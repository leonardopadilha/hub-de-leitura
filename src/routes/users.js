const express = require('express');
const router = express.Router();
const { authenticateToken, authenticateAdmin } = require('../middleware/auth');
const UsersController = require('../controllers/usersController');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       description: Usuário do sistema de biblioteca
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único do usuário
 *           example: 1
 *         name:
 *           type: string
 *           description: Nome completo do usuário
 *           example: "João Silva"
 *           minLength: 2
 *           maxLength: 100
 *         email:
 *           type: string
 *           format: email
 *           description: Email único do usuário (usado para login)
 *           example: "joao@email.com"
 *         isAdmin:
 *           type: boolean
 *           description: Se o usuário tem privilégios de administrador
 *           example: false
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Data de criação da conta
 *           example: "2024-01-15T10:30:00Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização
 *           example: "2024-01-20T15:45:00Z"
 *         statistics:
 *           type: object
 *           description: Estatísticas do usuário (quando aplicável)
 *           properties:
 *             totalReservations:
 *               type: integer
 *               example: 15
 *             activeReservations:
 *               type: integer
 *               example: 2
 *             completedReservations:
 *               type: integer
 *               example: 12
 *             basketItems:
 *               type: integer
 *               example: 3
 *       required: [name, email]
 *     UserCreateRequest:
 *       type: object
 *       description: Dados para criar novo usuário
 *       properties:
 *         name:
 *           type: string
 *           description: Nome completo (mínimo 2 caracteres)
 *           example: "Maria Santos"
 *           minLength: 2
 *           maxLength: 100
 *         email:
 *           type: string
 *           format: email
 *           description: Email único no sistema
 *           example: "maria@email.com"
 *         password:
 *           type: string
 *           description: Senha (mínimo 6 caracteres)
 *           example: "minhaSenha123"
 *           minLength: 6
 *         isAdmin:
 *           type: boolean
 *           description: Se deve ser criado como administrador (apenas admins podem definir)
 *           example: false
 *           default: false
 *       required: [name, email, password]
 *     UserUpdateRequest:
 *       type: object
 *       description: Dados para atualizar usuário (todos opcionais)
 *       properties:
 *         name:
 *           type: string
 *           description: Novo nome
 *           example: "João da Silva Santos"
 *           minLength: 2
 *           maxLength: 100
 *         email:
 *           type: string
 *           format: email
 *           description: Novo email (deve ser único)
 *           example: "joao.novo@email.com"
 *         password:
 *           type: string
 *           description: Nova senha (mínimo 6 caracteres)
 *           example: "novaSenha123"
 *           minLength: 6
 *     UsersListResponse:
 *       type: object
 *       description: Lista paginada de usuários
 *       properties:
 *         users:
 *           type: array
 *           items:
 *             allOf:
 *               - $ref: '#/components/schemas/User'
 *               - type: object
 *                 properties:
 *                   activeReservations:
 *                     type: integer
 *                     description: Reservas ativas do usuário
 *                   totalReservations:
 *                     type: integer
 *                     description: Total de reservas já feitas
 *         pagination:
 *           type: object
 *           properties:
 *             currentPage:
 *               type: integer
 *               example: 1
 *             totalPages:
 *               type: integer
 *               example: 5
 *             totalUsers:
 *               type: integer
 *               example: 47
 *             hasNext:
 *               type: boolean
 *               example: true
 *             hasPrev:
 *               type: boolean
 *               example: false
 *             limit:
 *               type: integer
 *               example: 20
 *             showing:
 *               type: integer
 *               example: 20
 *         filters:
 *           type: object
 *           properties:
 *             search:
 *               type: string
 *               example: "maria"
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [👤 Gestão de Usuários]
 *     summary: Listar usuários (Admin apenas)
 *     description: |
 *       **Lista todos os usuários do sistema com estatísticas**
 *       
 *       ### 🎯 Cenários para testar:
 *       - ✅ Listar como admin (sucesso)
 *       - ❌ Tentar listar como usuário comum (403)
 *       - 📄 Paginação com diferentes limites
 *       - 🔍 Busca por nome ou email
 *       - 📊 Verificar estatísticas de reservas
 *       
 *       ### ⚠️ Regras de negócio:
 *       - Apenas administradores podem listar usuários
 *       - Inclui estatísticas de reservas de cada usuário
 *       - Suporta busca por nome ou email
 *       - Dados sensíveis (senhas) não são retornados
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         description: Número da página (inicia em 1)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 1
 *       - name: limit
 *         in: query
 *         description: Usuários por página (máximo 50)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *           example: 20
 *       - name: search
 *         in: query
 *         description: Buscar por nome ou email
 *         schema:
 *           type: string
 *           example: "maria"
 *     responses:
 *       200:
 *         description: ✅ Lista de usuários carregada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UsersListResponse'
 *             examples:
 *               lista_usuarios:
 *                 summary: Lista com usuários
 *                 value:
 *                   users:
 *                     - id: 1
 *                       name: "Administrador"
 *                       email: "admin@admin.com"
 *                       isAdmin: true
 *                       created_at: "2024-01-01T00:00:00Z"
 *                       activeReservations: 0
 *                       totalReservations: 5
 *                     - id: 2
 *                       name: "João Silva"
 *                       email: "joao@email.com"
 *                       isAdmin: false
 *                       created_at: "2024-01-15T10:30:00Z"
 *                       activeReservations: 2
 *                       totalReservations: 8
 *                   pagination:
 *                     currentPage: 1
 *                     totalPages: 1
 *                     totalUsers: 2
 *                     hasNext: false
 *                     hasPrev: false
 *                     limit: 20
 *                     showing: 2
 *               busca_usuarios:
 *                 summary: Busca por "maria"
 *                 value:
 *                   users:
 *                     - id: 3
 *                       name: "Maria Santos"
 *                       email: "maria@email.com"
 *                       isAdmin: false
 *                       activeReservations: 1
 *                       totalReservations: 3
 *                   pagination:
 *                     currentPage: 1
 *                     totalPages: 1
 *                     totalUsers: 1
 *                   filters:
 *                     search: "maria"
 *       401:
 *         description: ❌ Token inválido ou expirado
 *       403:
 *         description: ❌ Acesso negado - Apenas administradores
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Acesso negado. Apenas administradores podem listar usuários."
 *       500:
 *         description: ❌ Erro interno do servidor
 *   post:
 *     tags: [👤 Gestão de Usuários]
 *     summary: Criar novo usuário
 *     description: |
 *       **Cria uma nova conta de usuário no sistema**
 *       
 *       ### 🎯 Cenários para testar:
 *       - ✅ Criar usuário com dados válidos (sucesso)
 *       - ❌ Email já existente (400)
 *       - ❌ Senha muito curta (400)
 *       - ❌ Email malformado (400)
 *       - ❌ Nome muito curto (400)
 *       - ❌ Campos obrigatórios em branco (400)
 *       
 *       ### ⚠️ Regras de negócio:
 *       - Email deve ser único no sistema
 *       - Senha mínimo 6 caracteres
 *       - Nome mínimo 2 caracteres
 *       - Novos usuários são criados como não-admin por padrão
 *       - Senha é automaticamente criptografada
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserCreateRequest'
 *           examples:
 *             usuario_valido:
 *               summary: Usuário válido
 *               value:
 *                 name: "Maria Santos"
 *                 email: "maria@email.com"
 *                 password: "senha123"
 *             usuario_admin:
 *               summary: Criar como admin (apenas para admins)
 *               value:
 *                 name: "Carlos Admin"
 *                 email: "carlos@admin.com"
 *                 password: "senhaAdmin123"
 *                 isAdmin: true
 *             dados_invalidos:
 *               summary: Dados inválidos (teste de erro)
 *               value:
 *                 name: "A"
 *                 email: "email-malformado"
 *                 password: "123"
 *     responses:
 *       201:
 *         description: ✅ Usuário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Usuário criado com sucesso."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 15
 *                     name:
 *                       type: string
 *                       example: "Maria Santos"
 *                     email:
 *                       type: string
 *                       example: "maria@email.com"
 *                     isAdmin:
 *                       type: boolean
 *                       example: false
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: ❌ Dados inválidos ou email já cadastrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 conflictingEmail:
 *                   type: string
 *             examples:
 *               email_duplicado:
 *                 summary: Email já cadastrado
 *                 value:
 *                   message: "Email já está sendo usado por outro usuário."
 *                   conflictingEmail: "maria@email.com"
 *               senha_curta:
 *                 summary: Senha muito curta
 *                 value:
 *                   message: "Senha deve ter pelo menos 6 caracteres."
 *               email_invalido:
 *                 summary: Formato de email inválido
 *                 value:
 *                   message: "Formato de email inválido."
 *               nome_curto:
 *                 summary: Nome muito curto
 *                 value:
 *                   message: "Nome deve ter pelo menos 2 caracteres."
 *       500:
 *         description: ❌ Erro interno do servidor
 */
