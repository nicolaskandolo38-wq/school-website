const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/events');
const { authMiddleware } = require('../middleware/auth');
const { uploadNews } = require('../middleware/upload');

// Publiques
router.get('/public', ctrl.getPublic);
router.get('/public/upcoming', ctrl.getUpcoming);

// Admin
router.get('/', authMiddleware, ctrl.getAll);
router.get('/:id', authMiddleware, ctrl.getById);
router.post('/', authMiddleware, uploadNews.single('image'), ctrl.create);
router.put('/:id', authMiddleware, uploadNews.single('image'), ctrl.update);
router.delete('/:id', authMiddleware, ctrl.remove);

module.exports = router;
