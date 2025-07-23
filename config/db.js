const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho para o banco de dados EXISTENTE
const dbPath = path.join(__dirname, '..', 'database', 'biblioteca.db');

console.log(`🔍 Procurando banco em: ${dbPath}`);

// Verificar se o arquivo existe
const fs = require('fs');
if (!fs.existsSync(dbPath)) {
  console.error(`❌ Banco de dados não encontrado em: ${dbPath}`);
  console.log('💡 Certifique-se de que o banco foi criado executando:');
  console.log('   node init_db.js');
  process.exit(1);
}

// Criar conexão com o banco EXISTENTE
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco SQLite:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Conectado ao banco SQLite existente');
    
    // Verificar estrutura do banco
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
      if (err) {
        console.error('❌ Erro ao verificar tabelas:', err.message);
      } else {
        console.log('📋 Tabelas encontradas:', tables.map(t => t.name).join(', '));
        
        // Verificar usuários existentes
        db.all("SELECT name, email FROM Users LIMIT 5", (err, users) => {
          if (!err && users.length > 0) {
            console.log('👥 Usuários encontrados:');
            users.forEach(user => {
              const userType = user.email.includes('admin') || user.email.includes('biblioteca') ? '👑' : '👤';
              console.log(`   ${userType} ${user.name} (${user.email})`);
            });
          }
        });
        
        // Verificar livros
        db.get("SELECT COUNT(*) as count FROM Books", (err, result) => {
          if (!err) {
            console.log(`📚 Livros no acervo: ${result.count}`);
          }
        });
      }
    });
  }
});

// Habilitar foreign keys
db.run('PRAGMA foreign_keys = ON', (err) => {
  if (err) {
    console.error('❌ Erro ao habilitar foreign keys:', err.message);
  } else {
    console.log('🔗 Foreign keys habilitadas');
  }
});

// Função para fechar a conexão graciosamente
function closeDatabase() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error('❌ Erro ao fechar banco:', err.message);
        reject(err);
      } else {
        console.log('✅ Conexão com banco fechada');
        resolve();
      }
    });
  });
}

// Verificar integridade do banco na inicialização
function checkDatabaseIntegrity() {
  return new Promise((resolve, reject) => {
    db.run('PRAGMA integrity_check', (err) => {
      if (err) {
        console.error('❌ Problema de integridade do banco:', err.message);
        reject(err);
      } else {
        console.log('✅ Integridade do banco verificada');
        resolve();
      }
    });
  });
}

// Função para obter estatísticas do banco
function getDatabaseStats() {
  return new Promise((resolve, reject) => {
    const stats = {};
    
    const queries = [
      { name: 'users', query: 'SELECT COUNT(*) as count FROM Users' },
      { name: 'books', query: 'SELECT COUNT(*) as count FROM Books' },
      { name: 'reservations', query: 'SELECT COUNT(*) as count FROM Reservations' },
      { name: 'basket', query: 'SELECT COUNT(*) as count FROM Basket' }
    ];
    
    let completed = 0;
    
    queries.forEach(({ name, query }) => {
      db.get(query, (err, result) => {
        if (!err) {
          stats[name] = result.count;
        } else {
          stats[name] = 0;
          console.warn(`⚠️ Erro ao contar ${name}:`, err.message);
        }
        
        completed++;
        if (completed === queries.length) {
          resolve(stats);
        }
      });
    });
  });
}

// Exportar a instância do banco e funções utilitárias
module.exports = db;
module.exports.closeDatabase = closeDatabase;
module.exports.checkDatabaseIntegrity = checkDatabaseIntegrity;
module.exports.getDatabaseStats = getDatabaseStats;