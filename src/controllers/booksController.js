const db = require("../../config/db");
const Joi = require("joi");

// Schema de validação para criar/atualizar livro
const bookSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  author: Joi.string().min(1).max(150).required(),
  description: Joi.string().max(1000).optional().allow(""),
  category: Joi.string().min(1).max(100).optional(),
  isbn: Joi.string().optional().allow(""),
  editor: Joi.string().max(100).optional().allow(""),
  language: Joi.string().max(50).optional().allow(""),
  publication_year: Joi.number()
    .integer()
    .min(1400)
    .max(new Date().getFullYear())
    .optional(),
  pages: Joi.number().integer().min(1).optional(),
  format: Joi.string().valid("Físico", "Digital", "Audiobook").optional(),
  total_copies: Joi.number().integer().min(1).optional().default(1),
  available_copies: Joi.number().integer().min(0).optional(),
  cover_image: Joi.string().optional().allow(""),
});

// Listar todos os livros com filtros e paginação
/* const getAllBooks = (req, res) => {
  let { 
    search, 
    category, 
    author, 
    available, 
    limit = 20, 
    page = 1, 
    orderBy = 'title', 
    order = 'ASC' 
  } = req.query;

  limit = Math.min(Math.max(parseInt(limit), 1), 100);
  page = parseInt(page) || 1;

  // Calcular o offset com base no page, se não for fornecido
  if (!offset) {
    page = parseInt(page) || 1;
    offset = (page - 1) * limit;
  } else {
    offset = parseInt(offset);
  }


  let whereClause = "WHERE 1=1";
  let queryParams = [];

  // Filtro de busca por título
  if (search) {
    whereClause += " AND (title LIKE ? OR author LIKE ?)";
    queryParams.push(`%${search}%`, `%${search}%`);
  }

  // Filtro por categoria
  if (category) {
    whereClause += " AND category = ?";
    queryParams.push(category);
  }

  // Filtro por autor
  if (author) {
    whereClause += " AND author LIKE ?";
    queryParams.push(`%${author}%`);
  }

  // Filtro por disponibilidade
  if (available === "true") {
    whereClause += " AND available_copies > 0";
  } else if (available === "false") {
    whereClause += " AND available_copies = 0";
  }

  // Validar ordenação
  const validOrderBy = [
    "title",
    "author",
    "category",
    "publication_year",
    "pages",
  ].includes(orderBy)
    ? orderBy
    : "title";
  const validOrder = ["ASC", "DESC"].includes(order.toUpperCase())
    ? order.toUpperCase()
    : "ASC";

  const limitNum = Math.min(Math.max(parseInt(limit), 1), 100);
  const offsetNum = (page - 1) * limit;
  //const offsetNum = Math.max(parseInt(offset), 0);

  const query = `
    SELECT 
      id, title, author, description, category, isbn, 
      editor, language, publication_year, pages, format,
      total_copies, available_copies, cover_image,
      created_at
    FROM Books 
    ${whereClause}
    ORDER BY ${validOrderBy} ${validOrder}
    LIMIT ? OFFSET ?
  `;

  queryParams.push(limitNum, offsetNum);

  db.all(query, queryParams, (err, books) => {
    if (err) {
      console.error("Erro ao buscar livros:", err);
      return res.status(500).json({
        message: "Erro ao buscar livros.",
        error:
          process.env.NODE_ENV === "development"
            ? err.message
            : "INTERNAL_ERROR",
      });
    }

    // Contar total para paginação
    const countQuery = `SELECT COUNT(*) as total FROM Books ${whereClause}`;

    db.get(countQuery, queryParams.slice(0, -2), (countErr, countResult) => {
      if (countErr) {
        console.error("Erro ao contar livros:", countErr);
        return res.status(500).json({
          message: "Erro ao contar livros.",
        });
      }

      const total = countResult.total;
      const hasNext = offsetNum + limitNum < total;
      const hasPrev = offsetNum > 0;

      res.json({
        books,
        pagination: {
          total,
          limit: limitNum,
          offset: offsetNum,
          hasNext,
          hasPrev,
          currentPage: Math.floor(offsetNum / limitNum) + 1,
          totalPages: Math.ceil(total / limitNum),
          showing: books.length,
        },
        filters: {
          search: search || null,
          category: category || null,
          author: author || null,
          available: available || null,
          orderBy: validOrderBy,
          order: validOrder,
        },
      });
    });
  });
}; */

