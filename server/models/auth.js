/**
 * Auth Model — authentification admin
 */
const { getDb } = require('../config/database');
const bcrypt = require('bcrypt');

const AuthModel = {
  /**
   * Vérifie les credentials d'un admin
   * Retourne l'admin sans le hash si OK, null sinon
   */
  verifyCredentials(username, password) {
    const db = getDb();
    const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
    if (!admin) return null;
    
    // Mode sans mot de passe (ADMIN_NO_PASSWORD=true ou pas de hash bcrypt)
    if (process.env.ADMIN_NO_PASSWORD === 'true' || !admin.password_hash || admin.password_hash.length < 10) {
      const { password_hash, ...safeAdmin } = admin;
      return safeAdmin;
    }
    
    const match = bcrypt.compareSync(password, admin.password_hash);
    if (!match) return null;
    const { password_hash, ...safeAdmin } = admin;
    return safeAdmin;
  },

  /**
   * Change le mot de passe d'un admin
   */
  changePassword(adminId, currentPassword, newPassword) {
    const db = getDb();
    const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(adminId);
    if (!admin) return { success: false, error: 'Admin introuvable' };
    if (!bcrypt.compareSync(currentPassword, admin.password_hash)) {
      return { success: false, error: 'Mot de passe actuel incorrect' };
    }
    if (newPassword.length < 8) {
      return { success: false, error: 'Le mot de passe doit faire au moins 8 caractères' };
    }
    const newHash = bcrypt.hashSync(newPassword, 12);
    db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(newHash, adminId);
    return { success: true };
  },

  /**
   * Log une tentative de connexion
   */
  logAttempt(username, ipAddress, success) {
    const db = getDb();
    db.prepare('INSERT INTO login_logs (username, ip_address, success) VALUES (?, ?, ?)').run(
      username, ipAddress || 'unknown', success ? 1 : 0
    );
  },

  /**
   * Récupère les logs de connexion
   */
  getLoginLogs(limit = 50) {
    const db = getDb();
    return db.prepare('SELECT * FROM login_logs ORDER BY attempted_at DESC LIMIT ?').all(limit);
  }
};

module.exports = AuthModel;
