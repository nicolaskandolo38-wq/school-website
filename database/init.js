/**
 * Script d'initialisation de la base de données
 * Lit le schéma SQL, crée les tables, insère les données par défaut
 * Usage : node database/init.js
 */

const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { getDb, closeDb } = require('../server/config/database');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const db = getDb();
const schemaPath = path.join(__dirname, 'schema.sql');

console.log('🏫 Initialisation de la base de données...\n');

// 1. Exécuter le schéma
try {
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
  console.log('✅ Tables créées avec succès');
} catch (err) {
  console.error('❌ Erreur schéma :', err.message);
  closeDb();
  process.exit(1);
}

// 2. Créer l'admin par défaut
const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@2024';

try {
  const existing = db.prepare('SELECT id FROM admins WHERE username = ?').get(adminUsername);
  if (!existing) {
    const hash = bcrypt.hashSync(adminPassword, 12);
    db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run(adminUsername, hash);
    console.log(`✅ Admin créé : ${adminUsername}`);
  } else {
    console.log(`ℹ️  Admin "${adminUsername}" existe déjà, ignoré`);
  }
} catch (err) {
  console.error('❌ Erreur création admin :', err.message);
}

// 3. Insérer les settings par défaut
const defaultSettings = [
  { key: 'school_name', value: 'Mon École' },
  { key: 'school_slogan', value: 'Excellence et Épanouissement' },
  { key: 'logo_path', value: '' },
  { key: 'banner_path', value: '' },
  { key: 'phone_primary', value: '+243 000 000 000' },
  { key: 'phone_secondary', value: '' },
  { key: 'email_contact', value: 'contact@monecole.edu' },
  { key: 'email_admin', value: 'admin@monecole.edu' },
  { key: 'whatsapp_link', value: 'https://wa.me/243000000000' },
  { key: 'facebook_link', value: 'https://facebook.com/monecole' },
  { key: 'instagram_link', value: 'https://instagram.com/monecole' },
  { key: 'twitter_link', value: '' },
  { key: 'youtube_link', value: '' },
  { key: 'address', value: '123 Avenue de l\'Éducation, Kinshasa' },
  { key: 'opening_hours', value: 'Lun-Ven : 7h30 - 16h30 | Sam : 8h00 - 12h00' },
  { key: 'primary_color', value: '#1a56db' },
  { key: 'secondary_color', value: '#047857' },
  { key: 'external_management_url', value: '' },
  { key: 'site_title', value: 'Mon École — Site Officiel' },
  { key: 'meta_description', value: 'Site officiel de Mon École — une éducation d\'excellence pour tous.' },
  { key: 'about_history', value: 'Fondée en 1990, notre école a formé des générations d\'élèves...' },
  { key: 'about_mission', value: 'Offrir une éducation de qualité qui développe le potentiel de chaque élève.' },
  { key: 'about_vision', value: 'Devenir un établissement de référence en Afrique centrale.' },
  { key: 'about_values', value: 'Excellence, Respect, Intégrité, Innovation' },
  { key: 'director_name', value: 'Dr. Jean Dupont' },
  { key: 'director_title', value: 'Directeur Général' },
  { key: 'director_message', value: 'Chers parents, chers élèves, bienvenue dans notre établissement...' },
  { key: 'director_photo', value: '' },
  { key: 'programs_intro', value: 'Découvrez nos différents cycles de formation, de la maternelle au lycée.' },
  { key: 'methodology_text', value: 'Notre approche pédagogique combine méthodes traditionnelles et innovantes...' },
];

const insertSetting = db.prepare(
  'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
);

const insertMany = db.transaction((settings) => {
  for (const s of settings) {
    insertSetting.run(s.key, s.value);
  }
});

insertMany(defaultSettings);
console.log(`✅ ${defaultSettings.length} paramètres par défaut insérés`);

