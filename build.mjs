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
  be: (process.env.SITE_URL_BE || 'https://example.be').replace(/\/$/, ''),
  de: (process.env.SITE_URL_DE || 'https://example.de').replace(/\/$/, ''),
};

// Maps locale keys (folder/URL slot) to BCP-47 language tags used for Intl
// formatters and og:locale. Add a new entry here when introducing a locale.
const OG_LOCALES = { be: 'nl_BE', de: 'de_DE', nl: 'nl_NL' };

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

// Strip these from the start of a TSV event label before matching against shop
// keys. The leftover should be a shop name. Anything that doesn't match a known
// shop after stripping is silently ignored.
const CLICK_EVENT_PREFIXES = [
  'comp_codes_aff_open_',
  'giftcard_inmodal_',
  'giftcard_companypage_table_',
];

function parseClickEvents(file) {
  const text = readFileSync(file, 'utf8');
  const counts = new Map();
  for (const line of text.split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const tab = line.indexOf('\t');
    if (tab < 0) continue;
    const label = line.slice(0, tab).trim();
    const count = parseInt(line.slice(tab + 1).trim(), 10);
    if (!label || !Number.isFinite(count) || count <= 0) continue;
    let shop = label;
    for (const p of CLICK_EVENT_PREFIXES) {
      if (label.startsWith(p)) {
        shop = label.slice(p.length);
        break;
      }
    }
    const k = normalizeKey(shop);
    if (!k) continue;
    counts.set(k, (counts.get(k) || 0) + count);
  }
  return counts;
}

