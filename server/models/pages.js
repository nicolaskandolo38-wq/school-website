/**
 * Pages Model — CRUD sur la table pages
 */
const { getDb } = require('../config/database');

const PagesModel = {
  /**
   * Récupère toutes les pages actives
   */
  getAll() {
    const db = getDb();
    return db.prepare('SELECT * FROM pages WHERE is_active = 1 ORDER BY id').all();
  },

  /**
   * Récupère toutes les pages (admin)
   */
  getAllAdmin() {
    const db = getDb();
    return db.prepare('SELECT * FROM pages ORDER BY id').all();
  },

  /**
   * Récupère une page par son page_name
   */
  getByName(pageName) {
    const db = getDb();
    return db.prepare('SELECT * FROM pages WHERE page_name = ?').get(pageName);
  },

  /**
   * Récupère une page par son ID
   */
  getById(id) {
    const db = getDb();
    return db.prepare('SELECT * FROM pages WHERE id = ?').get(id);
  },

  /**
   * Met à jour le contenu d'une page
   */
  update(id, data) {
    const db = getDb();
    const fields = [];
    const values = [];

    if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
    if (data.meta_description !== undefined) { fields.push('meta_description = ?'); values.push(data.meta_description); }
    if (data.sections !== undefined) { fields.push('sections = ?'); values.push(typeof data.sections === 'string' ? data.sections : JSON.stringify(data.sections)); }
    if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active ? 1 : 0); }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    db.prepare(`UPDATE pages SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.getById(id);
  },

  /**
   * Réorganise une page (change l'ordre des sections)
   */
  reorderSections(id, sectionsConfig) {
    return this.update(id, { sections: sectionsConfig });
  }
};

module.exports = PagesModel;
