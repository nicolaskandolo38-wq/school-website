/**
 * Auth Controller
 */
const jwt = require('jsonwebtoken');
const path = require('path');
const AuthModel = require('../models/auth');
const { validateRequired } = require('../middleware/validate');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const JWT_SECRET = process.env.JWT_SECRET || require('crypto').randomBytes(64).toString('hex');
const TOKEN_EXPIRY = '24h';

const AuthController = {
  /**
   * POST /api/auth/login
   * Body: { username, password }
   */
  login(req, res) {
    try {
      const validation = validateRequired(['username', 'password'], req.body);
      if (!validation.valid) {
        AuthModel.logAttempt(req.body.username || '', req.ip, false);
        return res.status(400).json({
          success: false,
          error: `Champs requis : ${validation.missing.join(', ')}`
        });
      }

      const admin = AuthModel.verifyCredentials(req.body.username, req.body.password);
      const ip = req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress;

      if (!admin) {
        AuthModel.logAttempt(req.body.username, ip, false);
        return res.status(401).json({
          success: false,
          error: 'Identifiants invalides'
        });
      }

      AuthModel.logAttempt(req.body.username, ip, true);

      // Générer le token JWT
      const token = jwt.sign(
        { id: admin.id, username: admin.username, role: 'admin' },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );

      // Définir le cookie
      res.cookie('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24h
      });

      res.json({
        success: true,
        data: {
          admin: { id: admin.id, username: admin.username },
          token
        },
        message: 'Connexion réussie'
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * POST /api/auth/logout
   */
  logout(req, res) {
    res.clearCookie('admin_token');
    res.json({ success: true, message: 'Déconnexion réussie' });
  },

  /**
   * GET /api/auth/me
   * Vérifie si l'admin est connecté et retourne ses infos
   */
  me(req, res) {
    // Arrive ici seulement si authMiddleware a validé le token
    res.json({
      success: true,
      data: {
        id: req.admin.id,
        username: req.admin.username,
        role: req.admin.role
      }
    });
  },

  /**
   * PUT /api/auth/change-password
   * Body: { currentPassword, newPassword }
   */
  changePassword(req, res) {
    try {
      const validation = validateRequired(['currentPassword', 'newPassword'], req.body);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: `Champs requis : ${validation.missing.join(', ')}`
        });
      }

      const result = AuthModel.changePassword(
        req.admin.id,
        req.body.currentPassword,
        req.body.newPassword
      );

      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }

      res.json({ success: true, message: 'Mot de passe modifié avec succès' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * GET /api/auth/login-logs
   */
  getLoginLogs(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const logs = AuthModel.getLoginLogs(limit);
      res.json({ success: true, data: logs });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

module.exports = AuthController;