// Listar todos os livros com filtros e paginação
const getAllBooks = (req, res) => {
  let {
    search,
    category,
    author,
    available,
    limit = 20,
    offset,
    page = 1,
    orderBy = 'title',
    order = 'ASC'
  } = req.query;

  limit = Math.min(Math.max(parseInt(limit), 1), 100);
  page = parseInt(page) || 1;
  offset = offset !== undefined ? parseInt(offset) : (page - 1) * limit;

  let whereClause = "WHERE 1=1";
  let queryParams = [];

  if (search) {
    whereClause += " AND (title LIKE ? OR author LIKE ?)";
    queryParams.push(`%${search}%`, `%${search}%`);
  }

  if (category) {
    whereClause += " AND category = ?";
    queryParams.push(category);
  }

  if (author) {
    whereClause += " AND author LIKE ?";
    queryParams.push(`%${author}%`);
  }

  if (available === "true") {
    whereClause += " AND available_copies > 0";
  } else if (available === "false") {
    whereClause += " AND available_copies = 0";
  }

  const validOrderBy = ["title", "author", "category", "publication_year", "pages"].includes(orderBy)
    ? orderBy
    : "title";
  const validOrder = ["ASC", "DESC"].includes(order.toUpperCase())
    ? order.toUpperCase()
    : "ASC";

  const query = `
    SELECT 
      id, title, author, description, category, isbn, 
      editor, language, publication_year, pages, format,
      total_copies, available_copies, cover_image,
      created_at
    FROM Books 
    ${whereClause}
    ORDER BY ${validOrderBy} ${validOrder}
    LIMIT ? OFFSET ?
  `;

  queryParams.push(limit, offset);

  db.all(query, queryParams, (err, books) => {
    if (err) {
      console.error("Erro ao buscar livros:", err);
      return res.status(500).json({ message: "Erro ao buscar livros." });
    }

    const countQuery = `SELECT COUNT(*) as total FROM Books ${whereClause}`;
    db.get(countQuery, queryParams.slice(0, -2), (countErr, countResult) => {
      if (countErr) {
        console.error("Erro ao contar livros:", countErr);
        return res.status(500).json({ message: "Erro ao contar livros." });
      }

      const total = countResult.total;
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      res.json({
        books,
        pagination: {
          total,
          limit,
          offset,
          currentPage: page,
          totalPages,
          hasNext,
          hasPrev,
          showing: books.length
        },
        filters: {
          search: search || null,
          category: category || null,
          author: author || null,
          available: available || null,
          orderBy: validOrderBy,
          order: validOrder
        }
      });
    });
  });
};

