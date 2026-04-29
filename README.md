# Diski

Static discount-code site, generated from per-locale `discounts.json` + `affiliate-links.json` files.

Two locales ship today: **NL** (Dutch market) and **DE** (German market). Each builds to its own folder and is intended to be deployed as a separate Cloudflare Pages project (one per country domain).

## Project layout

```
data/
  nl/
    discounts.json
    affiliate-links.json
  de/
    discounts.json
    affiliate-links.json
public/                ← shared static assets (style.css, reveal.js)
build.mjs              ← generator (zero deps)
serve.mjs              ← local preview
dist/
  nl/                  ← built NL site
  de/                  ← built DE site
```

## Local

```bash
# Build both locales
node build.mjs

# Build only one
LOCALE=nl node build.mjs
LOCALE=de node build.mjs

# Preview a locale at http://localhost:4321
LOCALE=nl node serve.mjs
LOCALE=de node serve.mjs
```

## Environment variables

| Var | Purpose | Default |
|---|---|---|
| `SITE_NAME` | Shown in header, footer, OG tags | `Diski` |
| `SITE_URL_NL` | Canonical / sitemap / hreflang for NL | `https://example.com` |
| `SITE_URL_DE` | Canonical / sitemap / hreflang for DE | `https://example.de` |
| `LOCALE` | If set, builds only that locale | unset (builds both) |

Example:

```bash
SITE_URL_NL=https://diski.nl \
SITE_URL_DE=https://diski.de \
node build.mjs
```

## Cloudflare Pages

Run **one project per locale**, both pointing at this same repo:

| | NL project | DE project |
|---|---|---|
| Build command | `LOCALE=nl node build.mjs` | `LOCALE=de node build.mjs` |
| Output dir | `dist/nl` | `dist/de` |
| Env vars | `SITE_URL_NL`, `SITE_NAME`, `NODE_VERSION=20` | `SITE_URL_DE`, `SITE_NAME`, `NODE_VERSION=20` |

That's it — no framework, no `npm install`.

## Adding codes / shops

Edit the relevant locale's `data/<locale>/discounts.json` (one CSV-style line per code: `"shop, code, discount, source, MM-DD"`) and `data/<locale>/affiliate-links.json` (JS-object literal). Rebuild — that's the whole flow.

## How the affiliate reveal flow works

For shops with an entry in `affiliate-links.json`, the discount code is blurred until the user clicks the reveal button. That click:

1. opens the same shop page with `?reveal=<index>` in a new tab (the code is unblurred there),
2. redirects the current tab to the affiliate URL.

Shops without an affiliate link show their codes immediately.
