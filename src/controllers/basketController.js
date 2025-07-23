const db = require("../../config/db");

// Listar itens do carrinho do usuário
const getUserBasket = (req, res) => {
  const { userId } = req.params;
  const requestingUserId = req.user.id;

  // Verificar se usuário pode acessar este carrinho
  if (parseInt(userId) !== requestingUserId) {
    return res.status(403).json({ 
      message: "Acesso negado. Você só pode ver seu próprio carrinho." 
    });
  }

  const query = `
    SELECT 
      b.id,
      b.user_id,
      b.book_id,
      b.quantity,
      b.added_date,
      bk.title as book_title,
      bk.author as book_author,
      bk.cover_image,
      bk.available_copies > 0 as available,
      bk.available_copies,
      bk.total_copies
    FROM Basket b
    INNER JOIN Books bk ON b.book_id = bk.id
    WHERE b.user_id = ?
    ORDER BY b.added_date DESC
  `;

  db.all(query, [userId], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar carrinho:', err);
      return res.status(500).json({ 
        error: "Erro ao buscar itens do carrinho.",
        details: err.message 
      });
    }

    res.json({
      items: rows,
      total: rows.length,
      userId: parseInt(userId),
      summary: {
        totalItems: rows.length,
        availableItems: rows.filter(item => item.available).length,
        unavailableItems: rows.filter(item => !item.available).length
      }
    });
  });
};

// Adicionar item ao carrinho
const addToBasket = (req, res) => {
  const { userId, bookId, quantity = 1 } = req.body;
  const requestingUserId = req.user.id;

  // Validações básicas
  if (!userId || !bookId) {
    return res.status(400).json({ 
      message: "userId e bookId são obrigatórios." 
    });
  }

  if (parseInt(userId) !== requestingUserId) {
    return res.status(403).json({ 
      message: "Acesso negado. Você só pode adicionar ao seu próprio carrinho." 
    });
  }

  if (quantity !== 1) {
    return res.status(400).json({ 
      message: "Quantidade deve ser 1 para livros." 
    });
  }

  // Verificar se o livro existe e está disponível
  db.get("SELECT * FROM Books WHERE id = ?", [bookId], (err, book) => {
    if (err) {
      console.error('Erro ao verificar livro:', err);
      return res.status(500).json({ 
        error: "Erro ao verificar livro.",
        details: err.message 
      });
    }

    if (!book) {
      return res.status(404).json({ 
        message: "Livro não encontrado." 
      });
    }

    if (book.available_copies <= 0) {
      return res.status(400).json({ 
        message: "Livro não está disponível para reserva.",
        bookTitle: book.title,
        availableCopies: book.available_copies
      });
    }

    // Verificar se já está no carrinho
    db.get(
      "SELECT * FROM Basket WHERE user_id = ? AND book_id = ?",
      [userId, bookId],
      (err, existingItem) => {
        if (err) {
          console.error('Erro ao verificar carrinho:', err);
          return res.status(500).json({ 
            error: "Erro ao verificar carrinho.",
            details: err.message 
          });
        }

        if (existingItem) {
          return res.status(400).json({ 
            message: "Livro já está no carrinho.",
            bookTitle: book.title,
            addedDate: existingItem.added_date
          });
        }

        // Adicionar ao carrinho
        db.run(
          "INSERT INTO Basket (user_id, book_id, quantity, added_date) VALUES (?, ?, ?, datetime('now'))",
          [userId, bookId, quantity],
          function (err) {
            if (err) {
              console.error('Erro ao adicionar ao carrinho:', err);
              return res.status(500).json({ 
                error: "Erro ao adicionar item ao carrinho.",
                details: err.message 
              });
            }

            console.log(`✅ Item adicionado ao carrinho: User ${userId} - Book ${bookId} (${book.title})`);

            res.status(201).json({
              message: "Livro adicionado ao carrinho com sucesso.",
              itemId: this.lastID,
              bookTitle: book.title,
              bookAuthor: book.author,
              addedDate: new Date().toISOString()
            });
          }
        );
      }
    );
  });
};

