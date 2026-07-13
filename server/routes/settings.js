/**
 * Settings Routes
 */
const express = require('express');
const router = express.Router();
const SettingsController = require('../controllers/settings');
const { authMiddleware } = require('../middleware/auth');
const { uploadLogo, uploadBanner, uploadTeam, uploadSingle } = require('../middleware/upload');

// Routes publiques (pas d'auth)
router.get('/public', SettingsController.getPublic);

// Routes admin (auth requise)
router.get('/', authMiddleware, SettingsController.getAll);
router.get('/:key', authMiddleware, SettingsController.getByKey);
router.put('/', authMiddleware, SettingsController.update);
router.put('/:key', authMiddleware, SettingsController.updateOne);

// Upload d'image pour les settings — routes séparées par dossier
router.post('/upload/logo', authMiddleware, uploadLogo.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'Aucun fichier' });
  res.json({ success: true, path: `/uploads/logo/${req.file.filename}` });
});

router.post('/upload/banner', authMiddleware, uploadBanner.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'Aucun fichier' });
  res.json({ success: true, path: `/uploads/banner/${req.file.filename}` });
});

router.post('/upload/team', authMiddleware, uploadTeam.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'Aucun fichier' });
  res.json({ success: true, path: `/uploads/team/${req.file.filename}` });
});

// Fallback générique
router.post('/upload', authMiddleware, uploadSingle.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'Aucun fichier' });
  const folder = req.body.folder || 'gallery';
  res.json({ success: true, path: `/uploads/${folder}/${req.file.filename}` });
});

module.exports = router;