router.get('/', authenticateAdmin, UsersController.getAllUsers);
router.post('/', UsersController.createUser);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [👤 Gestão de Usuários]
 *     summary: Ver perfil de usuário
 *     description: |
 *       **Retorna informações detalhadas de um usuário específico**
 *       
 *       ### 🎯 Cenários para testar:
 *       - ✅ Ver próprio perfil (sucesso)
 *       - ✅ Admin ver perfil de qualquer usuário (sucesso)
 *       - ❌ Usuário comum tentar ver perfil de outro (403)
 *       - ❌ ID de usuário inexistente (404)
 *       - 📊 Verificar estatísticas incluídas
 *       
 *       ### ⚠️ Regras de negócio:
 *       - Usuário comum só pode ver próprio perfil
 *       - Administradores podem ver qualquer perfil
 *       - Inclui estatísticas de reservas e carrinho
 *       - Senha nunca é retornada por segurança
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID do usuário
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *     responses:
 *       200:
 *         description: ✅ Perfil do usuário carregado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/User'
 *                 - type: object
 *                   properties:
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         totalReservations:
 *                           type: integer
 *                           example: 15
 *                         activeReservations:
 *                           type: integer
 *                           example: 2
 *                         completedReservations:
 *                           type: integer
 *                           example: 12
 *                         basketItems:
 *                           type: integer
 *                           example: 3
 *             examples:
 *               proprio_perfil:
 *                 summary: Visualizando próprio perfil
 *                 value:
 *                   id: 2
 *                   name: "João Silva"
 *                   email: "joao@email.com"
 *                   isAdmin: false
 *                   created_at: "2024-01-15T10:30:00Z"
 *                   updated_at: "2024-01-20T15:45:00Z"
 *                   statistics:
 *                     totalReservations: 8
 *                     activeReservations: 2
 *                     completedReservations: 5
 *                     basketItems: 3
 *               perfil_admin:
 *                 summary: Perfil de administrador
 *                 value:
 *                   id: 1
 *                   name: "Administrador"
 *                   email: "admin@admin.com"
 *                   isAdmin: true
 *                   created_at: "2024-01-01T00:00:00Z"
 *                   statistics:
 *                     totalReservations: 0
 *                     activeReservations: 0
 *                     completedReservations: 0
 *                     basketItems: 0
 *       401:
 *         description: ❌ Token inválido ou expirado
 *       403:
 *         description: ❌ Acesso negado - Tentativa de ver perfil de outro usuário
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Acesso negado. Você só pode ver seu próprio perfil."
 *       404:
 *         description: ❌ Usuário não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Usuário não encontrado."
 *       500:
 *         description: ❌ Erro interno do servidor
 *   put:
 *     tags: [👤 Gestão de Usuários]
 *     summary: Atualizar dados do usuário
 *     description: |
 *       **Atualiza informações de um usuário existente**
 *       
 *       ### 🎯 Cenários para testar:
 *       - ✅ Atualizar próprios dados (sucesso)
 *       - ✅ Admin atualizar dados de qualquer usuário (sucesso)
 *       - ❌ Usuário comum tentar atualizar outro (403)
 *       - ❌ Email já usado por outro usuário (400)
 *       - ❌ Nova senha muito curta (400)
 *       - ❌ Formato de email inválido (400)
 *       - ✅ Atualização parcial (só alguns campos)
 *       
 *       ### ⚠️ Regras de negócio:
 *       - Usuário comum só pode atualizar próprio perfil
 *       - Administradores podem atualizar qualquer perfil
 *       - Email deve continuar único no sistema
 *       - Senha é re-criptografada se fornecida
 *       - Todos os campos são opcionais na atualização
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID do usuário a ser atualizado
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdateRequest'
 *           examples:
 *             atualizacao_completa:
 *               summary: Atualização completa
 *               value:
 *                 name: "João da Silva Santos"
 *                 email: "joao.novo@email.com"
 *                 password: "novaSenha123"
 *             atualizacao_parcial:
 *               summary: Apenas nome e email
 *               value:
 *                 name: "João Silva"
 *                 email: "joao.atualizado@email.com"
 *             apenas_senha:
 *               summary: Apenas trocar senha
 *               value:
 *                 password: "senhaNova456"
 *     responses:
 *       200:
 *         description: ✅ Usuário atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Usuário atualizado com sucesso."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 2
 *                     name:
 *                       type: string
 *                       example: "João da Silva Santos"
 *                     email:
 *                       type: string
 *                       example: "joao.novo@email.com"
 *                     isAdmin:
 *                       type: boolean
 *                       example: false
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                 changedFields:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["name", "email"]
 *       400:
 *         description: ❌ Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 conflictingEmail:
 *                   type: string
 *             examples:
 *               email_em_uso:
 *                 summary: Email já usado por outro usuário
 *                 value:
 *                   message: "Email já está sendo usado por outro usuário."
 *                   conflictingEmail: "email@existente.com"
 *               senha_curta:
 *                 summary: Nova senha muito curta
 *                 value:
 *                   message: "Senha deve ter pelo menos 6 caracteres."
 *       401:
 *         description: ❌ Token inválido ou expirado
 *       403:
 *         description: ❌ Acesso negado
 *       404:
 *         description: ❌ Usuário não encontrado
 *       500:
 *         description: ❌ Erro interno do servidor
 *   delete:
 *     tags: [👤 Gestão de Usuários]
 *     summary: Remover usuário (Admin apenas)
 *     description: |
 *       **Remove um usuário do sistema permanentemente**
 *       
 *       ### 🎯 Cenários para testar:
 *       - ✅ Admin remover usuário sem reservas ativas (sucesso)
 *       - ❌ Admin tentar remover usuário com reservas ativas (400)
 *       - ❌ Usuário comum tentar remover (403)
 *       - ❌ ID inexistente (404)
 *       - 🧹 Verificar limpeza de dados relacionados
 *       
 *       ### ⚠️ Regras de negócio:
 *       - Apenas administradores podem remover usuários
 *       - Não pode remover usuário com reservas ativas
 *       - Remove automaticamente carrinho e histórico (CASCADE)
 *       - Operação é irreversível
 *       - Logs da ação são registrados
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID do usuário a ser removido
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 5
 *     responses:
 *       200:
 *         description: ✅ Usuário removido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Usuário removido com sucesso."
 *                 removedUser:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 5
 *                     name:
 *                       type: string
 *                       example: "Usuário Teste"
 *                     email:
 *                       type: string
 *                       example: "teste@email.com"
 *                 cleanupInfo:
 *                   type: object
 *                   properties:
 *                     basketItemsRemoved:
 *                       type: integer
 *                       example: 2
 *                     message:
 *                       type: string
 *                       example: "Carrinho e histórico de reservas também foram removidos."
 *       400:
 *         description: ❌ Usuário possui reservas ativas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Não é possível remover usuário com 2 reserva(s) ativa(s)."
 *                 activeReservations:
 *                   type: integer
 *                   example: 2
 *                 suggestion:
 *                   type: string
 *                   example: "Cancele ou complete as reservas antes de remover o usuário."
 *       401:
 *         description: ❌ Token inválido ou expirado
 *       403:
 *         description: ❌ Acesso negado - Apenas administradores
 *       404:
 *         description: ❌ Usuário não encontrado
 *       500:
 *         description: ❌ Erro interno do servidor
 */
router.get('/:id', authenticateToken, UsersController.getUserById);
router.put('/:id', authenticateToken, UsersController.updateUser);
router.delete('/:id', authenticateAdmin, UsersController.deleteUser);

module.exports = router;