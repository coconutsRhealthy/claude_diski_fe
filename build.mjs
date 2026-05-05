import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const DIST = join(ROOT, 'dist');
const PUBLIC = join(ROOT, 'public');

const SITE_NAME = process.env.SITE_NAME || 'Diski';

// Per-locale public URLs, used for canonical, OG, sitemap, hreflang.
const SITE_URLS = {
  be: (process.env.SITE_URL_BE || 'https://int-diski-belgium.pages.dev').replace(/\/$/, ''),
  de: (process.env.SITE_URL_DE || 'https://int-diski-germany.pages.dev').replace(/\/$/, ''),
  fr: (process.env.SITE_URL_FR || 'https://int-diski-france.pages.dev').replace(/\/$/, ''),
  uk: (process.env.SITE_URL_UK || 'https://int-diski-uk.pages.dev').replace(/\/$/, ''),
};

// Maps locale keys (folder/URL slot) to BCP-47 language tags used for Intl
// formatters and og:locale. Add a new entry here when introducing a locale.
const OG_LOCALES = { be: 'nl_BE', de: 'de_DE', nl: 'nl_NL', fr: 'fr_FR', uk: 'en_GB' };

// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------

const LOCALES = {
  be: {
    lang: 'nl-BE',
    tagline: 'Verse kortingscodes voor honderden webshops',
    homeLead: (n) => `Bespaar bij ${n} webshops met geverifieerde codes — geen gedoe, geen fake kortingen.`,
    homeMetaDesc: (n) => `Vind actuele kortingscodes voor ${n}+ webshops. Dagelijks bijgewerkt en handmatig gecontroleerd.`,
    btnAllShops: 'Bekijk alle webshops',
    sectionFeatured: 'Uitgelichte webshops',
    sectionAllLink: 'Alles bekijken →',
    sectionLatest: 'Net binnen',
    navHome: 'Home',
    navShops: 'Alle webshops',
    breadcrumbHome: 'Home',
    breadcrumbShops: 'Webshops',
    breadcrumbAria: 'Breadcrumb',
    alphaAria: 'Alfabetisch',
    allShopsTitle: (siteName) => `Alle webshops met kortingscodes — ${siteName}`,
    allShopsH1: 'Alle webshops',
    allShopsLead: (n) => `${n} webshops met actuele codes. Filter snel of spring naar een letter.`,
    allShopsMetaDesc: (n) => `Overzicht van ${n} webshops met actuele kortingscodes. Vind direct de juiste shop.`,
    filterPlaceholder: 'Filter webshops…',
    shopTitle: (shop, top, siteName) =>
      `${shop} kortingscode${top ? ` — ${top}${/^\d+$/.test(top) ? '%' : ''} korting` : ''} | ${siteName}`,
    shopMetaDesc: (n, shop) => `${n} actuele kortingscode${n === 1 ? '' : 's'} voor ${shop}. Dagelijks bijgewerkt en gecontroleerd.`,
    shopH1: (shop) => `${shop} kortingscode`,
    shopLead: (n, shop, hasAffiliate) =>
      `${n} actuele code${n === 1 ? '' : 's'} voor ${shop}.${
        hasAffiliate
          ? ' Klik op <em>Toon code</em> om de code te onthullen — de webshop opent automatisch in dit tabblad.'
          : ''
      }`,
    codeAdded: (date) => `Toegevoegd ${date}`,
    discountSuffix: 'korting',
    btnReveal: 'Toon code & ga naar shop',
    btnCopy: 'Kopieer',
    btnCopied: 'Gekopieerd!',
    btnAriaCopy: 'Kopieer code',
    shopMetaH2About: (shop) => `Over ${shop} kortingscodes`,
    shopMetaAboutBody: (n, shop) =>
      `Op deze pagina vind je ${n} kortingscode${n === 1 ? '' : 's'} voor ${shop}. We controleren elke dag of de codes nog werken en sorteren op datum, zodat de meest recente bovenaan staat. Niet elke code werkt voor elke bestelling — probeer er meerdere als de eerste niet pakt.`,
    shopMetaH2How: (shop) => `Hoe gebruik je een ${shop} code?`,
    shopMetaHowSteps: (shop, hasAffiliate) => [
      `Kies hierboven een code en${
        hasAffiliate ? ' klik op <em>Toon code</em>; de webshop opent in dit tabblad.' : ' kopieer de code.'
      }`,
      `Vul je winkelmandje bij ${shop}.`,
      'Plak de code in het kortingsveld bij het afrekenen.',
    ],
    footerText: (year, siteName) =>
      `© ${year} ${siteName}. Codes worden door derden aangedragen; werking niet gegarandeerd.`,
    cardCount: (n) => `${n} ${n === 1 ? 'code' : 'codes'}`,
    cardDiscount: (top) => `tot ${top} korting`,
    badge: 'deal',
    schemaCodes: 'kortingscodes',
    statShopsLabel: 'webshops',
    statCodesLabel: 'actuele codes',
    statTodayUpdated: 'Vandaag bijgewerkt',
    revealMicrocopy: 'Opent in dit tabblad · via partnerlink',
  },
  de: {
    lang: 'de',
    tagline: 'Frische Rabattcodes für hunderte Onlineshops',
    homeLead: (n) => `Spare bei ${n} Onlineshops mit geprüften Codes — kein Aufwand, keine Fake-Rabatte.`,
    homeMetaDesc: (n) => `Finde aktuelle Rabattcodes für ${n}+ Onlineshops. Täglich aktualisiert und handgeprüft.`,
    btnAllShops: 'Alle Shops ansehen',
    sectionFeatured: 'Empfohlene Shops',
    sectionAllLink: 'Alle ansehen →',
    sectionLatest: 'Neu hinzugefügt',
    navHome: 'Start',
    navShops: 'Alle Shops',
    breadcrumbHome: 'Start',
    breadcrumbShops: 'Shops',
    breadcrumbAria: 'Breadcrumb',
    alphaAria: 'Alphabetisch',
    allShopsTitle: (siteName) => `Alle Onlineshops mit Rabattcodes — ${siteName}`,
    allShopsH1: 'Alle Shops',
    allShopsLead: (n) => `${n} Shops mit aktuellen Codes. Filtere schnell oder springe zu einem Buchstaben.`,
    allShopsMetaDesc: (n) => `Übersicht über ${n} Onlineshops mit aktuellen Rabattcodes. Finde direkt den richtigen Shop.`,
    filterPlaceholder: 'Shops filtern…',
    shopTitle: (shop, top, siteName) =>
      `${shop} Rabattcode${top ? ` — ${top}${/^\d+$/.test(top) ? '%' : ''} Rabatt` : ''} | ${siteName}`,
    shopMetaDesc: (n, shop) =>
      `${n} aktueller Rabattcode${n === 1 ? '' : 's'} für ${shop}. Täglich aktualisiert und geprüft.`,
    shopH1: (shop) => `${shop} Rabattcode`,
    shopLead: (n, shop, hasAffiliate) =>
      `${n} aktueller Code${n === 1 ? '' : 's'} für ${shop}.${
        hasAffiliate
          ? ' Klicke auf <em>Code anzeigen</em>, um den Code zu enthüllen — der Shop öffnet automatisch in diesem Tab.'
          : ''
      }`,
    codeAdded: (date) => `Hinzugefügt ${date}`,
    discountSuffix: 'Rabatt',
    btnReveal: 'Code anzeigen & zum Shop',
    btnCopy: 'Kopieren',
    btnCopied: 'Kopiert!',
    btnAriaCopy: 'Code kopieren',
    shopMetaH2About: (shop) => `Über ${shop} Rabattcodes`,
    shopMetaAboutBody: (n, shop) =>
      `Auf dieser Seite findest du ${n} Rabattcode${n === 1 ? '' : 's'} für ${shop}. Wir prüfen täglich, ob die Codes funktionieren, und sortieren nach Datum, sodass die neuesten oben stehen. Nicht jeder Code funktioniert für jede Bestellung — probiere mehrere aus, falls der erste nicht klappt.`,
    shopMetaH2How: (shop) => `Wie verwendest du einen ${shop}-Code?`,
    shopMetaHowSteps: (shop, hasAffiliate) => [
      `Wähle oben einen Code${
        hasAffiliate ? ' und klicke auf <em>Code anzeigen</em>; der Shop öffnet in diesem Tab.' : ' und kopiere ihn.'
      }`,
      `Fülle deinen Warenkorb bei ${shop}.`,
      'Füge den Code im Gutscheinfeld an der Kasse ein.',
    ],
    footerText: (year, siteName) =>
      `© ${year} ${siteName}. Codes werden von Dritten beigetragen; Funktion nicht garantiert.`,
    cardCount: (n) => `${n} ${n === 1 ? 'Code' : 'Codes'}`,
    cardDiscount: (top) => `bis zu ${top} Rabatt`,
    badge: 'deal',
    schemaCodes: 'Rabattcodes',
    statShopsLabel: 'Shops',
    statCodesLabel: 'aktuelle Codes',
    statTodayUpdated: 'Heute aktualisiert',
    revealMicrocopy: 'Öffnet in diesem Tab · über Partnerlink',
  },
  fr: {
    lang: 'fr-FR',
    tagline: 'Codes promo récents pour des centaines de boutiques en ligne',
    homeLead: (n) => `Économisez chez ${n} boutiques en ligne avec des codes vérifiés — sans tracas, sans fausses promos.`,
    homeMetaDesc: (n) => `Trouvez des codes promo actuels pour ${n}+ boutiques en ligne. Mis à jour quotidiennement et vérifiés à la main.`,
    btnAllShops: 'Voir toutes les boutiques',
    sectionFeatured: 'Boutiques sélectionnées',
    sectionAllLink: 'Voir tout →',
    sectionLatest: 'Tout récents',
    navHome: 'Accueil',
    navShops: 'Toutes les boutiques',
    breadcrumbHome: 'Accueil',
    breadcrumbShops: 'Boutiques',
    breadcrumbAria: 'Fil d’Ariane',
    alphaAria: 'Alphabétique',
    allShopsTitle: (siteName) => `Toutes les boutiques en ligne avec codes promo — ${siteName}`,
    allShopsH1: 'Toutes les boutiques',
    allShopsLead: (n) => `${n} boutiques avec des codes actuels. Filtrez rapidement ou allez à une lettre.`,
    allShopsMetaDesc: (n) => `Aperçu de ${n} boutiques en ligne avec des codes promo actuels. Trouvez directement la bonne boutique.`,
    filterPlaceholder: 'Filtrer les boutiques…',
    shopTitle: (shop, top, siteName) =>
      `${shop} code promo${top ? ` — ${top}${/^\d+$/.test(top) ? '%' : ''} de réduction` : ''} | ${siteName}`,
    shopMetaDesc: (n, shop) =>
      `${n} code${n === 1 ? '' : 's'} promo actuel${n === 1 ? '' : 's'} pour ${shop}. Mis à jour quotidiennement et vérifié.`,
    shopH1: (shop) => `${shop} code promo`,
    shopLead: (n, shop, hasAffiliate) =>
      `${n} code${n === 1 ? '' : 's'} actuel${n === 1 ? '' : 's'} pour ${shop}.${
        hasAffiliate
          ? ' Cliquez sur <em>Afficher le code</em> pour révéler le code — la boutique s’ouvre automatiquement dans cet onglet.'
          : ''
      }`,
    codeAdded: (date) => `Ajouté le ${date}`,
    discountSuffix: 'de réduction',
    btnReveal: 'Afficher le code & aller à la boutique',
    btnCopy: 'Copier',
    btnCopied: 'Copié !',
    btnAriaCopy: 'Copier le code',
    shopMetaH2About: (shop) => `À propos des codes promo ${shop}`,
    shopMetaAboutBody: (n, shop) =>
      `Sur cette page, vous trouverez ${n} code${n === 1 ? '' : 's'} promo pour ${shop}. Nous vérifions chaque jour si les codes fonctionnent encore et les trions par date, afin que les plus récents apparaissent en haut. Tous les codes ne fonctionnent pas pour chaque commande — essayez-en plusieurs si le premier ne marche pas.`,
    shopMetaH2How: (shop) => `Comment utiliser un code ${shop} ?`,
    shopMetaHowSteps: (shop, hasAffiliate) => [
      `Choisissez un code ci-dessus${
        hasAffiliate ? ' et cliquez sur <em>Afficher le code</em> ; la boutique s’ouvre dans cet onglet.' : ' et copiez-le.'
      }`,
      `Remplissez votre panier sur ${shop}.`,
      'Collez le code dans le champ promo lors du paiement.',
    ],
    footerText: (year, siteName) =>
      `© ${year} ${siteName}. Les codes sont fournis par des tiers ; le fonctionnement n’est pas garanti.`,
    cardCount: (n) => `${n} code${n === 1 ? '' : 's'}`,
    cardDiscount: (top) => `jusqu’à ${top} de réduction`,
    badge: 'promo',
    schemaCodes: 'codes promo',
    statShopsLabel: 'boutiques',
    statCodesLabel: 'codes actuels',
    statTodayUpdated: 'Mis à jour aujourd’hui',
    revealMicrocopy: 'Ouvre dans cet onglet · via lien partenaire',
  },
  uk: {
    lang: 'en-GB',
    tagline: 'Fresh discount codes for hundreds of online shops',
    homeLead: (n) => `Save at ${n} online shops with verified codes — no hassle, no fake discounts.`,
    homeMetaDesc: (n) => `Find current discount codes for ${n}+ online shops. Updated daily and hand-checked.`,
    btnAllShops: 'View all shops',
    sectionFeatured: 'Featured shops',
    sectionAllLink: 'View all →',
    sectionLatest: 'Just in',
    navHome: 'Home',
    navShops: 'All shops',
    breadcrumbHome: 'Home',
    breadcrumbShops: 'Shops',
    breadcrumbAria: 'Breadcrumb',
    alphaAria: 'Alphabetical',
    allShopsTitle: (siteName) => `All online shops with discount codes — ${siteName}`,
    allShopsH1: 'All shops',
    allShopsLead: (n) => `${n} shops with current codes. Filter quickly or jump to a letter.`,
    allShopsMetaDesc: (n) => `Overview of ${n} online shops with current discount codes. Find the right shop directly.`,
    filterPlaceholder: 'Filter shops…',
    shopTitle: (shop, top, siteName) =>
      `${shop} discount code${top ? ` — ${top}${/^\d+$/.test(top) ? '%' : ''} off` : ''} | ${siteName}`,
    shopMetaDesc: (n, shop) =>
      `${n} current discount code${n === 1 ? '' : 's'} for ${shop}. Updated daily and checked.`,
    shopH1: (shop) => `${shop} discount code`,
    shopLead: (n, shop, hasAffiliate) =>
      `${n} current code${n === 1 ? '' : 's'} for ${shop}.${
        hasAffiliate
          ? ' Click <em>Show code</em> to reveal the code — the shop opens automatically in this tab.'
          : ''
      }`,
    codeAdded: (date) => `Added ${date}`,
    discountSuffix: 'off',
    btnReveal: 'Show code & go to shop',
    btnCopy: 'Copy',
    btnCopied: 'Copied!',
    btnAriaCopy: 'Copy code',
    shopMetaH2About: (shop) => `About ${shop} discount codes`,
    shopMetaAboutBody: (n, shop) =>
      `On this page you’ll find ${n} discount code${n === 1 ? '' : 's'} for ${shop}. We check every day whether the codes still work and sort by date, so the most recent ones appear at the top. Not every code works for every order — try several if the first one doesn’t.`,
    shopMetaH2How: (shop) => `How do you use a ${shop} code?`,
    shopMetaHowSteps: (shop, hasAffiliate) => [
      `Pick a code above${
        hasAffiliate ? ' and click <em>Show code</em>; the shop opens in this tab.' : ' and copy it.'
      }`,
      `Fill your basket at ${shop}.`,
      'Paste the code into the discount field at checkout.',
    ],
    footerText: (year, siteName) =>
      `© ${year} ${siteName}. Codes are submitted by third parties; functionality not guaranteed.`,
    cardCount: (n) => `${n} ${n === 1 ? 'code' : 'codes'}`,
    cardDiscount: (top) => `up to ${top} off`,
    badge: 'deal',
    schemaCodes: 'discount codes',
    statShopsLabel: 'shops',
    statCodesLabel: 'current codes',
    statTodayUpdated: 'Updated today',
    revealMicrocopy: 'Opens in this tab · via partner link',
  },
};

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

