const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

// Caminho para o banco de dados
const dbPath = path.join(__dirname, '../src/qa_commerce.db');

// Abrir o banco de dados
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        return console.error('Erro ao abrir o banco de dados:', err.message);
    }
    console.log('Conectado ao banco de dados SQLite.');
});

// Criar tabelas e inserir dados
db.serialize(() => {
    // Tabela de usuários
    db.run(`
        CREATE TABLE IF NOT EXISTS Users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT UNIQUE,
            password TEXT,
            isAdmin INTEGER DEFAULT 0
        )
    `);

    // Tabela de produtos
    db.run(`
        CREATE TABLE IF NOT EXISTS Products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            description TEXT,
            price REAL,
            image TEXT
        )
    `);

    // Tabela de carrinho
    db.run(`
        CREATE TABLE IF NOT EXISTS Cart (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            product_id INTEGER,
            quantity INTEGER,
            FOREIGN KEY(user_id) REFERENCES Users(id),
            FOREIGN KEY(product_id) REFERENCES Products(id)
        )
    `);

    // Tabela de pedidos
    db.run(`
        CREATE TABLE IF NOT EXISTS Orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            first_name TEXT,
            last_name TEXT,
            address TEXT,
            number TEXT,
            cep TEXT,
            phone TEXT,
            email TEXT,
            payment_method TEXT,
            card_number TEXT,
            card_expiry TEXT,
            card_cvc TEXT,
            boleto_code TEXT,
            pix_key TEXT,
            total_price REAL,
            status TEXT,
            order_number TEXT,
            FOREIGN KEY(user_id) REFERENCES Users(id)
        )
    `);
    console.log("Tabelas criadas com sucesso.");

    // Inserir dados de exemplo para produtos
    const products = [
        { name: 'Xícara Const', description: 'Xícara em porcelana. Capacidade: 270ml.', price: 40.0, image: 'images/produtos/imagem8.jpeg' },
        { name: 'Moletom com capuz "Na minha máquina funciona"', description: 'Moletom com capuz branco fabricado com tecido de alta qualidade e caimento impecável.', price: 59.00, image: 'images/produtos/imagem2.jpeg' },
        { name: 'Ecobag "Na minha máquina funciona"', description: 'Eco bag fabricada em tecido 100% algodão cru, com dimensões 30 x 40 cm.', price: 30.0, image: 'images/produtos/imagem3.jpeg' },
        { name: 'Moletom "Testar é o único lugar onde falhar é realmente uma vitória!"', description: 'Moletom com branco fabricado com tecido de alta qualidade e caimento impecável, fabricado em tecido 100% algodão.', price: 49.0, image: 'images/produtos/imagem4.jpeg' },
        { name: 'Garrafa "Testar é o único lugar onde falhar é realmente uma vitória!"', description: 'Garrafa térmica que mantem bebida qyente por até 12h e até 24h fria. Capacidade de 500 ml. Fabricada em aço inoxidável.', price: 30.0, image: 'images/produtos/imagem5.jpeg' },
        { name: 'Ecobag "Testar é o único lugar onde falhar é realmente uma vitória!"', description: 'Eco bag fabricada em tecido 100% algodão cru, com dimensões 30 x 40 cm.', price: 30.0, image: 'images/produtos/imagem6.jpeg' },
        { name: 'Quadro "Se você acha que nada é impossível..."', description: 'Quadro decorativo moldurado com acabamento em vidro. Medidas: 40 x 60 cm.', price: 70.0, image: 'images/produtos/imagem7.jpeg' },
        { name: 'Moletom com capuz "Se você acha que nada é impossível..."', description: 'Moletom com capuz preto fabricado com tecido de alta qualidade e caimento impecável.', price: 59.00, image: 'images/produtos/imagem1.jpeg' },
        { name: 'Moletom com capuz "Const"', description: 'Moletom com capuz branco fabricado com tecido de alta qualidade e caimento impecável.', price: 59.0, image: 'images/produtos/imagem9.jpeg' },
        { name: 'Regata "Na minha máquina funciona"', description: 'Regata masculina canelada de fio 40/1 em algodão premium com elastano.', price: 60.0, image: 'images/produtos/imagem10.jpeg' },
        { name: 'Agenda QA-Commerce', description: 'Agenda executiva em formato 17,7 x 24 cm, capa dura, 178 folhas.', price: 99.00, image: 'images/produtos/imagem11.jpeg' },
        { name: 'Moletom QA-Commerce', description: 'Moletom com branco fabricado com tecido de alta qualidade e caimento impecável, fabricado em tecido 100% algodão.', price: 49.0, image: 'images/produtos/imagem12.jpeg' },
        { name: 'Camiseta QA-Commerce', description: 'Camiseta branca fabricada em tecido 100% algodão.', price: 30.0, image: 'images/produtos/imagem13.jpeg' },
        { name: 'Boné QA-Commerce', description: 'Boné fabricado em tecido 100% algodão, com regulagem traseira e acabamento interno personalizado. Medidas: circunferência mínima: 51 cm e circunferência máxima: 66 cm', price: 140.0, image: 'images/produtos/imagem14.jpeg' },
        { name: 'Gorro "Era só cache"', description: 'Gorro unissex produzido em material sintético, com 48cm de circunferência e 20cm de altura. ', price: 50.0, image: 'images/produtos/imagem15.jpeg' },
    ];

    products.forEach(product => {
        db.run("INSERT INTO Products (name, description, price, image) VALUES (?, ?, ?, ?)",
            [product.name, product.description, product.price, product.image]);
    });

    console.log("Produtos de exemplo inseridos com sucesso.");

    // Inserir usuário administrador
    const adminEmail = 'admin@admin.com';
    const adminPassword = 'admin';
    const adminName = 'Admin';
    const saltRounds = 10;

    bcrypt.hash(adminPassword, saltRounds, (err, hashedPassword) => {
        if (err) {
            console.error('Erro ao hashear a senha:', err.message);
            db.close((closeErr) => {
                if (closeErr) {
                    console.error('Erro ao fechar o banco de dados:', closeErr.message);
                }
            });
            return;
        }
        db.run(
            "INSERT INTO Users (name, email, password, isAdmin) VALUES (?, ?, ?, ?)",
            [adminName, adminEmail, hashedPassword, 1], // 1 indica que é administrador
            (err) => {
                if (err) {
                    console.error('Erro ao inserir usuário administrador:', err.message);
                } else {
                    console.log('Usuário administrador inserido com sucesso.');
                }
                db.close((closeErr) => {
                    if (closeErr) {
                        console.error('Erro ao fechar o banco de dados:', closeErr.message);
                    } else {
                        console.log('Fechando a conexão com o banco de dados SQLite.');
                    }
                });
            }
        );
    });
});
