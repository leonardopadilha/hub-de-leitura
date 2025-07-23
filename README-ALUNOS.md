# 📚 Hub de Leitura - Guia do Aluno

> **Sistema de biblioteca para praticar Quality Assurance (QA)**

## 🚀 Instalação Rápida

### 1. **Baixar o projeto**
```bash
git clone https://github.com/fabioaraujoqa/hub-de-leitura.git
cd hub-de-leitura
```

### 2. **Instalar dependências**
```bash
npm install
```

### 3. **Iniciar o servidor**
```bash
npm start
```

### 4. **Abrir no navegador**
- **Sistema:** http://localhost:3000
- **Documentação:** http://localhost:3000/api-docs

## 🔑 Credenciais de Teste

| Perfil | Email | Senha | O que pode fazer |
|--------|-------|-------|------------------|
| **Admin** | `admin@admin.com` | `admin123` | Tudo: gerenciar livros, usuários, reservas |
| **Usuário** | `usuario@teste.com` | `user123` | Fazer reservas, ver catálogo |

## 🎯 O que Testar

### 📚 **Catálogo de Livros**
- ✅ Listar todos os livros
- ✅ Buscar por título/autor
- ✅ Filtrar por categoria
- ✅ Ver detalhes do livro

### 👤 **Sistema de Usuários**
- ✅ Fazer login
- ✅ Criar conta nova
- ✅ Ver perfil
- ✅ Atualizar dados

### 📝 **Reservas de Livros**
- ✅ Reservar livro disponível
- ✅ Ver minhas reservas
- ✅ Cancelar reserva
- ✅ Adicionar observações

### 🛒 **Carrinho de Livros**
- ✅ Adicionar livros ao carrinho
- ✅ Ver itens do carrinho
- ✅ Remover itens
- ✅ Criar reservas do carrinho

### 🛠️ **Painel Admin** (só para admin)
- ✅ Ver todas as reservas
- ✅ Marcar retirada/devolução
- ✅ Adicionar/editar livros
- ✅ Gerenciar usuários

## 🧪 Cenários de Teste Sugeridos

### **Testes Básicos (Iniciantes)**
1. Fazer login com credenciais válidas
2. Fazer login com senha errada
3. Listar todos os livros
4. Buscar um livro específico
5. Reservar um livro disponível
6. Tentar reservar livro esgotado
7. Ver detalhes de uma reserva
8. Cancelar uma reserva

### **Testes Intermediários**
1. Criar conta nova com dados válidos
2. Criar conta com email já existente
3. Adicionar livros ao carrinho
4. Criar múltiplas reservas do carrinho
5. Tentar exceder limite de 5 reservas
6. Testar paginação da lista de livros
7. Filtrar livros por categoria
8. Atualizar dados do perfil

### **Testes Avançados**
1. Teste de autorização (tentar acessar admin sem permissão)
2. Teste de token expirado
3. Teste de campos obrigatórios
4. Teste de validação de dados
5. Teste de limite de caracteres
6. Teste de concorrência (dois usuários no mesmo livro)
7. Teste de SQL injection
8. Teste de upload de arquivos

## 📖 Documentação da API

### **URLs Importantes**
- **Swagger UI:** http://localhost:3000/api-docs
- **Health Check:** http://localhost:3000/api/health
- **Info da API:** http://localhost:3000/api/info

### **Endpoints Principais**

#### **Autenticação**
- `POST /api/login` - Fazer login
- `POST /api/register` - Criar conta

#### **Livros**  
- `GET /api/books` - Listar livros
- `GET /api/books/:id` - Detalhes do livro
- `POST /api/books` - Adicionar livro (admin)

#### **Reservas**
- `GET /api/reservations` - Minhas reservas
- `POST /api/reservations` - Fazer reserva
- `DELETE /api/reservations/:id` - Cancelar reserva

#### **Carrinho**
- `GET /api/basket/:userId` - Ver carrinho
- `POST /api/basket` - Adicionar ao carrinho
- `DELETE /api/basket/:userId/:bookId` - Remover item

## 🔧 Ferramentas para Testar

### **Navegador (Mais Fácil)**
1. Acesse http://localhost:3000/api-docs
2. Clique em "Try it out" nos endpoints
3. Faça login primeiro para obter o token
4. Use o token nos outros endpoints

### **Postman/Insomnia**
1. Importe a coleção do Swagger
2. Configure o token JWT no Authorization
3. Teste todos os endpoints

### **cURL (Linha de Comando)**
```bash
# Login
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"admin123"}'

# Listar livros (com token)
curl -X GET http://localhost:3000/api/books \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## 🐛 Problemas Comuns

### **Erro: "Cannot find module"**
```bash
npm install
```

### **Erro: "Port 3000 already in use"**
```bash
# Mudar porta no arquivo .env
PORT=3001
```

### **Erro: "Token expired"**
- Faça login novamente para obter novo token

### **Erro: "Database not found"**
- O banco é criado automaticamente na primeira execução

## 📝 Relatório de Bugs

Quando encontrar um bug:

1. **Descreva o problema** - O que aconteceu?
2. **Passos para reproduzir** - Como chegar no bug?
3. **Resultado esperado** - O que deveria acontecer?
4. **Resultado atual** - O que realmente aconteceu?
5. **Screenshots** - Se possível

**Exemplo:**
```
🐛 BUG: Não consigo reservar livro

📋 Passos:
1. Fazer login como usuário comum
2. Ir em /api/books
3. Escolher livro disponível 
4. POST /api/reservations com {"bookId": 1}

✅ Esperado: Reserva criada (201)
❌ Atual: Erro 500

🖼️ Screenshot: [anexar]
```

## 🎓 Objetivos de Aprendizagem

Ao final, você deve conseguir:

- ✅ Entender como funciona uma API REST
- ✅ Usar ferramentas de teste (Postman, cURL, Swagger)
- ✅ Identificar diferentes tipos de bugs
- ✅ Escrever casos de teste
- ✅ Testar autenticação e autorização
- ✅ Validar dados de entrada e saída
- ✅ Testar regras de negócio
- ✅ Documentar bugs encontrados

## 🆘 Ajuda

- **Issues:** https://github.com/fabioaraujoqa/hub-de-leitura/issues
- **Email:** fabio@qualityassurance.com
- **Documentação completa:** README.md

---

**🚀 Bons testes! Encontre quantos bugs conseguir! 🐛**