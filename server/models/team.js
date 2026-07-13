/**
 * Team Model — CRUD sur la table team
 */
const { getDb } = require('../config/database');

const TeamModel = {
  getAll(activeOnly = false) {
    const db = getDb();
    if (activeOnly) {
      return db.prepare('SELECT * FROM team WHERE is_active = 1 ORDER BY sort_order, name').all();
    }
    return db.prepare('SELECT * FROM team ORDER BY sort_order, name').all();
  },

  getById(id) {
    const db = getDb();
    return db.prepare('SELECT * FROM team WHERE id = ?').get(id);
  },

  create(data) {
    const db = getDb();
    const result = db.prepare(
      'INSERT INTO team (name, role, bio, photo_path, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(
      data.name, data.role, data.bio || '',
      data.photo_path || null, data.sort_order || 0,
      data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1
    );
    return this.getById(result.lastInsertRowid);
  },

  update(id, data) {
    const db = getDb();
    const fields = [];
    const values = [];
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.role !== undefined) { fields.push('role = ?'); values.push(data.role); }
    if (data.bio !== undefined) { fields.push('bio = ?'); values.push(data.bio); }
    if (data.photo_path !== undefined) { fields.push('photo_path = ?'); values.push(data.photo_path); }
    if (data.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(data.sort_order); }
    if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active ? 1 : 0); }
    if (fields.length === 0) return this.getById(id);
    values.push(id);
    db.prepare(`UPDATE team SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.getById(id);
  },

  remove(id) {
    const db = getDb();
    const member = this.getById(id);
    if (!member) return false;
    db.prepare('DELETE FROM team WHERE id = ?').run(id);
    return member;
  }
};

module.exports = TeamModel;
