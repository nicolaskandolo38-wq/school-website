/**
 * Script de restauration de la base de données
 * Restaure la dernière sauvegarde (ou une sauvegarde spécifique)
 * Usage : node database/restore.js [backup-filename]
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const dbPath = path.resolve(__dirname, '..', process.env.DATABASE_PATH || 'database/school.db');
const backupDir = path.join(__dirname, 'backups');

if (!fs.existsSync(backupDir)) {
  console.error('❌ Aucun dossier de sauvegardes trouvé.');
  process.exit(1);
}

const backups = fs.readdirSync(backupDir)
  .filter(f => f.endsWith('.backup.db'))
  .sort()
  .reverse();

if (backups.length === 0) {
  console.error('❌ Aucune sauvegarde trouvée dans', backupDir);
  process.exit(1);
}

let backupFile = process.argv[2];
if (!backupFile) {
  backupFile = backups[0];
  console.log(`ℹ️  Aucun fichier spécifié, utilisation de la dernière sauvegarde : ${backupFile}`);
}

const backupPath = path.join(backupDir, backupFile);

if (!fs.existsSync(backupPath)) {
  console.error(`❌ Fichier introuvable : ${backupPath}`);
  console.log('\nSauvegardes disponibles :');
  backups.forEach(b => console.log(`  - ${b}`));
  process.exit(1);
}

// Sauvegarde de sécurité avant restauration
if (fs.existsSync(dbPath)) {
  const safetyPath = dbPath + '.pre_restore.bak';
  fs.copyFileSync(dbPath, safetyPath);
  console.log(`ℹ️  Sauvegarde de sécurité : ${safetyPath}`);
}

fs.copyFileSync(backupPath, dbPath);
console.log(`✅ Base restaurée depuis : ${backupFile}`);
