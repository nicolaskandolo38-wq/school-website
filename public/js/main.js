/**
 * School Website — JavaScript commun (layout partagé)
 * Navigation mobile, chargement des settings, header/footer dynamiques
 */

const API_BASE = '/api';

// ============================================
// 1. CHARGEMENT DES SETTINGS (HEADER + FOOTER)
// ============================================

async function loadSettings() {
  try {
    const res = await fetch(`${API_BASE}/settings/public`);
    const json = await res.json();
    if (json.success) {
      window.siteSettings = json.data;
      applyColors(json.data);
      buildHeader(json.data);
      buildFooter(json.data);
    }
  } catch (err) {
    console.error('Erreur chargement settings:', err);
  }
}

// ============================================
// 2. CONSTRUCTION DU HEADER
// ============================================

function buildHeader(settings) {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const schoolName = settings.school_name || 'Mon École';
  const slogan = settings.school_slogan || '';
  const logoPath = settings.logo_path || '';
  const currentPage = header.dataset.currentPage || '';
  const mgmtUrl = settings.external_management_url || '';

  const pages = [
    { name: 'home', label: 'Accueil', href: '/' },
    { name: 'about', label: 'À propos', href: '/about.html' },
    { name: 'programs', label: 'Formations', href: '/programs.html' },
    { name: 'gallery', label: 'Galerie', href: '/gallery.html' },
    { name: 'news', label: 'Actualités', href: '/news.html' },
    { name: 'contact', label: 'Contact', href: '/contact.html' },
  ];

  header.innerHTML = `
    <div class="header-inner">
      <a href="/" class="header-logo">
        ${logoPath
          ? `<img src="${logoPath}" alt="${schoolName}" />`
          : `<span style="font-size:2rem;">🏫</span>`
        }
        <div>
          <div class="header-logo-text">${schoolName}</div>
          ${slogan ? `<div class="header-logo-slogan">${slogan}</div>` : ''}
        </div>
      </a>

      <button class="menu-toggle" aria-label="Menu" onclick="toggleMenu()">
        <span></span><span></span><span></span>
      </button>

      <nav>
        <ul class="nav-links" id="navLinks">
          ${pages.map(p => `
            <li><a href="${p.href}" class="${currentPage === p.name ? 'active' : ''}">${p.label}</a></li>
          `).join('')}
          ${mgmtUrl && mgmtUrl.trim() ? `<li><a href="${mgmtUrl}" class="nav-cta" target="_blank" rel="noopener">🔐 Connexion</a></li>` : ''}
        </ul>
      </nav>
    </div>
  `;
}

// ============================================
// 3. CONSTRUCTION DU FOOTER
// ============================================

function buildFooter(settings) {
  const footer = document.querySelector('.site-footer');
  if (!footer) return;

  const schoolName = settings.school_name || 'Mon École';
  const address = settings.address || '';
  const phone = settings.phone_primary || '';
  const email = settings.email_contact || '';
  const hours = settings.opening_hours || '';
  const fb = settings.facebook_link || '#';
  const ig = settings.instagram_link || '#';
  const wa = settings.whatsapp_link || '#';
  const yt = settings.youtube_link || '';

  footer.innerHTML = `
    <div class="footer-inner">
      <div class="footer-col">
        <h4>${schoolName}</h4>
        <p>${address}</p>
        <p>📞 ${phone}</p>
        <p>✉️ ${email}</p>
        <div class="footer-social">
          ${fb !== '#' ? `<a href="${fb}" target="_blank" rel="noopener" title="Facebook">📘</a>` : ''}
          ${ig !== '#' ? `<a href="${ig}" target="_blank" rel="noopener" title="Instagram">📷</a>` : ''}
          ${wa !== '#' ? `<a href="${wa}" target="_blank" rel="noopener" title="WhatsApp">💬</a>` : ''}
          ${yt ? `<a href="${yt}" target="_blank" rel="noopener" title="YouTube">▶️</a>` : ''}
        </div>
      </div>

      <div class="footer-col">
        <h4>Navigation</h4>
        <ul>
          <li><a href="/">Accueil</a></li>
          <li><a href="/about.html">À propos</a></li>
          <li><a href="/programs.html">Formations</a></li>
          <li><a href="/gallery.html">Galerie</a></li>
          <li><a href="/news.html">Actualités</a></li>
          <li><a href="/contact.html">Contact</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <h4>Horaires</h4>
        <p>${hours.replace(/\|/g, '<br>')}</p>
      </div>
    </div>
    <div class="footer-bottom">
      © ${new Date().getFullYear()} ${schoolName} — Tous droits réservés.
    </div>
  `;
}

// ============================================
// 3b. APPLICATION DES COULEURS DYNAMIQUES
// ============================================

function applyColors(settings) {
  const root = document.documentElement;
  if (settings.primary_color) root.style.setProperty('--primary', settings.primary_color);
  if (settings.secondary_color) root.style.setProperty('--secondary', settings.secondary_color);

  // Appliquer au hero s'il existe
  const hero = document.getElementById('heroBanner');
  if (hero && settings.primary_color) {
    hero.style.background = `linear-gradient(135deg, ${settings.primary_color} 0%, ${settings.primary_color}dd 100%)`;
  }

  // Appliquer au CTA final (section avec background primary)
  document.querySelectorAll('section[style*="background:var(--primary)"]').forEach(el => {
    if (settings.primary_color) el.style.background = settings.primary_color;
  });
}

function toggleMenu() {
  const nav = document.getElementById('navLinks');
  const toggle = document.querySelector('.menu-toggle');
  if (nav) nav.classList.toggle('open');
  if (toggle) toggle.classList.toggle('active');
}

// ============================================
// 5. INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
});
