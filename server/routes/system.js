const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/system');
const { authMiddleware } = require('../middleware/auth');

router.post('/backup', authMiddleware, ctrl.backup);
router.get('/backups', authMiddleware, ctrl.listBackups);
router.post('/restore', authMiddleware, ctrl.restore);

module.exports = router;
