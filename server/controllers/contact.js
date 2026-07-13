/**
 * Contact Controller — traitement du formulaire de contact
 */
const { getDb } = require('../config/database');
const { validateRequired, isValidEmail } = require('../middleware/validate');

// Stocke les messages de contact dans les settings (comme des logs)
// ou peut être étendu pour envoyer des emails

const ContactController = {
  submit(req, res) {
    try {
      const validation = validateRequired(['name', 'email', 'message'], req.body);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: `Champs requis : ${validation.missing.join(', ')}`
        });
      }

      if (!isValidEmail(req.body.email)) {
        return res.status(400).json({
          success: false,
          error: 'Adresse email invalide'
        });
      }

      // Logger le message (on pourrait envoyer un email)
      const db = getDb();

      // S'assurer que la table contact_messages existe
      db.exec(`
        CREATE TABLE IF NOT EXISTS contact_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          subject TEXT,
          message TEXT NOT NULL,
          is_read INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.prepare(
        'INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)'
      ).run(req.body.name, req.body.email, req.body.phone || '', req.body.subject || '', req.body.message);

      console.log(`📬 Nouveau message de contact de ${req.body.name} (${req.body.email})`);

      res.json({
        success: true,
        message: 'Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.'
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  getAll(req, res) {
    try {
      const db = getDb();
      const messages = db.prepare(
        'SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 100'
      ).all();
      res.json({ success: true, data: messages });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  markRead(req, res) {
    try {
      const db = getDb();
      db.prepare('UPDATE contact_messages SET is_read = 1 WHERE id = ?').run(req.params.id);
      res.json({ success: true, message: 'Message marqué comme lu' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

module.exports = ContactController;
