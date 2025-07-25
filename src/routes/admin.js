const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');

// Importar controllers
const adminReservationsController = require('../controllers/adminReservationsController');

// === ROTAS DE RESERVAS ADMIN ===

/**
 * @swagger
 * /api/admin/reservations:
 *   get:
 *     summary: Listar todas as reservas (Admin)
 *     tags: [👑 Admin - Reservas]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todas as reservas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reservations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       user_name:
 *                         type: string
 *                       user_email:
 *                         type: string
 *                       title:
 *                         type: string
 *                       author:
 *                         type: string
 *                       status:
 *                         type: string
 *                       reservation_date:
 *                         type: string
 *                       pickup_deadline:
 *                         type: string
 *                       return_deadline:
 *                         type: string
 *                 total:
 *                   type: integer
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado - Apenas administradores
 */
router.get('/reservations', authenticateAdmin, adminReservationsController.getAllReservations);

/**
 * @swagger
 * /api/admin/reservations/stats:
 *   get:
 *     summary: Obter estatísticas das reservas (Admin)
 *     tags: [👑 Admin - Reservas]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas das reservas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     active:
 *                       type: integer
 *                       description: Reservas aguardando retirada
 *                     pickedUp:
 *                       type: integer
 *                       description: Livros retirados
 *                     overdue:
 *                       type: integer
 *                       description: Livros em atraso
 *                     returned:
 *                       type: integer
 *                       description: Livros devolvidos hoje
 */
router.get('/reservations/stats', authenticateAdmin, adminReservationsController.getReservationsStats);

/**
 * @swagger
 * /api/admin/reservations/search:
 *   get:
 *     summary: Buscar reservas com filtros (Admin)
 *     tags: [👑 Admin - Reservas]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, picked-up, returned, cancelled, expired, overdue]
 *         description: Filtrar por status
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filtrar por ID do usuário
 *       - in: query
 *         name: bookId
 *         schema:
 *           type: integer
 *         description: Filtrar por ID do livro
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final (YYYY-MM-DD)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Limite de resultados
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset para paginação
 *     responses:
 *       200:
 *         description: Reservas filtradas
 */
router.get('/reservations/search', authenticateAdmin, adminReservationsController.getReservationsByFilter);

/**
 * @swagger
 * /api/admin/reservations/{id}:
 *   put:
 *     summary: Atualizar status da reserva (Admin)
 *     tags: [👑 Admin - Reservas]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da reserva
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, picked-up, returned, cancelled, expired]
 *                 description: Novo status da reserva
 *               notes:
 *                 type: string
 *                 description: Observações adicionais
 *           examples:
 *             marcar_retirada:
 *               summary: Marcar como retirado
 *               value:
 *                 status: "picked-up"
 *                 notes: "Livro retirado no balcão"
 *             marcar_devolucao:
 *               summary: Marcar como devolvido
 *               value:
 *                 status: "returned"
 *                 notes: "Livro devolvido em boas condições"
 *             cancelar:
 *               summary: Cancelar reserva
 *               value:
 *                 status: "cancelled"
 *                 notes: "Cancelado por solicitação do usuário"
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Reserva não encontrada
 */
router.put('/reservations/:id', authenticateAdmin, adminReservationsController.updateReservationStatus);

/**
 * @swagger
 * /api/admin/reservations/{id}/extend:
 *   put:
 *     summary: Estender prazo de devolução (Admin)
 *     tags: [👑 Admin - Reservas]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da reserva
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               days:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 30
 *                 default: 7
 *                 description: Número de dias para estender
 *           examples:
 *             estender_padrao:
 *               summary: Estender por 7 dias (padrão)
 *               value:
 *                 days: 7
 *             estender_personalizado:
 *               summary: Estender por período personalizado
 *               value:
 *                 days: 14
 *     responses:
 *       200:
 *         description: Prazo estendido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 reservationId:
 *                   type: integer
 *                 previousDeadline:
 *                   type: string
 *                 newDeadline:
 *                   type: string
 *                 daysExtended:
 *                   type: integer
 *       400:
 *         description: Dados inválidos ou reserva não elegível
 *       404:
 *         description: Reserva não encontrada
 */
router.put('/reservations/:id/extend', authenticateAdmin, adminReservationsController.extendDeadline);

module.exports = router;