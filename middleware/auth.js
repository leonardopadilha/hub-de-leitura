const jwt = require('jsonwebtoken');
const db = require("../config/db");

const SECRET_KEY = process.env.JWT_SECRET || 'admin@admin'; // Altere para um valor seguro e armazene em uma variável de ambiente

// Middleware para autenticação de administrador
function authenticateAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
      return res.status(401).send({ message:"Token ausente."});
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) {
          return res.status(403).send({ message: "Token inválido." });
      }

      if (!decoded.isAdmin) {
          return res.status(403).send( { message: "Acesso negado. Apenas administradores."});
      }

      req.user = decoded; // Armazena os dados decodificados no request
      next();
  });
}

module.exports = {
  authenticateAdmin,
};
