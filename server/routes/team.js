const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/team');
const { authMiddleware } = require('../middleware/auth');
const { uploadTeam } = require('../middleware/upload');

// Publique
router.get('/public', ctrl.getPublic);

// Admin
router.get('/', authMiddleware, ctrl.getAll);
router.get('/:id', authMiddleware, ctrl.getById);
router.post('/', authMiddleware, uploadTeam.single('photo'), ctrl.create);
router.put('/:id', authMiddleware, uploadTeam.single('photo'), ctrl.update);
router.delete('/:id', authMiddleware, ctrl.remove);

module.exports = router;
