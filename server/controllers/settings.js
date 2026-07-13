/**
 * Settings Controller
 */
const SettingsModel = require('../models/settings');
const { validateRequired, isValidUrl } = require('../middleware/validate');

const SettingsController = {
  /**
   * GET /api/settings/public — Tous les settings pour le site public
   * Pas d'authentification requise
   */
  getPublic(req, res) {
    try {
      const settings = SettingsModel.getAll();
      res.json({ success: true, data: settings });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * GET /api/settings — Tous les settings (admin)
   */
  getAll(req, res) {
    try {
      const settings = SettingsModel.getAllDetailed();
      res.json({ success: true, data: settings });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * GET /api/settings/:key — Un setting
   */
  getByKey(req, res) {
    try {
      const setting = SettingsModel.getByKey(req.params.key);
      if (!setting) {
        return res.status(404).json({ success: false, error: 'Paramètre non trouvé' });
      }
      res.json({ success: true, data: setting });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * PUT /api/settings — Met à jour plusieurs settings
   * Body: { settings: [{ key, value }, ...] }
   */
  update(req, res) {
    try {
      const { settings } = req.body;
      if (!settings || !Array.isArray(settings) || settings.length === 0) {
        return res.status(400).json({ success: false, error: 'Tableau settings requis' });
      }

      // Validation des URLs
      for (const s of settings) {
        if (s.key && (s.key.endsWith('_link') || s.key.endsWith('_url'))) {
          if (s.value && s.value.trim() !== '' && !isValidUrl(s.value)) {
            return res.status(400).json({
              success: false,
              error: `URL invalide pour ${s.key}: ${s.value}`
            });
          }
        }
      }

      SettingsModel.updateMany(settings);
      const updated = SettingsModel.getAllDetailed();
      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * PUT /api/settings/:key — Met à jour un seul setting
   */
  updateOne(req, res) {
    try {
      const { value } = req.body;
      if (value === undefined) {
        return res.status(400).json({ success: false, error: 'Valeur requise' });
      }

      SettingsModel.update(req.params.key, value);
      const setting = SettingsModel.getByKey(req.params.key);
      res.json({ success: true, data: setting });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

module.exports = SettingsController;
