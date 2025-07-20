const express = require("express");
const bodyParser = require("body-parser");
const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET || "admin@admin";
const Joi = require("joi");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("../config/swagger.json");
const path = require("path");

// Importar middlewares e rotas
const { authenticateToken, isAdmin, authenticateAdmin } = require("./middleware/auth");
const booksRoutes = require("./routes/books");

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static("public"));

// Documentação Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// === NOVAS ROTAS ORGANIZADAS ===
app.use("/api/books", booksRoutes);

// === ROTAS DE USUÁRIOS (mantidas no server.js por enquanto) ===

// Rota de registro de usuário
app.post("/api/registrar", (req, res) => {
  const { name, email, password } = req.body;
  const saltRounds = 10;

  bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ error: "Erro ao registrar usuário." });
    }
    db.run(
      "INSERT INTO Users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword],
      function (err) {
        if (err) {
          res.status(500).json({ error: "Erro ao registrar usuário." });
        } else {
          res.status(201).json({ id: this.lastID });
        }
      }
    );
  });
});

// Rota de login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM Users WHERE email = ?", [email], (err, user) => {
    if (err || !user) {
      return res.status(401).json({ message: "Email ou senha incorretos." });
    }

    bcrypt.compare(password, user.password, (err, result) => {
      if (err || !result) {
        return res.status(401).json({ message: "Email ou senha incorretos." });
      }

      const token = jwt.sign(
        { id: user.id, isAdmin: user.isAdmin },
        SECRET_KEY,
        { expiresIn: "1h" }
      );
      res.json({ 
        id: user.id, 
        name: user.name, 
        isAdmin: user.isAdmin,
        token: `Bearer ${token}` 
      });
    });
  });
});

// === GESTÃO DE USUÁRIOS ===

// Rota POST para criar novos usuários
app.post("/api/users", (req, res) => {
  const { name, email, password, isAdmin } = req.body;

  db.get("SELECT * FROM Users WHERE email = ?", [email], (err, row) => {
    if (err) {
      return res.status(500).json({ error: "Erro ao verificar o email." });
    }
    if (row) {
      return res.status(400).json({ message: "Email já cadastrado." });
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        return res.status(500).json({ error: "Erro ao processar a senha." });
      }

      db.run(
        "INSERT INTO Users (name, email, password, isAdmin) VALUES (?, ?, ?, ?)",
        [name, email, hashedPassword, isAdmin ? 1 : 0],
        function (err) {
          if (err) {
            return res.status(500).json({ 
              error: "Erro ao criar usuário. Verifique as regras de negócio" 
            });
          }
          res.status(201).json({
            message: "Usuário criado com sucesso.",
            id: this.lastID,
          });
        }
      );
    });
  });
});

// Rota GET para listar todos os usuários
app.get("/api/users", (req, res) => {
  db.all("SELECT id, name, email, isAdmin FROM Users", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Erro ao listar usuários." });
    }
    res.json(rows);
  });
});

// Rota PUT para atualizar usuários
app.put("/api/users/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  // Verificar se o usuário logado é o mesmo que está tentando atualizar
  if (req.user.id != id) {
    return res.status(403).json({ 
      message: "Acesso negado. Você só pode editar seu próprio perfil." 
    });
  }

  db.get("SELECT * FROM Users WHERE email = ? AND id != ?", [email, id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: "Erro ao verificar o email." });
    }
    if (row) {
      return res.status(400).json({ 
        message: "Email já cadastrado por outro usuário." 
      });
    }

    const updateUser = (hashedPassword) => {
      db.run(
        "UPDATE Users SET name = ?, email = ?, password = COALESCE(?, password) WHERE id = ?",
        [name, email, hashedPassword, id],
        function (err) {
          if (err) {
            return res.status(500).json({ error: "Erro ao atualizar o usuário." });
          }
          res.status(200).json({ message: "Usuário atualizado com sucesso." });
        }
      );
    };

    if (password) {
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          return res.status(500).json({ error: "Erro ao processar a senha." });
        }
        updateUser(hashedPassword);
      });
    } else {
      updateUser(null);
    }
  });
});

