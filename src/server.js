const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET || "admin@admin";
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("../config/swaggerDef");

// Importar middlewares
const { authenticateToken, authenticateAdmin } = require("./middleware/auth");

// Importar todas as rotas
const booksRoutes = require("./routes/books");
const usersRoutes = require("./routes/users");
const reservationsRoutes = require("./routes/reservations");
const basketRoutes = require("./routes/basket");
const adminRoutes = require("./routes/admin");

// Importar configuração do banco
const db = require("../config/db");

const app = express();
const port = process.env.PORT || 3000;

// === MIDDLEWARE GLOBAL ===
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Middleware para logs de requisições (desenvolvimento)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// === ROTAS DE AUTENTICAÇÃO ===

/**
 * @swagger
 * /api/login:
 *   post:
 *     tags: [🔐 Autenticação]
 *     summary: Login de usuário
 *     description: |
 *       **Autentica usuário e retorna token JWT**
 *       
 *       ### 🎯 Cenários para testar:
 *       - ✅ Login com credenciais válidas
 *       - ❌ Email inexistente
 *       - ❌ Senha incorreta
 *       - ❌ Campos obrigatórios em branco
 *       - ✅ Login de admin vs usuário comum
 *       
 *       ### 🔑 Credenciais de teste:
 *       - **Admin:** admin@admin.com / admin123
 *       - **Usuário:** usuario@teste.com / user123
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@admin.com"
 *               password:
 *                 type: string
 *                 example: "admin123"
 *           examples:
 *             admin_login:
 *               summary: Login como administrador
 *               value:
 *                 email: "admin@admin.com"
 *                 password: "admin123"
 *             user_login:
 *               summary: Login como usuário comum
 *               value:
 *                 email: "usuario@teste.com"
 *                 password: "user123"
 *     responses:
 *       200:
 *         description: ✅ Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: "Administrador"
 *                 email:
 *                   type: string
 *                   example: "admin@admin.com"
 *                 isAdmin:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   example: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: ❌ Credenciais inválidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Email ou senha incorretos."
 */
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      message: "Email e senha são obrigatórios." 
    });
  }

  db.get("SELECT * FROM Users WHERE email = ?", [email], (err, user) => {
    if (err) {
      console.error("Erro ao buscar usuário:", err);
      return res.status(500).json({ 
        message: "Erro interno do servidor." 
      });
    }

    if (!user) {
      return res.status(401).json({ 
        message: "Email ou senha incorretos." 
      });
    }

    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        console.error("Erro ao comparar senhas:", err);
        return res.status(500).json({ 
          message: "Erro interno do servidor." 
        });
      }

      if (!result) {
        return res.status(401).json({ 
          message: "Email ou senha incorretos." 
        });
      }

      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email,
          isAdmin: user.isAdmin 
        },
        SECRET_KEY,
        { expiresIn: "8h" }
      );

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: !!user.isAdmin,
        token: `Bearer ${token}`
      });
    });
  });
});

/**
 * @swagger
 * /api/register:
 *   post:
 *     tags: [🔐 Autenticação]
 *     summary: Registro de novo usuário
 *     description: |
 *       **Cria uma nova conta de usuário no sistema**
 *       
 *       ### 🎯 Cenários para testar:
 *       - ✅ Registro com dados válidos
 *       - ❌ Email já cadastrado
 *       - ❌ Senha muito curta
 *       - ❌ Email malformado
 *       - ❌ Campos obrigatórios em branco
 *       
 *       ### ⚠️ Regras:
 *       - Email deve ser único
 *       - Senha mínimo 6 caracteres
 *       - Nome mínimo 2 caracteres
 *       - Novos usuários são criados como não-admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 example: "João Silva"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "joao@email.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "minhaSenha123"
 *     responses:
 *       201:
 *         description: ✅ Usuário criado com sucesso
 *       400:
 *         description: ❌ Dados inválidos ou email já cadastrado
 *       500:
 *         description: ❌ Erro interno do servidor
 */
