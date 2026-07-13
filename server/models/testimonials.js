/**
 * Testimonials Model — CRUD sur la table testimonials
 */
const { getDb } = require('../config/database');

const TestimonialsModel = {
  getAll(activeOnly = false) {
    const db = getDb();
    if (activeOnly) {
      return db.prepare('SELECT * FROM testimonials WHERE is_active = 1 ORDER BY created_at DESC').all();
    }
    return db.prepare('SELECT * FROM testimonials ORDER BY created_at DESC').all();
  },

  getById(id) {
    const db = getDb();
    return db.prepare('SELECT * FROM testimonials WHERE id = ?').get(id);
  },

  create(data) {
    const db = getDb();
    const result = db.prepare(
      'INSERT INTO testimonials (name, role, content, image_path, is_active) VALUES (?, ?, ?, ?, ?)'
    ).run(
      data.name, data.role || '', data.content,
      data.image_path || null, data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1
    );
    return this.getById(result.lastInsertRowid);
  },

  update(id, data) {
    const db = getDb();
    const fields = [];
    const values = [];
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.role !== undefined) { fields.push('role = ?'); values.push(data.role); }
    if (data.content !== undefined) { fields.push('content = ?'); values.push(data.content); }
    if (data.image_path !== undefined) { fields.push('image_path = ?'); values.push(data.image_path); }
    if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active ? 1 : 0); }
    if (fields.length === 0) return this.getById(id);
    values.push(id);
    db.prepare(`UPDATE testimonials SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.getById(id);
  },

  remove(id) {
    const db = getDb();
    const item = this.getById(id);
    if (!item) return false;
    db.prepare('DELETE FROM testimonials WHERE id = ?').run(id);
    return item;
  }
};

module.exports = TestimonialsModel;
