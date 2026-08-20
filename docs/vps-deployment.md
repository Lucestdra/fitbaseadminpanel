# Deploying the panel

The panel is an Expo web export — HTML, JavaScript and assets, with no application process. It ships
as a Caddy image that serves those files, in its own Compose stack next to the backend's.

## First time

**1. DNS.** `admin.fitbase.com.tr` needs an A record on the VPS before anything else. Caddy obtains a
certificate on first request, and a site block for a name that does not resolve makes the whole
Caddyfile fail to load — which takes the API down with it.

**2. Check out this repository on the host.**

```bash
git clone <this repo> /opt/fitbase-panel
cd /opt/fitbase-panel
```

**3. Build and start.**

```bash
docker compose -f docker-compose.vps.yml up -d --build
```

The API's URL is compiled into the bundle, so it is a build argument rather than a runtime setting.
The default is `https://api.fitbase.com.tr`; override with `FITBASE_PANEL_API_BASE_URL` if the API
lives somewhere else.

**4. Add the site block to the shared Caddy.** Append [deploy/Caddyfile.vps-site](../deploy/Caddyfile.vps-site)
to `/root/shelif/Caddyfile`, next to the `api.fitbase.com.tr` block the backend supplies, then:

```bash
docker exec shelif-caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker exec shelif-caddy caddy reload   --config /etc/caddy/Caddyfile --adapter caddyfile
```

**5. Point the connect flow back here.** In the backend's `.env.production`:

```
Channels__ConnectRedirectUri=https://admin.fitbase.com.tr/kanallar/baglandi
```

then re-run the backend's `scripts/deploy-vps.sh`. Without this a studio finishes authorizing at the
provider and lands nowhere, and the authorization is lost when the state expires.

## Updating

```bash
cd /opt/fitbase-panel && git pull && docker compose -f docker-compose.vps.yml up -d --build
```

The build runs `typecheck` and the three repo checks before exporting, so a broken panel fails here
rather than in front of a studio. Pages are served `no-cache` and hashed assets `immutable`, so a
returning browser picks up the new bundle without a hard refresh.

## What is deliberately not automated

There is no GitHub Actions deployment for the panel. The backend has one (`.github/workflows/deploy.yml`)
and this repository does not, so a release here is a `git pull` on the host. That is a gap rather
than a decision — worth closing once the panel changes often enough to be worth it.

## Things that will look like a broken panel

**A blank page with a CSP error in the console.** The policy names a hash of Expo Router's inline
hydration script, computed at build time by [scripts/render-caddyfile.mjs](../scripts/render-caddyfile.mjs).
If Expo changes that line and the renderer stops finding it, the build fails rather than shipping —
but a policy edited by hand would not. Do not paste a hash into the template.

**Every screen failing to load, panel itself fine.** The bundle was built without
`EXPO_PUBLIC_API_BASE_URL`, or with the wrong one, so requests go somewhere that does not answer.
The Dockerfile refuses an empty value; a wrong value builds happily. Check `connect-src` in the
`Content-Security-Policy` response header — it is rendered from the same input, so it tells you what
the bundle was compiled against.

**502 from Caddy with the container healthy.** The panel is not on `web-net`, or the site block
proxies to `panel` rather than `fitbase-panel`. Compose registers both names, so the service name
resolves until a neighbouring stack claims it.
