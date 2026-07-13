# 🔒 Rapport d'Audit de Sécurité — School Website Server

**Date :** 2026-07-13
**Périmètre :** `school-website/server/` + fichiers connexes (database/, .env, .gitignore)
**Méthodologie :** Revue statique de code, analyse de flux de données, vérification des configurations

---

## Résumé Exécutif

L'audit a révélé **2 vulnérabilités CRITICAL, 7 vulnérabilités HIGH, et 5 vulnérabilités MEDIUM**. Les problèmes les plus graves concernent le **path traversal** (permettant l'écriture de fichiers arbitraires sur le disque) et l'absence de **headers de sécurité**. Le code est bien structuré globalement, mais présente des lacunes de sécurité qui augmentent considérablement la surface d'attaque.

---

## 1. Path Traversal 🔴 CRITICAL

### 1.1 Upload générique : `folder` non validé (CVSS 8.1)

**Fichier :** `server/middleware/upload.js` — fonction `uploadSingle`
**Route :** `POST /api/settings/upload`

```javascript
const subfolder = req.body.folder || 'gallery';
const dest = path.join(uploadBase, subfolder);
```

**Problème :** Le paramètre `folder` provient directement du body de la requête et est passé à `path.join()` sans aucune validation. La sanitization (`escapeHtml`) n'échappe PAS les séparateurs de chemin (`/`, `\`, `.`). Un attaquant authentifié (admin) peut écrire un fichier n'importe où sur le disque.

**Exploitation :**
```
POST /api/settings/upload
Body (multipart): folder=../../../windows/system32&image=<fichier>
```

Le fichier sera écrit dans `public/uploads/../../../windows/system32/` = `school-website/../windows/system32/`.

**Correction recommandée :**
```javascript
// Valider que le dossier est dans la liste blanche
const ALLOWED_FOLDERS = ['logo', 'banner', 'gallery', 'news', 'team', 'testimonials'];
if (!ALLOWED_FOLDERS.includes(subfolder)) {
  return cb(new Error('Dossier non autorisé'));
}
// OU : normaliser et vérifier que le chemin reste dans uploadBase
const dest = path.resolve(uploadBase, subfolder);
if (!dest.startsWith(path.resolve(uploadBase))) {
  return cb(new Error('Path traversal détecté'));
}
```

### 1.2 Restauration : `filename` non validé (CVSS 7.7)

**Fichier :** `server/controllers/system.js` — fonction `restore()`
**Route :** `POST /api/system/restore`

```javascript
const { filename } = req.body;
const srcPath = path.join(backupDir, filename);
```

**Problème :** `filename` n'est pas validé. `path.join` normalise les `../`. Un attaquant avec `filename=../../../etc/somefile` peut faire pointer `srcPath` en dehors du dossier `backups/` et potentiellement restaurer un fichier arbitraire comme base de données, ou écraser la DB avec un fichier corrompu.

**Correction recommandée :**
```javascript
// Rejeter tout chemin contenant des séparateurs
if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
  return res.status(400).json({ success: false, error: 'Nom de fichier invalide' });
}
// ET vérifier que le chemin résolu reste dans backupDir
const srcPath = path.resolve(backupDir, filename);
if (!srcPath.startsWith(path.resolve(backupDir))) {
  return res.status(400).json({ success: false, error: 'Chemin non autorisé' });
}
```

---

## 2. Secrets et Mots de Passe en Clair 🔴 CRITICAL / HIGH

### 2.1 Secrets prédictibles par défaut

**Fichiers :** `.env`, `server/middleware/auth.js`, `server/app.js`

| Secret | Valeur | Risque |
|--------|--------|--------|
| `SESSION_SECRET` | `change-this-to-a-random-secret-string-in-production` | Forgery de session |
| `JWT_SECRET` | `change-this-to-another-random-secret-for-jwt` | Forgery de token JWT |
| Fallback `JWT_SECRET` | `fallback-jwt-secret-change-me` (hardcodé) | Forgery si .env absent |
| Fallback `SESSION_SECRET` | `fallback-session-secret-change-me` (hardcodé) | Forgery si .env absent |

**Problème :** Les secrets sont faibles ET en clair dans le dépôt. Si `.gitignore` échoue ou si `.env` est exposé (erreur de config serveur), un attaquant peut forger des tokens JWT valides et usurper l'identité de l'admin.

