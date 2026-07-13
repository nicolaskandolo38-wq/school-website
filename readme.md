# 🏫 School Website — Site Vitrine Scolaire + Panneau Admin

Site web complet pour établissement scolaire avec panneau d'administration sécurisé.

## Stack technique

- **Backend** : Node.js + Express
- **Base de données** : SQLite (via `better-sqlite3`)
- **Frontend public** : HTML5 + Tailwind CSS (CDN) + Vanilla JS
- **Admin** : HTML5 + Tailwind CSS (CDN) + Vanilla JS
- **Sécurité** : bcrypt, JWT, rate limiting, CSRF, input sanitization

## Démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Initialiser la base de données (crée les tables + admin par défaut)
npm run db:init

# 3. Lancer le serveur (mode dev)
npm run dev

# 4. Ouvrir dans le navigateur
# Site public : http://localhost:3000
# Admin : http://localhost:3000/admin/login.html
```

## Identifiants admin par défaut

- **Username** : `admin`
- **Mot de passe** : `Admin@2024`

> ⚠️ Changez immédiatement le mot de passe après la première connexion !

## Structure du projet

```
school-website/
├── public/              # Site vitrine accessible publiquement
│   ├── css/style.css    # Styles principaux
│   ├── js/main.js       # JavaScript frontend public
│   ├── uploads/         # Images uploadées par l'admin
│   └── *.html           # Pages publiques
├── admin/               # Panneau d'administration
│   └── *.html           # Pages admin
├── server/              # Backend Node.js/Express
│   ├── app.js           # Point d'entrée
│   ├── routes/          # Routes API
│   ├── controllers/     # Logique métier
│   ├── models/          # Accès base de données
│   ├── config/          # Configuration
│   └── middleware/      # Middlewares (auth, upload, etc.)
├── database/            # Scripts SQL et DB
│   ├── init.js          # Initialisation DB
│   ├── backup.js        # Sauvegarde
│   └── restore.js       # Restauration
├── .env                 # Variables d'environnement
└── package.json         # Dépendances et scripts
```

## Commandes disponibles

| Commande | Description |
|----------|-------------|
| `npm start` | Lance le serveur en mode production |
| `npm run dev` | Lance le serveur avec rechargement automatique |
| `npm run db:init` | Initialise/crée la base de données |
| `npm run db:backup` | Sauvegarde la base de données |
| `npm run db:restore` | Restaure la dernière sauvegarde |

## Sécurité

- Mots de passe hachés avec bcrypt (12 rounds)
- Protection brute-force sur le login (rate limiting)
- Tokens JWT pour les sessions admin
- Protection CSRF sur les formulaires
- Validation et sanitization des inputs
- Uploads restreints aux types d'images

## Configuration

Toutes les variables de configuration sont dans le fichier `.env` :

| Variable | Description |
|----------|-------------|
| `PORT` | Port du serveur (défaut: 3000) |
| `SESSION_SECRET` | Secret pour les sessions |
| `JWT_SECRET` | Secret pour les tokens JWT |
| `ADMIN_USERNAME` | Nom d'utilisateur admin initial |
| `ADMIN_PASSWORD` | Mot de passe admin initial |
| `UPLOAD_DIR` | Dossier des fichiers uploadés |
| `DATABASE_PATH` | Chemin de la base SQLite |
| `EXTERNAL_MANAGEMENT_URL` | URL système de gestion externe (optionnel) |
