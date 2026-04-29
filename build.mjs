import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const DIST = join(ROOT, 'dist');
const PUBLIC = join(ROOT, 'public');

const SITE_URL = (process.env.SITE_URL || 'https://example.com').replace(/\/$/, '');
const SITE_NAME = process.env.SITE_NAME || 'Kortingsjacht';
const SITE_TAGLINE = 'Verse kortingscodes voor honderden webshops';

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

function parseDiscounts() {
  const raw = JSON.parse(readFileSync(join(ROOT, 'discounts.json'), 'utf8'));
  const items = [];
  for (const line of raw) {
    if (typeof line !== 'string' || !line.trim()) continue;
    const parts = line.split(',').map((s) => s.trim());
    if (parts.length < 5) continue;
    // Last four fields are fixed: code, discount, source, date.
    // Anything before that joins back into the shop name.
    const date = parts.pop();
    const source = parts.pop();
    const discount = parts.pop();
    const code = parts.pop();
    const shop = parts.join(', ');
    if (!shop || !code) continue;
    items.push({ shop, code, discount, source, date });
  }
  return items;
}

function parseAffiliates() {
  const raw = readFileSync(join(ROOT, 'affiliate-links.json'), 'utf8');
  const cleaned = raw
    .split('\n')
    .map((l) => l.replace(/^\s*\/\/.*$/, ''))
    .join('\n');
  const re = /'([^']+)'\s*:\s*\{\s*url\s*:\s*'([^']+)'\s*,\s*dummyCode\s*:\s*'([^']*)'\s*\}/g;
  const map = new Map();
  let m;
  while ((m = re.exec(cleaned)) !== null) {
    const key = m[1].trim();
    map.set(normalizeKey(key), { rawKey: key, url: m[2], dummyCode: m[3] });
  }
  return map;
}

function normalizeKey(s) {
  return s.toLowerCase().replace(/\([^)]*\)/g, '').replace(/[^a-z0-9]/g, '');
}

function urlSlug(s) {
  return s
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/&/g, ' en ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function displayName(shop) {
  // Capitalize first letter of each word, leave parenthetical hints alone.
  const base = shop
    .replace(/\.nl|\.com|\.it|\.de/gi, (m) => m.toLowerCase())
    .split(' ')
    .map((w) =>
      w.length > 0 && /^[a-z]/.test(w)
        ? w.charAt(0).toUpperCase() + w.slice(1)
        : w
    )
    .join(' ');
  return base;
}

// ---------------------------------------------------------------------------
// Build dataset
// ---------------------------------------------------------------------------

function parseDateMMDD(s) {
  // Format used in source: MM-DD (no year). Treat all as current year for sorting.
  const parts = s.split('-').map((n) => parseInt(n, 10));
  if (parts.length !== 2 || parts.some(Number.isNaN)) return 0;
  const [mm, dd] = parts;
  return mm * 100 + dd;
}