**Correction recommandée :**
- Générer des secrets aléatoires forts : `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- En production, injecter via variables d'environnement système, pas via `.env`
- Supprimer les fallbacks hardcodés (forcer le crash si absent)

### 2.2 Credentials admin par défaut en clair

**Fichier :** `.env`
```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin@2024
```

Le mot de passe admin est en clair dans `.env`. Si ce fichier fuit (mauvaise config serveur, backup exposé, commit accidentel), l'attaquant obtient un accès admin complet.

**Correction recommandée :**
- Ne pas stocker le mot de passe dans `.env` après l'init
- Le script `init.js` devrait demander le mot de passe interactivement
- Utiliser un gestionnaire de secrets (vault, AWS Secrets Manager, etc.) en production

---

## 3. Headers de Sécurité Manquants 🔴 HIGH

**Fichier :** `server/app.js`

Aucun middleware de sécurité HTTP n'est configuré. Le module `helmet` n'est pas utilisé. Headers manquants :

| Header | Impact |
|--------|--------|
| `Content-Security-Policy` | XSS, data injection, clickjacking |
| `Strict-Transport-Security` (HSTS) | Downgrade attack, MITM |
| `X-Content-Type-Options: nosniff` | MIME sniffing attack |
| `X-Frame-Options: DENY` | Clickjacking |
| `Referrer-Policy` | Fuite d'URL dans les référents |
| `Permissions-Policy` | Accès aux API navigateur |

**Correction recommandée :**
```javascript
const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"]
    }
  }
}));
app.use(helmet.hsts({ maxAge: 15552000, includeSubDomains: true }));
```

---

## 4. CORS Trop Permissif 🔴 HIGH

**Fichier :** `server/app.js`

```javascript
app.use(cors({
  origin: true,       // ⚠️ Reflète TOUTES les origines
  credentials: true   // ⚠️ Avec credentials, n'importe quel site peut
                      //    faire des requêtes authentifiées
}));
```

**Problème :** `origin: true` signifie que le serveur accepte n'importe quelle origine (Access-Control-Allow-Origin reflète le header Origin de la requête). Combiné avec `credentials: true`, cela permet à n'importe quel site web malveillant de faire des requêtes authentifiées vers l'API (avec cookies JWT). C'est une porte ouverte aux attaques CSRF cross-origin.

**Correction recommandée :**
```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',  // dev frontend
  'https://votre-domaine.com'  // production
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true
}));
```

---

## 5. Absence de Protection CSRF 🔴 HIGH

**Fichiers :** `server/app.js`, `server/middleware/auth.js`

L'authentification utilise un cookie `httpOnly` contenant le JWT. Toute requête vers une route admin depuis n'importe quelle page web (à cause du CORS `origin: true`) inclura automatiquement ce cookie. Il n'y a aucun token CSRF ni header custom (comme `X-Requested-With`) pour vérifier que la requête provient bien de l'interface d'administration.

**Correction recommandée :**
- Implémenter un token CSRF (ex: `csurf` ou génération manuelle)
- OU : migrer l'auth vers `Authorization: Bearer <token>` uniquement (pas de cookie), car les headers Authorization ne sont pas envoyés automatiquement par le navigateur
- OU : utiliser le pattern `SameSite: strict` + vérifier le header `Origin`/`Referer`

---

## 6. Rate Limiting Insuffisant sur les Routes Sensibles 🟡 MEDIUM

**Fichier :** `server/middleware/rateLimiter.js`

| Route | Limiteur | Efficacité |
|-------|----------|------------|
| `POST /api/auth/login` | 10 req / 15 min | ✅ Correct |
| `POST /api/contact` | Général (500/15min) | ⚠️ Faible |
| `PUT /api/auth/change-password` | Général (500/15min) | ⚠️ Faible |
| `POST /api/settings/upload` | Général (500/15min) | ⚠️ Faible |

**Problèmes :**
- Le formulaire de contact public peut être spammé 500 fois en 15 minutes
- Aucun rate limiting spécifique sur le changement de mot de passe
- Le rate limiter utilise le store mémoire par défaut (partagé entre instances si scaling)
- Pas de rate limiting au niveau IP pour les erreurs 401 répétées

**Correction recommandée :**
```javascript
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,  // 5 messages de contact par 15 min
  message: { success: false, error: 'Trop de messages. Réessayez plus tard.' }
});

const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,  // 3 changements par heure
  message: { success: false, error: 'Trop de tentatives.' }
});
```

---

## 7. XSS — Sanitization Partielle 🟡 MEDIUM

### 7.1 Données multipart sanitizées ✅

**Fichier :** `server/middleware/validate.js`

Le middleware `sanitize` est appliqué à `app.use('/api', sanitize)`. Il parcourt récursivement `req.body` et échappe `&`, `<`, `>`, `"`, `'`. Les données multipart (upload de fichiers avec champs texte) passent par ce middleware, donc elles sont effectivement sanitizées avant stockage en base.