function parseDiscounts(file) {
  const raw = JSON.parse(readFileSync(file, 'utf8'));
  const list = Array.isArray(raw?.discount_codes) ? raw.discount_codes : [];
  const items = [];
  for (const entry of list) {
    if (!entry || typeof entry !== 'object') continue;
    const companyId = typeof entry.company_id === 'string' ? entry.company_id.trim() : '';
    const shop = typeof entry.company === 'string' ? entry.company.trim() : '';
    const code = typeof entry.code === 'string' ? entry.code.trim() : '';
    const date = typeof entry.date === 'string' ? entry.date.trim() : '';
    if (!companyId || !shop || !code) continue;
    items.push({ companyId, shop, code, discount: entry.discount ?? null, date });
  }
  return items;
}

function parseShops(file) {
  const obj = JSON.parse(readFileSync(file, 'utf8'));
  const map = new Map();
  for (const [key, entry] of Object.entries(obj)) {
    if (!entry || typeof entry !== 'object') continue;
    map.set(normalizeKey(key), {
      rawKey: key,
      url: entry.url || null,
      logo: entry.logo || null,
    });
  }
  return map;
}

function normalizeKey(s) {
  return s.toLowerCase().replace(/\([^)]*\)/g, '').replace(/[^a-z0-9]/g, '');
}