function buildDataset() {
  const discounts = parseDiscounts();
  const affiliates = parseAffiliates();

  const groups = new Map();
  for (const d of discounts) {
    const baseShop = d.shop.replace(/\s*\([^)]*\)\s*$/, '').trim();
    const slug = urlSlug(baseShop);
    if (!slug) continue;
    if (!groups.has(slug)) {
      groups.set(slug, {
        slug,
        name: displayName(baseShop),
        rawName: baseShop,
        codes: [],
        affiliate: affiliates.get(normalizeKey(baseShop)) || null,
      });
    }
    groups.get(slug).codes.push(d);
  }

  // Sort codes: most recent first (by MM-DD heuristic), de-dup by code.
  for (const g of groups.values()) {
    const seen = new Set();
    g.codes = g.codes
      .sort((a, b) => parseDateMMDD(b.date) - parseDateMMDD(a.date))
      .filter((c) => {
        const k = c.code.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    g.latestDate = g.codes[0]?.date || '';
  }

  const shops = [...groups.values()].sort((a, b) =>
    a.name.localeCompare(b.name, 'nl')
  );
  return { shops, discounts };
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

function layout({ title, description, canonical, jsonLd, body, activeNav }) {
  const ogTitle = title;
  const ogDesc = description;
  const ld = jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : '';
  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(ogTitle)}">
<meta property="og:description" content="${esc(ogDesc)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:site_name" content="${esc(SITE_NAME)}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(ogTitle)}">
<meta name="twitter:description" content="${esc(ogDesc)}">
<meta name="theme-color" content="#0f172a">
<link rel="stylesheet" href="/style.css">
${ld}
</head>
<body>
<header class="site-header">
  <div class="container">
    <a href="/" class="brand"><span class="brand-mark">%</span> ${esc(SITE_NAME)}</a>
    <nav>
      <a href="/"${activeNav === 'home' ? ' aria-current="page"' : ''}>Home</a>
      <a href="/shops/"${activeNav === 'shops' ? ' aria-current="page"' : ''}>Alle webshops</a>
    </nav>
  </div>
</header>
<main class="container">
${body}
</main>
<footer class="site-footer">
  <div class="container">
    <p>&copy; ${new Date().getFullYear()} ${esc(SITE_NAME)}. Codes worden door derden aangedragen; werking niet gegarandeerd.</p>
  </div>
</footer>
<script src="/reveal.js" defer></script>
</body>
</html>`;
}

function shopCard(shop) {
  const count = shop.codes.length;
  const top = shop.codes[0];
  const flag = shop.affiliate ? '<span class="badge">deal</span>' : '';
  return `<a class="card shop-card" href="/shop/${esc(shop.slug)}/">
    <div class="card-row">
      <h3>${esc(shop.name)}</h3>
      ${flag}
    </div>
    <p class="muted">${count} ${count === 1 ? 'code' : 'codes'}${top ? ` · tot ${esc(top.discount)} korting` : ''}</p>
  </a>`;
}

function discountText(disc) {
  if (!disc) return '';
  const trimmed = String(disc).trim();
  if (/^\d+$/.test(trimmed)) return `${trimmed}% korting`;
  return `${trimmed} korting`;
}

// ---------------------------------------------------------------------------
// Page renderers
// ---------------------------------------------------------------------------

function renderHome({ shops }) {
  const featured = [...shops]
    .filter((s) => s.affiliate)
    .sort((a, b) => b.codes.length - a.codes.length)
    .slice(0, 12);

  const latest = shops
    .flatMap((s) => s.codes.map((c) => ({ ...c, shopSlug: s.slug, shopName: s.name })))
    .sort((a, b) => parseDateMMDD(b.date) - parseDateMMDD(a.date))
    .slice(0, 24);

  const title = `${SITE_NAME} — ${SITE_TAGLINE}`;
  const description = `Vind actuele kortingscodes voor ${shops.length}+ webshops. Dagelijks bijgewerkt en handmatig gecontroleerd.`;
  const canonical = `${SITE_URL}/`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/shops/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  const body = `
<section class="hero">
  <h1>${esc(SITE_TAGLINE)}</h1>
  <p class="lead">Bespaar bij ${shops.length} webshops met geverifieerde codes — geen gedoe, geen fake kortingen.</p>
  <p><a class="btn" href="/shops/">Bekijk alle webshops</a></p>
</section>

<section>
  <div class="section-head">
    <h2>Uitgelichte webshops</h2>
    <a class="muted" href="/shops/">Alles bekijken →</a>
  </div>
  <div class="grid">
    ${featured.map(shopCard).join('\n')}
  </div>
</section>

<section>
  <h2>Net binnen</h2>
  <ul class="latest-list">
    ${latest
      .map(
        (c) => `
      <li>
        <a href="/shop/${esc(c.shopSlug)}/">
          <strong>${esc(c.shopName)}</strong>
          <span class="muted"> · ${esc(discountText(c.discount))}</span>
        </a>
        <span class="date">${esc(c.date)}</span>
      </li>`
      )
      .join('\n')}
  </ul>
</section>
`;

  return layout({ title, description, canonical, jsonLd, body, activeNav: 'home' });
}

function renderAllShops({ shops }) {
  const title = `Alle webshops met kortingscodes — ${SITE_NAME}`;
  const description = `Overzicht van ${shops.length} webshops met actuele kortingscodes. Vind direct de juiste shop.`;
  const canonical = `${SITE_URL}/shops/`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Webshops',
    numberOfItems: shops.length,
    itemListElement: shops.slice(0, 200).map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/shop/${s.slug}/`,
      name: s.name,
    })),
  };

  // Group by first letter for a nice index.
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
  <h1>Alle webshops</h1>
  <p class="lead">${shops.length} webshops met actuele codes. Filter snel of spring naar een letter.</p>
  <input type="search" id="shop-filter" placeholder="Filter webshops…" aria-label="Filter webshops">
</section>

<nav class="alpha-index" aria-label="Alfabetisch">
  ${letters.map((l) => `<a href="#l-${esc(l)}">${esc(l)}</a>`).join('')}
</nav>

${letters
  .map(
    (l) => `
<section class="letter-block" id="l-${esc(l)}">
  <h2>${esc(l)}</h2>
  <div class="grid">
    ${byLetter.get(l).map(shopCard).join('\n')}
  </div>
</section>`
  )
  .join('\n')}
