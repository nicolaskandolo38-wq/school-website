/**
 * Settings Model — accès direct aux paramètres dans la table settings
 */
const { getDb } = require('../config/database');

const SettingsModel = {
  /**
   * Récupère tous les settings sous forme { key: value }
   */
  getAll() {
    const db = getDb();
    const rows = db.prepare('SELECT key, value FROM settings ORDER BY key').all();
    const result = {};
    rows.forEach(r => { result[r.key] = r.value; });
    return result;
  },

  /**
   * Récupère tous les settings avec leur ID (pour l'admin)
   */
  getAllDetailed() {
    const db = getDb();
    return db.prepare('SELECT * FROM settings ORDER BY key').all();
  },

  /**
   * Récupère un setting par sa clé
   */
  getByKey(key) {
    const db = getDb();
    return db.prepare('SELECT * FROM settings WHERE key = ?').get(key);
  },

  /**
   * Récupère la valeur d'un setting
   */
  getValue(key) {
    const db = getDb();
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? row.value : null;
  },

  /**
   * Met à jour plusieurs settings d'un coup { key, value }
   */
  updateMany(settings) {
    const db = getDb();
    const stmt = db.prepare(
      'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP'
    );
    const updateMany = db.transaction((items) => {
      for (const s of items) {
        stmt.run(s.key, s.value);
      }
    });
    updateMany(settings);
    return true;
  },

  /**
   * Met à jour un seul setting
   */
  update(key, value) {
    return this.updateMany([{ key, value }]);
  }
};

module.exports = SettingsModel;
