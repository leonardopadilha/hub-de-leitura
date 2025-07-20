const db = require("../../config/db");

/**
 * Controller para gerenciamento de livros
 * Substitui a funcionalidade de produtos do e-commerce
 */
class BooksController {

  /**
   * Listar livros com paginação e filtros
   * GET /api/books
   */
  static getAllBooks(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const category = req.query.category;
    const author = req.query.author;
    const search = req.query.search;
    const available = req.query.available; // true/false para mostrar apenas disponíveis
    
    const offset = (page - 1) * limit;
    
    // Construir query dinamicamente baseada nos filtros
    let whereClause = "WHERE 1=1";
    let queryParams = [];
    let countParams = [];
    
    if (category) {
      whereClause += " AND category = ?";
      queryParams.push(category);
      countParams.push(category);
    }
    
    if (author) {
      whereClause += " AND author LIKE ?";
      queryParams.push(`%${author}%`);
      countParams.push(`%${author}%`);
    }
    
    if (search) {
      whereClause += " AND (title LIKE ? OR author LIKE ? OR description LIKE ?)";
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (available === 'true') {
      whereClause += " AND available_copies > 0";
    }
    
    // Query principal com paginação
    const mainQuery = `
      SELECT 
        id, title, author, isbn, editor, category, language,
        publication_year, pages, format, total_copies, available_copies,
        description, cover_image, created_at
      FROM Books 
      ${whereClause}
      ORDER BY title ASC
      LIMIT ? OFFSET ?
    `;
    
    queryParams.push(limit, offset);
    
    // Query para contar total
    const countQuery = `SELECT COUNT(*) as total FROM Books ${whereClause}`;
    
    db.all(mainQuery, queryParams, (err, rows) => {
      if (err) {
        console.error('Erro ao buscar livros:', err);
        return res.status(500).json({ 
          error: "Erro ao buscar livros.",
          details: err.message 
        });
      }
      
      db.get(countQuery, countParams, (err, result) => {
        if (err) {
          console.error('Erro ao contar livros:', err);
          return res.status(500).json({ 
            error: "Erro ao calcular o total de livros.",
            details: err.message 
          });
        }
        
        const total = result.total;
        const totalPages = Math.ceil(total / limit);
        
        res.json({
          books: rows,
          pagination: {
            totalPages: totalPages,
            currentPage: page,
            totalBooks: total,
            booksPerPage: limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          },
          filters: {
            category,
            author,
            search,
            available
          }
        });
      });
    });
  }

  /**
   * Obter detalhes de um livro específico
   * GET /api/books/:id
   */
  static getBookById(req, res) {
    const bookId = req.params.id;
    
    const query = `
      SELECT 
        id, title, author, isbn, editor, category, language,
        publication_year, pages, format, total_copies, available_copies,
        description, cover_image, created_at
      FROM Books 
      WHERE id = ?
    `;
    
    db.get(query, [bookId], (err, book) => {
      if (err) {
        console.error('Erro ao buscar livro:', err);
        return res.status(500).json({ 
          error: "Erro ao buscar detalhes do livro.",
          details: err.message 
        });
      }
      
      if (!book) {
        return res.status(404).json({ 
          message: "Livro não encontrado." 
        });
      }
      
      // Buscar avaliações do livro
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
      
      db.all(reviewsQuery, [bookId], (err, reviews) => {
        if (err) {
          console.error('Erro ao buscar avaliações:', err);
          reviews = []; // Continua sem as avaliações em caso de erro
        }
        
        // Calcular média das avaliações
        const avgRatingQuery = `
          SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
          FROM BookReviews 
          WHERE book_id = ?
        `;
        
        db.get(avgRatingQuery, [bookId], (err, ratingData) => {
          if (err) {
            console.error('Erro ao calcular média:', err);
            ratingData = { avg_rating: null, review_count: 0 };
          }
          
          res.json({
            ...book,
            availability: {
              isAvailable: book.available_copies > 0,
              availableCopies: book.available_copies,
              totalCopies: book.total_copies,
              reservationStatus: book.available_copies > 0 ? 'available' : 'unavailable'
            },
            reviews: {
              items: reviews,
              averageRating: ratingData.avg_rating ? Math.round(ratingData.avg_rating * 10) / 10 : null,
              totalReviews: ratingData.review_count
            }
          });
        });
      });
    });
  }

  /**
   * Criar novo livro (Admin apenas)
   * POST /api/books
   */
  static createBook(req, res) {
    const {
      title, author, isbn, editor, category, language,
      publication_year, pages, format, total_copies,
      description, cover_image
    } = req.body;
    
    // Validações básicas
    if (!title || !author) {
      return res.status(400).json({ 
        message: "Título e autor são obrigatórios." 
      });
    }
    
    const query = `
      INSERT INTO Books (
        title, author, isbn, editor, category, language,
        publication_year, pages, format, total_copies, available_copies,
        description, cover_image
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const availableCopies = total_copies || 1;
    
    db.run(query, [
      title, author, isbn, editor, category, language || 'Português',
      publication_year, pages, format || 'Físico', 
      total_copies || 1, availableCopies,
      description, cover_image || 'livro-padrao.png'
    ], function(err) {
      if (err) {
        console.error('Erro ao criar livro:', err);
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(400).json({ 
            message: "ISBN já existe no sistema." 
          });
        }
        return res.status(500).json({ 
          error: "Erro ao criar livro.",
          details: err.message 
        });
      }
      
      res.status(201).json({
        message: "Livro criado com sucesso.",
        bookId: this.lastID
      });
    });
  }

  /**
   * Atualizar livro (Admin apenas)
   * PUT /api/books/:id
   */
  static updateBook(req, res) {
    const bookId = req.params.id;
    const {
      title, author, isbn, editor, category, language,
      publication_year, pages, format, total_copies,
      description, cover_image
    } = req.body;
    
    // Verificar se o livro existe
    db.get("SELECT * FROM Books WHERE id = ?", [bookId], (err, book) => {
      if (err) {
        console.error('Erro ao verificar livro:', err);
        return res.status(500).json({ 
          error: "Erro ao verificar livro." 
        });
      }
      
      if (!book) {
        return res.status(404).json({ 
          message: "Livro não encontrado." 
        });
      }
      
      // Calcular available_copies se total_copies mudou
      let newAvailableCopies = book.available_copies;
      if (total_copies && total_copies !== book.total_copies) {
        const difference = total_copies - book.total_copies;
        newAvailableCopies = Math.max(0, book.available_copies + difference);
      }
      
      const query = `
        UPDATE Books SET
          title = COALESCE(?, title),
          author = COALESCE(?, author),
          isbn = COALESCE(?, isbn),
          editor = COALESCE(?, editor),
          category = COALESCE(?, category),
          language = COALESCE(?, language),
          publication_year = COALESCE(?, publication_year),
          pages = COALESCE(?, pages),
          format = COALESCE(?, format),
          total_copies = COALESCE(?, total_copies),
          available_copies = ?,
          description = COALESCE(?, description),
          cover_image = COALESCE(?, cover_image)
        WHERE id = ?
      `;
      
      db.run(query, [
        title, author, isbn, editor, category, language,
        publication_year, pages, format, total_copies,
        newAvailableCopies, description, cover_image, bookId
      ], function(err) {
        if (err) {
          console.error('Erro ao atualizar livro:', err);
          if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(400).json({ 
              message: "ISBN já existe no sistema." 
            });
          }
          return res.status(500).json({ 
            error: "Erro ao atualizar livro.",
            details: err.message 
          });
        }
        
        res.json({
          message: "Livro atualizado com sucesso."
        });
      });
    });
  }

  /**
   * Deletar livro (Admin apenas)
   * DELETE /api/books/:id
   */
  static deleteBook(req, res) {
    const bookId = req.params.id;
    
    // Verificar se há reservas ativas para este livro
    const checkReservationsQuery = `
      SELECT COUNT(*) as active_reservations
      FROM Reservations 
      WHERE book_id = ? AND status IN ('active', 'picked_up')
    `;
    
    db.get(checkReservationsQuery, [bookId], (err, result) => {
      if (err) {
        console.error('Erro ao verificar reservas:', err);
        return res.status(500).json({ 
          error: "Erro ao verificar reservas ativas." 
        });
      }
      
      if (result.active_reservations > 0) {
        return res.status(400).json({ 
          message: "Não é possível deletar livro com reservas ativas." 
        });
      }
      
      db.run("DELETE FROM Books WHERE id = ?", [bookId], function(err) {
        if (err) {
          console.error('Erro ao deletar livro:', err);
          return res.status(500).json({ 
            error: "Erro ao deletar livro.",
            details: err.message 
          });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ 
            message: "Livro não encontrado." 
          });
        }
        
        res.json({
          message: "Livro deletado com sucesso."
        });
      });
    });
  }

  /**
   * Obter categorias disponíveis
   * GET /api/books/categories
   */
  static getCategories(req, res) {
    const query = `
      SELECT DISTINCT category, COUNT(*) as book_count
      FROM Books 
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY category ASC
    `;
    
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('Erro ao buscar categorias:', err);
        return res.status(500).json({ 
          error: "Erro ao buscar categorias." 
        });
      }
      
      res.json({
        categories: rows
      });
    });
  }

  /**
   * Obter autores disponíveis
   * GET /api/books/authors
   */
  static getAuthors(req, res) {
    const query = `
      SELECT DISTINCT author, COUNT(*) as book_count
      FROM Books 
      WHERE author IS NOT NULL
      GROUP BY author
      ORDER BY author ASC
    `;
    
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('Erro ao buscar autores:', err);
        return res.status(500).json({ 
          error: "Erro ao buscar autores." 
        });
      }
      
      res.json({
        authors: rows
      });
    });
  }
}

module.exports = BooksController;