app.post("/api/register", (req, res) => {
  const { name, email, password } = req.body;

  // Validações básicas
  if (!name || !email || !password) {
    return res.status(400).json({ 
      message: "Nome, email e senha são obrigatórios." 
    });
  }

  if (name.length < 2) {
    return res.status(400).json({ 
      message: "Nome deve ter pelo menos 2 caracteres." 
    });
  }

  if (password.length < 6) {
    return res.status(400).json({ 
      message: "Senha deve ter pelo menos 6 caracteres." 
    });
  }

  // Verificar se email já existe
  db.get("SELECT * FROM Users WHERE email = ?", [email], (err, existingUser) => {
    if (err) {
      console.error("Erro ao verificar email:", err);
      return res.status(500).json({ 
        message: "Erro interno do servidor." 
      });
    }

    if (existingUser) {
      return res.status(400).json({ 
        message: "Email já está sendo usado por outro usuário.",
        conflictingEmail: email
      });
    }

    // Criptografar senha e criar usuário
    const saltRounds = 10;
    bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
      if (err) {
        console.error("Erro ao criptografar senha:", err);
        return res.status(500).json({ 
          message: "Erro ao processar senha." 
        });
      }

      db.run(
        "INSERT INTO Users (name, email, password, isAdmin) VALUES (?, ?, ?, ?)",
        [name, email, hashedPassword, 0],
        function (err) {
          if (err) {
            console.error("Erro ao criar usuário:", err);
            return res.status(500).json({ 
              message: "Erro ao criar usuário." 
            });
          }

          res.status(201).json({
            message: "Usuário criado com sucesso.",
            user: {
              id: this.lastID,
              name: name,
              email: email,
              isAdmin: false
            }
          });
        }
      );
    });
  });
});

// === ROTAS ORGANIZADAS ===

// Rotas principais da API
app.use("/api/books", booksRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/reservations", reservationsRoutes);
app.use("/api/basket", basketRoutes);
app.use("/api/admin", adminRoutes);

// === ROTA DE HEALTH CHECK GERAL ===

/**
 * @swagger
 * /api/health:
 *   get:
 *     tags: [🔧 Sistema]
 *     summary: Verificar status do sistema
 *     description: |
 *       **Endpoint para monitoramento da saúde do sistema**
 *       
 *       ### 📋 Verifica:
 *       - Status do servidor
 *       - Conexão com banco de dados
 *       - Serviços disponíveis
 *       - Versão da API
 *     responses:
 *       200:
 *         description: ✅ Sistema funcionando corretamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 environment:
 *                   type: string
 *                   example: "development"
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                       example: "connected"
 *                     auth:
 *                       type: string
 *                       example: "working"
 *                     swagger:
 *                       type: string
 *                       example: "active"
 *                 routes:
 *                   type: object
 *                   properties:
 *                     books:
 *                       type: string
 *                       example: "/api/books"
 *                     users:
 *                       type: string
 *                       example: "/api/users"
 *                     reservations:
 *                       type: string
 *                       example: "/api/reservations"
 *                     basket:
 *                       type: string
 *                       example: "/api/basket"
 *                     admin:
 *                       type: string
 *                       example: "/api/admin"
 */
app.get("/api/health", (req, res) => {
  // Verificar conexão com banco
  db.get("SELECT 1", (err) => {
    const dbStatus = err ? 'disconnected' : 'connected';
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: dbStatus,
        auth: 'working',
        swagger: 'active'
      },
      routes: {
        books: '/api/books',
        users: '/api/users', 
        reservations: '/api/reservations',
        basket: '/api/basket',
        admin: '/api/admin'
      },
      documentation: '/api-docs'
    });
  });
});

// === ROTA DE INFORMAÇÕES DA API ===

/**
 * @swagger
 * /api/info:
 *   get:
 *     tags: [🔧 Sistema]
 *     summary: Informações da API
 *     description: Retorna informações gerais sobre a API e endpoints disponíveis
 *     responses:
 *       200:
 *         description: ✅ Informações carregadas
 */
