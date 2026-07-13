const path = require('path');
const Database = require('better-sqlite3');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const dbPath = path.resolve(__dirname, '..', '..', process.env.DATABASE_PATH || 'database/school.db');

// Fly.io: ensure /data directory exists
const dbDir = path.dirname(dbPath);
if (!require('fs').existsSync(dbDir)) {
  require('fs').mkdirSync(dbDir, { recursive: true });
}

let db;

function getDb() {
  if (!db) {
    db = new Database(dbPath, {
      // verbose: console.log
    });
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, closeDb };