`;

  return layout({ title, description, canonical, jsonLd, body, activeNav: 'shops' });
}

function renderShop(shop) {
  const codeCount = shop.codes.length;
  const topDiscount = shop.codes[0]?.discount || '';
  const title = `${shop.name} kortingscode${topDiscount ? ` — ${topDiscount}${/^\d+$/.test(topDiscount) ? '%' : ''} korting` : ''} | ${SITE_NAME}`;
  const description = `${codeCount} actuele kortingscode${codeCount === 1 ? '' : 's'} voor ${shop.name}. Dagelijks bijgewerkt en gecontroleerd.`;
  const canonical = `${SITE_URL}/shop/${shop.slug}/`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${shop.name} kortingscodes`,
    itemListElement: shop.codes.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Offer',
        name: `${shop.name} ${discountText(c.discount)}`,
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
      { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Webshops', item: `${SITE_URL}/shops/` },
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
    <h3>${esc(discountText(c.discount))}</h3>
    <p class="muted">Toegevoegd ${esc(c.date)}${c.source ? ` · bron ${esc(c.source)}` : ''}</p>
  </div>
  <div class="code-action">
    <div class="code-value" data-code="${esc(c.code)}">
      <span class="code-text">${esc(c.code)}</span>
      <button type="button" class="copy-btn" aria-label="Kopieer code">Kopieer</button>
    </div>
    ${
      hasAffiliate
        ? `<button type="button" class="reveal-btn" data-affiliate="${esc(affiliateUrl)}" data-index="${i}">Toon code &amp; ga naar shop</button>`
        : ''
    }
  </div>
</article>`;
    })
    .join('\n');

  const body = `
<nav class="breadcrumb" aria-label="Breadcrumb">
  <a href="/">Home</a> <span>›</span>
  <a href="/shops/">Webshops</a> <span>›</span>
  <span aria-current="page">${esc(shop.name)}</span>
</nav>

<header class="shop-hero">
  <h1>${esc(shop.name)} kortingscode</h1>
  <p class="lead">${codeCount} actuele code${codeCount === 1 ? '' : 's'} voor ${esc(shop.name)}.${
    hasAffiliate
      ? ' Klik op <em>Toon code</em> om de code te onthullen — de webshop opent automatisch in dit tabblad.'
      : ''
  }</p>
</header>

<section class="codes" data-has-affiliate="${hasAffiliate}">
  ${codesHtml}
</section>

<section class="shop-meta">
  <h2>Over ${esc(shop.name)} kortingscodes</h2>
  <p>Op deze pagina vind je ${codeCount} kortingscode${codeCount === 1 ? '' : 's'} voor ${esc(shop.name)}. We controleren elke dag of de codes nog werken en sorteren op datum, zodat de meest recente bovenaan staat. Niet elke code werkt voor elke bestelling — probeer er meerdere als de eerste niet pakt.</p>
  <h2>Hoe gebruik je een ${esc(shop.name)} code?</h2>
  <ol>
    <li>Kies hierboven een code en${hasAffiliate ? ' klik op <em>Toon code</em>; de webshop opent in dit tabblad.' : ' kopieer de code.'}</li>
    <li>Vul je winkelmandje bij ${esc(shop.name)}.</li>
    <li>Plak de code in het kortingsveld bij het afrekenen.</li>
  </ol>
</section>
`;

  return layout({
    title,
    description,
    canonical,
    jsonLd: [jsonLd, breadcrumb],
    body,
    activeNav: 'shops',
  });
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

function writePage(relPath, html) {
  const out = join(DIST, relPath);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
}

function buildSitemap(shops) {
  const urls = [
    `${SITE_URL}/`,
    `${SITE_URL}/shops/`,
    ...shops.map((s) => `${SITE_URL}/shop/${s.slug}/`),
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
  writeFileSync(join(DIST, 'sitemap.xml'), xml);
}

function buildRobots() {
  const txt = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
  writeFileSync(join(DIST, 'robots.txt'), txt);
}

function main() {
  if (existsSync(DIST)) rmSync(DIST, { recursive: true });
  mkdirSync(DIST, { recursive: true });

  if (existsSync(PUBLIC)) {
    cpSync(PUBLIC, DIST, { recursive: true });
  }

  const dataset = buildDataset();
  console.log(`Parsed ${dataset.shops.length} shops, ${dataset.discounts.length} codes`);

  writePage('index.html', renderHome(dataset));
  writePage('shops/index.html', renderAllShops(dataset));
  for (const shop of dataset.shops) {
    writePage(`shop/${shop.slug}/index.html`, renderShop(shop));
  }

  buildSitemap(dataset.shops);
  buildRobots();

  console.log(`Built site at ${DIST}`);
}

main();
