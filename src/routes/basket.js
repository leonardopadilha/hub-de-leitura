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
 *       description: Item no carrinho de livros
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único do item no carrinho
 *           example: 1
 *         user_id:
 *           type: integer
 *           description: ID do usuário dono do carrinho
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
 *       description: Dados para adicionar item ao carrinho
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
 *       description: Resposta com itens do carrinho
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
 *     tags: [🛒 Carrinho (Basket)]
 *     summary: Listar itens do carrinho
 *     description: |
 *       **Retorna todos os livros no carrinho do usuário**
 *       
 *       ### 🎯 Cenários para testar:
 *       - ✅ Ver próprio carrinho (sucesso)
 *       - ❌ Tentar ver carrinho de outro usuário (403)
 *       - 📋 Carrinho vazio vs com itens
 *       - ⚠️ Verificar livros que ficaram indisponíveis
 *       
 *       ### ⚠️ Regras de negócio:
 *       - Usuário só pode ver próprio carrinho
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
 *         description: ✅ Itens do carrinho carregados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BasketResponse'
 *             examples:
 *               carrinho_com_itens:
 *                 summary: Carrinho com livros
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
 *               carrinho_vazio:
 *                 summary: Carrinho vazio
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
 *         description: ❌ Acesso negado - Tentativa de ver carrinho de outro usuário
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Acesso negado. Você só pode ver seu próprio carrinho."
 *       500:
 *         description: ❌ Erro interno do servidor
 */
router.get('/:userId', authenticateToken, BasketController.getUserBasket);

/**
 * @swagger
 * /api/basket:
 *   post:
 *     tags: [🛒 Carrinho (Basket)]
 *     summary: Adicionar livro ao carrinho
 *     description: |
 *       **Adiciona um livro disponível ao carrinho do usuário**
 *       
 *       ### 🎯 Cenários para testar:
 *       - ✅ Adicionar livro disponível (sucesso)
 *       - ❌ Adicionar livro já no carrinho (400)
 *       - ❌ Adicionar livro esgotado (400)
 *       - ❌ Adicionar livro inexistente (404)
 *       - ❌ Quantidade diferente de 1 (400)
 *       - ❌ Tentar adicionar ao carrinho de outro usuário (403)
 *       
 *       ### ⚠️ Regras de negócio:
 *       - Cada livro só pode estar uma vez no carrinho
 *       - Quantidade sempre deve ser 1
 *       - Apenas livros disponíveis podem ser adicionados
 *       - Usuário só pode adicionar ao próprio carrinho
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
 *             livro_ja_no_carrinho:
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
 *         description: ✅ Livro adicionado ao carrinho com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Livro adicionado ao carrinho com sucesso."
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
 *               livro_ja_no_carrinho:
 *                 summary: Livro já está no carrinho
 *                 value:
 *                   message: "Livro já está no carrinho."
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
 *         description: ❌ Acesso negado - Tentativa de adicionar ao carrinho de outro usuário
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
 *     tags: [🛒 Carrinho (Basket)]
 *     summary: Limpar carrinho completo
 *     description: |
 *       **Remove todos os itens do carrinho do usuário**
 *       
 *       ### 🎯 Cenários para testar:
 *       - ✅ Limpar carrinho com itens (sucesso)
 *       - ✅ Limpar carrinho já vazio (sucesso)
 *       - ❌ Tentar limpar carrinho de outro usuário (403)
 *       
 *       ### ⚠️ Regras de negócio:
 *       - Usuário só pode limpar próprio carrinho
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
 *         description: ✅ Carrinho limpo com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Carrinho limpo com sucesso."
 *                 itemsRemoved:
 *                   type: integer
 *                   description: Número de itens removidos
 *                   example: 3
 *                 previousItemCount:
 *                   type: integer
 *                   description: Total de itens antes da limpeza
 *                   example: 3
 *             examples:
 *               carrinho_com_itens:
 *                 summary: Carrinho com itens foi limpo
 *                 value:
 *                   message: "Carrinho limpo com sucesso."
 *                   itemsRemoved: 3
 *                   previousItemCount: 3
 *               carrinho_ja_vazio:
 *                 summary: Carrinho já estava vazio
 *                 value:
 *                   message: "Carrinho já estava vazio."
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
 *     tags: [🛒 Carrinho (Basket)]
 *     summary: Remover item específico do carrinho
 *     description: |
 *       **Remove um livro específico do carrinho do usuário**
 *       
 *       ### 🎯 Cenários para testar:
 *       - ✅ Remover item existente no carrinho (sucesso)
 *       - ❌ Remover item que não está no carrinho (404)
 *       - ❌ IDs inválidos (400)
 *       - ❌ Tentar remover de carrinho de outro usuário (403)
 *       
 *       ### ⚠️ Regras de negócio:
 *       - Item deve existir no carrinho
 *       - Usuário só pode remover do próprio carrinho
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
 *         description: ✅ Item removido do carrinho com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Item removido do carrinho com sucesso."
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
 *         description: ❌ Item não encontrado no carrinho
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Item não encontrado no carrinho."
 *       500:
 *         description: ❌ Erro interno do servidor
 */
router.delete('/:userId/:bookId', authenticateToken, BasketController.removeFromBasket);

/**
 * @swagger
 * /api/basket/{userId}/check-availability:
 *   get:
 *     tags: [🛒 Carrinho (Basket)]
 *     summary: Verificar disponibilidade dos itens
 *     description: |
 *       **Verifica se todos os livros do carrinho ainda estão disponíveis**
 *       
 *       ### 🎯 Cenários para testar:
 *       - ✅ Todos os itens disponíveis
 *       - ⚠️ Alguns itens ficaram indisponíveis
 *       - 📋 Carrinho vazio
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