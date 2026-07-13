const TeamModel = require('../models/team');
const { validateRequired } = require('../middleware/validate');

module.exports = {
  getPublic(req, res) {
    try {
      const members = TeamModel.getAll(true);
      res.json({ success: true, data: members });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  getAll(req, res) {
    try {
      const members = TeamModel.getAll(false);
      res.json({ success: true, data: members });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  getById(req, res) {
    try {
      const m = TeamModel.getById(req.params.id);
      if (!m) return res.status(404).json({ success: false, error: 'Membre non trouvé' });
      res.json({ success: true, data: m });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  create(req, res) {
    try {
      const validation = validateRequired(['name', 'role'], req.body);
      if (!validation.valid) {
        return res.status(400).json({ success: false, error: `Champs requis : ${validation.missing.join(', ')}` });
      }
      const data = { ...req.body };
      if (req.file) data.photo_path = `/uploads/team/${req.file.filename}`;
      const member = TeamModel.create(data);
      res.status(201).json({ success: true, data: member });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  update(req, res) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID invalide' });
      const existing = TeamModel.getById(id);
      if (!existing) return res.status(404).json({ success: false, error: 'Membre non trouvé' });
      const data = { ...req.body };
      if (req.file) data.photo_path = `/uploads/team/${req.file.filename}`;
      const member = TeamModel.update(id, data);
      res.json({ success: true, data: member });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  remove(req, res) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID invalide' });
      const member = TeamModel.remove(id);
      if (!member) return res.status(404).json({ success: false, error: 'Membre non trouvé' });
      res.json({ success: true, message: 'Membre supprimé' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
