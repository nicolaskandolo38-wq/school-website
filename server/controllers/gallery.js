const GalleryModel = require('../models/gallery');
const { validateRequired } = require('../middleware/validate');

module.exports = {
  getPublic(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;
      const album = req.query.album;
      let photos;
      if (album) {
        photos = GalleryModel.getByAlbum(album, limit);
      } else {
        photos = GalleryModel.getAll(limit, offset);
      }
      const albums = GalleryModel.getAlbums();
      res.json({ success: true, data: photos, albums });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  getAlbums(req, res) {
    try {
      const albums = GalleryModel.getAlbums();
      res.json({ success: true, data: albums });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  getAll(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;
      const photos = GalleryModel.getAll(limit, offset);
      res.json({ success: true, data: photos });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  getById(req, res) {
    try {
      const photo = GalleryModel.getById(req.params.id);
      if (!photo) return res.status(404).json({ success: false, error: 'Photo non trouvée' });
      res.json({ success: true, data: photo });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  create(req, res) {
    try {
      const validation = validateRequired(['album_name'], req.body);
      if (!validation.valid) {
        return res.status(400).json({ success: false, error: `Champs requis : ${validation.missing.join(', ')}` });
      }
      if (!req.body.image_path && !req.file) {
        return res.status(400).json({ success: false, error: 'Une image est requise' });
      }
      const imagePath = req.file
        ? `/uploads/gallery/${req.file.filename}`
        : req.body.image_path;
      const photo = GalleryModel.create({ ...req.body, image_path: imagePath });
      res.status(201).json({ success: true, data: photo });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  update(req, res) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID invalide' });
      const existing = GalleryModel.getById(id);
      if (!existing) return res.status(404).json({ success: false, error: 'Photo non trouvée' });
      const photo = GalleryModel.update(id, req.body);
      res.json({ success: true, data: photo });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  remove(req, res) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID invalide' });
      const photo = GalleryModel.remove(id);
      if (!photo) return res.status(404).json({ success: false, error: 'Photo non trouvée' });
      res.json({ success: true, message: 'Photo supprimée' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
