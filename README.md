# Diski

Static discount-code site, generated from per-locale `discounts.json` + `shops.json` files.

Four locales ship today: **BE** (Belgian / Flemish market, `nl-BE`), **DE** (German), **FR** (French), and **UK** (British English). Each builds to its own folder and is intended to be deployed as a separate Cloudflare Pages project (one per country domain). A separate **NL** locale slot is reserved for a future Netherlands-specific site.

## Project layout

```
data/
  be/                    ← Belgium / Flemish (nl-BE)
    discounts.json
    shops.json           ← per-shop metadata (logo, affiliate URL)
  de/                    ← Germany (de-DE)
  fr/                    ← France (fr-FR)
  uk/                    ← United Kingdom (en-GB)
public/                  ← shared static assets (style.css, reveal.js)
build.mjs                ← generator (zero deps)
serve.mjs                ← local preview
dist/
  be/  de/  fr/  uk/     ← built per-locale sites
```

The homepage shows two sections:

- **Featured** — top 12 shops with an affiliate link, ranked by code count
- **Latest** — 24 most recent codes, de-duped against featured shops

### discounts.json schema

> **Note:** committed `data/<locale>/discounts.json` files are dev fixtures — the live site is built from data produced by the [`claude_diski_data`](https://github.com/coconutsRhealthy/claude_diski_data) pipeline on the droplet, fed in via the `DATA_FILE` env var (see "Local" below).

```json
{
  "generated_at": "2026-04-30T04:05:25+00:00",
  "discount_codes": [
    {
      "company_id": "aboutyou",
      "company": "About You",
      "code": "CASSYV15",
      "discount": "15%",
      "date": "2026-04-30"
    }
  ]
}
```

`company_id` is the canonical key — it is used as the shop URL slug and to look up logo / affiliate URL in `shops.json`. `discount` may be `null`. Dates are ISO `YYYY-MM-DD`.

### shops.json schema

```json
{
  "aboutyou": {
    "logo": "https://...png",     // optional — falls back to a letter placeholder
    "url":  "https://tidd.ly/..." // optional — affiliate URL; if missing, codes are shown unblurred
  }
}
```

Both fields are optional. A shop entry can have just `logo`, just `url`, or both. The key should match `company_id` from `discounts.json`.

## Local

```bash
# Build both locales
node build.mjs

# Build only one
LOCALE=be node build.mjs
LOCALE=de node build.mjs

# Preview a locale at http://localhost:4321
LOCALE=be node serve.mjs
LOCALE=de node serve.mjs
```

## Environment variables

| Var | Purpose | Default |
|---|---|---|
| `SITE_NAME` | Shown in header, footer, OG tags | `Diski` |
| `SITE_URL_BE` | Canonical / sitemap / hreflang for BE | `https://int-diski-belgium.pages.dev` |
| `SITE_URL_DE` | Canonical / sitemap / hreflang for DE | `https://int-diski-germany.pages.dev` |
| `SITE_URL_FR` | Canonical / sitemap / hreflang for FR | `https://int-diski-france.pages.dev` |
| `SITE_URL_UK` | Canonical / sitemap / hreflang for UK | `https://int-diski-uk.pages.dev` |
| `LOCALE` | If set, builds only that locale | unset (builds all) |
| `DATA_FILE` | Override path to discounts JSON (requires `LOCALE`) | unset (uses `data/<locale>/discounts.json`) |

Example:

```bash
SITE_URL_BE=https://int-diski-belgium.pages.dev \
SITE_URL_DE=https://int-diski-germany.pages.dev \
SITE_URL_FR=https://int-diski-france.pages.dev \
SITE_URL_UK=https://int-diski-uk.pages.dev \
node build.mjs
```

When custom domains are wired up (e.g. `https://diski.de`), point the relevant `SITE_URL_*` at the production hostname instead.

## Cloudflare Pages

Run **one project per locale** — current internal URLs follow the `int-diski-<country>.pages.dev` pattern:

| | BE | DE | FR | UK |
|---|---|---|---|---|
| Build | `LOCALE=be node build.mjs` | `LOCALE=de …` | `LOCALE=fr …` | `LOCALE=uk …` |
| Output dir | `dist/be` | `dist/de` | `dist/fr` | `dist/uk` |
| Pages project | `int-diski-belgium` | `int-diski-germany` | `int-diski-france` | `int-diski-uk` |

The build itself stays zero-runtime-dependency — `node build.mjs` works from a clean clone, no install needed.

### Deploying

Deploys go through `wrangler pages deploy`. Wrangler is the only `devDependency`, fetched on demand:

```bash
npm install                 # one-time, fetches wrangler
LOCALE=de node build.mjs    # produce dist/de/
npm run deploy:de           # → wrangler pages deploy dist/de --project-name=int-diski-germany --branch=main
```

Per-locale scripts (`deploy:be`, `deploy:de`, `deploy:fr`, `deploy:uk`) hard-code the matching CF Pages project. The generic `npm run deploy -- <dir> --project-name=<name>` form takes args directly.

Wrangler reads `CLOUDFLARE_API_TOKEN` from the environment (and optionally `CLOUDFLARE_ACCOUNT_ID`); on the droplet these come from `/srv/diski/.env.frontend`.

### Droplet deploy (Docker)

The image clones this repo from GitHub at build time. To rebuild with the latest commit:

```bash
docker build --build-arg CACHE_BUST=$(date +%s) -t diski-frontend .
```

Run per-country (called from the cron wrapper after the matching pipeline finishes):

```bash
docker run --rm \
  --env-file /srv/diski/.env.frontend \
  -v /srv/diski/output:/data:ro \
  diski-frontend germany
```

Country argument: `belgium`, `germany`, `france`, or `uk`. The container script maps that to its locale (`be`/`de`/`fr`/`uk`), reads `/data/<country>/discount_codes_public.json`, builds, and deploys via `npm run deploy:<locale>`.

The container assumes the Pages project's production branch is `main` (so `--branch=main` produces a real production deploy, not a preview).

## Adding codes / shops

Edit the relevant locale's `data/<locale>/discounts.json` (objects in `discount_codes` with `company_id`, `company`, `code`, `discount`, `date`) and/or `data/<locale>/shops.json` (logo + affiliate URL keyed by `company_id`). Rebuild — that's the whole flow.

## How the affiliate reveal flow works

For shops whose `shops.json` entry has a `url`, the discount code is blurred until the user clicks the reveal button. That click:

1. opens the same shop page with `?reveal=<index>` in a new tab (the code is unblurred there),
2. redirects the current tab to the affiliate URL.

Shops without an affiliate link show their codes immediately.