**Verdict :** Les données entrantes via `req.body` sont correctement échappées pour le contexte HTML. ✅

### 7.2 Query params et route params non sanitizés ⚠️

**Fichiers :** `server/controllers/*.js`

Le middleware `sanitize` ne traite que `req.body`. Les `req.query` (ex: `?album=<script>`) et `req.params` ne sont pas sanitizés. Cependant, ces valeurs sont utilisées uniquement dans des requêtes SQL paramétrées (jamais dans du HTML directement côté serveur). Le risque dépend entièrement du frontend.

**Verdict :** Risque faible côté serveur, mais dépend du frontend. ⚠️

### 7.3 Double-encodage potentiel

Si le frontend applique aussi un échappement HTML (React JSX, Vue `{{ }}`), les données déjà échappées (`&lt;script&gt;`) seront ré-échappées (`&amp;lt;script&amp;gt;`), causant un affichage incorrect. Ce n'est pas une faille de sécurité mais un problème d'intégrité des données.

---

## 8. Injection SQL 🟢 AUCUNE (Sûr)

**Verdict :** Toutes les requêtes utilisent des requêtes paramétrées (`?` placeholders) via `better-sqlite3`. Aucune concaténation de chaînes avec des inputs utilisateur dans les clauses SQL.

Les constructions dynamiques de colonnes (`fields.push('title = ?')`) utilisent des noms de champs hardcodés, pas des inputs utilisateur. ✅

Les `parseInt()` sur `req.query.limit` peuvent produire `NaN` qui causera une erreur better-sqlite3, mais pas d'injection.

---

## 9. Validation des Inputs 🟡 MEDIUM

### 9.1 Absence de limites de longueur

**Fichiers :** Tous les controllers et models

Aucun champ n'a de limite de longueur. Un attaquant peut envoyer un titre de 10 Mo (dans la limite de `10mb` du body parser) qui sera stocké en base. La base SQLite peut mal le gérer ou le frontend peut casser.

**Correction recommandée :**
```javascript
const MAX_FIELD_LENGTHS = {
  title: 200,
  name: 100,
  content: 50000,
  email: 254,
  message: 5000,
  // etc.
};

function validateLength(body, limits) {
  for (const [field, max] of Object.entries(limits)) {
    if (body[field] && typeof body[field] === 'string' && body[field].length > max) {
      return { valid: false, error: `${field} trop long (max ${max} caractères)` };
    }
  }
  return { valid: true };
}
```

### 9.2 Validation des IDs insuffisante

Dans les controllers, `req.params.id` est passé à `parseInt()` mais pas systématiquement validé :

- `events.js` : ✅ `parseInt` + `isNaN` check
- `news.js` : ✅ `parseInt` + `isNaN` check
- `gallery.js` : ✅ `parseInt` + `isNaN` check
- `pages.js` : ⚠️ `req.params.id` utilisé directement dans `PagesModel.getById(req.params.id)` via paramètre SQL (safe mais pas idéal)
- `settings.js` : ⚠️ `req.params.key` utilisé sans aucune validation

### 9.3 Validation de type de fichier incomplète

**Fichier :** `server/middleware/upload.js`

```javascript
if (ALLOWED_TYPES.includes(file.mimetype)) { ... }
```

La validation repose uniquement sur le MIME type fourni par le client, qui est trivial à falsifier. Un attaquant peut uploader un fichier `.php` ou `.exe` avec un Content-Type `image/jpeg` falsifié.

**Correction recommandée :**
- Ajouter une validation d'extension (liste blanche)
- Utiliser `file-type` ou `file-signature` pour vérifier les magic bytes
- Servir les uploads avec le bon Content-Type pour éviter l'exécution

---

## 10. Exposition de Fichiers Sensibles 🟡 MEDIUM

### 10.1 Base de données (.db)

**Fichier :** `database/school.db`

Le fichier SQLite est hors du dossier `public/` servi par Express, donc non accessible via le serveur web. ✅

Cependant, les fichiers WAL (`school.db-wal`, `school.db-shm`) contiennent aussi des données. Si le serveur est mal configuré (ex: reverse proxy qui expose tout le dossier), ces fichiers pourraient être accessibles.

### 10.2 Fichier .env

Le `.env` est exclu via `.gitignore` et hors de `public/`. ✅

**Risque résiduel :** Si le serveur Express est configuré pour servir tout le répertoire racine (changement de `express.static`), `.env` deviendrait accessible.

### 10.3 Sauvegardes de base de données

