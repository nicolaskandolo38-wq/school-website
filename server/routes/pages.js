/**
 * Pages Routes
 */
const express = require('express');
const router = express.Router();
const PagesController = require('../controllers/pages');
const { authMiddleware } = require('../middleware/auth');

// Routes publiques
router.get('/public', PagesController.getPublic);
router.get('/public/:name', PagesController.getPublicByName);

// Routes admin
router.get('/', authMiddleware, PagesController.getAll);
router.get('/:id', authMiddleware, PagesController.getById);
router.put('/:id', authMiddleware, PagesController.update);

module.exports = router;