function parseDateSortKey(s) {
  if (typeof s !== 'string') return 0;
  const parts = s.split('-').map((n) => parseInt(n, 10));
  if (parts.some(Number.isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 10000 + parts[1] * 100 + parts[2];
  if (parts.length === 2) return parts[0] * 100 + parts[1];
  return 0;
}

function formatDate(s, locale) {
  if (typeof s !== 'string') return '';
  const parts = s.split('-').map((n) => parseInt(n, 10));
  if (parts.some(Number.isNaN)) return s;
  let d;
  if (parts.length === 3) {
    const [yyyy, mm, dd] = parts;
    d = new Date(yyyy, mm - 1, dd);
  } else if (parts.length === 2) {
    const [mm, dd] = parts;
    d = new Date(2000, mm - 1, dd);
  } else {
    return s;
  }
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(d);
}

// Append "%" to bare numeric discounts ("15" → "15%"); leave anything containing
// "€" or "%" alone, and leave non-numeric values ("60+10", "3F2+15") untouched.
function formatDiscountValue(disc) {
  const s = String(disc || '').trim();
  if (!s) return '';
  if (/^\d+$/.test(s)) return `${s}%`;
  return s;
}

// ---------------------------------------------------------------------------
// Dataset
// ---------------------------------------------------------------------------

function buildDataset(locale, langTag, opts = {}) {
  const dataDir = join(ROOT, 'data', locale);
  const discountsFile = opts.discountsFile || join(dataDir, 'discounts.json');
  const shopsFile = join(dataDir, 'shops.json');

  const discounts = existsSync(discountsFile) ? parseDiscounts(discountsFile) : [];
  const shopMeta = existsSync(shopsFile) ? parseShops(shopsFile) : new Map();

  const groups = new Map();
  for (const d of discounts) {
    const slug = d.companyId;
    if (!slug) continue;
    if (!groups.has(slug)) {
      const meta = shopMeta.get(normalizeKey(slug)) || null;
      groups.set(slug, {
        slug,
        name: d.shop,
        rawName: d.shop,
        codes: [],
        affiliate: meta?.url ? { url: meta.url } : null,
        logo: meta?.logo || null,
      });
    }
    groups.get(slug).codes.push(d);
  }

  for (const g of groups.values()) {
    const seen = new Set();
    g.codes = g.codes
      .sort((a, b) => parseDateSortKey(b.date) - parseDateSortKey(a.date))
      .filter((c) => {
        const k = c.code.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    g.latestDate = g.codes[0]?.date || '';
  }

  const collator = new Intl.Collator(langTag || locale);
  const shops = [...groups.values()].sort((a, b) => collator.compare(a.name, b.name));

  // Re-emit raw discounts with shop slug/name/logo attached, preserving JSON
  // file order — used by the homepage "latest" section.
  const enrichedDiscounts = discounts
    .map((d) => {
      const slug = d.companyId;
      if (!slug) return null;
      const group = groups.get(slug);
      return {
        ...d,
        shopSlug: slug,
        shopName: d.shop,
        shopLogo: group?.logo || null,
      };
    })
    .filter(Boolean);

  return { shops, discounts: enrichedDiscounts };
}

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderHreflang(pathname) {
  return Object.entries(SITE_URLS)
    .map(([loc, base]) => {
      const tag = LOCALES[loc]?.lang || loc;
      return `<link rel="alternate" hreflang="${tag}" href="${esc(base + pathname)}">`;
    })
    .join('\n');
}

function layout({ ctx, title, description, canonical, jsonLd, body, activeNav, hreflangPath }) {
  const { t } = ctx;
  const ld = jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : '';
  const alternates = hreflangPath ? renderHreflang(hreflangPath) : '';
  return `<!DOCTYPE html>
<html lang="${t.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
${alternates}
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:site_name" content="${esc(SITE_NAME)}">
<meta property="og:locale" content="${OG_LOCALES[ctx.locale] || 'en_US'}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="theme-color" content="#fafaf9">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="/style.css">
${ld}
</head>
<body>
<header class="site-header">
  <div class="container">
    <a href="/" class="brand"><span class="brand-mark">%</span>${esc(SITE_NAME)}</a>
    <nav class="site-nav">
      <a href="/"${activeNav === 'home' ? ' aria-current="page"' : ''}>${esc(t.navHome)}</a>
      <a href="/shops/"${activeNav === 'shops' ? ' aria-current="page"' : ''}>${esc(t.navShops)}</a>
    </nav>
  </div>
</header>
<main class="container">
${body}
</main>
<footer class="site-footer">
  <div class="container">
    <span>${esc(t.footerText(new Date().getFullYear(), SITE_NAME))}</span>
    <span><a href="/shops/">${esc(t.navShops)}</a></span>
  </div>
</footer>
<script src="/reveal.js" defer></script>
</body>
</html>`;
}

function logoHtml(item, size) {
  // `item` may be a shop ({ logo, name }) or an enriched discount
  // ({ shopLogo, shopName }). Render a logo tile (wrapper span) containing
  // either an <img> or a letter placeholder. `size` is sm | md | lg; md
  // is the default and adds no modifier class.
  const logo = item.logo || item.shopLogo || null;
  const name = item.name || item.shopName || '?';
  const sizeMod = size && size !== 'md' ? ` shop-logo--${size}` : '';
  const cls = `shop-logo${sizeMod}`;
  if (logo) {
    return `<span class="${cls}"><img src="${esc(logo)}" alt="" loading="lazy" decoding="async"></span>`;
  }
  const initial = (name.charAt(0) || '?').toUpperCase();
  return `<span class="${cls}"><span class="placeholder" aria-hidden="true">${esc(initial)}</span></span>`;
}

function shopCard(ctx, shop) {
  const { t } = ctx;
  const count = shop.codes.length;
  const top = shop.codes[0];
  const meta = `${esc(t.cardCount(count))}${top ? ` · ${esc(t.cardDiscount(formatDiscountValue(top.discount)))}` : ''}`;
  return `<a class="shop-card" href="/shop/${esc(shop.slug)}/">
    ${logoHtml(shop, 'md')}
    <span class="shop-card-body">
      <h3 class="shop-card-name">${esc(shop.name)}</h3>
      <span class="shop-card-meta">${meta}</span>
    </span>
  </a>`;
}

function discountText(t, disc) {
  const v = formatDiscountValue(disc);
  return v ? `${v} ${t.discountSuffix}` : '';
}

// ---------------------------------------------------------------------------
// Page renderers
// ---------------------------------------------------------------------------

function renderHome(ctx) {
  const { t, siteUrl, shops, discounts } = ctx;
  const langTag = t.lang;

  // Featured: shops with an affiliate link, ranked by code count (top 12).
  const featuredSet = new Set();
  const featured = [...shops]
    .filter((s) => s.affiliate)
    .sort((a, b) => b.codes.length - a.codes.length)
    .slice(0, 12);
  for (const s of featured) featuredSet.add(s);

  // Latest: most recent codes overall, de-duped against featured shops.
  const shown = new Set(featured.map((s) => s.slug));
  const latest = [...discounts]
    .sort((a, b) => parseDateSortKey(b.date) - parseDateSortKey(a.date))
    .filter((d) => !shown.has(d.shopSlug))
    .slice(0, 24);

  const title = `${SITE_NAME} — ${t.tagline}`;
  const description = t.homeMetaDesc(shops.length);
  const canonical = `${siteUrl}/`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: siteUrl,
    inLanguage: t.lang,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/shops/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  const totalCodes = discounts.length;

  const body = `
<section class="hero">
  <h1>${esc(t.tagline)}</h1>
  <p class="lead">${esc(t.homeLead(shops.length))}</p>
  <div class="hero-cta">
    <a class="btn" href="/shops/">${esc(t.btnAllShops)}</a>
  </div>
  <div class="hero-meta">
    <span class="hero-meta-item"><strong>${shops.length}</strong> ${esc(t.statShopsLabel)}</span>
    <span class="hero-meta-item"><strong>${totalCodes}</strong> ${esc(t.statCodesLabel)}</span>
    <span class="hero-meta-item"><span class="hero-meta-dot"></span> ${esc(t.statTodayUpdated)}</span>
  </div>
</section>

<section class="block">
  <div class="section-head">
    <h2>${esc(t.sectionFeatured)}</h2>
    <a class="btn-link" href="/shops/">${esc(t.sectionAllLink)}</a>
  </div>
  <div class="grid">
    ${featured.map((s) => shopCard(ctx, s)).join('\n')}
  </div>
</section>

<section class="block">
  <div class="section-head">
    <h2>${esc(t.sectionLatest)}</h2>
    <a class="btn-link" href="/shops/">${esc(t.sectionAllLink)}</a>
  </div>
  <ul class="latest-list">
    ${latest
      .map((c) => {
        const v = formatDiscountValue(c.discount);
        const discount = v
          ? `<strong>${esc(v)}</strong> ${esc(t.discountSuffix)}`
          : esc(t.discountSuffix);
        return `
      <li>
        <a class="row-link" href="/shop/${esc(c.shopSlug)}/">
          ${logoHtml(c, 'sm')}
          <span class="latest-shop-name">${esc(c.shopName)}</span>
          <span class="latest-discount">${discount}</span>
          <span class="latest-date">${esc(formatDate(c.date, langTag))}</span>
        </a>
      </li>`;
      })
      .join('\n')}
  </ul>
</section>
`;

  return layout({
    ctx, title, description, canonical, jsonLd, body,
    activeNav: 'home', hreflangPath: '/',
  });
}

function renderAllShops(ctx) {
  const { t, siteUrl, shops } = ctx;
  const title = t.allShopsTitle(SITE_NAME);
  const description = t.allShopsMetaDesc(shops.length);
  const canonical = `${siteUrl}/shops/`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t.allShopsH1,
    inLanguage: t.lang,
    numberOfItems: shops.length,
    itemListElement: shops.slice(0, 200).map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${siteUrl}/shop/${s.slug}/`,
      name: s.name,
    })),
  };

  const byLetter = new Map();
  for (const s of shops) {
    const ch = (s.name[0] || '#').toUpperCase();
    const key = /[A-Z]/.test(ch) ? ch : '#';
    if (!byLetter.has(key)) byLetter.set(key, []);
    byLetter.get(key).push(s);
  }
  const letters = [...byLetter.keys()].sort();

  const body = `
<section class="shops-hero">
  <h1>${esc(t.allShopsH1)}</h1>
  <p class="lead">${esc(t.allShopsLead(shops.length))}</p>
  <input type="search" id="shop-filter" class="shop-filter" placeholder="${esc(t.filterPlaceholder)}" aria-label="${esc(t.filterPlaceholder)}">
</section>

<nav class="alpha-index" aria-label="${esc(t.alphaAria)}">
  ${letters.map((l) => `<a href="#l-${esc(l)}">${esc(l)}</a>`).join('')}
</nav>

${letters
  .map((l) => {
    const group = byLetter.get(l);
    const count = `${group.length} ${group.length === 1 ? 'shop' : 'shops'}`;
    return `
<section class="letter-block" id="l-${esc(l)}">
  <div class="letter-block-head">
    <span class="letter-block-letter">${esc(l)}</span>
    <span class="letter-block-count">${esc(count)}</span>
  </div>
  <div class="grid">
    ${group.map((s) => shopCard(ctx, s)).join('\n')}
  </div>
</section>`;
  })
  .join('\n')}
`;

  return layout({
    ctx, title, description, canonical, jsonLd, body,
    activeNav: 'shops', hreflangPath: '/shops/',
  });
}

function renderShop(ctx, shop) {
  const { t, siteUrl } = ctx;
  const codeCount = shop.codes.length;
  const topDiscount = shop.codes[0]?.discount || '';
  const title = t.shopTitle(shop.name, topDiscount, SITE_NAME);
  const description = t.shopMetaDesc(codeCount, shop.name);
  const canonical = `${siteUrl}/shop/${shop.slug}/`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${shop.name} ${t.schemaCodes}`,
    inLanguage: t.lang,
    itemListElement: shop.codes.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Offer',
        name: `${shop.name} ${discountText(t, c.discount)}`,
        url: canonical,
        availability: 'https://schema.org/InStock',
        seller: { '@type': 'Organization', name: shop.name },
      },
    })),
  };

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${siteUrl}/` },
      { '@type': 'ListItem', position: 2, name: t.breadcrumbShops, item: `${siteUrl}/shops/` },
      { '@type': 'ListItem', position: 3, name: shop.name, item: canonical },
    ],
  };

  const hasAffiliate = !!shop.affiliate;
  const affiliateUrl = hasAffiliate ? shop.affiliate.url : '';

  const codesHtml = shop.codes
    .map((c, i) => {
      const reveal = !hasAffiliate;
      const value = formatDiscountValue(c.discount);
      const discountBlock = value
        ? `<div class="code-discount">
      <span class="value">${esc(value)}</span>
      <span class="suffix">${esc(t.discountSuffix)}</span>
    </div>`
        : `<div class="code-discount"><span class="value hint">—</span></div>`;
      const revealBlock = hasAffiliate
        ? `<button type="button" class="reveal-btn" data-affiliate="${esc(affiliateUrl)}" data-index="${i}">${esc(t.btnReveal)}</button>
    <span class="reveal-microcopy">${esc(t.revealMicrocopy)}</span>`
        : '';
      return `
