const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const BasketController = require('../controllers/basketController');

/**
 * @swagger
 * components:
 *   schemas:
 *     BasketItem:
 *       type: object
 *       description: Item na cesta de livros
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único do item na cesta
 *           example: 1
 *         user_id:
 *           type: integer
 *           description: ID do usuário dono da cesta
 *           example: 2
 *         book_id:
 *           type: integer
 *           description: ID do livro
 *           example: 1
 *         quantity:
 *           type: integer
 *           description: Quantidade (sempre 1 para livros)
 *           example: 1
 *         added_date:
 *           type: string
 *           format: date-time
 *           description: Data quando foi adicionado
 *           example: "2024-01-15T10:30:00Z"
 *         book_title:
 *           type: string
 *           description: Título do livro
 *           example: "Dom Casmurro"
 *         book_author:
 *           type: string
 *           description: Autor do livro
 *           example: "Machado de Assis"
 *         available:
 *           type: boolean
 *           description: Se o livro está disponível
 *           example: true
 *         available_copies:
 *           type: integer
 *           description: Cópias disponíveis
 *           example: 3
 *     BasketRequest:
 *       type: object
 *       description: Dados para adicionar item à cesta
 *       properties:
 *         userId:
 *           type: integer
 *           description: ID do usuário (deve ser o mesmo do token)
 *           example: 2
 *         bookId:
 *           type: integer
 *           description: ID do livro a adicionar
 *           example: 1
 *         quantity:
 *           type: integer
 *           description: Quantidade (sempre 1)
 *           example: 1
 *           enum: [1]
 *       required: [userId, bookId, quantity]
 *     BasketResponse:
 *       type: object
 *       description: Resposta com itens da cesta
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BasketItem'
 *         total:
 *           type: integer
 *           description: Total de itens
 *           example: 3
 *         userId:
 *           type: integer
 *           example: 2
 *         summary:
 *           type: object
 *           properties:
 *             totalItems:
 *               type: integer
 *               example: 3
 *             availableItems:
 *               type: integer
 *               example: 2
 *             unavailableItems:
 *               type: integer
 *               example: 1
 */

/**
 * @swagger
 * /api/basket/{userId}:
 *   get:
 *     tags: [🛒 Cesta de Livros]
 *     summary: Listar itens da cesta
 *     description: |
 *       **Retorna todos os livros na cesta do usuário**
 *       
 *       ### 🎯 Cenários para testar:
 *       - ✅ Ver própria cesta (sucesso)
 *       - ❌ Tentar ver cesta de outro usuário (403)
 *       - 📋 Cesta vazia vs com itens
 *       - ⚠️ Verificar livros que ficaram indisponíveis
 *       
 *       ### ⚠️ Regras de negócio:
 *       - Usuário só pode ver própria cesta
 *       - Mostra disponibilidade atual dos livros
 *       - Inclui estatísticas de disponibilidade
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: ID do usuário (deve ser o mesmo do token JWT)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *         example: 2
 *     responses:
 *       200:
 *         description: ✅ Itens da cesta carregados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BasketResponse'
 *             examples:
 *               cesta_com_itens:
 *                 summary: Cesta com livros
 *                 value:
 *                   items:
 *                     - id: 1
 *                       user_id: 2
 *                       book_id: 1
 *                       quantity: 1
 *                       added_date: "2024-01-15T10:30:00Z"
 *                       book_title: "Dom Casmurro"
 *                       book_author: "Machado de Assis"
 *                       available: true
 *                       available_copies: 3
 *                   total: 1
 *                   userId: 2
 *                   summary:
 *                     totalItems: 1
 *                     availableItems: 1
 *                     unavailableItems: 0
 *               cesta_vazia:
 *                 summary: Cesta vazia
 *                 value:
 *                   items: []
 *                   total: 0
 *                   userId: 2
 *                   summary:
 *                     totalItems: 0
 *                     availableItems: 0
 *                     unavailableItems: 0
 *       401:
 *         description: ❌ Token inválido ou expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Token inválido ou expirado"
 *       403:
 *         description: ❌ Acesso negado - Tentativa de ver cesta de outro usuário
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Acesso negado. Você só pode ver sua própria cesta."
 *       500:
 *         description: ❌ Erro interno do servidor
 */