app.get("/api/info", (req, res) => {
  res.json({
    name: "Hub de Leitura API",
    description: "Sistema de biblioteca para aprendizado de QA",
    version: "1.0.0",
    author: "Fábio Araújo",
    contact: {
      email: "fabio@qualityassurance.com",
      github: "https://github.com/fabioaraujoqa/hub-de-leitura"
    },
    documentation: {
      swagger: "/api-docs",
      postman: "Disponível no repositório"
    },
    endpoints: {
      auth: ["/api/login", "/api/register"],
      books: ["/api/books", "/api/books/:id"],
      users: ["/api/users", "/api/users/:id"],
      reservations: ["/api/reservations", "/api/reservations/:id"],
      basket: ["/api/basket/:userId", "/api/basket"],
      admin: ["/api/admin/reservations", "/api/admin/users"]
    },
    testCredentials: {
      admin: { email: "admin@admin.com", password: "admin123" },
      user: { email: "usuario@teste.com", password: "user123" }
    }
  });
});

// === ROTAS LEGADAS E REDIRECIONAMENTOS ===

// Compatibilidade com rotas antigas
app.get("/api/produtos", (req, res) => {
  res.redirect(301, "/api/books");
});

app.get("/api/produtos/:id", (req, res) => {
  res.redirect(301, `/api/books/${req.params.id}`);
});

app.get("/api/registrar", (req, res) => {
  res.redirect(301, "/api/register");
});

// === ROTAS ESTÁTICAS E PÁGINAS HTML ===

// Página inicial - redireciona para dashboard
app.get("/", (req, res) => {
  res.redirect("/index.html");
});

// Servir páginas HTML diretamente
app.get("/dashboard.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/dashboard.html"));
});

app.get("/admin-dashboard.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/admin-dashboard.html"));
});

app.get("/admin-reservations.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/admin-reservations.html"));
});

app.get("/index.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// === MIDDLEWARE DE TRATAMENTO DE ERROS ===

// Middleware para rotas não encontradas
app.use("*", (req, res) => {
  // Se é uma rota da API, retorna JSON
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({
      message: "Endpoint não encontrado",
      endpoint: req.originalUrl,
      method: req.method,
      availableEndpoints: {
        auth: ["/api/login", "/api/register"],
        books: ["/api/books", "/api/books/:id"],
        users: ["/api/users", "/api/users/:id"],
        reservations: ["/api/reservations", "/api/reservations/:id"],
        basket: ["/api/basket/:userId"],
        admin: ["/api/admin/reservations", "/api/admin/users"],
        system: ["/api/health", "/api/info"]
      },
      documentation: "/api-docs"
    });
  }

  // Para outras rotas, redireciona para página inicial
  res.redirect("/login.html");
});

// Middleware global de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);

  // Erro de token JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: "Token JWT inválido",
      error: "INVALID_TOKEN"
    });
  }

  // Erro de token expirado
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: "Token JWT expirado",
      error: "EXPIRED_TOKEN",
      expiredAt: err.expiredAt
    });
  }

  // Erro de validação
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: "Dados inválidos",
      details: err.details
    });
  }

  // Erro de banco de dados
  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(400).json({
      message: "Violação de restrição do banco de dados",
      error: "DATABASE_CONSTRAINT"
    });
  }

  // Erro genérico
  res.status(500).json({
    message: "Erro interno do servidor",
    error: process.env.NODE_ENV === 'development' ? err.message : "INTERNAL_ERROR",
    timestamp: new Date().toISOString()
  });
});

// === INICIALIZAÇÃO E CONFIGURAÇÃO DO SERVIDOR ===

