const db = require("../../config/db");

// Listar todas as reservas (Admin)
const getAllReservations = (req, res) => {
  const query = `
    SELECT 
      r.id,
      r.user_id,
      r.book_id,
      r.status,
      r.reservation_date,
      r.pickup_deadline,
      r.pickup_date,
      r.return_deadline,
      r.return_date,
      r.notes,
      u.name as user_name,
      u.email as user_email,
      b.title,
      b.author,
      b.cover_image
    FROM Reservations r
    INNER JOIN Users u ON r.user_id = u.id
    INNER JOIN Books b ON r.book_id = b.id
    ORDER BY r.reservation_date DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar reservas:', err);
      return res.status(500).json({ 
        error: "Erro interno do servidor ao buscar reservas.",
        details: err.message 
      });
    }

    // Processar dados para adicionar status calculado (overdue)
    const reservationsWithStatus = rows.map(reservation => {
      let calculatedStatus = reservation.status;
      
      // Verificar se está em atraso
      if (reservation.status === 'picked-up' && reservation.return_deadline) {
        const returnDeadline = new Date(reservation.return_deadline);
        const now = new Date();
        if (returnDeadline < now) {
          calculatedStatus = 'overdue';
        }
      }
      
      // Verificar se reserva expirou
      if (reservation.status === 'active' && reservation.pickup_deadline) {
        const pickupDeadline = new Date(reservation.pickup_deadline);
        const now = new Date();
        if (pickupDeadline < now) {
          calculatedStatus = 'expired';
        }
      }

      return {
        ...reservation,
        calculated_status: calculatedStatus
      };
    });

    res.json({
      reservations: reservationsWithStatus,
      total: reservationsWithStatus.length,
      timestamp: new Date().toISOString()
    });
  });
};

// Obter estatísticas das reservas (Admin)
const getReservationsStats = (req, res) => {
  const queries = {
    active: "SELECT COUNT(*) as count FROM Reservations WHERE status = 'active'",
    pickedUp: "SELECT COUNT(*) as count FROM Reservations WHERE status = 'picked-up'",
    returned: `SELECT COUNT(*) as count FROM Reservations 
               WHERE status = 'returned' 
               AND DATE(return_date) = DATE('now')`,
    overdue: `SELECT COUNT(*) as count FROM Reservations 
              WHERE status = 'picked-up' 
              AND return_deadline < datetime('now')`
  };

  const stats = {};
  let completed = 0;
  const total = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, query]) => {
    db.get(query, [], (err, row) => {
      if (err) {
        console.error(`Erro ao buscar estatística ${key}:`, err);
        stats[key] = 0;
      } else {
        stats[key] = row.count || 0;
      }
      
      completed++;
      if (completed === total) {
        res.json({
          stats,
          timestamp: new Date().toISOString()
        });
      }
    });
  });
};

// Atualizar status da reserva (Admin)
const updateReservationStatus = (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  if (!id || !status) {
    return res.status(400).json({ 
      message: "ID da reserva e status são obrigatórios." 
    });
  }

  // Validar status permitidos
  const allowedStatuses = ['active', 'picked-up', 'returned', 'cancelled', 'expired'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ 
      message: "Status inválido.",
      allowedStatuses 
    });
  }

  // Buscar reserva atual
  db.get(
    "SELECT * FROM Reservations WHERE id = ?", 
    [id], 
    (err, reservation) => {
      if (err) {
        return res.status(500).json({ error: "Erro ao buscar reserva." });
      }
      
      if (!reservation) {
        return res.status(404).json({ message: "Reserva não encontrada." });
      }

      // Preparar dados de atualização baseados no novo status
      let updateData = {
        status,
        notes: notes || reservation.notes
      };

      const now = new Date().toISOString();

      switch (status) {
        case 'picked-up':
          if (reservation.status === 'active') {
            updateData.pickup_date = now;
            // Calcular deadline de devolução (14 dias)
            const returnDeadline = new Date();
            returnDeadline.setDate(returnDeadline.getDate() + 14);
            updateData.return_deadline = returnDeadline.toISOString();
          }
          break;
          
        case 'returned':
          updateData.return_date = now;
          break;
          
        case 'cancelled':
        case 'expired':
          // Para cancelamentos e expirações, liberar o livro
          updateData.pickup_date = null;
          updateData.return_deadline = null;
          updateData.return_date = null;
          break;
      }

      // Construir query de atualização dinamicamente
      const fields = Object.keys(updateData);
      const values = Object.values(updateData);
      const setClause = fields.map(field => `${field} = ?`).join(', ');

      db.run(
        `UPDATE Reservations SET ${setClause} WHERE id = ?`,
        [...values, id],
        function (err) {
          if (err) {
            console.error('Erro ao atualizar reserva:', err);
            return res.status(500).json({ error: "Erro ao atualizar reserva." });
          }

          if (this.changes === 0) {
            return res.status(404).json({ message: "Reserva não encontrada." });
          }

          // Atualizar disponibilidade do livro se necessário
          updateBookAvailability(reservation.book_id, reservation.status, status)
            .then(() => {
              res.json({
                message: "Status da reserva atualizado com sucesso.",
                reservationId: id,
                newStatus: status,
                updatedFields: updateData,
                timestamp: now
              });
            })
            .catch(bookErr => {
              console.error('Erro ao atualizar disponibilidade do livro:', bookErr);
              // Não falhar a operação principal por isso
              res.json({
                message: "Status atualizado, mas houve problema ao atualizar disponibilidade do livro.",
                reservationId: id,
                newStatus: status,
                warning: "Verificar manualmente a disponibilidade do livro"
              });
            });
        }
      );
    }
  );
};

// Estender prazo de devolução (Admin)
const extendDeadline = (req, res) => {
  const { id } = req.params;
  const { days = 7 } = req.body;

  if (!id) {
    return res.status(400).json({ message: "ID da reserva é obrigatório." });
  }

  if (isNaN(days) || days < 1 || days > 30) {
    return res.status(400).json({ 
      message: "Número de dias deve ser entre 1 e 30." 
    });
  }

  // Buscar reserva atual
  db.get(
    "SELECT * FROM Reservations WHERE id = ?", 
    [id], 
    (err, reservation) => {
      if (err) {
        return res.status(500).json({ error: "Erro ao buscar reserva." });
      }
      
      if (!reservation) {
        return res.status(404).json({ message: "Reserva não encontrada." });
      }

      // Verificar se a reserva pode ter prazo estendido
      if (!['picked-up', 'overdue'].includes(reservation.status)) {
        return res.status(400).json({ 
          message: "Apenas reservas com livros retirados podem ter prazo estendido.",
          currentStatus: reservation.status
        });
      }

      if (!reservation.return_deadline) {
        return res.status(400).json({ 
          message: "Reserva não possui prazo de devolução definido." 
        });
      }

      // Calcular nova data
      const currentDeadline = new Date(reservation.return_deadline);
      currentDeadline.setDate(currentDeadline.getDate() + parseInt(days));
      const newDeadline = currentDeadline.toISOString();

      // Atualizar reserva
      db.run(
        "UPDATE Reservations SET return_deadline = ?, status = 'picked-up' WHERE id = ?",
        [newDeadline, id],
        function (err) {
          if (err) {
            console.error('Erro ao estender prazo:', err);
            return res.status(500).json({ error: "Erro ao estender prazo." });
          }

          if (this.changes === 0) {
            return res.status(404).json({ message: "Reserva não encontrada." });
          }

          res.json({
            message: `Prazo estendido por ${days} dia(s) com sucesso.`,
            reservationId: id,
            previousDeadline: reservation.return_deadline,
            newDeadline: newDeadline,
            daysExtended: days,
            timestamp: new Date().toISOString()
          });
        }
      );
    }
  );
};

// Função auxiliar para atualizar disponibilidade do livro
const updateBookAvailability = (bookId, oldStatus, newStatus) => {
  return new Promise((resolve, reject) => {
    let availabilityChange = 0;

    // Calcular mudança na disponibilidade
    if (oldStatus === 'active' && ['returned', 'cancelled', 'expired'].includes(newStatus)) {
      availabilityChange = 1; // Liberar livro
    } else if (['returned', 'cancelled', 'expired'].includes(oldStatus) && newStatus === 'active') {
      availabilityChange = -1; // Reservar livro
    }

    if (availabilityChange === 0) {
      return resolve(); // Nenhuma mudança necessária
    }

    db.run(
      "UPDATE Books SET available_copies = available_copies + ? WHERE id = ?",
      [availabilityChange, bookId],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
};

// Buscar reservas por filtros (Admin)
const getReservationsByFilter = (req, res) => {
  const { 
    status, 
    userId, 
    bookId, 
    startDate, 
    endDate, 
    limit = 50, 
    offset = 0 
  } = req.query;

  let whereConditions = [];
  let queryParams = [];

  // Construir condições WHERE dinamicamente
  if (status) {
    whereConditions.push("r.status = ?");
    queryParams.push(status);
  }

  if (userId) {
    whereConditions.push("r.user_id = ?");
    queryParams.push(userId);
  }

  if (bookId) {
    whereConditions.push("r.book_id = ?");
    queryParams.push(bookId);
  }

  if (startDate) {
    whereConditions.push("DATE(r.reservation_date) >= DATE(?)");
    queryParams.push(startDate);
  }

  if (endDate) {
    whereConditions.push("DATE(r.reservation_date) <= DATE(?)");
    queryParams.push(endDate);
  }

  const whereClause = whereConditions.length > 0 
    ? `WHERE ${whereConditions.join(' AND ')}` 
    : '';

  const query = `
    SELECT 
      r.id,
      r.user_id,
      r.book_id,
      r.status,
      r.reservation_date,
      r.pickup_deadline,
      r.pickup_date,
      r.return_deadline,
      r.return_date,
      r.notes,
      u.name as user_name,
      u.email as user_email,
      b.title,
      b.author,
      b.cover_image
    FROM Reservations r
    INNER JOIN Users u ON r.user_id = u.id
    INNER JOIN Books b ON r.book_id = b.id
    ${whereClause}
    ORDER BY r.reservation_date DESC
    LIMIT ? OFFSET ?
  `;

  queryParams.push(parseInt(limit), parseInt(offset));

  db.all(query, queryParams, (err, rows) => {
    if (err) {
      console.error('Erro ao buscar reservas filtradas:', err);
      return res.status(500).json({ 
        error: "Erro ao buscar reservas.",
        details: err.message 
      });
    }

    // Contar total de registros para paginação
    const countQuery = `
      SELECT COUNT(*) as total
      FROM Reservations r
      INNER JOIN Users u ON r.user_id = u.id
      INNER JOIN Books b ON r.book_id = b.id
      ${whereClause}
    `;

    const countParams = queryParams.slice(0, -2); // Remove limit e offset

    db.get(countQuery, countParams, (countErr, countRow) => {
      if (countErr) {
        console.error('Erro ao contar reservas:', countErr);
        return res.status(500).json({ error: "Erro ao contar reservas." });
      }

      res.json({
        reservations: rows,
        pagination: {
          total: countRow.total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasNext: (parseInt(offset) + parseInt(limit)) < countRow.total
        },
        filters: { status, userId, bookId, startDate, endDate },
        timestamp: new Date().toISOString()
      });
    });
  });
};

module.exports = {
  getAllReservations,
  getReservationsStats,
  updateReservationStatus,
  extendDeadline,
  getReservationsByFilter
};