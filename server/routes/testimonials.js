const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/testimonials');
const { authMiddleware } = require('../middleware/auth');
const { uploadTestimonials } = require('../middleware/upload');

// Publique
router.get('/public', ctrl.getPublic);

// Admin
router.get('/', authMiddleware, ctrl.getAll);
router.get('/:id', authMiddleware, ctrl.getById);
router.post('/', authMiddleware, uploadTestimonials.single('image'), ctrl.create);
router.put('/:id', authMiddleware, uploadTestimonials.single('image'), ctrl.update);
router.delete('/:id', authMiddleware, ctrl.remove);

module.exports = router;