// Função para inicializar dados de exemplo (ADAPTADA PARA BANCO EXISTENTE)
async function initializeTestData() {
  return new Promise((resolve, reject) => {
    // Verificar se já existem dados
    db.get("SELECT COUNT(*) as count FROM Users", (err, result) => {
      if (err) {
        console.error("Erro ao verificar dados existentes:", err);
        return reject(err);
      }

      // Se já existem usuários, não inicializa dados
      if (result.count > 0) {
        console.log("📊 Dados já existem no banco");
        
        // Verificar credenciais existentes
        db.all("SELECT name, email FROM Users", (err, users) => {
          if (!err && users.length > 0) {
            console.log("👥 Usuários disponíveis:");
            users.forEach(user => {
              const userType = user.email.includes('admin') || user.email.includes('biblioteca') ? '👑 Admin' : '👤 User';
              console.log(`   ${userType}: ${user.email}`);
            });
          }
        });
        
        return resolve();
      }

      console.log("🔧 Banco vazio, mas isso é normal se você já tem dados...");
      resolve();
    });
  });
}

// === INICIALIZAÇÃO DO SERVIDOR ===

async function startServer() {
  try {
    // Inicializar dados de teste se necessário
    await initializeTestData();

    // Iniciar servidor
    app.listen(port, () => {
      console.log('\n🚀 ===============================================');
      console.log('📚 HUB DE LEITURA - Sistema de Biblioteca QA');
      console.log('🚀 ===============================================\n');
      
      console.log(`🌐 Servidor rodando em: http://localhost:${port}`);
      console.log(`📖 Documentação API: http://localhost:${port}/api-docs`);
      console.log(`👤 Login: http://localhost:${port}/login.html`);
      console.log(`🏠 Dashboard: http://localhost:${port}/dashboard.html`);
      console.log(`🛠️  Admin: http://localhost:${port}/admin-dashboard.html`);
      
      console.log('\n🔑 Credenciais de Teste (Banco Existente):');
      console.log('   👑 Admin: admin@biblioteca.com / admin123');
      console.log('   👤 User:  usuario@teste.com / user123');
      
      console.log('\n📋 Endpoints Principais:');
      console.log('   🔐 POST /api/login        - Autenticação');
      console.log('   📚 GET  /api/books        - Listar livros');
      console.log('   👥 GET  /api/users        - Listar usuários (Admin)');
      console.log('   📝 GET  /api/reservations - Minhas reservas');
      console.log('   🛒 GET  /api/basket/:id   - Meu carrinho');
      console.log('   🛠️  GET  /api/admin/*     - Rotas administrativas');
      console.log('   ❤️  GET  /api/health      - Status do sistema');
      
      console.log('\n✨ Recursos Disponíveis:');
      console.log('   📖 Sistema completo de biblioteca');
      console.log('   🔐 Autenticação JWT com roles');
      console.log('   📝 Gestão de reservas e carrinho');
      console.log('   🛠️  Painel administrativo completo');
      console.log('   📚 Documentação Swagger interativa');
      console.log('   🧪 Dados de teste pré-configurados');
      
      console.log('\n🎯 Perfeito para:');
      console.log('   ✅ Aprendizado de QA Manual');
      console.log('   ✅ Automação de testes de API');
      console.log('   ✅ Testes de integração');
      console.log('   ✅ Práticas de teste E2E');
      
      console.log('\n🚀 ===============================================');
      console.log('✨ Sistema pronto para uso! Bons testes! 🧪');
      console.log('🚀 ===============================================\n');
    });

    // Abrir automaticamente no navegador (apenas em desenvolvimento)
    if (process.env.NODE_ENV !== 'production') {
      try {
        const open = await import("open");
        setTimeout(() => {
          open.default(`http://localhost:${port}/index.html`);
        }, 1000);
      } catch (error) {
        // Falha silenciosa se o módulo 'open' não estiver disponível
      }
    }

  } catch (error) {
    console.error('❌ Erro ao inicializar servidor:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔄 Encerrando servidor graciosamente...');
  
  // Fechar conexão com banco de dados
  db.close((err) => {
    if (err) {
      console.error('❌ Erro ao fechar banco de dados:', err);
    } else {
      console.log('✅ Banco de dados fechado');
    }
    
    console.log('👋 Servidor encerrado. Até mais!');
    process.exit(0);
  });
});

// Tratar erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// === INICIAR SERVIDOR ===
startServer();

module.exports = app;