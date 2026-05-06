# Diski — end-to-end architecture

How the data pipeline, the frontend build, the droplet, and the four Cloudflare Pages sites fit together. Read this first when picking up infra or deploy work.

## Two repos, one product

- **`claude_diski_data`** — Python. Scrapes Instagram via Apify, extracts codes via Anthropic, writes one JSON feed per country. → https://github.com/coconutsRhealthy/claude_diski_data
- **`claude_diski_fe`** (this repo) — Node, zero-dependency build. Reads the JSON, renders per-locale HTML, deploys via wrangler. → https://github.com/coconutsRhealthy/claude_diski_fe

## The droplet

- DigitalOcean droplet `diski-int`, Amsterdam (AMS3), Ubuntu 24.04, 1 GB RAM / 25 GB disk
- Docker 29.x, timezone `Europe/Amsterdam` (DST handled by the OS)
- Workspace: `/srv/diski/`
- Logs: `/var/log/diski/` (per-country, e.g. `frontend-belgium.log`)

### `/srv/diski/` layout

```
data/                  pipeline persistent state (per-market codes.json, handles.json)
inputs/                pipeline inputs (curated influencers.txt + generated rankings)
output/                SHARED HANDOFF — pipeline writes, frontend reads
  belgium/  france/  germany/  uk/
    discount_codes_public.json    ← the file the frontend reads via DATA_FILE
    social/                       ← future: pushed to R2; ignored by frontend
.env                   data project secrets
.env.frontend          CLOUDFLARE_API_TOKEN; mode 600, root only
Dockerfile             data project image
Dockerfile.frontend    frontend image (downloaded from this repo's raw GitHub URL)
run-pipeline.sh        existing wrapper for the data project
run-frontend.sh        wrapper: docker run --rm --env-file .env.frontend -v output:/data:ro diski-frontend <country>
```

The frontend container expects `/srv/diski/output` bind-mounted at `/data`.

## Country → locale → Cloudflare Pages

| Country (data project) | Locale (frontend) | Lang   | CF Pages project    | URL |
|---|---|---|---|---|
| `belgium` | `be` | nl-BE | `int-diski-belgium` | https://int-diski-belgium.pages.dev |
| `germany` | `de` | de-DE | `int-diski-germany` | https://int-diski-germany.pages.dev |
| `france`  | `fr` | fr-FR | `int-diski-france`  | https://int-diski-france.pages.dev |
| `uk`      | `uk` | en-GB | `int-diski-uk`      | https://int-diski-uk.pages.dev |

The mapping is encoded in two places:
- `scripts/build-and-deploy.sh` (case statement: country → locale)
- `package.json` (per-locale `deploy:*` scripts hardcode the matching project name)

`nl` is reserved as a future locale slot in `OG_LOCALES` for a Netherlands site.

## Cloudflare specifics

- All four projects are **Direct Upload** (not GitHub-connected — wrangler pushes from the droplet).
- Production branch on each project is `main`. The deploy scripts pass `--branch=main`, so deploys land in production rather than preview.
- API token `int-diski-frontend-deploy` requires **four permissions**:
  - Account → Cloudflare Pages → Edit
  - Account → Account Settings → Read
  - User → User Details → Read
  - User → Memberships → Read
- The token lives only in `/srv/diski/.env.frontend` (mode `600`, root-only).

## Deploy flow per country

1. **Cron fires** at 02:00 Amsterdam on Mon/Wed/Fri and calls `run-pipeline.sh <country>`.
2. **Pipeline runs**; on success the frontend wrapper runs (`&&` semantics).
3. **`run-frontend.sh <country>`** runs `docker run --rm --env-file /srv/diski/.env.frontend -v /srv/diski/output:/data:ro diski-frontend <country>`. All output is redirected to `/var/log/diski/frontend-<country>.log`.
4. **Inside the container**, `scripts/build-and-deploy.sh <country>`:
   - Maps country → locale via case statement.
   - Reads `/data/<country>/discount_codes_public.json`.
   - Runs `LOCALE=<locale> DATA_FILE=<path> node build.mjs` → produces `dist/<locale>/`.
   - Runs `npm run deploy:<locale>` → wrangler deploys `dist/<locale>/` to the matching CF Pages project.
