const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/contact');
const { authMiddleware } = require('../middleware/auth');
const { contactLimiter } = require('../middleware/rateLimiter');

// Publique (limitée anti-spam)
router.post('/', contactLimiter, ctrl.submit);

// Admin
router.get('/', authMiddleware, ctrl.getAll);
router.put('/:id/read', authMiddleware, ctrl.markRead);

module.exports = router;