// Remover item específico do carrinho
const removeFromBasket = (req, res) => {
  const { userId, bookId } = req.params;
  const requestingUserId = req.user.id;

  if (parseInt(userId) !== requestingUserId) {
    return res.status(403).json({ 
      message: "Acesso negado. Você só pode modificar seu próprio carrinho." 
    });
  }

  // Buscar informações do item antes de remover
  db.get(
    `SELECT b.*, bk.title, bk.author 
     FROM Basket b 
     INNER JOIN Books bk ON b.book_id = bk.id 
     WHERE b.user_id = ? AND b.book_id = ?`,
    [userId, bookId],
    (err, item) => {
      if (err) {
        console.error('Erro ao buscar item:', err);
        return res.status(500).json({ 
          error: "Erro ao buscar item do carrinho.",
          details: err.message 
        });
      }

      if (!item) {
        return res.status(404).json({ 
          message: "Item não encontrado no carrinho." 
        });
      }

      // Remover item
      db.run(
        "DELETE FROM Basket WHERE user_id = ? AND book_id = ?",
        [userId, bookId],
        function (err) {
          if (err) {
            console.error('Erro ao remover do carrinho:', err);
            return res.status(500).json({ 
              error: "Erro ao remover item do carrinho.",
              details: err.message 
            });
          }

          console.log(`✅ Item removido do carrinho: User ${userId} - Book ${bookId} (${item.title})`);

          res.json({
            message: "Item removido do carrinho com sucesso.",
            removedItem: {
              bookId: parseInt(bookId),
              bookTitle: item.title,
              bookAuthor: item.author
            }
          });
        }
      );
    }
  );
};

// Limpar carrinho completo
const clearBasket = (req, res) => {
  const { userId } = req.params;
  const requestingUserId = req.user.id;

  if (parseInt(userId) !== requestingUserId) {
    return res.status(403).json({ 
      message: "Acesso negado. Você só pode limpar seu próprio carrinho." 
    });
  }

  // Contar itens antes de limpar
  db.get(
    "SELECT COUNT(*) as itemCount FROM Basket WHERE user_id = ?",
    [userId],
    (err, countResult) => {
      if (err) {
        console.error('Erro ao contar itens:', err);
        return res.status(500).json({ 
          error: "Erro ao verificar carrinho.",
          details: err.message 
        });
      }

      const itemCount = countResult.itemCount;

      if (itemCount === 0) {
        return res.json({
          message: "Carrinho já estava vazio.",
          itemsRemoved: 0
        });
      }

      // Limpar carrinho
      db.run(
        "DELETE FROM Basket WHERE user_id = ?",
        [userId],
        function (err) {
          if (err) {
            console.error('Erro ao limpar carrinho:', err);
            return res.status(500).json({ 
              error: "Erro ao limpar carrinho.",
              details: err.message 
            });
          }

          console.log(`✅ Carrinho limpo: User ${userId} - ${this.changes} itens removidos`);

          res.json({
            message: "Carrinho limpo com sucesso.",
            itemsRemoved: this.changes,
            previousItemCount: itemCount
          });
        }
      );
    }
  );
};

// Verificar disponibilidade dos itens do carrinho
const checkBasketAvailability = (req, res) => {
  const { userId } = req.params;
  const requestingUserId = req.user.id;

  if (parseInt(userId) !== requestingUserId) {
    return res.status(403).json({ 
      message: "Acesso negado." 
    });
  }

  const query = `
    SELECT 
      b.book_id,
      bk.title,
      bk.author,
      bk.available_copies,
      bk.available_copies > 0 as available,
      CASE 
        WHEN bk.available_copies > 0 THEN 'available'
        ELSE 'unavailable'
      END as status
    FROM Basket b
    INNER JOIN Books bk ON b.book_id = bk.id
    WHERE b.user_id = ?
  `;

  db.all(query, [userId], (err, items) => {
    if (err) {
      console.error('Erro ao verificar disponibilidade:', err);
      return res.status(500).json({ 
        error: "Erro ao verificar disponibilidade.",
        details: err.message 
      });
    }

    const available = items.filter(item => item.available);
    const unavailable = items.filter(item => !item.available);

    res.json({
      total: items.length,
      available: available.length,
      unavailable: unavailable.length,
      canProceedToReservation: unavailable.length === 0,
      items: items,
      unavailableBooks: unavailable.map(item => ({
        bookId: item.book_id,
        title: item.title,
        author: item.author
      }))
    });
  });
};

module.exports = {
  getUserBasket,
  addToBasket,
  removeFromBasket,
  clearBasket,
  checkBasketAvailability
};