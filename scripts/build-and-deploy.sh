#!/usr/bin/env bash
# Build and deploy a single country's site to its Cloudflare Pages project.
#
# Usage: build-and-deploy.sh <country>
#        country: belgium | germany | france | uk
#
# Reads /data/<country>/discount_codes_public.json (host bind-mount of
# /srv/diski/output, read-only) and runs the per-locale build + deploy.

set -euo pipefail

country="${1:-}"
if [[ -z "$country" ]]; then
  echo "Usage: $0 <country>  (belgium|germany|france|uk)" >&2
  exit 2
fi

case "$country" in
  belgium) locale=be ;;
  germany) locale=de ;;
  france)  locale=fr ;;
  uk)      locale=uk ;;
  *)
    echo "Unknown country: $country" >&2
    echo "Valid: belgium, germany, france, uk" >&2
    exit 2
    ;;
esac

data_file="/data/${country}/discount_codes_public.json"
if [[ ! -f "$data_file" ]]; then
  echo "Data file not found: $data_file" >&2
  echo "Make sure /srv/diski/output is bind-mounted at /data inside the container." >&2
  exit 3
fi

ts() { date -u +%Y-%m-%dT%H:%M:%SZ; }

echo "[$(ts)] [$country/$locale] build starting (data: $data_file)"
LOCALE="$locale" DATA_FILE="$data_file" node build.mjs

echo "[$(ts)] [$country/$locale] deploying to Cloudflare Pages"
npm run "deploy:${locale}"

echo "[$(ts)] [$country/$locale] done"