// Rota DELETE para deletar usuários com autenticação de administrador
app.delete("/api/users/:id", authenticateAdmin, (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM Users WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ error: "Erro ao deletar o usuário." });
    }
    res.status(200).json({ message: "Usuário deletado com sucesso." });
  });
});

// === SISTEMA DE RESERVAS (temporário - será movido para controller) ===

// Esquema de validação para reservas usando Joi
const reservationSchema = Joi.object({
  userId: Joi.number().required(),
  bookId: Joi.number().required(),
  notes: Joi.string().max(500).optional().allow(""),
});

// Rota para criar reserva
app.post("/api/reservations", authenticateToken, (req, res) => {
  const { bookId, notes } = req.body;
  const userId = req.user.id;

  const { error } = reservationSchema.validate({ userId, bookId, notes });
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  // Verificar se o livro existe e está disponível
  db.get("SELECT * FROM Books WHERE id = ?", [bookId], (err, book) => {
    if (err) {
      return res.status(500).json({ error: "Erro ao verificar livro." });
    }
    if (!book) {
      return res.status(404).json({ message: "Livro não encontrado." });
    }
    if (book.available_copies <= 0) {
      return res.status(400).json({ message: "Livro não disponível para reserva." });
    }

    // Verificar se o usuário já tem reserva ativa para este livro
    db.get(
      "SELECT * FROM Reservations WHERE user_id = ? AND book_id = ? AND status = 'active'",
      [userId, bookId],
      (err, existingReservation) => {
        if (err) {
          return res.status(500).json({ error: "Erro ao verificar reservas existentes." });
        }
        if (existingReservation) {
          return res.status(400).json({ 
            message: "Você já possui uma reserva ativa para este livro." 
          });
        }

        // Criar reserva
        const pickupDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h
        
        db.run(
          `INSERT INTO Reservations (user_id, book_id, status, pickup_deadline, notes) 
           VALUES (?, ?, 'active', ?, ?)`,
          [userId, bookId, pickupDeadline.toISOString(), notes],
          function (err) {
            if (err) {
              return res.status(500).json({ error: "Erro ao criar reserva." });
            }

            // Atualizar disponibilidade do livro
            db.run(
              "UPDATE Books SET available_copies = available_copies - 1 WHERE id = ?",
              [bookId],
              (err) => {
                if (err) {
                  console.error("Erro ao atualizar disponibilidade:", err);
                }
                
                res.status(201).json({
                  message: "Reserva criada com sucesso.",
                  reservationId: this.lastID,
                  pickupDeadline: pickupDeadline
                });
              }
            );
          }
        );
      }
    );
  });
});

// Rota para listar reservas do usuário
app.get("/api/reservations", authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  const query = `
    SELECT 
      r.id, r.status, r.reservation_date, r.pickup_deadline, 
      r.pickup_date, r.return_deadline, r.return_date, r.notes,
      b.title, b.author, b.cover_image
    FROM Reservations r
    JOIN Books b ON r.book_id = b.id
    WHERE r.user_id = ?
    ORDER BY r.reservation_date DESC
  `;
  
  db.all(query, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Erro ao buscar reservas." });
    }
    res.json(rows);
  });
});

// === ROTAS LEGADAS (serão removidas gradualmente) ===

// Manter compatibilidade temporária com rotas antigas
app.get("/api/produtos", (req, res) => {
  res.redirect(301, "/api/books");
});

app.get("/api/produtos/:id", (req, res) => {
  res.redirect(301, `/api/books/${req.params.id}`);
});

// === ROTAS ESTÁTICAS ===

// Servir arquivos estáticos HTML diretamente
app.get("/dashboard.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/dashboard.html"));
});

// === INICIALIZAÇÃO DO SERVIDOR ===

app.listen(port, async () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
  console.log(`📚 Documentação rodando em http://localhost:${port}/api-docs`);
  console.log(`📖 Sistema de Biblioteca QA-Hub ativo!`);
});

// Abrir automaticamente no navegador
import("open").then((open) => {
  open.default(`http://localhost:${port}`);
});