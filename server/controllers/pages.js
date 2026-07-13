/**
 * Pages Controller
 */
const PagesModel = require('../models/pages');

const PagesController = {
  /**
   * GET /api/pages/public — Toutes les pages actives (site public)
   */
  getPublic(req, res) {
    try {
      const pages = PagesModel.getAll();
      res.json({ success: true, data: pages });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * GET /api/pages/public/:name — Une page par son nom (site public)
   */
  getPublicByName(req, res) {
    try {
      const page = PagesModel.getByName(req.params.name);
      if (!page || !page.is_active) {
        return res.status(404).json({ success: false, error: 'Page non trouvée' });
      }
      res.json({ success: true, data: page });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * GET /api/pages — Toutes les pages (admin)
   */
  getAll(req, res) {
    try {
      const pages = PagesModel.getAllAdmin();
      res.json({ success: true, data: pages });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * GET /api/pages/:id — Une page par ID (admin)
   */
  getById(req, res) {
    try {
      const page = PagesModel.getById(req.params.id);
      if (!page) {
        return res.status(404).json({ success: false, error: 'Page non trouvée' });
      }
      res.json({ success: true, data: page });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * PUT /api/pages/:id — Met à jour une page
   */
  update(req, res) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'ID invalide' });
      }

      const existing = PagesModel.getById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Page non trouvée' });
      }

      const updated = PagesModel.update(id, req.body);
      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

module.exports = PagesController;
