const ProgramsModel = require('../models/programs');
const { validateRequired } = require('../middleware/validate');

module.exports = {
  getPublic(req, res) {
    try {
      const programs = ProgramsModel.getAll(true);
      res.json({ success: true, data: programs });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  getBySlug(req, res) {
    try {
      const prog = ProgramsModel.getBySlug(req.params.slug);
      if (!prog) return res.status(404).json({ success: false, error: 'Programme non trouvé' });
      res.json({ success: true, data: prog });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  getAll(req, res) {
    try {
      const programs = ProgramsModel.getAll(false);
      res.json({ success: true, data: programs });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  getById(req, res) {
    try {
      const prog = ProgramsModel.getById(req.params.id);
      if (!prog) return res.status(404).json({ success: false, error: 'Programme non trouvé' });
      res.json({ success: true, data: prog });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  create(req, res) {
    try {
      const validation = validateRequired(['name'], req.body);
      if (!validation.valid) {
        return res.status(400).json({ success: false, error: `Champs requis : ${validation.missing.join(', ')}` });
      }
      const prog = ProgramsModel.create(req.body);
      res.status(201).json({ success: true, data: prog });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  update(req, res) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID invalide' });
      const existing = ProgramsModel.getById(id);
      if (!existing) return res.status(404).json({ success: false, error: 'Programme non trouvé' });
      const prog = ProgramsModel.update(id, req.body);
      res.json({ success: true, data: prog });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  remove(req, res) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID invalide' });
      const prog = ProgramsModel.remove(id);
      if (!prog) return res.status(404).json({ success: false, error: 'Programme non trouvé' });
      res.json({ success: true, message: 'Programme supprimé' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
