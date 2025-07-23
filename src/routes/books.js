const express = require('express');
const router = express.Router();
const BooksController = require('../controllers/booksController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

/**
 * @swagger
 * /api/books:
 *   get:
 *     tags: [📚 Catálogo de Livros]
 *     summary: Listar livros com filtros e paginação
 *     description: Retorna lista paginada de livros com filtros opcionais
 *     parameters:
 *       - name: search
 *         in: query
 *         description: Buscar por título ou autor
 *         schema:
 *           type: string
 *           example: "machado"
 *       - name: category
 *         in: query
 *         description: Filtrar por categoria
 *         schema:
 *           type: string
 *           example: "Literatura Brasileira"
 *       - name: author
 *         in: query
 *         description: Filtrar por autor
 *         schema:
 *           type: string
 *           example: "Machado de Assis"
 *       - name: available
 *         in: query
 *         description: Filtrar por disponibilidade
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           example: "true"
 *       - name: limit
 *         in: query
 *         description: Itens por página (máximo 100)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *           example: 20
 *       - name: offset
 *         in: query
 *         description: Itens para pular (paginação)
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *           example: 0
 *       - name: orderBy
 *         in: query
 *         description: Campo para ordenação
 *         schema:
 *           type: string
 *           enum: [title, author, category, publication_year, pages]
 *           default: "title"
 *           example: "title"
 *       - name: order
 *         in: query
 *         description: Direção da ordenação
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: "ASC"
 *           example: "ASC"
 *     responses:
 *       200:
 *         description: Lista de livros carregada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 books:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Book'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     showing:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                 filters:
 *                   type: object
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   post:
 *     tags: [📚 Catálogo de Livros]
 *     summary: Adicionar novo livro (Admin apenas)
 *     description: Cria um novo livro no acervo da biblioteca
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, author, category, total_copies]
 *             properties:
 *               title:
 *                 type: string
 *                 example: "O Cortiço"
 *               author:
 *                 type: string
 *                 example: "Aluísio Azevedo"
 *               description:
 *                 type: string
 *                 example: "Romance naturalista brasileiro"
 *               category:
 *                 type: string
 *                 example: "Literatura Brasileira"
 *               isbn:
 *                 type: string
 *                 example: "978-85-260-1320-6"
 *               editor:
 *                 type: string
 *                 example: "Editora Ática"
 *               language:
 *                 type: string
 *                 example: "Português"
 *                 default: "Português"
 *               publication_year:
 *                 type: integer
 *                 example: 1890
 *               pages:
 *                 type: integer
 *                 example: 312
 *               format:
 *                 type: string
 *                 enum: [Físico, Digital, Audiobook]
 *                 example: "Físico"
 *                 default: "Físico"
 *               total_copies:
 *                 type: integer
 *                 example: 4
 *                 minimum: 1
 *               available_copies:
 *                 type: integer
 *                 example: 4
 *                 minimum: 0
 *               cover_image:
 *                 type: string
 *                 example: "o-cortico.jpg"
 *           examples:
 *             livro_completo:
 *               summary: Livro com todos os campos
 *               value:
 *                 title: "O Cortiço"
 *                 author: "Aluísio Azevedo"
 *                 description: "Romance naturalista que retrata a vida em um cortiço"
 *                 category: "Literatura Brasileira"
 *                 isbn: "978-85-260-1320-6"
 *                 editor: "Editora Ática"
 *                 language: "Português"
 *                 publication_year: 1890
 *                 pages: 312
 *                 format: "Físico"
 *                 total_copies: 4
 *                 available_copies: 4
 *             livro_minimo:
 *               summary: Livro com campos mínimos
 *               value:
 *                 title: "Iracema"
 *                 author: "José de Alencar"
 *                 category: "Literatura Brasileira"
 *                 total_copies: 2
 *     responses:
 *       201:
 *         description: Livro criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Livro criado com sucesso."
 *                 book:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 25
 *                     title:
 *                       type: string
 *                       example: "O Cortiço"
 *                     author:
 *                       type: string
 *                       example: "Aluísio Azevedo"
 *                     category:
 *                       type: string
 *                       example: "Literatura Brasileira"
 *                     total_copies:
 *                       type: integer
 *                       example: 4
 *                     available_copies:
 *                       type: integer
 *                       example: 4
 *       400:
 *         description: Dados inválidos ou livro já existe
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/books/categories:
 *   get:
 *     tags: [📚 Catálogo de Livros]
 *     summary: Listar categorias disponíveis
 *     description: Retorna lista de todas as categorias de livros com estatísticas
 *     responses:
 *       200:
 *         description: Categorias carregadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "Literatura Brasileira"
 *                       bookCount:
 *                         type: integer
 *                         example: 8
 *                       availableBooks:
 *                         type: integer
 *                         example: 12
 *                 total:
 *                   type: integer
 *                   example: 6
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/books/authors:
 *   get:
 *     tags: [📚 Catálogo de Livros]
 *     summary: Listar autores disponíveis
 *     description: Retorna lista de todos os autores com estatísticas
 *     responses:
 *       200:
 *         description: Autores carregados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 authors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "Machado de Assis"
 *                       bookCount:
 *                         type: integer
 *                         example: 3
 *                       availableBooks:
 *                         type: integer
 *                         example: 7
 *                 total:
 *                   type: integer
 *                   example: 15
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/books/{id}:
 *   get:
 *     tags: [📚 Catálogo de Livros]
 *     summary: Obter detalhes de um livro específico
 *     description: Retorna informações completas de um livro incluindo estatísticas
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID do livro
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *     responses:
 *       200:
 *         description: Detalhes do livro carregados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 book:
 *                   $ref: '#/components/schemas/Book'
 *                 availability:
 *                   type: object
 *                   properties:
 *                     total_copies:
 *                       type: integer
 *                     available_copies:
 *                       type: integer
 *                     is_available:
 *                       type: boolean
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     total_reservations:
 *                       type: integer
 *                     active_reservations:
 *                       type: integer
 *                     average_rating:
 *                       type: number
 *                     total_reviews:
 *                       type: integer
 *       400:
 *         description: ID inválido
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   put:
 *     tags: [📚 Catálogo de Livros]
 *     summary: Atualizar livro (Admin apenas)
 *     description: Atualiza informações de um livro existente
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID do livro a ser atualizado
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               author:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               available_copies:
 *                 type: integer
 *                 minimum: 0
 *           examples:
 *             atualizacao_parcial:
 *               summary: Atualizar apenas alguns campos
 *               value:
 *                 description: "Descrição atualizada do livro"
 *                 available_copies: 2
 *             corrigir_disponibilidade:
 *               summary: Corrigir número de exemplares
 *               value:
 *                 available_copies: 4
 *                 total_copies: 5
 *     responses:
 *       200:
 *         description: Livro atualizado com sucesso
 *       400:
 *         description: Dados inválidos ou nenhum campo fornecido
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   delete:
 *     tags: [📚 Catálogo de Livros]
 *     summary: Remover livro (Admin apenas)
 *     description: Remove um livro do acervo permanentemente
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID do livro a ser removido
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 5
 *     responses:
 *       200:
 *         description: Livro removido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Livro deletado com sucesso."
 *                 deletedBook:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 5
 *                     title:
 *                       type: string
 *                       example: "Livro Teste"
 *                     author:
 *                       type: string
 *                       example: "Autor Teste"
 *       400:
 *         description: Livro possui reservas ativas
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

// Rotas públicas - não precisam de autenticação
router.get('/', BooksController.getAllBooks);
router.get('/categories', BooksController.getCategories);
router.get('/authors', BooksController.getAuthors);
router.get('/:id', BooksController.getBookById);

// Rotas protegidas - apenas administradores
const requireAdmin = [authenticateToken, isAdmin];

router.post('/', requireAdmin, BooksController.createBook);
router.put('/:id', requireAdmin, BooksController.updateBook);
router.delete('/:id', requireAdmin, BooksController.deleteBook);

module.exports = router;