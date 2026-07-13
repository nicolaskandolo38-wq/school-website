-- ============================================
-- School Website — Schéma de base de données
-- SQLite
-- ============================================

-- Table Admins (authentification)
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table Login Logs (sécurité)
CREATE TABLE IF NOT EXISTS login_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  ip_address TEXT,
  success INTEGER NOT NULL DEFAULT 0,
  attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table Settings (paramètres généraux du site)
-- Clés utilisées : school_name, school_slogan, logo_path, banner_path,
-- phone_primary, phone_secondary, email_contact, email_admin,
-- whatsapp_link, facebook_link, instagram_link, twitter_link, youtube_link,
-- address, opening_hours, primary_color, secondary_color,
-- external_management_url, site_title, meta_description,
-- about_history, about_mission, about_vision, about_values,
-- director_name, director_title, director_message, director_photo,
-- programs_intro, methodology_text
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table Pages (contenu éditable des pages)
CREATE TABLE IF NOT EXISTS pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_name TEXT NOT NULL UNIQUE,   -- 'home', 'about', 'programs', 'gallery', 'news', 'contact'
  title TEXT,
  meta_description TEXT,
  sections TEXT,                     -- JSON : sections configurables
  is_active INTEGER NOT NULL DEFAULT 1,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table News (actualités / blog)
CREATE TABLE IF NOT EXISTS news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  content TEXT,
  image_path TEXT,
  is_published INTEGER NOT NULL DEFAULT 0,
  publish_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table Gallery (galerie photos)
CREATE TABLE IF NOT EXISTS gallery (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  album_name TEXT NOT NULL,
  image_path TEXT NOT NULL,
  description TEXT,
  upload_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table Events (événements / calendrier)
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATETIME NOT NULL,
  event_end_date DATETIME,
  location TEXT,
  image_path TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table Testimonials (témoignages)
CREATE TABLE IF NOT EXISTS testimonials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT,
  content TEXT NOT NULL,
  image_path TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table Team (équipe pédagogique)
CREATE TABLE IF NOT EXISTS team (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  photo_path TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table Programs (formations / cycles)
CREATE TABLE IF NOT EXISTS programs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  details TEXT,            -- JSON : détails structurés du programme
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table Site Visits (statistiques simples)
CREATE TABLE IF NOT EXISTS site_visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page TEXT,
  visitor_ip TEXT,
  visited_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_news_publish ON news(publish_date);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_gallery_album ON gallery(album_name);
CREATE INDEX IF NOT EXISTS idx_visits_date ON site_visits(visited_at);
CREATE INDEX IF NOT EXISTS idx_login_logs_date ON login_logs(attempted_at);
