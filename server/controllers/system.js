/**
 * System Controller — backup, restore, stats
 */
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '..', '..', 'database', 'school.db');
const backupDir = path.resolve(__dirname, '..', '..', 'database', 'backups');

const SystemController = {
  backup(req, res) {
    try {
      fs.mkdirSync(backupDir, { recursive: true });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `school-${timestamp}.backup.db`;
      const destPath = path.join(backupDir, filename);

      if (!fs.existsSync(dbPath)) {
        return res.status(500).json({ success: false, error: 'Base de données introuvable' });
      }

      fs.copyFileSync(dbPath, destPath);

      // Lister les sauvegardes
      const files = fs.readdirSync(backupDir)
        .filter(f => f.endsWith('.backup.db'))
        .sort().reverse();

      res.json({
        success: true,
        message: `Sauvegarde créée : ${filename}`,
        filename
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  listBackups(req, res) {
    try {
      if (!fs.existsSync(backupDir)) {
        return res.json({ success: true, data: [] });
      }
      const files = fs.readdirSync(backupDir)
        .filter(f => f.endsWith('.backup.db'))
        .sort().reverse()
        .map(f => {
          const stat = fs.statSync(path.join(backupDir, f));
          return { name: f, size: (stat.size / 1024).toFixed(1) + ' KB', date: stat.mtime };
        });
      res.json({ success: true, data: files });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  restore(req, res) {
    try {
      const { filename } = req.body;
      if (!filename) return res.status(400).json({ success: false, error: 'Nom de fichier requis' });

      // Protection path-traversal : n'autoriser que les noms de fichier sans chemin
      const safeFilename = path.basename(filename);
      if (safeFilename !== filename || !safeFilename.endsWith('.backup.db')) {
        return res.status(400).json({ success: false, error: 'Nom de fichier invalide' });
      }
      const srcPath = path.join(backupDir, safeFilename);
      if (!fs.existsSync(srcPath)) {
        return res.status(404).json({ success: false, error: 'Sauvegarde introuvable' });
      }

      // Sauvegarde de sécurité
      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, dbPath + '.pre_restore.bak');
      }

      fs.copyFileSync(srcPath, dbPath);
      res.json({ success: true, message: 'Base restaurée avec succès' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

module.exports = SystemController;
