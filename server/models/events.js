/**
 * Events Model — CRUD sur la table events
 */
const { getDb } = require('../config/database');

const EventsModel = {
  getAll(activeOnly = false, limit = 50, offset = 0) {
    const db = getDb();
    if (activeOnly) {
      return db.prepare(
        'SELECT * FROM events WHERE is_active = 1 ORDER BY event_date ASC LIMIT ? OFFSET ?'
      ).all(limit, offset);
    }
    return db.prepare(
      'SELECT * FROM events ORDER BY event_date DESC LIMIT ? OFFSET ?'
    ).all(limit, offset);
  },

  getUpcoming(limit = 5) {
    const db = getDb();
    return db.prepare(
      `SELECT * FROM events WHERE is_active = 1 AND event_date >= datetime('now', 'localtime')
       ORDER BY event_date ASC LIMIT ?`
    ).all(limit);
  },

  getPast(limit = 10) {
    const db = getDb();
    return db.prepare(
      `SELECT * FROM events WHERE is_active = 1 AND event_date < datetime('now', 'localtime')
       ORDER BY event_date DESC LIMIT ?`
    ).all(limit);
  },

  getById(id) {
    const db = getDb();
    return db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  },

  create(data) {
    const db = getDb();
    const result = db.prepare(
      `INSERT INTO events (title, description, event_date, event_end_date, location, image_path, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      data.title, data.description || '', data.event_date,
      data.event_end_date || null, data.location || '',
      data.image_path || null, data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1
    );
    return this.getById(result.lastInsertRowid);
  },

  update(id, data) {
    const db = getDb();
    const fields = [];
    const values = [];
    if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.event_date !== undefined) { fields.push('event_date = ?'); values.push(data.event_date); }
    if (data.event_end_date !== undefined) { fields.push('event_end_date = ?'); values.push(data.event_end_date); }
    if (data.location !== undefined) { fields.push('location = ?'); values.push(data.location); }
    if (data.image_path !== undefined) { fields.push('image_path = ?'); values.push(data.image_path); }
    if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active ? 1 : 0); }
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    db.prepare(`UPDATE events SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.getById(id);
  },

  remove(id) {
    const db = getDb();
    const event = this.getById(id);
    if (!event) return false;
    db.prepare('DELETE FROM events WHERE id = ?').run(id);
    return event;
  }
};

module.exports = EventsModel;
