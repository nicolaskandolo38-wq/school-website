/**
 * Auth Routes
 */
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth');
const { authMiddleware } = require('../middleware/auth');
const { loginLimiter, passwordLimiter } = require('../middleware/rateLimiter');

// Login (avec rate limiter anti brute-force)
router.post('/login', loginLimiter, AuthController.login);

// Logout (pas d'auth nécessaire — on clear le cookie)
router.post('/logout', AuthController.logout);

// Vérifier l'état de connexion
router.get('/me', authMiddleware, AuthController.me);

// Changer mot de passe (limité)
router.put('/change-password', authMiddleware, passwordLimiter, AuthController.changePassword);

// Logs de connexion
router.get('/login-logs', authMiddleware, AuthController.getLoginLogs);

module.exports = router;
