const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/programs');
const { authMiddleware } = require('../middleware/auth');

// Publiques
router.get('/public', ctrl.getPublic);
router.get('/public/:slug', ctrl.getBySlug);

// Admin
router.get('/', authMiddleware, ctrl.getAll);
router.get('/:id', authMiddleware, ctrl.getById);
router.post('/', authMiddleware, ctrl.create);
router.put('/:id', authMiddleware, ctrl.update);
router.delete('/:id', authMiddleware, ctrl.remove);

module.exports = router;
