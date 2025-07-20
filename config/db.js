const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Novo caminho para a pasta database
const dbPath = path.join(__dirname, '../database/biblioteca.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('📚 Conectado ao banco de dados da Biblioteca.');
    }
});

module.exports = db;