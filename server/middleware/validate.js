/**
 * Middleware de validation et sanitization des inputs
 * Nettoie les strings, échappe les caractères HTML, valide les champs requis
 */

/**
 * Échappe les caractères HTML pour prévenir XSS
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  };
  return str.replace(/[&<>"']/g, char => map[char]);
}

/**
 * Nettoie récursivement un objet body
 */
function sanitizeBody(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      cleaned[key] = escapeHtml(value.trim());
    } else if (Array.isArray(value)) {
      cleaned[key] = value.map(v => typeof v === 'string' ? escapeHtml(v.trim()) : v);
    } else if (typeof value === 'object' && value !== null) {
      cleaned[key] = sanitizeBody(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Valide qu'un champ requis n'est pas vide
 */
function validateRequired(fields, body) {
  const missing = [];
  for (const field of fields) {
    if (!body[field] || (typeof body[field] === 'string' && body[field].trim() === '')) {
      missing.push(field);
    }
  }
  if (missing.length > 0) {
    return { valid: false, missing };
  }
  return { valid: true, missing: [] };
}

/**
 * Valide le format email
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Valide une URL
 */
function isValidUrl(url) {
  if (!url || url.trim() === '') return true; // optionnel
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Middleware Express : sanitization du body
 */
function sanitize(req, res, next) {
  if (req.body) {
    req.body = sanitizeBody(req.body);
  }
  next();
}

module.exports = {
  sanitize,
  escapeHtml,
  validateRequired,
  isValidEmail,
  isValidUrl
};
