/**
 * School Website — Point d'entrée du serveur Express
 * Sert le site public ET l'API d'administration
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const { generalLimiter } = require('./middleware/rateLimiter');
const { sanitize } = require('./middleware/validate');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================
// 1. MIDDLEWARES GLOBAUX
// =============================================

// Helmet — headers de sécurité HTTP
app.use(helmet({
  contentSecurityPolicy: false, // désactivé car Tailwind CDN utilise inline styles
  crossOriginEmbedderPolicy: false
}));

// CORS — restreint aux origines connues
const ALLOWED_ORIGINS = [
  `http://localhost:${PORT}`,
  'http://127.0.0.1:' + PORT,
];
app.use(cors({
  origin: function(origin, callback) {
    // Requêtes sans origin (curl, Postman, même site) = autorisées
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    // En dev, on autorise tout (pratique)
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    callback(new Error('Origine non autorisée par CORS'));
  },
  credentials: true
}));

// Parser JSON (limite 10 MB pour les uploads base64)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookies
app.use(cookieParser());

// Sessions (utilisées pour CSRF et state temporaire)
app.use(session({
  secret: process.env.SESSION_SECRET || require('crypto').randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24h
  }
}));

// Rate limiting général (hors uploads)
app.use('/api', generalLimiter);

// Sanitization des inputs
app.use('/api', sanitize);

// Logging simple
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// =============================================
// 2. PROTECTION ADMIN — DOUBLE VERROU
//    OWASP WSTG-CONF-07 / WSTG-ATHN-08
//    ① URL obfusquée (security through obscurity)
//    ② Gate password (mot de passe de porte)
// =============================================

const ADMIN_PATH = process.env.ADMIN_PATH || 'admin';
const ADMIN_GATE_PASSWORD = process.env.ADMIN_GATE_PASSWORD || '';
const ADMIN_REDIRECT = process.env.ADMIN_REDIRECT || '/';

// Middleware : gate password avant d'accéder à l'admin
function adminGateMiddleware(req, res, next) {
  // Si ADMIN_PATH = 'admin' (dev local), pas de gate
  if (ADMIN_PATH === 'admin') return next();

  // Déjà vérifié dans la session
  if (req.session && req.session.adminGatePassed) return next();

  // Vérifier le paramètre ?gate=...
  var gateParam = req.query.gate;
  if (gateParam && gateParam === ADMIN_GATE_PASSWORD) {
    req.session.adminGatePassed = true;
    // Rediriger vers la même URL sans le paramètre
    var cleanUrl = req.originalUrl.replace(/[?&]gate=[^&]*/, '').replace(/\?$/, '');
    return res.redirect(cleanUrl || '/' + ADMIN_PATH + '/login.html');
  }

  // Afficher le formulaire de gate password
  res.status(403).send('<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta name="robots" content="noindex,nofollow"><title>Accès restreint</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;background:#111827;color:#e5e7eb;display:flex;align-items:center;justify-content:center;min-height:100vh}.gate-box{background:#1f2937;padding:2.5rem;border-radius:12px;box-shadow:0 25px 50px rgba(0,0,0,.5);width:100%;max-width:400px;text-align:center}.gate-box h1{font-size:1.5rem;margin-bottom:.5rem;color:#f9fafb}.gate-box p{color:#9ca3af;margin-bottom:1.5rem;font-size:.9rem}.gate-box input{width:100%;padding:.875rem;border-radius:8px;border:1px solid #374151;background:#111827;color:#f9fafb;font-size:1rem;margin-bottom:1rem;text-align:center;letter-spacing:.3em}.gate-box input:focus{outline:none;border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.2)}.gate-box button{width:100%;padding:.875rem;border-radius:8px;border:none;background:#6366f1;color:#fff;font-size:1rem;font-weight:600;cursor:pointer}.gate-box button:hover{background:#4f46e5}</style></head><body><div class="gate-box"><h1>🔐 Accès Restreint</h1><p>Cette zone est protégée. Entrez le mot de passe pour continuer.</p><form method="get"><input type="password" name="gate" placeholder="••••••••" autofocus autocomplete="off"><button type="submit">Accéder</button></form></div></body></html>');
}

// Bloquer l'accès direct à /admin si ADMIN_PATH a été changé
if (ADMIN_PATH !== 'admin') {
  app.use('/admin', (req, res) => {
    res.redirect(301, ADMIN_REDIRECT);
  });
}

// Servir l'admin uniquement sur le chemin obfusqué avec double verrou
app.use('/' + ADMIN_PATH,
  adminGateMiddleware,
  express.static(path.join(__dirname, '..', 'admin'), {
    maxAge: 0,
    setHeaders: function(res) {
      res.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    }
  })
);

// =============================================
// 3. FICHIERS STATIQUES
// =============================================

// Site public
app.use(express.static(path.join(__dirname, '..', 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0
}));

// Uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads'), {
  maxAge: '30d'
}));

// =============================================
// 3. ROUTES API
// =============================================

// Routes API
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'School Website API — OK', version: '1.0.0' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/pages', require('./routes/pages'));
app.use('/api/news', require('./routes/news'));
app.use('/api/events', require('./routes/events'));
app.use('/api/gallery', require('./routes/gallery'));
app.use('/api/testimonials', require('./routes/testimonials'));
app.use('/api/team', require('./routes/team'));
app.use('/api/programs', require('./routes/programs'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/system', require('./routes/system'));

// =============================================
// 4. PAGE D'ACCUEIL PAR DÉFAUT
// =============================================

// Redirection racine → index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// =============================================
// 5. GESTION DES ERREURS
// =============================================

// 404 pour les routes non trouvées
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'Route API non trouvée' });
  }
  // Pour le site public, renvoyer une 404 simple
  res.status(404).send('Page non trouvée');
});

// Erreur multer (fichier trop gros, mauvais type...)
app.use((err, req, res, next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'Fichier trop volumineux (max 5 MB)'
    });
  }
  if (err && err.message && err.message.includes('Type de fichier non autorisé')) {
    return res.status(415).json({
      success: false,
      error: err.message
    });
  }
  next(err);
});

// Erreur générale
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur :', err.message);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne du serveur'
  });
});

// =============================================
// 6. DÉMARRAGE
// =============================================

app.listen(PORT, () => {
  console.log('🏫 ========================================');
  console.log(`   School Website Server`);
  console.log(`   Site public : http://localhost:${PORT}`);
  console.log(`   Admin       : http://localhost:${PORT}/admin/login.html`);
  console.log(`   API         : http://localhost:${PORT}/api`);
  console.log(`   Mode        : ${process.env.NODE_ENV || 'development'}`);
  console.log('   ========================================');
});

module.exports = app;
