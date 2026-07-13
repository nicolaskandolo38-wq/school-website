/**
 * Middleware d'upload de fichiers (images)
 * Utilise multer avec filtre de type et limite de taille
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Configuration des dossiers de destination
const uploadBase = path.join(__dirname, '..', '..', 'public', 'uploads');

// Assurer l'existence des dossiers
const folders = ['logo', 'banner', 'gallery', 'news', 'team', 'testimonials'];
folders.forEach(f => {
  fs.mkdirSync(path.join(uploadBase, f), { recursive: true });
});

// Types MIME acceptés
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Crée un storage multer configuré pour un sous-dossier spécifique
 */
function createStorage(subfolder) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dest = path.join(uploadBase, subfolder);
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const name = `${uuidv4()}${ext}`;
      cb(null, name);
    }
  });
}

/**
 * Filtre de type de fichier
 */
function fileFilter(req, file, cb) {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Type de fichier non autorisé : ${file.mimetype}. Types acceptés : JPG, PNG, GIF, WEBP`), false);
  }
}

/**
 * Factory : crée un middleware multer pour un sous-dossier donné
 * @param {string} subfolder - logo, banner, gallery, news, team, testimonials
 * @returns multer instance
 */
function uploadFor(subfolder) {
  return multer({
    storage: createStorage(subfolder),
    fileFilter,
    limits: { fileSize: MAX_SIZE }
  });
}

// Instances préconfigurées
const uploadLogo = uploadFor('logo');
const uploadBanner = uploadFor('banner');
const uploadGallery = uploadFor('gallery');
const uploadNews = uploadFor('news');
const uploadTeam = uploadFor('team');
const uploadTestimonials = uploadFor('testimonials');

// Instance générique (single upload, n'importe quel sous-dossier via req.body)
const uploadSingle = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const subfolder = req.body.folder || 'gallery';
      // Protection path-traversal : whitelist uniquement
      const ALLOWED_FOLDERS = ['logo','banner','gallery','news','team','testimonials'];
      if (!ALLOWED_FOLDERS.includes(subfolder)) {
        return cb(new Error('Dossier non autorisé'));
      }
      const dest = path.join(uploadBase, subfolder);
      fs.mkdirSync(dest, { recursive: true });
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uuidv4()}${ext}`);
    }
  }),
  fileFilter,
  limits: { fileSize: MAX_SIZE }
});

module.exports = {
  uploadLogo,
  uploadBanner,
  uploadGallery,
  uploadNews,
  uploadTeam,
  uploadTestimonials,
  uploadSingle
};