// Obter detalhes de um livro específico
const getBookById = (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({
      message: "ID do livro inválido.",
      providedId: id,
    });
  }

  const query = `
    SELECT 
      b.*,
      -- Estatísticas do livro
      (SELECT COUNT(*) FROM Reservations WHERE book_id = b.id) as total_reservations,
      (SELECT COUNT(*) FROM Reservations WHERE book_id = b.id AND status = 'active') as active_reservations,
      (SELECT AVG(rating) FROM BookReviews WHERE book_id = b.id) as average_rating,
      (SELECT COUNT(*) FROM BookReviews WHERE book_id = b.id) as total_reviews
    FROM Books b 
    WHERE b.id = ?
  `;

  db.get(query, [id], (err, book) => {
    if (err) {
      console.error("Erro ao buscar livro:", err);
      return res.status(500).json({
        message: "Erro ao buscar livro.",
      });
    }

    if (!book) {
      return res.status(404).json({
        message: "Livro não encontrado.",
        bookId: parseInt(id),
      });
    }

    // Buscar algumas avaliações recentes
    const reviewsQuery = `
      SELECT 
        br.rating, br.review_text, br.created_at,
        u.name as reviewer_name
      FROM BookReviews br
      JOIN Users u ON br.user_id = u.id
      WHERE br.book_id = ?
      ORDER BY br.created_at DESC
      LIMIT 5
    `;

    db.all(reviewsQuery, [id], (reviewsErr, reviews) => {
      if (reviewsErr) {
        console.error("Erro ao buscar avaliações:", reviewsErr);
        reviews = [];
      }

      // Calcular disponibilidade
      book.isAvailable = book.available_copies > 0;
      book.availability_status =
        book.available_copies > 0 ? "available" : "unavailable";

      // Adicionar avaliações
      book.recent_reviews = reviews || [];

      res.json({
        book,
        availability: {
          total_copies: book.total_copies,
          available_copies: book.available_copies,
          reserved_copies: book.total_copies - book.available_copies,
          isAvailable: book.isAvailable,
          status: book.availability_status,
        },
        statistics: {
          total_reservations: book.total_reservations || 0,
          active_reservations: book.active_reservations || 0,
          average_rating: parseFloat(book.average_rating) || 0,
          total_reviews: book.total_reviews || 0,
        },
      });
    });
  });
};

// Obter categorias disponíveis
const getCategories = (req, res) => {
  const query = `
    SELECT 
      category,
      COUNT(*) as book_count,
      SUM(available_copies) as available_books
    FROM Books 
    WHERE category IS NOT NULL AND category != ''
    GROUP BY category 
    ORDER BY category ASC
  `;

  db.all(query, [], (err, categories) => {
    if (err) {
      console.error("Erro ao buscar categorias:", err);
      return res.status(500).json({
        message: "Erro ao buscar categorias.",
      });
    }

    res.json({
      categories: categories.map((cat) => ({
        name: cat.category,
        bookCount: cat.book_count,
        availableBooks: cat.available_books,
      })),
      total: categories.length,
    });
  });
};

// Obter autores disponíveis
const getAuthors = (req, res) => {
  const query = `
    SELECT 
      author,
      COUNT(*) as book_count,
      SUM(available_copies) as available_books
    FROM Books 
    WHERE author IS NOT NULL AND author != ''
    GROUP BY author 
    ORDER BY author ASC
  `;

  db.all(query, [], (err, authors) => {
    if (err) {
      console.error("Erro ao buscar autores:", err);
      return res.status(500).json({
        message: "Erro ao buscar autores.",
      });
    }

    res.json({
      authors: authors.map((auth) => ({
        name: auth.author,
        bookCount: auth.book_count,
        availableBooks: auth.available_books,
      })),
      total: authors.length,
    });
  });
};

