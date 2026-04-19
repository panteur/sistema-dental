const jwt = require('jsonwebtoken');
const { ROLES } = require('../config/constants');
const { query } = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const users = await query('SELECT id, email, name, role FROM users WHERE id = ?', [decoded.id || decoded.userId]);
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
    next(error);
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permisos para esta acción' });
    }

    next();
  };
};

const authorizeAny = (roles) => authorize(...roles);
const isAdmin = authorize(ROLES.ADMIN);
const isDentist = authorize(ROLES.DENTIST);
const isReceptionist = authorize(ROLES.RECEPTIONIST);
const isAdminOrDentist = authorizeAny([ROLES.ADMIN, ROLES.DENTIST]);
const isAdminOrReceptionist = authorizeAny([ROLES.ADMIN, ROLES.RECEPTIONIST]);
const isAdminOrDentistOrReceptionist = authorizeAny([ROLES.ADMIN, ROLES.DENTIST, ROLES.RECEPTIONIST]);

module.exports = {
  authenticate,
  authorize,
  authorizeAny,
  isAdmin,
  isDentist,
  isReceptionist,
  isAdminOrDentist,
  isAdminOrReceptionist,
  isAdminOrDentistOrReceptionist
};
