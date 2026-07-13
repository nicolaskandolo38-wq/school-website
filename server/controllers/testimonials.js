const TestimonialsModel = require('../models/testimonials');
const { validateRequired } = require('../middleware/validate');

module.exports = {
  getPublic(req, res) {
    try {
      const testimonials = TestimonialsModel.getAll(true);
      res.json({ success: true, data: testimonials });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  getAll(req, res) {
    try {
      const testimonials = TestimonialsModel.getAll(false);
      res.json({ success: true, data: testimonials });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  getById(req, res) {
    try {
      const t = TestimonialsModel.getById(req.params.id);
      if (!t) return res.status(404).json({ success: false, error: 'Témoignage non trouvé' });
      res.json({ success: true, data: t });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  create(req, res) {
    try {
      const validation = validateRequired(['name', 'content'], req.body);
      if (!validation.valid) {
        return res.status(400).json({ success: false, error: `Champs requis : ${validation.missing.join(', ')}` });
      }
      const t = TestimonialsModel.create(req.body);
      res.status(201).json({ success: true, data: t });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  update(req, res) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID invalide' });
      const existing = TestimonialsModel.getById(id);
      if (!existing) return res.status(404).json({ success: false, error: 'Témoignage non trouvé' });
      const t = TestimonialsModel.update(id, req.body);
      res.json({ success: true, data: t });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  remove(req, res) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID invalide' });
      const t = TestimonialsModel.remove(id);
      if (!t) return res.status(404).json({ success: false, error: 'Témoignage non trouvé' });
      res.json({ success: true, message: 'Témoignage supprimé' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
