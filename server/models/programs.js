/**
 * Programs Model — CRUD sur la table programs
 */
const { getDb } = require('../config/database');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

const ProgramsModel = {
  getAll(activeOnly = false) {
    const db = getDb();
    if (activeOnly) {
      return db.prepare('SELECT * FROM programs WHERE is_active = 1 ORDER BY sort_order').all();
    }
    return db.prepare('SELECT * FROM programs ORDER BY sort_order').all();
  },

  getById(id) {
    const db = getDb();
    return db.prepare('SELECT * FROM programs WHERE id = ?').get(id);
  },

  getBySlug(slug) {
    const db = getDb();
    return db.prepare('SELECT * FROM programs WHERE slug = ?').get(slug);
  },

  create(data) {
    const db = getDb();
    let slug = data.slug || slugify(data.name);
    let suffix = 1;
    while (this.getBySlug(slug)) { slug = slugify(data.name) + '-' + suffix++; }
    const result = db.prepare(
      'INSERT INTO programs (name, slug, description, details, icon, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      data.name, slug, data.description || '', data.details || JSON.stringify({}),
      data.icon || null, data.sort_order || 0,
      data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1
    );
    return this.getById(result.lastInsertRowid);
  },

  update(id, data) {
    const db = getDb();
    const fields = [];
    const values = [];
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.slug !== undefined) { fields.push('slug = ?'); values.push(data.slug); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.details !== undefined) { fields.push('details = ?'); values.push(typeof data.details === 'string' ? data.details : JSON.stringify(data.details)); }
    if (data.icon !== undefined) { fields.push('icon = ?'); values.push(data.icon); }
    if (data.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(data.sort_order); }
    if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active ? 1 : 0); }
    if (fields.length === 0) return this.getById(id);
    values.push(id);
    db.prepare(`UPDATE programs SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.getById(id);
  },

  remove(id) {
    const db = getDb();
    const prog = this.getById(id);
    if (!prog) return false;
    db.prepare('DELETE FROM programs WHERE id = ?').run(id);
    return prog;
  }
};

module.exports = ProgramsModel;
