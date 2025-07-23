const db = require("../../config/db");
const Joi = require("joi");

// Schema de validação para criar reserva
const reservationSchema = Joi.object({
  bookId: Joi.number().integer().positive().required(),
  notes: Joi.string().max(500).optional().allow("")
});

// Schema para atualizar reserva
const updateReservationSchema = Joi.object({
  action: Joi.string().valid('cancel', 'update_notes').required(),
  notes: Joi.string().max(500).optional().allow("")
});

// Listar reservas do usuário (COMPATÍVEL COM ESTRUTURA EXISTENTE)
const getUserReservations = (req, res) => {
  const userId = req.user.id;
  const { status, limit = 20, offset = 0, orderBy = 'desc' } = req.query;

  let whereClause = "WHERE r.user_id = ?";
  let queryParams = [userId];

  // Filtro por status (incluindo overdue que é calculado)
  if (status && status !== 'all') {
    if (status === 'overdue') {
      whereClause += " AND r.status = 'active' AND datetime(r.return_deadline) < datetime('now')";
    } else {
      whereClause += " AND r.status = ?";
      queryParams.push(status);
    }
  }

  // Validar ordem
  const validOrder = ['asc', 'desc'].includes(orderBy.toLowerCase()) ? orderBy : 'desc';
  const limitNum = Math.min(Math.max(parseInt(limit), 1), 100);
  const offsetNum = Math.max(parseInt(offset), 0);

  // QUERY COMPATÍVEL COM A ESTRUTURA EXISTENTE (sem created_at/updated_at)
  const query = `
    SELECT 
      r.id,
      r.status,
      r.reservation_date,
      r.pickup_deadline,
      r.pickup_date,
      r.return_deadline,
      r.return_date,
      r.notes,
      r.renewal_count,
      b.title,
      b.author,
      b.category,
      b.cover_image,
      b.isbn,
      b.editor,
      b.language,
      -- Status calculado baseado em prazos
      CASE 
        WHEN r.status = 'active' AND r.pickup_date IS NOT NULL AND datetime(r.return_deadline) < datetime('now') THEN 'overdue'
        WHEN r.status = 'active' AND datetime(r.pickup_deadline) < datetime('now') THEN 'expired'
        ELSE r.status
      END as calculated_status,
      -- Horas restantes para vencimento
      CASE 
        WHEN r.status = 'active' AND r.pickup_date IS NULL THEN 
          CAST((julianday(r.pickup_deadline) - julianday('now')) * 24 AS INTEGER)
        WHEN r.status = 'active' AND r.pickup_date IS NOT NULL THEN 
          CAST((julianday(r.return_deadline) - julianday('now')) * 24 AS INTEGER)
        ELSE NULL
      END as hours_remaining
    FROM Reservations r
    INNER JOIN Books b ON r.book_id = b.id
    ${whereClause}
    ORDER BY r.reservation_date ${validOrder.toUpperCase()}
    LIMIT ? OFFSET ?
  `;

  queryParams.push(limitNum, offsetNum);

  db.all(query, queryParams, (err, reservations) => {
    if (err) {
      console.error('Erro ao buscar reservas:', err);
      return res.status(500).json({ 
        message: "Erro ao buscar reservas.",
        error: process.env.NODE_ENV === 'development' ? err.message : "INTERNAL_ERROR"
      });
    }

    // Contar total de reservas para paginação
    const countQuery = `
      SELECT COUNT(*) as total
      FROM Reservations r
      INNER JOIN Books b ON r.book_id = b.id
      ${whereClause}
    `;

    db.get(countQuery, queryParams.slice(0, -2), (countErr, countResult) => {
      if (countErr) {
        console.error('Erro ao contar reservas:', countErr);
        return res.status(500).json({ 
          message: "Erro ao contar reservas."
        });
      }

      // Calcular estatísticas globais do usuário
      const statsQuery = `
        SELECT 
          SUM(CASE 
            WHEN r.status = 'active' AND r.pickup_date IS NULL AND datetime(r.pickup_deadline) >= datetime('now') 
            THEN 1 ELSE 0 
          END) as active,
          SUM(CASE 
            WHEN r.status = 'active' AND r.pickup_date IS NOT NULL AND datetime(r.return_deadline) >= datetime('now') 
            THEN 1 ELSE 0 
          END) as pickedUp,
          SUM(CASE WHEN r.status = 'completed' OR r.status = 'returned' THEN 1 ELSE 0 END) as returned,
          SUM(CASE WHEN r.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
          SUM(CASE 
            WHEN r.status = 'active' AND r.pickup_date IS NOT NULL AND datetime(r.return_deadline) < datetime('now') 
            THEN 1 ELSE 0 
          END) as overdue,
          SUM(CASE 
            WHEN r.status = 'active' AND r.pickup_date IS NULL AND datetime(r.pickup_deadline) < datetime('now') 
            THEN 1 ELSE 0 
          END) as expired
        FROM Reservations r
        WHERE r.user_id = ?
      `;

      db.get(statsQuery, [userId], (statsErr, stats) => {
        if (statsErr) {
          console.error('Erro ao buscar estatísticas:', statsErr);
          stats = { active: 0, pickedUp: 0, returned: 0, cancelled: 0, overdue: 0, expired: 0 };
        }

        const total = countResult.total;
        const hasNext = offsetNum + limitNum < total;
        const hasPrev = offsetNum > 0;

        res.json({
          reservations,
          statistics: stats || { active: 0, pickedUp: 0, returned: 0, cancelled: 0, overdue: 0, expired: 0 },
          pagination: {
            total,
            limit: limitNum,
            offset: offsetNum,
            hasNext,
            hasPrev,
            showing: reservations.length
          },
          filters: {
            status: status || 'all',
            orderBy: validOrder
          }
        });
      });
    });
  });
};

