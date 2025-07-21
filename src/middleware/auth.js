const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET || "admin@admin";

/**
 * Middleware para autenticar token JWT
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  console.log('🔍 DEBUG AUTH:', {
    hasHeader: !!authHeader,
    hasToken: !!token,
    headerFormat: authHeader?.substring(0, 20) + '...'
  });

  if (!token) {
    return res.status(401).json({ 
      message: "Token não fornecido.",
      debug: "Expected format: Bearer <token>"
    });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      console.log('❌ JWT Error:', err.name, err.message);
      return res.status(403).json({ 
        message: "Token inválido.",
        error: err.name
      });
    }
    
    console.log('✅ JWT Valid:', { id: user.id, isAdmin: user.isAdmin });
    req.user = user;
    next();
  });
}

/**
 * Middleware para verificar se é administrador
 */
function isAdmin(req, res, next) {
  console.log('🔍 Admin Check:', { 
    hasUser: !!req.user, 
    isAdmin: req.user?.isAdmin 
  });

  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ 
      message: "Acesso negado. Apenas administradores.",
      userRole: req.user?.isAdmin ? 'admin' : 'user'
    });
  }
  next();
}

/**
 * Middleware combinado: Autentica E verifica admin em uma única função
 */
function requireAdmin(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ 
      message: "Token não fornecido." 
    });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        message: "Token inválido." 
      });
    }

    // Verificar se é admin na mesma função
    if (!user.isAdmin) {
      return res.status(403).json({ 
        message: "Acesso negado. Apenas administradores." 
      });
    }

    req.user = user;
    next();
  });
}

/**
 * Middleware para verificar se é o próprio usuário ou admin
 */
function isOwnerOrAdmin(req, res, next) {
  const targetUserId = parseInt(req.params.id || req.params.userId);
  const currentUserId = req.user.id;
  const isUserAdmin = req.user.isAdmin;
  
  if (!isUserAdmin && currentUserId !== targetUserId) {
    return res.status(403).json({ 
      message: "Acesso negado. Você só pode acessar seus próprios dados." 
    });
  }
  next();
}

/**
 * Middleware legado para compatibilidade (será removido futuramente)
 */
function authenticateAdmin(req, res, next) {
  authenticateToken(req, res, (err) => {
    if (err) return;
    isAdmin(req, res, next);
  });
}

module.exports = {
  authenticateToken,
  isAdmin,
  isOwnerOrAdmin,
  authenticateAdmin, // Legado - manter por compatibilidade
  requireAdmin // NOVO - middleware combinado mais eficiente
};