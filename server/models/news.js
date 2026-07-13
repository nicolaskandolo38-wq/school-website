/**
 * News Model — CRUD sur la table news
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

const NewsModel = {
  getAll(publishedOnly = false, limit = 50, offset = 0) {
    const db = getDb();
    if (publishedOnly) {
      return db.prepare(
        'SELECT * FROM news WHERE is_published = 1 ORDER BY publish_date DESC LIMIT ? OFFSET ?'
      ).all(limit, offset);
    }
    return db.prepare(
      'SELECT * FROM news ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).all(limit, offset);
  },

  getById(id) {
    const db = getDb();
    return db.prepare('SELECT * FROM news WHERE id = ?').get(id);
  },

  getBySlug(slug) {
    const db = getDb();
    return db.prepare('SELECT * FROM news WHERE slug = ?').get(slug);
  },

  getRecent(limit = 4) {
    const db = getDb();
    return db.prepare(
      'SELECT * FROM news WHERE is_published = 1 ORDER BY publish_date DESC LIMIT ?'
    ).all(limit);
  },

  count(publishedOnly = false) {
    const db = getDb();
    if (publishedOnly) {
      return db.prepare('SELECT COUNT(*) as total FROM news WHERE is_published = 1').get().total;
    }
    return db.prepare('SELECT COUNT(*) as total FROM news').get().total;
  },

  create(data) {
    const db = getDb();
    let slug = slugify(data.title);
    // Éviter les doublons
    let suffix = 1;
    while (this.getBySlug(slug)) {
      slug = slugify(data.title) + '-' + suffix++;
    }
    const result = db.prepare(
      `INSERT INTO news (title, slug, summary, content, image_path, is_published, publish_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      data.title, slug, data.summary || '', data.content || '',
      data.image_path || null, data.is_published ? 1 : 0,
      data.publish_date || new Date().toISOString()
    );
    return this.getById(result.lastInsertRowid);
  },

  update(id, data) {
    const db = getDb();
    const fields = [];
    const values = [];
    if (data.title !== undefined) {
      fields.push('title = ?');
      values.push(data.title);
      // Re-générer le slug si le titre change
      let slug = slugify(data.title);
      let suffix = 1;
      const existing = this.getById(id);
      while (db.prepare('SELECT id FROM news WHERE slug = ? AND id != ?').get(slug, id)) {
        slug = slugify(data.title) + '-' + suffix++;
      }
      fields.push('slug = ?');
      values.push(slug);
    }
    if (data.summary !== undefined) { fields.push('summary = ?'); values.push(data.summary); }
    if (data.content !== undefined) { fields.push('content = ?'); values.push(data.content); }
    if (data.image_path !== undefined) { fields.push('image_path = ?'); values.push(data.image_path); }
    if (data.is_published !== undefined) { fields.push('is_published = ?'); values.push(data.is_published ? 1 : 0); }
    if (data.publish_date !== undefined) { fields.push('publish_date = ?'); values.push(data.publish_date); }
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    db.prepare(`UPDATE news SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.getById(id);
  },

  remove(id) {
    const db = getDb();
    const article = this.getById(id);
    if (!article) return false;
    db.prepare('DELETE FROM news WHERE id = ?').run(id);
    return article;
  }
};

module.exports = NewsModel;