router.get('/:userId', authenticateToken, BasketController.getUserBasket);

/**
 * @swagger
 * /api/basket:
 *   post:
 *     tags: [🛒 Cesta de Livros]
 *     summary: Adicionar livro à cesta
 *     description: |
 *       **Adiciona um livro disponível à cesta do usuário**
 *       
 *       ### 🎯 Cenários para testar:
 *       - ✅ Adicionar livro disponível (sucesso)
 *       - ❌ Adicionar livro já na cesta (400)
 *       - ❌ Adicionar livro esgotado (400)
 *       - ❌ Adicionar livro inexistente (404)
 *       - ❌ Quantidade diferente de 1 (400)
 *       - ❌ Tentar adicionar à cesta de outro usuário (403)
 *       
 *       ### ⚠️ Regras de negócio:
 *       - Cada livro só pode estar uma vez na cesta
 *       - Quantidade sempre deve ser 1
 *       - Apenas livros disponíveis podem ser adicionados
 *       - Usuário só pode adicionar à própria cesta
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BasketRequest'
 *           examples:
 *             adicionar_livro:
 *               summary: Adicionar livro válido
 *               value:
 *                 userId: 2
 *                 bookId: 1
 *                 quantity: 1
 *             livro_ja_na_cesta:
 *               summary: Livro já adicionado (erro esperado)
 *               value:
 *                 userId: 2
 *                 bookId: 1
 *                 quantity: 1
 *             quantidade_invalida:
 *               summary: Quantidade inválida (erro esperado)
 *               value:
 *                 userId: 2
 *                 bookId: 1
 *                 quantity: 2
 *     responses:
 *       201:
 *         description: ✅ Livro adicionado à cesta com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Livro adicionado à cesta com sucesso."
 *                 itemId:
 *                   type: integer
 *                   example: 15
 *                 bookTitle:
 *                   type: string
 *                   example: "Dom Casmurro"
 *                 bookAuthor:
 *                   type: string
 *                   example: "Machado de Assis"
 *                 addedDate:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00Z"
 *       400:
 *         description: ❌ Dados inválidos ou regra de negócio violada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 bookTitle:
 *                   type: string
 *                 availableCopies:
 *                   type: integer
 *             examples:
 *               livro_ja_na_cesta:
 *                 summary: Livro já está na cesta
 *                 value:
 *                   message: "Livro já está na cesta."
 *                   bookTitle: "Dom Casmurro"
 *                   addedDate: "2024-01-15T10:30:00Z"
 *               livro_esgotado:
 *                 summary: Livro não disponível
 *                 value:
 *                   message: "Livro não está disponível para reserva."
 *                   bookTitle: "1984"
 *                   availableCopies: 0
 *               quantidade_invalida:
 *                 summary: Quantidade deve ser 1
 *                 value:
 *                   message: "Quantidade deve ser 1 para livros."
 *       401:
 *         description: ❌ Token inválido ou expirado
 *       403:
 *         description: ❌ Acesso negado - Tentativa de adicionar à cesta de outro usuário
 *       404:
 *         description: ❌ Livro não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Livro não encontrado."
 *       500:
 *         description: ❌ Erro interno do servidor
 */
router.post('/', authenticateToken, BasketController.addToBasket);

/**
 * @swagger
 * /api/basket/{userId}:
 *   delete:
 *     tags: [🛒 Cesta de Livros]
 *     summary: Limpar cesta completa
 *     description: |
 *       **Remove todos os itens da cesta do usuário**
 *       
 *       ### 🎯 Cenários para testar:
 *       - ✅ Limpar cesta com itens (sucesso)
 *       - ✅ Limpar cesta já vazia (sucesso)
 *       - ❌ Tentar limpar cesta de outro usuário (403)
 *       
 *       ### ⚠️ Regras de negócio:
 *       - Usuário só pode limpar própria cesta
 *       - Operação é irreversível
 *       - Não afeta disponibilidade dos livros
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: ID do usuário (deve ser o mesmo do token)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *     responses:
 *       200:
 *         description: ✅ Cesta limpa com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cesta limpa com sucesso."
 *                 itemsRemoved:
 *                   type: integer
 *                   description: Número de itens removidos
 *                   example: 3
 *                 previousItemCount:
 *                   type: integer
 *                   description: Total de itens antes da limpeza
 *                   example: 3
 *             examples:
 *               cesta_com_itens:
 *                 summary: Cesta com itens foi limpa
 *                 value:
 *                   message: "Cesta limpa com sucesso."
 *                   itemsRemoved: 3
 *                   previousItemCount: 3
 *               cesta_ja_vazia:
 *                 summary: Cesta já estava vazia
 *                 value:
 *                   message: "Cesta já estava vazia."
 *                   itemsRemoved: 0
 *       401:
 *         description: ❌ Token inválido ou expirado
 *       403:
 *         description: ❌ Acesso negado
 *       500:
 *         description: ❌ Erro interno do servidor
 */