Les backups sont dans `database/backups/`, hors de `public/`. ✅ Mais le point d'API `/api/system/backups` liste tous les backups (requiert auth).

---

## 11. Authentification et Sessions 🔵 LOW

### 11.1 Cookie JWT

**Fichier :** `server/middleware/auth.js`, `server/controllers/auth.js`

```javascript
res.cookie('admin_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000
});
```

- `httpOnly: true` ✅
- `secure: conditionnel` ⚠️ — Devrait être forcé à `true` en production
- `sameSite: 'lax'` ✅ (bon compromis)
- Le token JWT n'a pas de `jti` (JWT ID) pour invalidation côté serveur ; un token volé reste valide 24h

### 11.2 Session non utilisée

Le middleware `express-session` est configuré mais n'est utilisé nulle part dans l'application. Il consomme des ressources pour rien. Vraisemblablement prévu pour un futur système CSRF.

---

## 12. Gestion des Erreurs 🔵 LOW

**Fichier :** `server/app.js`

```javascript
error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne du serveur'
```

En développement, les messages d'erreur complets sont exposés, ce qui peut fuiter des chemins de fichiers ou de la logique interne. Ce comportement est normal en dev mais doit être strictement désactivé en production.

---

## 13. Stockage du Rate Limiter 🔵 INFO

**Fichier :** `server/middleware/rateLimiter.js`

`express-rate-limit` utilise un store mémoire par défaut. Si l'application est déployée avec plusieurs instances (cluster, load balancer), chaque instance aura son propre compteur, rendant le rate limiting inefficace. Pour la production, utiliser `rate-limit-redis` ou `rate-limit-memcached`.

---

## Synthèse des Vulnérabilités

| # | Catégorie | Sévérité | Fichier(s) | État |
|---|-----------|----------|------------|------|
| 1 | Path Traversal — upload `folder` | 🔴 CRITICAL | `middleware/upload.js` | À corriger |
| 2 | Path Traversal — restore `filename` | 🔴 CRITICAL | `controllers/system.js` | À corriger |
| 3 | Secrets faibles / hardcodés | 🔴 HIGH | `.env`, `app.js`, `auth.js` | À corriger |
| 4 | Credentials admin en clair | 🔴 HIGH | `.env`, `database/init.js` | À corriger |
| 5 | Headers sécurité manquants | 🔴 HIGH | `app.js` | À corriger |
| 6 | CORS `origin: true` | 🔴 HIGH | `app.js` | À corriger |
| 7 | Absence CSRF | 🔴 HIGH | `app.js`, `auth.js` | À corriger |
| 8 | Rate limiting insuffisant | 🟡 MEDIUM | `rateLimiter.js`, routes | À améliorer |
| 9 | Pas de limites longueur input | 🟡 MEDIUM | Tous les controllers | À améliorer |
| 10 | Validation fichier MIME-only | 🟡 MEDIUM | `middleware/upload.js` | À améliorer |
| 11 | Query params non sanitizés | 🟡 MEDIUM | `middleware/validate.js` | À surveiller |
| 12 | Pas de validation ID/type | 🟡 MEDIUM | Controllers | À améliorer |
| 13 | Cookie secure conditionnel | 🔵 LOW | `auth.js` | À améliorer |
| 14 | Tokens JWT non révocables | 🔵 LOW | `auth.js` | À améliorer |
| 15 | Rate limiter mémoire | 🔵 INFO | `rateLimiter.js` | Note prod |

## Plan d'Action Prioritaire

### Immédiat (J-0)
1. **Corriger les path traversals** : ajouter une validation/normalisation dans `upload.js` (uploadSingle) et `system.js` (restore)
2. **Restreindre CORS** : remplacer `origin: true` par une liste blanche explicite
3. **Changer les secrets** : générer des secrets forts, supprimer les fallbacks hardcodés dans `auth.js` et `app.js`

### Court terme (J-7)
4. **Installer Helmet** : activer CSP, HSTS, X-Content-Type-Options, X-Frame-Options
5. **Ajouter CSRF** : implémenter un token CSRF ou migrer vers auth header-only
6. **Ajouter rate limiting** : sur `/api/contact`, `/api/auth/change-password`
7. **Changer le mot de passe admin** : après déploiement

### Moyen terme (J-30)
8. **Ajouter validation de longueur** : limiter tous les champs texte
9. **Améliorer la validation de fichiers** : vérifier les magic bytes en plus du MIME
10. **Ajouter JWT jti** : permettre la révocation de tokens
11. **Migrer le rate limiter** vers Redis/Memcached si scaling prévu

---

*Rapport généré par audit statique de code — 18 fichiers analysés.*
