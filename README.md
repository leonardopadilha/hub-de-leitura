# 📚 Hub de Leitura - Sistema de Biblioteca para QA

**Sistema educacional completo para aprendizado e prática de Quality Assurance (QA)**

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![Express](https://img.shields.io/badge/Express-4.18+-blue.svg)
![SQLite](https://img.shields.io/badge/SQLite-3+-lightgrey.svg)
![JWT](https://img.shields.io/badge/JWT-Auth-orange.svg)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-purple.svg)
![License](https://img.shields.io/badge/License-Educational-yellow.svg)

## 🎯 Objetivo

O **Hub de Leitura** é um sistema de gestão de biblioteca desenvolvido especificamente para **ensinar e praticar Quality Assurance**. Cada funcionalidade representa cenários reais que profissionais de QA encontram no dia a dia.

### 🎓 Para Estudantes de QA

- ✅ **Aprenda testando** - Sistema real com cenários complexos
- ✅ **API REST completa** - Todos os tipos de endpoint
- ✅ **Diferentes perfis** - Usuário comum vs Administrador
- ✅ **Autenticação JWT** - Sistema de login profissional
- ✅ **Cenários de erro** - Como sistemas falham na prática
- ✅ **Documentação Swagger** - API bem documentada
- ✅ **Interface moderna** - Frontend para testes E2E

## 🚀 Funcionalidades

### 👤 **Gestão de Usuários**

- Registro e login de usuários
- Autenticação JWT com expiração
- Perfis diferenciados (Usuário/Admin)
- Atualização de perfil

### 📖 **Catálogo de Livros**

- Listagem com filtros e busca
- CRUD completo (Admin)
- Controle de estoque
- Upload de capas
- Categorização

### 📝 **Reservas**

- Reserva de livros disponíveis
- Controle de prazos
- Gestão de retiradas e devoluções
- Histórico completo
- Alertas de atraso

### 🛠️ **Painel Administrativo**

- Dashboard com estatísticas
- Gestão de todas as reservas
- Controle de usuários
- Relatórios e exportações
- Logs do sistema

## 🛠️ Tecnologias

### Backend

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **SQLite** - Banco de dados leve
- **JWT** - Autenticação
- **Bcrypt** - Criptografia de senhas
- **Joi** - Validação de dados
- **Swagger** - Documentação da API

### Frontend

- **HTML5/CSS3** - Estrutura e estilo
- **Bootstrap 5** - Framework CSS
- **JavaScript ES6+** - Interatividade
- **Font Awesome** - Ícones
- **Chart.js** - Gráficos (futuro)

## ⚡ Instalação Rápida

### Pré-requisitos

- Node.js 18+ instalado
- Git instalado
- Editor de código (VS Code recomendado)

### 1. Clone o Repositório

```bash
git clone https://github.com/fabioaraujoqa/hub-de-leitura.git
cd hub-de-leitura
```

### 2. Instale as Dependências

```bash
npm install
```

### 3. Inicie o Servidor

```bash
npm start
```

### 4. Acesse o Sistema

- **Sistema:** http://localhost:3000
- **API Docs:** http://localhost:3000/api-docs
- **Admin:** http://localhost:3000/admin-dashboard.html

## 🔑 Credenciais de Teste

### Administrador

- **Email:** admin@biblioteca.com
- **Senha:** admin123
- **Permissões:** Acesso total ao sistema

### Usuário Comum

- **Email:** usuario@teste.com
- **Senha:** user123
- **Permissões:** Reservas e consultas

## 📋 Cenários de Teste Sugeridos

### 🔐 **Autenticação**

- [ ] Login com credenciais válidas
- [ ] Login com email inexistente
- [ ] Login com senha incorreta
- [ ] Registro de novo usuário
- [ ] Registro com email já existente
- [ ] Acesso com token expirado
- [ ] Tentativa de acesso sem token

### 📚 **Gestão de Livros**

- [ ] Listar todos os livros
- [ ] Buscar por título/autor/categoria
- [ ] Filtrar por disponibilidade
- [ ] Adicionar novo livro (Admin)
- [ ] Editar informações do livro (Admin)
- [ ] Tentar editar sem permissão de admin
- [ ] Remover livro com reservas ativas

### 📝 **Reservas**

- [ ] Reservar livro disponível
- [ ] Tentar reservar livro esgotado
- [ ] Reservar mesmo livro duas vezes
- [ ] Marcar retirada de livro (Admin)
- [ ] Marcar devolução (Admin)
- [ ] Estender prazo de devolução (Admin)
- [ ] Cancelar reserva (Admin)

### 🛠️ **Painel Admin**

- [ ] Acessar dashboard com perfil admin
- [ ] Tentar acessar dashboard como usuário comum
- [ ] Visualizar estatísticas
- [ ] Filtrar reservas por status/usuário
- [ ] Verificar alertas de atraso

## 🗂️ Estrutura do Projeto

## 🔗 Endpoints da API

### Autenticação

- `POST /api/login` - Login de usuário
- `POST /api/registrar` - Registro de usuário

### Livros

- `GET /api/books` - Listar livros
- `GET /api/books/:id` - Detalhes do livro
- `POST /api/books` - Adicionar livro (Admin)
- `PUT /api/books/:id` - Editar livro (Admin)
- `DELETE /api/books/:id` - Remover livro (Admin)

### Reservas (Usuário)

- `GET /api/reservations` - Minhas reservas
- `POST /api/reservations` - Fazer reserva

### Admin - Reservas

- `GET /api/admin/reservations` - Todas as reservas
- `GET /api/admin/reservations/stats` - Estatísticas
- `PUT /api/admin/reservations/:id` - Atualizar status
- `PUT /api/admin/reservations/:id/extend` - Estender prazo

### Utilitários

- `GET /api/health` - Status do sistema
- `GET /api-docs` - Documentação Swagger

## 🧪 Testando a API

### Com cURL

```bash
# Login
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@biblioteca.com","password":"admin123"}'

# Listar livros (com token)
curl -X GET http://localhost:3000/api/books \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Com Postman/Insomnia

1. Importe a coleção do Swagger: http://localhost:3000/api-docs
2. Configure o token JWT no cabeçalho Authorization
3. Teste todos os endpoints disponíveis

## 🎨 Personalizações

### Adicionando Novos Livros

```sql
INSERT INTO Books (title, author, category, isbn, total_copies, available_copies) 
VALUES ('Seu Livro', 'Autor', 'Categoria', 'ISBN', 5, 5);
```

### Criando Usuário Admin

```sql
UPDATE Users SET isAdmin = 1 WHERE email = 'seu@email.com';
```

### Configurando Tempo de Token

```javascript
// Em src/server.js
const token = jwt.sign(payload, SECRET_KEY, { 
  expiresIn: "8h" // Altere conforme necessário
});
```

## 🤝 Contribuindo

### Para Instrutores

1. Fork o repositório
2. Crie cenários de teste adicionais
3. Adicione novos endpoints para prática
4. Documente bugs intencionais para os alunos encontrarem
5. Envie um Pull Request

### Para Alunos

1. Reporte bugs encontrados (é parte do aprendizado!)
2. Sugira melhorias na documentação
3. Compartilhe casos de teste interessantes
4. Contribua com exemplos de automação

## 📝 Logs e Debugging

### Visualizar Logs

```bash
# No terminal onde o servidor está rodando
# Os logs aparecem automaticamente
```

### Estrutura do Banco de Dados

- **Users** - Usuários do sistema
- **Books** - Catálogo de livros
- **Reservations** - Histórico de reservas

### Resetar Banco de Dados

```bash
# Pare o servidor e delete o arquivo do banco
rm data/library.db
# Reinicie o servidor para recriar as tabelas
npm start
```

## 🐛 Problemas Comuns

### Erro "Port 3000 already in use"

```bash
# Encontrar processo usando a porta
lsof -ti:3000
# Finalizar processo
kill -9 PID_DO_PROCESSO
```

### Token expirado

- Faça login novamente para obter um novo token
- Tokens expiram em 1 hora por padrão

### Banco de dados corrompido

- Delete o arquivo `database/biblioteca.db`
- Rode o comando `npm run db` para recriar o banco

## 📚 Recursos de Aprendizado

### Documentação

- [Express.js](https://expressjs.com/)
- [JWT.io](https://jwt.io/)
- [SQLite Tutorial](https://www.sqlitetutorial.net/)
- [Swagger/OpenAPI](https://swagger.io/docs/)

### Ferramentas de Teste

- [Postman](https://www.postman.com/)
- [Insomnia](https://insomnia.rest/)
- [Jest](https://jestjs.io/) - Para testes automatizados
- [Newman](https://github.com/postmanlabs/newman) - CLI do Postman

## 🏆 Próximas Funcionalidades

- [ ] Testes automatizados com Jest
- [ ] Notificações por email
- [ ] Sistema de multas
- [ ] Reserva de salas de estudo
- [ ] API de recomendações
- [ ] Dashboard com gráficos
- [ ] Integração com sistemas externos
- [ ] App mobile com React Native

### Uso Permitido

- ✅ Uso educacional e acadêmico
- ✅ Modificação para fins didáticos
- ✅ Distribuição para alunos
- ✅ Criação de cursos baseados no projeto

### Uso Restrito

- ❌ Uso comercial direto
- ❌ Venda do código
- ❌ Redistribuição sem créditos

---

## ⭐ Agradecimentos

Desenvolvido com ❤️ para a comunidade de **Quality Assurance**.

**Contribuidores:**

- Fábio Araújo
    - [Repositório](https://github.com/fabioaraujoqa)
    - [Linkedin](https://www.linkedin.com/in/fabio10/)

---

### 🚀 **Bons Testes!**

*"A qualidade nunca é um acidente; ela é sempre o resultado de um esforço inteligente."* - John Ruskin