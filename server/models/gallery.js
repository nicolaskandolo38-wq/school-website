/**
 * Gallery Model — CRUD sur la table gallery
 */
const { getDb } = require('../config/database');

const GalleryModel = {
  getAll(limit = 100, offset = 0) {
    const db = getDb();
    return db.prepare(
      'SELECT * FROM gallery ORDER BY upload_date DESC LIMIT ? OFFSET ?'
    ).all(limit, offset);
  },

  getAlbums() {
    const db = getDb();
    return db.prepare(
      'SELECT album_name, COUNT(*) as count, MIN(upload_date) as first_date FROM gallery GROUP BY album_name ORDER BY first_date DESC'
    ).all();
  },

  getByAlbum(albumName, limit = 100) {
    const db = getDb();
    return db.prepare(
      'SELECT * FROM gallery WHERE album_name = ? ORDER BY upload_date DESC LIMIT ?'
    ).all(albumName, limit);
  },

  getById(id) {
    const db = getDb();
    return db.prepare('SELECT * FROM gallery WHERE id = ?').get(id);
  },

  create(data) {
    const db = getDb();
    const result = db.prepare(
      'INSERT INTO gallery (album_name, image_path, description) VALUES (?, ?, ?)'
    ).run(data.album_name, data.image_path, data.description || '');
    return this.getById(result.lastInsertRowid);
  },

  update(id, data) {
    const db = getDb();
    const fields = [];
    const values = [];
    if (data.album_name !== undefined) { fields.push('album_name = ?'); values.push(data.album_name); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.image_path !== undefined) { fields.push('image_path = ?'); values.push(data.image_path); }
    if (fields.length === 0) return this.getById(id);
    values.push(id);
    db.prepare(`UPDATE gallery SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.getById(id);
  },

  remove(id) {
    const db = getDb();
    const item = this.getById(id);
    if (!item) return false;
    db.prepare('DELETE FROM gallery WHERE id = ?').run(id);
    return item;
  }
};

module.exports = GalleryModel;
