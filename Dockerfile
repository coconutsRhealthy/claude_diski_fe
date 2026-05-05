# Build & deploy the Diski frontend for a single country.
#
# The image clones the repo at build time (no CI / GHCR), so to pick up new
# commits, rebuild with:
#     docker build --build-arg CACHE_BUST=$(date +%s) -t diski-frontend .
#
# Per-country invocation:
#     docker run --rm \
#       --env-file /srv/diski/.env.frontend \
#       -v /srv/diski/output:/data:ro \
#       diski-frontend germany

FROM node:22-slim

# git is needed at build time to clone the repo; ca-certificates for HTTPS.
RUN apt-get update && apt-get install -y --no-install-recommends \
      git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Pass --build-arg CACHE_BUST=$(date +%s) to invalidate the cache layer below
# and force a fresh clone of the latest main.
ARG CACHE_BUST=1
RUN echo "Cache bust: $CACHE_BUST" \
 && git clone --depth 1 https://github.com/coconutsRhealthy/claude_diski_fe.git .

# Installs wrangler (the only devDependency); locked via package-lock.json.
RUN npm ci

# Container expects /data/<country>/discount_codes_public.json — bind-mount
# the host's /srv/diski/output to /data when running.
ENTRYPOINT ["/app/scripts/build-and-deploy.sh"]
