/**
 * Script de sauvegarde de la base de données
 * Copie le fichier SQLite avec un timestamp
 * Usage : node database/backup.js
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const dbPath = path.resolve(__dirname, '..', process.env.DATABASE_PATH || 'database/school.db');

if (!fs.existsSync(dbPath)) {
  console.error('❌ Base de données introuvable. Lancez d\'abord npm run db:init');
  process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.join(__dirname, 'backups');
const backupPath = path.join(backupDir, `school-${timestamp}.backup.db`);

fs.mkdirSync(backupDir, { recursive: true });
fs.copyFileSync(dbPath, backupPath);

console.log(`✅ Sauvegarde créée : ${backupPath}`);

// Lister les sauvegardes existantes
const backups = fs.readdirSync(backupDir)
  .filter(f => f.endsWith('.backup.db'))
  .sort()
  .reverse();

console.log(`\n📁 Sauvegardes disponibles (${backups.length}) :`);
backups.forEach((b, i) => {
  const stat = fs.statSync(path.join(backupDir, b));
  const size = (stat.size / 1024).toFixed(1);
  console.log(`  ${i + 1}. ${b} (${size} KB)`);
});
