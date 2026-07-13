const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/news');
const { authMiddleware } = require('../middleware/auth');
const { uploadNews } = require('../middleware/upload');

// Publiques
router.get('/public', ctrl.getPublic);
router.get('/public/recent', ctrl.getRecent);
router.get('/public/:slug', ctrl.getBySlug);

// Admin
router.get('/', authMiddleware, ctrl.getAll);
router.get('/:id', authMiddleware, ctrl.getById);
router.post('/', authMiddleware, uploadNews.single('image'), ctrl.create);
router.put('/:id', authMiddleware, uploadNews.single('image'), ctrl.update);
router.delete('/:id', authMiddleware, ctrl.remove);

module.exports = router;