router.delete('/:userId', authenticateToken, BasketController.clearBasket);

/**
 * @swagger
 * /api/basket/{userId}/{bookId}:
 *   delete:
 *     tags: [🛒 Cesta de Livros]
 *     summary: Remover item específico da cesta
 *     description: |
 *       **Remove um livro específico da cesta do usuário**
 *       
 *       ### 🎯 Cenários para testar:
 *       - ✅ Remover item existente na cesta (sucesso)
 *       - ❌ Remover item que não está na cesta (404)
 *       - ❌ IDs inválidos (400)
 *       - ❌ Tentar remover de cesta de outro usuário (403)
 *       
 *       ### ⚠️ Regras de negócio:
 *       - Item deve existir na cesta
 *       - Usuário só pode remover do próprio cesta
 *       - Não afeta disponibilidade do livro
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: ID do usuário
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *       - name: bookId
 *         in: path
 *         required: true
 *         description: ID do livro a ser removido
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *     responses:
 *       200:
 *         description: ✅ Item removido da cesta com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Item removido da cesta com sucesso."
 *                 removedItem:
 *                   type: object
 *                   properties:
 *                     bookId:
 *                       type: integer
 *                       example: 1
 *                     bookTitle:
 *                       type: string
 *                       example: "Dom Casmurro"
 *                     bookAuthor:
 *                       type: string
 *                       example: "Machado de Assis"
 *       401:
 *         description: ❌ Token inválido ou expirado
 *       403:
 *         description: ❌ Acesso negado
 *       404:
 *         description: ❌ Item não encontrado na cesta
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Item não encontrado na cesta."
 *       500:
 *         description: ❌ Erro interno do servidor
 */
router.delete('/:userId/:bookId', authenticateToken, BasketController.removeFromBasket);

/**
 * @swagger
 * /api/basket/{userId}/check-availability:
 *   get:
 *     tags: [🛒 Cesta de Livros]
 *     summary: Verificar disponibilidade dos itens
 *     description: |
 *       **Verifica se todos os livros da cesta ainda estão disponíveis**
 *       
 *       ### 🎯 Cenários para testar:
 *       - ✅ Todos os itens disponíveis
 *       - ⚠️ Alguns itens ficaram indisponíveis
 *       - 📋 Cesta vazia
 *       
 *       ### 💡 Útil antes de criar reservas
 *       - Mostra quais livros podem ser reservados
 *       - Indica se pode prosseguir com reservas
 *       - Lista livros que ficaram indisponíveis
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: ID do usuário
 *         schema:
 *           type: integer
 *           example: 2
 *     responses:
 *       200:
 *         description: ✅ Verificação de disponibilidade concluída
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 3
 *                 available:
 *                   type: integer
 *                   example: 2
 *                 unavailable:
 *                   type: integer
 *                   example: 1
 *                 canProceedToReservation:
 *                   type: boolean
 *                   example: false
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       book_id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       author:
 *                         type: string
 *                       available_copies:
 *                         type: integer
 *                       available:
 *                         type: boolean
 *                       status:
 *                         type: string
 *                         enum: [available, unavailable]
 *                 unavailableBooks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       bookId:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       author:
 *                         type: string
 *       401:
 *         description: ❌ Token inválido
 *       403:
 *         description: ❌ Acesso negado
 */
router.get('/:userId/check-availability', authenticateToken, BasketController.checkBasketAvailability);

module.exports = router;