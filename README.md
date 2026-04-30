# Diski

Static discount-code site, generated from per-locale `discounts.json` + `shops.json` files.

Two locales ship today: **BE** (Belgian / Flemish market, `nl-BE`) and **DE** (German market). Each builds to its own folder and is intended to be deployed as a separate Cloudflare Pages project (one per country domain). A separate **NL** locale slot is reserved for a future Netherlands-specific site.

## Project layout

```
click_events.tsv         ← optional, shared: drives popularity ranking on home
data/
  be/
    discounts.json
    shops.json           ← per-shop metadata (logo, affiliate URL)
  de/
    discounts.json
    shops.json
public/                  ← shared static assets (style.css, reveal.js)
build.mjs                ← generator (zero deps)
serve.mjs                ← local preview
dist/
  be/                    ← built BE site
  de/                    ← built DE site
```

### click_events.tsv (optional)

The build looks for `data/<locale>/click_events.tsv` first, then falls back to a shared `click_events.tsv` at the project root. When found, the build uses it to rank shops on the homepage:

- **Featured section** — top 12 shops by click popularity
- **Latest section** — next 24 popular shops, each with their most recent code

The TSV format is GA-export style: tab-separated `event_label\tcount` lines, with `#`-prefixed comment header lines ignored. Recognised event prefixes:

- `comp_codes_aff_open_<shop>` — affiliate clicks
- `giftcard_inmodal_<shop>`
- `giftcard_companypage_table_<shop>`
- bare `<shop>` — direct click on the shop's tile

Counts from all matching rows are summed per shop. Unknown labels are silently dropped. If no click data is available, both sections fall back to the previous defaults (most-codes-with-affiliate / latest by date).

### discounts.json schema

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
| `SITE_URL_BE` | Canonical / sitemap / hreflang for BE | `https://example.be` |
| `SITE_URL_DE` | Canonical / sitemap / hreflang for DE | `https://example.de` |
| `LOCALE` | If set, builds only that locale | unset (builds both) |

Example:

```bash
SITE_URL_BE=https://diski.be \
SITE_URL_DE=https://diski.de \
node build.mjs
```

## Cloudflare Pages

Run **one project per locale**, both pointing at this same repo:

| | BE project | DE project |
|---|---|---|
| Build command | `LOCALE=be node build.mjs` | `LOCALE=de node build.mjs` |
| Output dir | `dist/be` | `dist/de` |
| Env vars | `SITE_URL_BE`, `SITE_NAME`, `NODE_VERSION=20` | `SITE_URL_DE`, `SITE_NAME`, `NODE_VERSION=20` |

That's it — no framework, no `npm install`.

## Adding codes / shops

Edit the relevant locale's `data/<locale>/discounts.json` (objects in `discount_codes` with `company_id`, `company`, `code`, `discount`, `date`) and/or `data/<locale>/shops.json` (logo + affiliate URL keyed by `company_id`). Rebuild — that's the whole flow.

## How the affiliate reveal flow works

For shops whose `shops.json` entry has a `url`, the discount code is blurred until the user clicks the reveal button. That click:

1. opens the same shop page with `?reveal=<index>` in a new tab (the code is unblurred there),
2. redirects the current tab to the affiliate URL.

Shops without an affiliate link show their codes immediately.
