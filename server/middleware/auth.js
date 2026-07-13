/**
 * Middleware d'authentification admin
 * Vérifie le token JWT dans les cookies ou le header Authorization
 */

const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const JWT_SECRET = process.env.JWT_SECRET || require('crypto').randomBytes(64).toString('hex');

function authMiddleware(req, res, next) {
  let token = null;

  // 1. Cookie first
  if (req.cookies && req.cookies.admin_token) {
    token = req.cookies.admin_token;
  }
  // 2. Header Authorization: Bearer <token>
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.substring(7);
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentification requise'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Session expirée, veuillez vous reconnecter'
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Token invalide'
    });
  }
}

/**
 * Middleware optionnel : ne bloque pas, mais attache l'admin si connecté
 */
function optionalAuth(req, res, next) {
  let token = null;
  if (req.cookies && req.cookies.admin_token) {
    token = req.cookies.admin_token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.substring(7);
  }

  if (token) {
    try {
      req.admin = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      // Silencieux — non bloquant
    }
  }
  next();
}

module.exports = { authMiddleware, optionalAuth };