<article class="code${reveal ? ' is-revealed' : ''}" data-index="${i}">
  ${discountBlock}
  <div class="code-info">
    <p class="added">${esc(t.codeAdded(formatDate(c.date, ctx.t.lang)))}</p>
  </div>
  <div class="code-action">
    <div class="code-value" data-code="${esc(c.code)}">
      <span class="code-text">${esc(c.code)}</span>
      <button type="button" class="copy-btn" aria-label="${esc(t.btnAriaCopy)}" data-copied="${esc(t.btnCopied)}">${esc(t.btnCopy)}</button>
    </div>
    ${revealBlock}
  </div>
</article>`;
    })
    .join('\n');

  const howSteps = t.shopMetaHowSteps(shop.name, hasAffiliate);

  const body = `
<nav class="breadcrumb" aria-label="${esc(t.breadcrumbAria)}">
  <a href="/">${esc(t.breadcrumbHome)}</a> <span>›</span>
  <a href="/shops/">${esc(t.breadcrumbShops)}</a> <span>›</span>
  <span aria-current="page">${esc(shop.name)}</span>
</nav>

<header class="shop-hero">
  ${logoHtml(shop, 'lg')}
  <div>
    <h1>${esc(t.shopH1(shop.name))}</h1>
    <p class="lead">${t.shopLead(codeCount, esc(shop.name), hasAffiliate)}</p>
  </div>
