const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/gallery');
const { authMiddleware } = require('../middleware/auth');
const { uploadGallery } = require('../middleware/upload');

// Publiques
router.get('/public', ctrl.getPublic);
router.get('/public/albums', ctrl.getAlbums);

// Admin
router.get('/', authMiddleware, ctrl.getAll);
router.get('/:id', authMiddleware, ctrl.getById);
router.post('/', authMiddleware, uploadGallery.single('image'), ctrl.create);
router.put('/:id', authMiddleware, ctrl.update);
router.delete('/:id', authMiddleware, ctrl.remove);

module.exports = router;
