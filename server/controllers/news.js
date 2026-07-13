const NewsModel = require('../models/news');
const { validateRequired } = require('../middleware/validate');

module.exports = {
  getPublic(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const articles = NewsModel.getAll(true, limit, offset);
      const total = NewsModel.count(true);
      res.json({ success: true, data: articles, total, limit, offset });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  getRecent(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 4;
      const articles = NewsModel.getRecent(limit);
      res.json({ success: true, data: articles });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  getBySlug(req, res) {
    try {
      const article = NewsModel.getBySlug(req.params.slug);
      if (!article || !article.is_published) {
        return res.status(404).json({ success: false, error: 'Article non trouvé' });
      }
      res.json({ success: true, data: article });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  getAll(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const articles = NewsModel.getAll(false, limit, offset);
      const total = NewsModel.count(false);
      res.json({ success: true, data: articles, total, limit, offset });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  getById(req, res) {
    try {
      const article = NewsModel.getById(req.params.id);
      if (!article) return res.status(404).json({ success: false, error: 'Article non trouvé' });
      res.json({ success: true, data: article });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  create(req, res) {
    try {
      const validation = validateRequired(['title'], req.body);
      if (!validation.valid) {
        return res.status(400).json({ success: false, error: `Champs requis : ${validation.missing.join(', ')}` });
      }
      const data = { ...req.body };
      if (req.file) data.image_path = `/uploads/news/${req.file.filename}`;
      if (data.is_published === '1') data.is_published = true;
      if (data.is_published === '0') data.is_published = false;
      const article = NewsModel.create(data);
      res.status(201).json({ success: true, data: article });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  update(req, res) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID invalide' });
      const existing = NewsModel.getById(id);
      if (!existing) return res.status(404).json({ success: false, error: 'Article non trouvé' });
      const data = { ...req.body };
      if (req.file) data.image_path = `/uploads/news/${req.file.filename}`;
      if (data.is_published === '1') data.is_published = true;
      if (data.is_published === '0') data.is_published = false;
      const article = NewsModel.update(id, data);
      res.json({ success: true, data: article });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  remove(req, res) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID invalide' });
      const article = NewsModel.remove(id);
      if (!article) return res.status(404).json({ success: false, error: 'Article non trouvé' });
      res.json({ success: true, message: 'Article supprimé' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
