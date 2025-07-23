const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcrypt");
const fs = require("fs");

// Caminhos para o banco de dados e arquivo JSON
const dbPath = path.join(__dirname, "../database/biblioteca.db");
const booksJsonPath = path.join(__dirname, "../data/books.json");

// Abrir o banco de dados
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    return console.error("Erro ao abrir o banco de dados:", err.message);
  }
  console.log("📚 Conectado ao banco de dados da Biblioteca.");
});

// Função para carregar livros do JSON
function loadBooksFromJson() {
  try {
    const jsonData = fs.readFileSync(booksJsonPath, "utf8");
    return JSON.parse(jsonData);
  } catch (error) {
    console.error("❌ Erro ao carregar books.json:", error.message);
    return [];
  }
}

// Criar tabelas e inserir dados
db.serialize(() => {
  console.log("🔧 Criando estrutura do banco de dados...\n");

  // Tabela de usuários (mantém estrutura similar)
  db.run(`
        CREATE TABLE IF NOT EXISTS Users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            phone TEXT,
            isAdmin INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
  console.log("✅ Tabela Users criada");

  // Tabela de livros (substitui Products)
  db.run(`
        CREATE TABLE IF NOT EXISTS Books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            isbn TEXT, -- Removido UNIQUE para permitir duplicatas temporariamente
            editor TEXT,
            category TEXT,
            language TEXT DEFAULT 'Português',
            publication_year INTEGER,
            pages INTEGER,
            format TEXT DEFAULT 'Físico',
            total_copies INTEGER DEFAULT 1,
            available_copies INTEGER DEFAULT 1,
            description TEXT,
            cover_image TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
  console.log("✅ Tabela Books criada");

  // Tabela de reservas (substitui Cart)
  db.run(`
        CREATE TABLE IF NOT EXISTS Reservations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            book_id INTEGER NOT NULL,
            status TEXT DEFAULT 'active', -- active, expired, cancelled, completed
            reservation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            pickup_deadline DATETIME, -- prazo para retirada (48h após reserva)
            pickup_date DATETIME, -- quando foi retirado
            return_deadline DATETIME, -- prazo para devolução (15 dias após retirada)
            return_date DATETIME, -- quando foi devolvido
            renewal_count INTEGER DEFAULT 0,
            notes TEXT,
            FOREIGN KEY(user_id) REFERENCES Users(id),
            FOREIGN KEY(book_id) REFERENCES Books(id)
        )
    `);
  console.log("✅ Tabela Reservations criada");

  // Tabela de histórico de empréstimos
  db.run(`
        CREATE TABLE IF NOT EXISTS LoanHistory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            book_id INTEGER NOT NULL,
            loan_date DATETIME NOT NULL,
            return_date DATETIME,
            status TEXT DEFAULT 'active', -- active, returned, overdue
            fine_amount REAL DEFAULT 0,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES Users(id),
            FOREIGN KEY(book_id) REFERENCES Books(id)
        )
    `);
  console.log("✅ Tabela LoanHistory criada");

  // Tabela de lista de desejos (nova funcionalidade)
  db.run(`
        CREATE TABLE IF NOT EXISTS Wishlist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            book_id INTEGER NOT NULL,
            added_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            notified INTEGER DEFAULT 0, -- se foi notificado quando ficou disponível
            FOREIGN KEY(user_id) REFERENCES Users(id),
            FOREIGN KEY(book_id) REFERENCES Books(id),
            UNIQUE(user_id, book_id)
        )
    `);
  console.log("✅ Tabela Wishlist criada");

  // Tabela de Carrinho/Basket
  db.run(`
  CREATE TABLE IF NOT EXISTS Basket (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    added_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES Books(id) ON DELETE CASCADE,
    UNIQUE(user_id, book_id)
  )
`);
console.log("✅ Tabela Basket criada");

  // Índices para performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_basket_user_id ON Basket(user_id)`);
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_reservations_status ON Reservations(status)`
  );

  // Tabela de avaliações/comentários dos livros
  db.run(`
        CREATE TABLE IF NOT EXISTS BookReviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            book_id INTEGER NOT NULL,
            rating INTEGER CHECK(rating >= 1 AND rating <= 5),
            review_text TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES Users(id),
            FOREIGN KEY(book_id) REFERENCES Books(id),
            UNIQUE(user_id, book_id)
        )
    `);
  console.log("✅ Tabela BookReviews criada");

  console.log("\n📖 Carregando livros do arquivo JSON...");

  // Carregar e inserir livros do JSON
  const books = loadBooksFromJson();

  if (books.length > 0) {
    const insertBookStmt = db.prepare(`
            INSERT INTO Books (
                title, author, isbn, editor, category, language, 
                publication_year, pages, format, total_copies, 
                available_copies, description, cover_image
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

    let booksInserted = 0;
    let duplicatesFound = [];

    books.forEach((book, index) => {
      try {
        // Gerar ISBN único se estiver duplicado ou vazio
        let uniqueIsbn = book.isbn;
        if (!uniqueIsbn || duplicatesFound.includes(uniqueIsbn)) {
          uniqueIsbn = `978-85-AUTO-${String(index + 1).padStart(
            4,
            "0"
          )}-${Math.floor(Math.random() * 10)}`;
          console.log(
            `⚠️  ISBN gerado automaticamente para "${book.title}": ${uniqueIsbn}`
          );
        }
        duplicatesFound.push(uniqueIsbn);

        insertBookStmt.run([
          book.title,
          book.author,
          uniqueIsbn,
          book.editor,
          book.category,
          book.language,
          book.publication_year,
          book.pages,
          book.format,
          book.available, // total_copies
          book.available, // available_copies (inicialmente igual ao total)
          book.description,
          book.cover_image || "livro-padrao.png",
        ]);
        booksInserted++;
      } catch (error) {
        console.error(
          `❌ Erro ao inserir livro "${book.title}":`,
          error.message
        );
      }
    });

    insertBookStmt.finalize();
    console.log(`✅ ${booksInserted} livros inseridos com sucesso!`);

    if (duplicatesFound.length !== books.length) {
      console.log(
        `⚠️  ${
          books.length - booksInserted
        } livros tiveram problemas na inserção`
      );
    }
  } else {
    console.log("⚠️  Nenhum livro encontrado no arquivo JSON");
  }

  // Inserir usuários de exemplo
  console.log("\n👥 Criando usuários de exemplo...");

  const saltRounds = 10;

  // Usuário administrador
  const adminData = {
    name: "Bibliotecário Admin",
    email: "admin@biblioteca.com",
    password: "admin123",
    phone: "(11) 99999-9999",
    isAdmin: 1,
  };

  // Usuário comum para testes
  const userTestData = {
    name: "Usuário Padrão",
    email: "usuario@teste.com",
    password: "user123",
    phone: "(11) 88888-8888",
    isAdmin: 0,
  };

  const users = [adminData, userTestData];
  let usersCreated = 0;

  users.forEach((userData, index) => {
    bcrypt.hash(userData.password, saltRounds, (err, hashedPassword) => {
      if (err) {
        console.error(
          `❌ Erro ao hashear senha para ${userData.name}:`,
          err.message
        );
        return;
      }

      db.run(
        "INSERT INTO Users (name, email, password, phone, isAdmin) VALUES (?, ?, ?, ?, ?)",
        [
          userData.name,
          userData.email,
          hashedPassword,
          userData.phone,
          userData.isAdmin,
        ],
        (err) => {
          if (err) {
            console.error(
              `❌ Erro ao inserir usuário ${userData.name}:`,
              err.message
            );
          } else {
            console.log(`✅ Usuário ${userData.name} criado com sucesso`);
          }

          usersCreated++;
          if (usersCreated === users.length) {
            // Todos os usuários foram processados
            console.log("\n📊 Inserindo dados de exemplo para testes...");
            insertTestData();
          }
        }
      );
    });
  });

  // Função para inserir dados de teste
  function insertTestData() {
    // Criar algumas reservas de exemplo para testes
    const testReservations = [
      {
        user_id: 2, // João Silva
        book_id: 1, // Dom Casmurro
        status: "active",
        pickup_deadline: new Date(
          Date.now() + 48 * 60 * 60 * 1000
        ).toISOString(), // 48h a partir de agora
      },
      {
        user_id: 2, // João Silva
        book_id: 3, // O Pequeno Príncipe
        status: "completed",
        reservation_date: new Date(
          Date.now() - 10 * 24 * 60 * 60 * 1000
        ).toISOString(), // 10 dias atrás
        pickup_date: new Date(
          Date.now() - 8 * 24 * 60 * 60 * 1000
        ).toISOString(), // 8 dias atrás
        return_date: new Date(
          Date.now() - 1 * 24 * 60 * 60 * 1000
        ).toISOString(), // 1 dia atrás
      },
    ];

    testReservations.forEach((reservation) => {
      db.run(
        `
                INSERT INTO Reservations (user_id, book_id, status, reservation_date, pickup_deadline, pickup_date, return_date)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
        [
          reservation.user_id,
          reservation.book_id,
          reservation.status,
          reservation.reservation_date || new Date().toISOString(),
          reservation.pickup_deadline,
          reservation.pickup_date,
          reservation.return_date,
        ]
      );
    });

    // Atualizar disponibilidade dos livros reservados
    db.run(
      "UPDATE Books SET available_copies = available_copies - 1 WHERE id = 1"
    );

    console.log("✅ Dados de teste inseridos");
    console.log("\n🎉 Banco de dados da biblioteca criado com sucesso!");
    console.log("\n📋 Resumo:");
    console.log(
      "   • Usuários: Admin (admin@biblioteca.com) e Teste (joao@teste.com)"
    );
    console.log("   • Senha padrão: admin123 / teste123");
    console.log("   • Livros carregados do books.json");
    console.log("   • Estrutura completa para sistema de reservas");

    // Fechar conexão
    db.close((closeErr) => {
      if (closeErr) {
        console.error("❌ Erro ao fechar o banco de dados:", closeErr.message);
      } else {
        console.log("\n🔒 Conexão com o banco de dados fechada.");
      }
    });
  }
});
