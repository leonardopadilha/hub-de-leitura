const express = require('express');
const router = express.Router();
const BooksController = require('../controllers/booksController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

/**
 * Rotas públicas - não precisam de autenticação
 */

// GET /api/books - Listar livros com filtros e paginação
router.get('/', BooksController.getAllBooks);

// GET /api/books/categories - Obter categorias disponíveis
router.get('/categories', BooksController.getCategories);

// GET /api/books/authors - Obter autores disponíveis  
router.get('/authors', BooksController.getAuthors);

// GET /api/books/:id - Obter detalhes de um livro específico
router.get('/:id', BooksController.getBookById);

/**
 * Rotas protegidas - apenas administradores
 */

// POST /api/books - Criar novo livro (Admin apenas)
router.post('/', authenticateToken, isAdmin, BooksController.createBook);

// PUT /api/books/:id - Atualizar livro (Admin apenas)
router.put('/:id', authenticateToken, isAdmin, BooksController.updateBook);

// DELETE /api/books/:id - Deletar livro (Admin apenas)
router.delete('/:id', authenticateToken, isAdmin, BooksController.deleteBook);

module.exports = router;