</header>

<section class="codes" data-has-affiliate="${hasAffiliate}">
  ${codesHtml}
</section>

<section class="shop-meta">
  <div>
    <h2>${esc(t.shopMetaH2About(shop.name))}</h2>
    <p>${esc(t.shopMetaAboutBody(codeCount, shop.name))}</p>
  </div>
  <div>
    <h2>${esc(t.shopMetaH2How(shop.name))}</h2>
    <ol>
      ${howSteps.map((step) => `<li>${step}</li>`).join('\n')}
    </ol>
  </div>
</section>
`;

  return layout({
    ctx, title, description, canonical,
    jsonLd: [jsonLd, breadcrumb],
    body, activeNav: 'shops',
  });
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

function writePage(distDir, relPath, html) {
  const out = join(distDir, relPath);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
}

function buildSitemap(distDir, siteUrl, shops) {
  const urls = [
    `${siteUrl}/`,
    `${siteUrl}/shops/`,
    ...shops.map((s) => `${siteUrl}/shop/${s.slug}/`),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u}</loc>
    <changefreq>daily</changefreq>
  </url>`
  )
  .join('\n')}
</urlset>`;
  writeFileSync(join(distDir, 'sitemap.xml'), xml);
}

function buildRobots(distDir, siteUrl) {
  const txt = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;
  writeFileSync(join(distDir, 'robots.txt'), txt);
}

function buildLocale(locale, opts = {}) {
  if (!LOCALES[locale]) throw new Error(`Unknown locale: ${locale}`);
  const t = LOCALES[locale];
  const siteUrl = SITE_URLS[locale];
  const distDir = join(DIST, locale);

  if (existsSync(distDir)) rmSync(distDir, { recursive: true });
  mkdirSync(distDir, { recursive: true });
  if (existsSync(PUBLIC)) cpSync(PUBLIC, distDir, { recursive: true });

  const dataset = buildDataset(locale, t.lang, opts);

  const ctx = { locale, t, siteUrl, shops: dataset.shops, discounts: dataset.discounts };

  writePage(distDir, 'index.html', renderHome(ctx));
  writePage(distDir, 'shops/index.html', renderAllShops(ctx));
  for (const shop of dataset.shops) {
    writePage(distDir, `shop/${shop.slug}/index.html`, renderShop(ctx, shop));
  }

  buildSitemap(distDir, siteUrl, dataset.shops);
  buildRobots(distDir, siteUrl);

  const src = opts.discountsFile ? ` (data: ${opts.discountsFile})` : '';
  console.log(
    `[${locale}] ${dataset.shops.length} shops, ${dataset.discounts.length} codes${src} → ${distDir}`
  );
}

function main() {
  const requested = process.env.LOCALE;
  const dataFile = process.env.DATA_FILE;
  if (dataFile && !requested) {
    throw new Error('DATA_FILE requires LOCALE to be set (single-locale build).');
  }
  if (dataFile && !existsSync(dataFile)) {
    throw new Error(`DATA_FILE does not exist: ${dataFile}`);
  }
  const locales = requested ? [requested] : Object.keys(LOCALES);
  for (const loc of locales) {
    const opts = dataFile && loc === requested ? { discountsFile: dataFile } : {};
    buildLocale(loc, opts);
  }
}

main();