5. **Cloudflare** rebuilds the edge; live URL is updated within ~30 s.

## Cron schedule

```
0 2 * * 1,3,5 /srv/diski/run-pipeline.sh france && /srv/diski/run-frontend.sh france ; /srv/diski/run-pipeline.sh germany && /srv/diski/run-frontend.sh germany ; /srv/diski/run-pipeline.sh uk && /srv/diski/run-frontend.sh uk
```

- `&&` within a country pair → frontend only deploys if the pipeline succeeded (no deploy on stale data).
- `;` between countries → each country's failure is isolated; downstream countries still run.
- **Belgium is intentionally not in cron** today; deploys are manual via `/srv/diski/run-frontend.sh belgium`.

## How code changes ship

The frontend image is a **frozen git clone of `main`**. To pick up new commits, rebuild the image:

```bash
docker build --build-arg CACHE_BUST=$(date +%s) -f /srv/diski/Dockerfile.frontend -t diski-frontend /srv/diski/
```

`CACHE_BUST=$(date +%s)` invalidates the cached `git clone` layer so a fresh clone happens. Without it Docker reuses the old clone forever.

Standard dev loop:
1. Edit locally → `node build.mjs` to verify.
2. Commit + push to GitHub.
3. SSH to the droplet → run the docker build above.
4. (Optional) Smoke test: `/srv/diski/run-frontend.sh belgium`.
5. Next cron run picks up the new image automatically.

A daily 01:30 image-rebuild cron could automate step 3, at the cost of "any pushed commit goes live next deploy" — currently kept manual to allow controlled rollout.

## Frontend repo essentials

### Committed
- `build.mjs` — generator (~700 lines, zero deps).
- `public/style.css` + `public/reveal.js`.
- `data/<locale>/discounts.json` — **dev fixtures only**; production reads via `DATA_FILE`.
- `data/<locale>/shops.json` — curated logos + affiliate URLs. Lives only in this repo, not produced by the data pipeline. `{}` for `fr` and `uk` until populated.
- `Dockerfile`, `scripts/build-and-deploy.sh`, `package.json`, `package-lock.json`.

### Env vars `build.mjs` honors
| Var | Purpose | Default |
|---|---|---|
| `LOCALE` | Build only this locale | unset (builds all four) |
| `DATA_FILE` | Override path for discounts JSON; requires `LOCALE` | unset |
| `SITE_URL_BE` / `DE` / `FR` / `UK` | Canonical / sitemap / hreflang URL per locale | `int-diski-<country>.pages.dev` |
| `SITE_NAME` | Header / footer / OG name | `Diski` |

### npm scripts
| Script | What it does |
|---|---|
| `build` | `node build.mjs` |
| `preview` | local preview server |
| `deploy` | generic — takes `<dir> --project-name=<name>` args |
| `deploy:be` / `:de` / `:fr` / `:uk` | hardcoded project names; used by the container |

`wrangler` is the only `devDependency`; install with `npm ci`.

## Known caveats

- **French copy** in `LOCALES.fr` is a first pass; needs a native-speaker review.
- **`shops.json` is empty for `fr` and `uk`** — until populated, those locales have no shop logos and the affiliate-reveal flow doesn't engage (codes show unblurred).
- **No centralised cron-failure alerting** today. With `;` between countries, cron's overall exit code is just the last command's. Per-country logs in `/var/log/diski/` are the source of truth.
- **Image rebuild is manual** — controlled rollout, but easy to forget.
- **Belgium has no cron entry** yet; manual deploys only.
