const EventsModel = require('../models/events');
const { validateRequired } = require('../middleware/validate');

module.exports = {
  getPublic(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const events = EventsModel.getAll(true, limit, offset);
      res.json({ success: true, data: events });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  getUpcoming(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 5;
      const events = EventsModel.getUpcoming(limit);
      res.json({ success: true, data: events });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  getAll(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const events = EventsModel.getAll(false, limit, offset);
      res.json({ success: true, data: events });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  getById(req, res) {
    try {
      const event = EventsModel.getById(req.params.id);
      if (!event) return res.status(404).json({ success: false, error: 'Événement non trouvé' });
      res.json({ success: true, data: event });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  create(req, res) {
    try {
      const validation = validateRequired(['title', 'event_date'], req.body);
      if (!validation.valid) {
        return res.status(400).json({ success: false, error: `Champs requis : ${validation.missing.join(', ')}` });
      }
      const data = { ...req.body };
      if (req.file) data.image_path = `/uploads/news/${req.file.filename}`;
      if (data.is_active === '1') data.is_active = true;
      if (data.is_active === '0') data.is_active = false;
      const event = EventsModel.create(data);
      res.status(201).json({ success: true, data: event });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  update(req, res) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID invalide' });
      const existing = EventsModel.getById(id);
      if (!existing) return res.status(404).json({ success: false, error: 'Événement non trouvé' });
      const data = { ...req.body };
      if (req.file) data.image_path = `/uploads/news/${req.file.filename}`;
      if (data.is_active === '1') data.is_active = true;
      if (data.is_active === '0') data.is_active = false;
      const event = EventsModel.update(id, data);
      res.json({ success: true, data: event });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  remove(req, res) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID invalide' });
      const event = EventsModel.remove(id);
      if (!event) return res.status(404).json({ success: false, error: 'Événement non trouvé' });
      res.json({ success: true, message: 'Événement supprimé' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