// 4. Insérer les pages par défaut
const defaultPages = [
  {
    page_name: 'home',
    title: 'Accueil',
    meta_description: 'Bienvenue sur le site de Mon École',
    sections: JSON.stringify({
      hero: { enabled: true },
      features: { enabled: true, title: 'Pourquoi nous choisir ?' },
      news: { enabled: true, title: 'Actualités récentes', count: 4 },
      testimonials: { enabled: true, title: 'Témoignages' },
      stats: { enabled: true, title: 'En chiffres' },
      cta: { enabled: true, title: 'Prêt à nous rejoindre ?' }
    })
  },
  {
    page_name: 'about',
    title: 'À propos',
    meta_description: 'Découvrez notre histoire, notre mission et notre équipe',
    sections: JSON.stringify({
      history: { enabled: true },
      mission: { enabled: true },
      director: { enabled: true },
      team: { enabled: true },
      infrastructure: { enabled: true }
    })
  },
  {
    page_name: 'programs',
    title: 'Formations',
    meta_description: 'Nos programmes et cycles de formation',
    sections: JSON.stringify({
      intro: { enabled: true },
      cycles: { enabled: true },
      methodology: { enabled: true },
      extracurricular: { enabled: true }
    })
  },
  {
    page_name: 'gallery',
    title: 'Galerie',
    meta_description: 'Nos photos et vidéos',
    sections: JSON.stringify({
      photos: { enabled: true },
      videos: { enabled: true }
    })
  },
  {
    page_name: 'news',
    title: 'Actualités',
    meta_description: 'Actualités et événements de l\'école',
    sections: JSON.stringify({
      articles: { enabled: true },
      events: { enabled: true }
    })
  },
  {
    page_name: 'contact',
    title: 'Contact',
    meta_description: 'Contactez-nous',
    sections: JSON.stringify({
      form: { enabled: true },
      map: { enabled: true },
      info: { enabled: true }
    })
  }
];

const insertPage = db.prepare(
  'INSERT OR IGNORE INTO pages (page_name, title, meta_description, sections) VALUES (?, ?, ?, ?)'
);

const insertPages = db.transaction((pages) => {
  for (const p of pages) {
    insertPage.run(p.page_name, p.title, p.meta_description, p.sections);
  }
});

insertPages(defaultPages);
console.log(`✅ ${defaultPages.length} pages par défaut créées`);

// 5. Insérer quelques programmes par défaut
const defaultPrograms = [
  { name: 'Maternelle', slug: 'maternelle', description: 'Cycle maternel (3-5 ans). Éveil, socialisation et premiers apprentissages.', details: JSON.stringify({ age: '3-5 ans', duration: '3 ans', sections: ['Petite Section', 'Moyenne Section', 'Grande Section'] }), sort_order: 1 },
  { name: 'Primaire', slug: 'primaire', description: 'Cycle primaire (6-11 ans). Fondamentaux et développement des compétences de base.', details: JSON.stringify({ age: '6-11 ans', duration: '6 ans', sections: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'] }), sort_order: 2 },
  { name: 'Collège', slug: 'college', description: 'Cycle collège (12-15 ans). Approfondissement et préparation au lycée.', details: JSON.stringify({ age: '12-15 ans', duration: '4 ans', sections: ['6ème', '5ème', '4ème', '3ème'] }), sort_order: 3 },
  { name: 'Lycée', slug: 'lycee', description: 'Cycle lycée (16-18 ans). Préparation aux examens d\'État et à l\'enseignement supérieur.', details: JSON.stringify({ age: '16-18 ans', duration: '3 ans', sections: ['2nde', '1ère', 'Terminale'] }), sort_order: 4 },
];

const insertProgram = db.prepare(
  'INSERT OR IGNORE INTO programs (name, slug, description, details, sort_order) VALUES (?, ?, ?, ?, ?)'
);

const insertPrograms = db.transaction((progs) => {
  for (const p of progs) {
    insertProgram.run(p.name, p.slug, p.description, p.details, p.sort_order);
  }
});

insertPrograms(defaultPrograms);
console.log(`✅ ${defaultPrograms.length} programmes par défaut créés`);

closeDb();
console.log('\n🎉 Base de données initialisée avec succès !');
console.log(`📁 Fichier : ${path.resolve(__dirname, 'school.db')}`);
