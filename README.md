# Kortingsjacht

Static discount-code site, generated from `discounts.json` + `affiliate-links.json`.

## Local

```bash
node build.mjs        # writes ./dist
node serve.mjs        # preview at http://localhost:4321
```

`SITE_URL` (used for canonical URLs, sitemap, OpenGraph) and `SITE_NAME` are env vars:

```bash
SITE_URL=https://kortingsjacht.nl SITE_NAME="Kortingsjacht" node build.mjs
```

## Cloudflare Pages

- Build command: `node build.mjs`
- Build output directory: `dist`
- Environment variables: `SITE_URL`, `SITE_NAME` (set in Pages → Settings → Environment variables)
- Node version: set `NODE_VERSION=20` (or newer) in Pages env vars

That's it — no framework, no `npm install`.

## How the affiliate reveal flow works

For shops with an entry in `affiliate-links.json`, the discount code is blurred until the user clicks **Toon code & ga naar shop**. That click:

1. opens the same shop page with `?reveal=<index>` in a new tab (the code is unblurred there),
2. redirects the current tab to the affiliate URL.

Shops without an affiliate link show their codes immediately.