// Criar nova reserva (ADAPTADO PARA ESTRUTURA EXISTENTE)
const createReservation = (req, res) => {
  const { bookId, notes } = req.body;
  const userId = req.user.id;

  // Validar dados de entrada
  const { error } = reservationSchema.validate({ bookId, notes });
  if (error) {
    return res.status(400).json({ 
      message: error.details[0].message,
      field: error.details[0].path[0]
    });
  }

  // Verificar se o livro existe e está disponível
  db.get("SELECT * FROM Books WHERE id = ?", [bookId], (err, book) => {
    if (err) {
      console.error('Erro ao verificar livro:', err);
      return res.status(500).json({ 
        message: "Erro ao verificar livro."
      });
    }

    if (!book) {
      return res.status(404).json({ 
        message: "Livro não encontrado.",
        bookId: bookId
      });
    }

    if (book.available_copies <= 0) {
      return res.status(400).json({ 
        message: "Livro não está disponível para reserva.",
        bookTitle: book.title,
        availableCopies: book.available_copies,
        totalCopies: book.total_copies
      });
    }

    // Verificar se usuário já tem reserva ativa deste livro
    db.get(
      "SELECT * FROM Reservations WHERE user_id = ? AND book_id = ? AND status = 'active'",
      [userId, bookId],
      (err, existingReservation) => {
        if (err) {
          console.error('Erro ao verificar reservas existentes:', err);
          return res.status(500).json({ 
            message: "Erro ao verificar reservas existentes."
          });
        }

        if (existingReservation) {
          return res.status(400).json({ 
            message: "Você já possui uma reserva ativa para este livro.",
            bookTitle: book.title,
            existingReservation: {
              id: existingReservation.id,
              status: existingReservation.status,
              reservationDate: existingReservation.reservation_date
            }
          });
        }

        // Verificar limite de reservas simultâneas (máximo 5)
        db.get(
          "SELECT COUNT(*) as activeCount FROM Reservations WHERE user_id = ? AND status = 'active'",
          [userId],
          (err, countResult) => {
            if (err) {
              console.error('Erro ao contar reservas ativas:', err);
              return res.status(500).json({ 
                message: "Erro ao verificar limite de reservas."
              });
            }

            const maxReservations = 5;
            if (countResult.activeCount >= maxReservations) {
              return res.status(400).json({ 
                message: `Você atingiu o limite máximo de ${maxReservations} reservas simultâneas.`,
                currentActive: countResult.activeCount,
                maxAllowed: maxReservations,
                suggestion: "Complete ou cancele algumas reservas antes de fazer novas."
              });
            }

            // Criar reserva (USANDO ESTRUTURA EXISTENTE)
            const pickupDeadline = new Date();
            pickupDeadline.setHours(pickupDeadline.getHours() + 48); // 48 horas para retirada

            db.run(
              `INSERT INTO Reservations 
               (user_id, book_id, status, pickup_deadline, notes) 
               VALUES (?, ?, 'active', ?, ?)`,
              [userId, bookId, pickupDeadline.toISOString(), notes || ''],
              function (err) {
                if (err) {
                  console.error('Erro ao criar reserva:', err);
                  return res.status(500).json({ 
                    message: "Erro ao criar reserva."
                  });
                }

                const reservationId = this.lastID;

                // Atualizar disponibilidade do livro
                db.run(
                  "UPDATE Books SET available_copies = available_copies - 1 WHERE id = ?",
                  [bookId],
                  (updateErr) => {
                    if (updateErr) {
                      console.error('Erro ao atualizar disponibilidade do livro:', updateErr);
                      // Reverter criação da reserva se falhar ao atualizar livro
                      db.run("DELETE FROM Reservations WHERE id = ?", [reservationId]);
                      return res.status(500).json({ 
                        message: "Erro ao atualizar disponibilidade do livro."
                      });
                    }

                    console.log(`✅ Reserva criada: User ${userId} - Book ${bookId} (${book.title}) - Reservation ${reservationId}`);

                    res.status(201).json({
                      message: "Reserva criada com sucesso.",
                      reservation: {
                        id: reservationId,
                        bookId: bookId,
                        bookTitle: book.title,
                        bookAuthor: book.author,
                        status: 'active',
                        pickupDeadline: pickupDeadline.toISOString(),
                        notes: notes || '',
                        reservationDate: new Date().toISOString()
                      },
                      instructions: {
                        pickupLocation: "Balcão da biblioteca",
                        pickupHours: "Segunda a sexta: 8h às 18h",
                        deadline: "Retire o livro em até 48 horas"
                      }
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  });
};

// Atualizar reserva (rota genérica para diferentes ações)
const updateReservation = (req, res) => {
  const { id } = req.params;
  const { action, notes } = req.body;

  // Validar dados de entrada
  const { error } = updateReservationSchema.validate({ action, notes });
  if (error) {
    return res.status(400).json({ 
      message: error.details[0].message
    });
  }

  // Redirecionar para função específica baseada na ação
  switch (action) {
    case 'cancel':
      return cancelReservation(req, res);
    case 'update_notes':
      return updateReservationNotes(req, res);
    default:
      return res.status(400).json({ 
        message: "Ação não suportada.",
        supportedActions: ['cancel', 'update_notes'],
        providedAction: action
      });
  }
};

// Cancelar reserva específica
const cancelReservation = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Verificar se reserva pertence ao usuário e pode ser cancelada
  db.get(
    `SELECT r.*, b.title, b.author 
     FROM Reservations r 
     INNER JOIN Books b ON r.book_id = b.id 
     WHERE r.id = ? AND r.user_id = ?`,
    [id, userId],
    (err, reservation) => {
      if (err) {
        console.error('Erro ao buscar reserva:', err);
        return res.status(500).json({ 
          message: "Erro ao buscar reserva."
        });
      }

      if (!reservation) {
        return res.status(404).json({ 
          message: "Reserva não encontrada ou não pertence a você.",
          reservationId: parseInt(id)
        });
      }

      // Verificar se pode cancelar baseado no status
      const cancellableStatuses = ['active'];
      if (!cancellableStatuses.includes(reservation.status)) {
        return res.status(400).json({ 
          message: `Não é possível cancelar reserva com status '${reservation.status}'.`,
          currentStatus: reservation.status,
          cancellableStatuses,
          bookTitle: reservation.title
        });
      }

      // Cancelar reserva
      db.run(
        "UPDATE Reservations SET status = 'cancelled' WHERE id = ?",
        [id],
        function (err) {
          if (err) {
            console.error('Erro ao cancelar reserva:', err);
            return res.status(500).json({ 
              message: "Erro ao cancelar reserva."
            });
          }

          // Liberar livro (aumentar disponibilidade)
          db.run(
            "UPDATE Books SET available_copies = available_copies + 1 WHERE id = ?",
            [reservation.book_id],
            (updateErr) => {
              if (updateErr) {
                console.error('Erro ao liberar livro:', updateErr);
                // Não falhar a operação por isso, mas logar o erro
              }

              console.log(`✅ Reserva cancelada: User ${userId} - Book ${reservation.book_id} (${reservation.title}) - Reservation ${id}`);

              res.json({
                message: "Reserva cancelada com sucesso.",
                cancelledReservation: {
                  id: parseInt(id),
                  bookTitle: reservation.title,
                  bookAuthor: reservation.author,
                  originalStatus: reservation.status,
                  cancellationDate: new Date().toISOString()
                },
                bookAvailability: {
                  message: "O livro foi liberado e está disponível para outros usuários."
                }
              });
            }
          );
        }
      );
    }
  );
};

// Atualizar apenas as observações da reserva
const updateReservationNotes = (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  const userId = req.user.id;

  // Validar observações
  if (notes && notes.length > 500) {
    return res.status(400).json({ 
      message: "Observações não podem ter mais de 500 caracteres.",
      currentLength: notes.length,
      maxLength: 500
    });
  }

  // Verificar se reserva pertence ao usuário
  db.get(
    "SELECT r.*, b.title FROM Reservations r INNER JOIN Books b ON r.book_id = b.id WHERE r.id = ? AND r.user_id = ?",
    [id, userId],
    (err, reservation) => {
      if (err) {
        console.error('Erro ao buscar reserva:', err);
        return res.status(500).json({ 
          message: "Erro ao buscar reserva."
        });
      }

      if (!reservation) {
        return res.status(404).json({ 
          message: "Reserva não encontrada ou não pertence a você."
        });
      }

      // Atualizar observações
      db.run(
        "UPDATE Reservations SET notes = ? WHERE id = ?",
        [notes || '', id],
        function (err) {
          if (err) {
            console.error('Erro ao atualizar observações:', err);
            return res.status(500).json({ 
              message: "Erro ao atualizar observações."
            });
          }

          res.json({
            message: "Observações atualizadas com sucesso.",
            reservation: {
              id: parseInt(id),
              bookTitle: reservation.title,
              previousNotes: reservation.notes,
              newNotes: notes || '',
              updatedAt: new Date().toISOString()
            }
          });
        }
      );
    }
  );
};

// Criar reservas a partir do carrinho (ADAPTADO PARA TABELA 'Basket')
const createReservationsFromBasket = (req, res) => {
  const userId = req.user.id;
  const { notes, clearBasket = true } = req.body;

  // Buscar itens do carrinho (USANDO TABELA 'Basket' EM VEZ DE 'BasketItems')
  const basketQuery = `
    SELECT 
      b.book_id, 
      bk.title, 
      bk.author,
      bk.available_copies,
      bk.available_copies > 0 as available
    FROM Basket b 
    INNER JOIN Books bk ON b.book_id = bk.id 
    WHERE b.user_id = ?
    ORDER BY b.added_date ASC
  `;

  db.all(basketQuery, [userId], (err, basketItems) => {
    if (err) {
      console.error('Erro ao buscar carrinho:', err);
      return res.status(500).json({ 
        message: "Erro ao buscar itens do carrinho."
      });
    }

    if (basketItems.length === 0) {
      return res.status(400).json({ 
        message: "Carrinho está vazio. Adicione livros antes de criar reservas.",
        basketInfo: { totalItems: 0 },
        suggestion: "Navegue pelo catálogo e adicione livros ao carrinho."
      });
    }

    // Verificar disponibilidade de todos os itens
    const unavailableBooks = basketItems.filter(item => !item.available);
    if (unavailableBooks.length > 0) {
      return res.status(400).json({ 
        message: `${unavailableBooks.length} livro(s) do carrinho não estão mais disponíveis.`,
        unavailableBooks: unavailableBooks.map(book => ({
          bookId: book.book_id,
          title: book.title,
          author: book.author,
          reason: "Sem exemplares disponíveis",
          availableCopies: book.available_copies
        })),
        suggestion: "Remova os livros indisponíveis do carrinho e tente novamente."
      });
    }

    // Verificar limite de reservas
    db.get(
      "SELECT COUNT(*) as activeCount FROM Reservations WHERE user_id = ? AND status = 'active'",
      [userId],
      (err, countResult) => {
        if (err) {
          console.error('Erro ao verificar limite de reservas:', err);
          return res.status(500).json({ 
            message: "Erro ao verificar limite de reservas."
          });
        }

        const maxReservations = 5;
        const currentActive = countResult.activeCount;
        const newReservations = basketItems.length;

        if (currentActive + newReservations > maxReservations) {
          return res.status(400).json({ 
            message: "Criar essas reservas excederia o limite de 5 reservas simultâneas.",
            reservationLimits: {
              currentActive,
              basketItems: newReservations,
              maxAllowed: maxReservations,
              wouldExceedBy: (currentActive + newReservations) - maxReservations
            },
            suggestion: "Complete ou cancele algumas reservas ativas antes de prosseguir."
          });
        }

        // Criar reservas para todos os itens disponíveis
        const pickupDeadline = new Date();
        pickupDeadline.setHours(pickupDeadline.getHours() + 48);
        
        const reservationsCreated = [];
        let completedCount = 0;
        let hasError = false;

        basketItems.forEach((item, index) => {
          if (hasError) return;

          db.run(
            `INSERT INTO Reservations 
             (user_id, book_id, status, pickup_deadline, notes) 
             VALUES (?, ?, 'active', ?, ?)`,
            [userId, item.book_id, pickupDeadline.toISOString(), notes || ''],
            function (err) {
              if (err) {
                console.error(`Erro ao criar reserva para livro ${item.book_id}:`, err);
                hasError = true;
                return res.status(500).json({ 
                  message: "Erro ao criar reservas."
                });
              }

              // Atualizar disponibilidade
              db.run(
                'UPDATE Books SET available_copies = available_copies - 1 WHERE id = ?', 
                [item.book_id],
                (updateErr) => {
                  if (updateErr) {
                    console.error('Erro ao atualizar disponibilidade:', updateErr);
                  }

                  reservationsCreated.push({
                    id: this.lastID,
                    bookId: item.book_id,
                    bookTitle: item.title,
                    bookAuthor: item.author,
                    status: 'active',
                    pickupDeadline: pickupDeadline.toISOString(),
                    notes: notes || null
                  });

                  completedCount++;

                  // Se todas as reservas foram criadas
                  if (completedCount === basketItems.length && !hasError) {
                    // Limpar carrinho se solicitado (USANDO TABELA 'Basket')
                    if (clearBasket) {
                      db.run('DELETE FROM Basket WHERE user_id = ?', [userId], (clearErr) => {
                        if (clearErr) {
                          console.error('Erro ao limpar carrinho:', clearErr);
                        }

                        console.log(`✅ Reservas criadas do carrinho: User ${userId} - ${reservationsCreated.length} livros`);

                        res.status(201).json({
                          message: `${reservationsCreated.length} reservas criadas com sucesso a partir do carrinho.`,
                          reservationsCreated,
                          summary: {
                            totalItemsInBasket: basketItems.length,
                            successfulReservations: reservationsCreated.length,
                            failedReservations: 0
                          },
                          basketCleared: true,
                          instructions: {
                            message: "Todas as reservas foram criadas com prazo de 48h para retirada.",
                            nextSteps: [
                              "Retire os livros no balcão da biblioteca",
                              "Prazo: até 48 horas após a reserva",
                              "Horário: Segunda a sexta, 8h às 18h"
                            ]
                          }
                        });
                      });
                    } else {
                      console.log(`✅ Reservas criadas do carrinho: User ${userId} - ${reservationsCreated.length} livros`);

                      res.status(201).json({
                        message: `${reservationsCreated.length} reservas criadas com sucesso a partir do carrinho.`,
                        reservationsCreated,
                        summary: {
                          totalItemsInBasket: basketItems.length,
                          successfulReservations: reservationsCreated.length,
                          failedReservations: 0
                        },
                        basketCleared: false,
                        instructions: {
                          message: "Todas as reservas foram criadas com prazo de 48h para retirada.",
                          nextSteps: [
                            "Retire os livros no balcão da biblioteca",
                            "Prazo: até 48 horas após a reserva",
                            "Horário: Segunda a sexta, 8h às 18h"
                          ]
                        }
                      });
                    }
                  }
                }
              );
            }
          );
        });
      }
    );
  });
};

// Obter estatísticas das reservas do usuário
const getUserReservationStats = (req, res) => {
  const userId = req.user.id;

  // Estatísticas gerais
  const overallQuery = `
    SELECT 
      COUNT(*) as totalReservations,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as currentActive,
      SUM(CASE WHEN status IN ('completed', 'returned') THEN 1 ELSE 0 END) as completedReservations,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelledReservations
    FROM Reservations 
    WHERE user_id = ?
  `;

  db.get(overallQuery, [userId], (err, overall) => {
    if (err) {
      console.error('Erro ao buscar estatísticas gerais:', err);
      return res.status(500).json({ 
        message: "Erro ao carregar estatísticas."
      });
    }

    // Estatísticas por status
    const statusQuery = `
      SELECT 
        SUM(CASE WHEN status = 'active' AND pickup_date IS NULL AND datetime(pickup_deadline) >= datetime('now') THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'active' AND pickup_date IS NOT NULL THEN 1 ELSE 0 END) as pickedUp,
        SUM(CASE WHEN status IN ('completed', 'returned') THEN 1 ELSE 0 END) as returned,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN status = 'active' AND pickup_date IS NULL AND datetime(pickup_deadline) < datetime('now') THEN 1 ELSE 0 END) as expired,
        SUM(CASE WHEN status = 'active' AND pickup_date IS NOT NULL AND datetime(return_deadline) < datetime('now') THEN 1 ELSE 0 END) as overdue
      FROM Reservations
      WHERE user_id = ?
    `;

    db.get(statusQuery, [userId], (err, byStatus) => {
      if (err) {
        console.error('Erro ao buscar estatísticas por status:', err);
        byStatus = { active: 0, pickedUp: 0, returned: 0, cancelled: 0, expired: 0, overdue: 0 };
      }

      // Categorias favoritas
      const categoriesQuery = `
        SELECT 
          b.category,
          COUNT(*) as count,
          ROUND((COUNT(*) * 100.0 / ?), 1) as percentage
        FROM Reservations r
        JOIN Books b ON r.book_id = b.id
        WHERE r.user_id = ?
        GROUP BY b.category
        ORDER BY count DESC
        LIMIT 5
      `;

      db.all(categoriesQuery, [overall?.totalReservations || 1, userId], (err, categories) => {
        if (err) {
          console.error('Erro ao buscar categorias favoritas:', err);
          categories = [];
        }

        res.json({
          userId,
          overall: overall || { 
            totalReservations: 0, 
            currentActive: 0, 
            completedReservations: 0,
            cancelledReservations: 0
          },
          byStatus: byStatus || { 
            active: 0, 
            pickedUp: 0, 
            returned: 0, 
            cancelled: 0, 
            expired: 0, 
            overdue: 0 
          },
          favoriteCategories: categories || [],
          generatedAt: new Date().toISOString()
        });
      });
    });
  });
};

module.exports = {
  getUserReservations,
  createReservation,
  updateReservation,
  cancelReservation,
  createReservationsFromBasket,
  getUserReservationStats
};