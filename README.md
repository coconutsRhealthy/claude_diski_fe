# Diski

Static discount-code site, generated from per-locale `discounts.json` + `affiliate-links.json` files.

Two locales ship today: **NL** (Dutch market) and **DE** (German market). Each builds to its own folder and is intended to be deployed as a separate Cloudflare Pages project (one per country domain).

## Project layout

```
data/
  nl/
    discounts.json
    shops.json           ← per-shop metadata (logo, affiliate URL)
    click_events.tsv     ← optional: drives popularity ranking on home
  de/
    discounts.json
    shops.json
public/                  ← shared static assets (style.css, reveal.js)
build.mjs                ← generator (zero deps)
serve.mjs                ← local preview
dist/
  nl/                    ← built NL site
  de/                    ← built DE site
```

### click_events.tsv (optional)

If `data/<locale>/click_events.tsv` exists, the build uses it to rank shops on the homepage:

- **Featured section** — top 12 shops by click popularity
- **Latest section** — next 24 popular shops, each with their most recent code

The TSV format is GA-export style: tab-separated `event_label\tcount` lines, with `#`-prefixed comment header lines ignored. Recognised event prefixes:

- `comp_codes_aff_open_<shop>` — affiliate clicks
- `giftcard_inmodal_<shop>`
- `giftcard_companypage_table_<shop>`
- bare `<shop>` — direct click on the shop's tile

Counts from all matching rows are summed per shop. Unknown labels are silently dropped. If no click data is available, both sections fall back to the previous defaults (most-codes-with-affiliate / latest by date).

### shops.json schema

```json
{
  "hunkemoller": {
    "logo": "https://...png",     // optional — falls back to a letter placeholder
    "url":  "https://tidd.ly/..." // optional — affiliate URL; if missing, codes are shown unblurred
  }
}
```

Both fields are optional. A shop entry can have just `logo`, just `url`, or both.

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

Edit the relevant locale's `data/<locale>/discounts.json` (one CSV-style line per code: `"shop, code, discount, source, MM-DD"`) and/or `data/<locale>/shops.json` (logo + affiliate URL). Rebuild — that's the whole flow.

## How the affiliate reveal flow works

For shops with an entry in `affiliate-links.json`, the discount code is blurred until the user clicks the reveal button. That click:

1. opens the same shop page with `?reveal=<index>` in a new tab (the code is unblurred there),
2. redirects the current tab to the affiliate URL.

Shops without an affiliate link show their codes immediately.