// Criar novo livro (Admin apenas)
const createBook = (req, res) => {
  const { error, value } = bookSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
      field: error.details[0].path[0],
    });
  }

  const {
    title,
    author,
    description,
    category,
    isbn,
    editor,
    language,
    publication_year,
    pages,
    format,
    total_copies,
    cover_image,
  } = value;

  // Verificar se livro com mesmo título e autor já existe
  db.get(
    "SELECT id, title, author FROM Books WHERE title = ? AND author = ?",
    [title, author],
    (err, existingBook) => {
      if (err) {
        console.error("Erro ao verificar livro existente:", err);
        return res.status(500).json({
          message: "Erro ao verificar livro existente.",
        });
      }

      if (existingBook) {
        return res.status(400).json({
          message: "Já existe um livro com este título e autor.",
          existingBook: {
            id: existingBook.id,
            title: existingBook.title,
            author: existingBook.author,
          },
        });
      }

      // Criar livro
      const available_copies =
        value.available_copies !== undefined
          ? value.available_copies
          : total_copies;

      const insertQuery = `
        INSERT INTO Books (
          title, author, description, category, isbn, editor, language,
          publication_year, pages, format, total_copies, available_copies, cover_image
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.run(
        insertQuery,
        [
          title,
          author,
          description || "",
          category || "",
          isbn || "",
          editor || "",
          language || "Português",
          publication_year || null,
          pages || null,
          format || "Físico",
          total_copies,
          available_copies,
          cover_image || "",
        ],
        function (err) {
          if (err) {
            console.error("Erro ao criar livro:", err);
            return res.status(500).json({
              message: "Erro ao criar livro.",
            });
          }

          console.log(
            `✅ Livro criado: "${title}" por ${author} - ID ${this.lastID}`
          );

          res.status(201).json({
            message: "Livro criado com sucesso.",
            book: {
              id: this.lastID,
              title,
              author,
              category: category || "",
              isbn: isbn || "",
              total_copies,
              available_copies,
              created_at: new Date().toISOString(),
            },
          });
        }
      );
    }
  );
};

// Atualizar livro (Admin apenas)
const updateBook = (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({
      message: "ID do livro inválido.",
    });
  }

  const { error, value } = bookSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
      field: error.details[0].path[0],
    });
  }

  // Verificar se livro existe
  db.get("SELECT * FROM Books WHERE id = ?", [id], (err, book) => {
    if (err) {
      console.error("Erro ao buscar livro:", err);
      return res.status(500).json({
        message: "Erro ao buscar livro.",
      });
    }

    if (!book) {
      return res.status(404).json({
        message: "Livro não encontrado.",
        bookId: parseInt(id),
      });
    }

    // Preparar campos para atualização
    const fields = [];
    const values = [];

    Object.keys(value).forEach((key) => {
      if (value[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value[key]);
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({
        message: "Nenhum campo para atualizar fornecido.",
      });
    }

    values.push(id); // Para o WHERE

    const updateQuery = `UPDATE Books SET ${fields.join(", ")} WHERE id = ?`;

    db.run(updateQuery, values, function (err) {
      if (err) {
        console.error("Erro ao atualizar livro:", err);
        return res.status(500).json({
          message: "Erro ao atualizar livro.",
        });
      }

      console.log(`✅ Livro atualizado: ID ${id} - ${book.title}`);

      res.json({
        message: "Livro atualizado com sucesso.",
        bookId: parseInt(id),
        updatedFields: Object.keys(value),
        previousTitle: book.title,
      });
    });
  });
};

// Deletar livro (Admin apenas)
const deleteBook = (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({
      message: "ID do livro inválido.",
    });
  }

  // Verificar se livro existe e se tem reservas ativas
  const checkQuery = `
    SELECT 
      b.*,
      (SELECT COUNT(*) FROM Reservations WHERE book_id = b.id AND status = 'active') as active_reservations
    FROM Books b 
    WHERE b.id = ?
  `;

  db.get(checkQuery, [id], (err, book) => {
    if (err) {
      console.error("Erro ao verificar livro:", err);
      return res.status(500).json({
        message: "Erro ao verificar livro.",
      });
    }

    if (!book) {
      return res.status(404).json({
        message: "Livro não encontrado.",
        bookId: parseInt(id),
      });
    }

    if (book.active_reservations > 0) {
      return res.status(400).json({
        message: `Não é possível deletar livro com ${book.active_reservations} reserva(s) ativa(s).`,
        bookTitle: book.title,
        activeReservations: book.active_reservations,
        suggestion:
          "Aguarde as reservas serem concluídas ou cancele-as antes de deletar o livro.",
      });
    }

    // Deletar livro
    db.run("DELETE FROM Books WHERE id = ?", [id], function (err) {
      if (err) {
        console.error("Erro ao deletar livro:", err);
        return res.status(500).json({
          message: "Erro ao deletar livro.",
        });
      }

      console.log(`✅ Livro deletado: "${book.title}" - ID ${id}`);

      res.json({
        message: "Livro deletado com sucesso.",
        deletedBook: {
          id: parseInt(id),
          title: book.title,
          author: book.author,
        },
      });
    });
  });
};

module.exports = {
  getAllBooks,
  getBookById,
  getCategories,
  getAuthors,
  createBook,
  updateBook,
  deleteBook,
};
