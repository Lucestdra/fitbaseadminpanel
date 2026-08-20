# The studio panel: an Expo web export, served by Caddy.
#
# <b>There is no application process here.</b> `expo export` produces HTML, JavaScript and assets —
# no Node runtime, no server. So the runtime stage is a file server and nothing else, which is why
# this image is a few megabytes rather than a few hundred and why it has no database credentials,
# no secrets and nothing to compromise beyond files that are public by construction.
#
# Build:
#   docker build --build-arg EXPO_PUBLIC_API_BASE_URL=https://api.fitbase.com.tr -t fitbase-panel .

# Pinned, not floated. A generator whose output is the artefact that ships must not change without
# a reviewable diff — the same rule the backend applies to its SDK version.
ARG NODE_VERSION=22.14-alpine
ARG CADDY_VERSION=2.9-alpine

# ---- build ------------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS build
WORKDIR /src

# Lockfile first, so a source-only change reuses the install layer. `npm ci` rather than
# `npm install`: it installs exactly what package-lock.json records and fails if the two disagree,
# which is the difference between building the dependency set that was reviewed and building
# whatever resolved today.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# <b>Compiled in, not read at runtime.</b> There is no server here to hold configuration, so where
# the API lives is decided now and baked into the bundle. Required: an empty value makes every
# request relative, which was correct when the panel and the API shared an origin and is wrong now
# that they are admin.* and api.* — see src/api/client.ts.
ARG EXPO_PUBLIC_API_BASE_URL
ENV EXPO_PUBLIC_API_BASE_URL=${EXPO_PUBLIC_API_BASE_URL}

# Fails the build rather than shipping a panel that cannot reach anything. A missing --build-arg is
# otherwise indistinguishable from a working build until somebody opens the site.
RUN test -n "$EXPO_PUBLIC_API_BASE_URL" \
 || (echo "EXPO_PUBLIC_API_BASE_URL is required: --build-arg EXPO_PUBLIC_API_BASE_URL=https://api.fitbase.com.tr" >&2 && exit 1)

# The same gates CI runs. A panel that does not typecheck is not one to deploy, and finding that
# out here costs a minute against finding it out from a studio.
RUN npm run typecheck \
 && npm run check:api \
 && npm run check:mocks \
 && npm run check:integrations

RUN npx expo export --platform web

# The container's own Caddyfile, with the CSP script hash read back out of the export. See
# scripts/render-caddyfile.mjs for why neither value in it may be written by hand.
RUN node scripts/render-caddyfile.mjs dist deploy/Caddyfile.template /Caddyfile

# ---- panel ------------------------------------------------------------------------------
FROM caddy:${CADDY_VERSION} AS panel

COPY --from=build /src/dist /srv
COPY --from=build /Caddyfile /etc/caddy/Caddyfile

# Rejects a malformed Caddyfile at build time. Without it a syntax error becomes a container that
# restart-loops in production, reported as "the panel is down" with the reason in a log nobody has
# opened yet.
RUN caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile

EXPOSE 8080

# No published port and no health check: the container is reached over web-net by the host's Caddy,
# and a static file server that started is a static file server that works.