function locateClickEventsFile(locale) {
  const localeFile = join(ROOT, 'data', locale, 'click_events.tsv');
  if (existsSync(localeFile)) return localeFile;
  const rootFile = join(ROOT, 'click_events.tsv');
  if (existsSync(rootFile)) return rootFile;
  return null;
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

function buildDataset(locale, langTag) {
  const dataDir = join(ROOT, 'data', locale);
  const discountsFile = join(dataDir, 'discounts.json');
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
<meta name="theme-color" content="#0f172a">
<link rel="stylesheet" href="/style.css">
${ld}
</head>
<body>
<header class="site-header">
  <div class="container">
    <a href="/" class="brand"><span class="brand-mark">%</span> ${esc(SITE_NAME)}</a>
    <nav>
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
    <p>${esc(t.footerText(new Date().getFullYear(), SITE_NAME))}</p>
  </div>
</footer>
<script src="/reveal.js" defer></script>
</body>
</html>`;
}

function logoHtml(item, size) {
  // `item` may be a shop ({ logo, name }) or an enriched discount
  // ({ shopLogo, shopName }). Render an <img> when a logo URL exists,
  // otherwise a neutral placeholder showing the first letter of the name.
  const logo = item.logo || item.shopLogo || null;
  const name = item.name || item.shopName || '?';
  const cls = `shop-logo shop-logo--${size}`;
  if (logo) {
    return `<img class="${cls}" src="${esc(logo)}" alt="" loading="lazy" decoding="async">`;
  }
  const initial = (name.charAt(0) || '?').toUpperCase();
  return `<span class="${cls} shop-logo--placeholder" aria-hidden="true">${esc(initial)}</span>`;
}

function shopCard(ctx, shop) {
  const { t } = ctx;
  const count = shop.codes.length;
  const top = shop.codes[0];
  const flag = shop.affiliate ? `<span class="badge">${esc(t.badge)}</span>` : '';
  const meta = `${esc(t.cardCount(count))}${top ? ` · ${esc(t.cardDiscount(formatDiscountValue(top.discount)))}` : ''}`;
  return `<a class="card shop-card" href="/shop/${esc(shop.slug)}/">
    ${logoHtml(shop, 'md')}
    <div class="shop-card-body">
      <div class="card-row">
        <h3>${esc(shop.name)}</h3>
        ${flag}
      </div>
      <p class="muted">${meta}</p>
    </div>
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

  // Rank by click popularity (click_events.tsv). Shops with no click data
  // get a score of 0 and are ordered after the popular ones.
  const ranked = [...shops]
    .filter((s) => (s.clickScore || 0) > 0)
    .sort((a, b) => b.clickScore - a.clickScore);

  // Featured: top 12 popular shops. If fewer than 12 shops have click data,
  // top up with the previous heuristic (affiliate-link shops, by code count).
  const featuredSet = new Set();
  const featured = [];
  for (const s of ranked) {
    if (featured.length >= 12) break;
    featured.push(s);
    featuredSet.add(s);
  }
  if (featured.length < 12) {
    const fallback = [...shops]
      .filter((s) => s.affiliate && !featuredSet.has(s))
      .sort((a, b) => b.codes.length - a.codes.length);
    for (const s of fallback) {
      if (featured.length >= 12) break;
      featured.push(s);
      featuredSet.add(s);
    }
  }

  // "Latest" section: the next 24 popular shops (after the featured set),
  // showing each one's most recent code. If fewer than 24 popular shops are
  // left, top up with the most recent codes overall (de-duped against the
  // shops already shown above).
  const latestShops = ranked
    .filter((s) => !featuredSet.has(s) && s.codes.length > 0)
    .slice(0, 24);
  const latest = latestShops.map((s) => ({
    ...s.codes[0],
    shopSlug: s.slug,
    shopName: s.name,
    shopLogo: s.logo,
  }));
  if (latest.length < 24) {
    const shown = new Set(latestShops.map((s) => s.slug));
    for (const s of featured) shown.add(s.slug);
    const dates = discounts.map((d) => parseDateSortKey(d.date)).filter((n) => n > 0);
    const maxDate = dates.length ? Math.max(...dates) : 0;
    const more = discounts
      .filter((d) => parseDateSortKey(d.date) === maxDate && !shown.has(d.shopSlug))
      .slice(0, 24 - latest.length);
    latest.push(...more);
  }

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

  const body = `
<section class="hero">
  <h1>${esc(t.tagline)}</h1>
  <p class="lead">${esc(t.homeLead(shops.length))}</p>
  <p><a class="btn" href="/shops/">${esc(t.btnAllShops)}</a></p>
</section>

<section>
  <div class="section-head">
    <h2>${esc(t.sectionFeatured)}</h2>
    <a class="muted" href="/shops/">${esc(t.sectionAllLink)}</a>
  </div>
  <div class="grid">
    ${featured.map((s) => shopCard(ctx, s)).join('\n')}
  </div>
</section>

<section>
  <h2>${esc(t.sectionLatest)}</h2>
  <ul class="latest-list">
    ${latest
      .map(
        (c) => `
      <li>
        <a href="/shop/${esc(c.shopSlug)}/">
          ${logoHtml(c, 'sm')}
          <span class="latest-text">
            <strong>${esc(c.shopName)}</strong>
            <span class="muted"> · ${esc(discountText(t, c.discount))}</span>
          </span>
        </a>
        <span class="date">${esc(formatDate(c.date, langTag))}</span>
      </li>`
      )
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
<section class="hero compact">
  <h1>${esc(t.allShopsH1)}</h1>
  <p class="lead">${esc(t.allShopsLead(shops.length))}</p>
  <input type="search" id="shop-filter" placeholder="${esc(t.filterPlaceholder)}" aria-label="${esc(t.filterPlaceholder)}">
</section>

<nav class="alpha-index" aria-label="${esc(t.alphaAria)}">
  ${letters.map((l) => `<a href="#l-${esc(l)}">${esc(l)}</a>`).join('')}
</nav>

${letters
  .map(
    (l) => `
<section class="letter-block" id="l-${esc(l)}">
  <h2>${esc(l)}</h2>
  <div class="grid">
    ${byLetter.get(l).map((s) => shopCard(ctx, s)).join('\n')}
  </div>
</section>`
  )
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
      return `
<article class="code${reveal ? ' is-revealed' : ''}" data-index="${i}">
  <div class="code-info">
    <h3>${esc(discountText(t, c.discount))}</h3>
    <p class="muted">${esc(t.codeAdded(formatDate(c.date, ctx.t.lang)))}</p>
  </div>
  <div class="code-action">
    <div class="code-value" data-code="${esc(c.code)}">
      <span class="code-text">${esc(c.code)}</span>
      <button type="button" class="copy-btn" aria-label="${esc(t.btnAriaCopy)}" data-copied="${esc(t.btnCopied)}">${esc(t.btnCopy)}</button>
    </div>
    ${
      hasAffiliate
        ? `<button type="button" class="reveal-btn" data-affiliate="${esc(affiliateUrl)}" data-index="${i}">${esc(t.btnReveal)}</button>`
        : ''
    }
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
  <h2>${esc(t.shopMetaH2About(shop.name))}</h2>
  <p>${esc(t.shopMetaAboutBody(codeCount, shop.name))}</p>
  <h2>${esc(t.shopMetaH2How(shop.name))}</h2>
  <ol>
    ${howSteps.map((step) => `<li>${step}</li>`).join('\n')}
  </ol>
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

function buildLocale(locale) {
  if (!LOCALES[locale]) throw new Error(`Unknown locale: ${locale}`);
  const t = LOCALES[locale];
  const siteUrl = SITE_URLS[locale];
  const distDir = join(DIST, locale);

  if (existsSync(distDir)) rmSync(distDir, { recursive: true });
  mkdirSync(distDir, { recursive: true });
  if (existsSync(PUBLIC)) cpSync(PUBLIC, distDir, { recursive: true });

  const dataset = buildDataset(locale, t.lang);

  // Apply click-event popularity scores to each shop, when click data is
  // available. Used by renderHome() to drive the featured + latest sections.
  const clickFile = locateClickEventsFile(locale);
  const clicks = clickFile ? parseClickEvents(clickFile) : new Map();
  let rankedCount = 0;
  for (const s of dataset.shops) {
    const score = clicks.get(normalizeKey(s.rawName)) || 0;
    s.clickScore = score;
    if (score > 0) rankedCount++;
  }

  const ctx = { locale, t, siteUrl, shops: dataset.shops, discounts: dataset.discounts };

  writePage(distDir, 'index.html', renderHome(ctx));
  writePage(distDir, 'shops/index.html', renderAllShops(ctx));
  for (const shop of dataset.shops) {
    writePage(distDir, `shop/${shop.slug}/index.html`, renderShop(ctx, shop));
  }

  buildSitemap(distDir, siteUrl, dataset.shops);
  buildRobots(distDir, siteUrl);

  console.log(
    `[${locale}] ${dataset.shops.length} shops, ${dataset.discounts.length} codes` +
      (clickFile ? `, ${rankedCount} ranked by click data` : ', no click data') +
      ` → ${distDir}`
  );
}

function main() {
  const requested = process.env.LOCALE;
  const locales = requested ? [requested] : Object.keys(LOCALES);
  for (const loc of locales) buildLocale(loc);
}

main();
