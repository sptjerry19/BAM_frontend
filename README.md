# JBadminton frontend

Vue 3 / Vite storefront and admin SPA. The Laravel API is in the sibling `BAM_backend` repository.

## How it runs

`src/router/index.js` maps public, authenticated and admin pages. Route components are loaded on navigation so the game, admin and social screens do not inflate the first page. `src/api` calls the Laravel API; `src/composables/useAuth.js` keeps the JWT session. Production Nginx serves the built SPA, proxies `/api` to the backend and `/app` to Reverb on `jb_net`. The backend enforces authorization; router guards only control navigation.

Campaign images in `src/assets/uploads` are resized WebP files; `src/utils/uploads.js` maps them to Vite asset URLs. The court default image has a stable URL at `/images/court-default.webp` because that URL is persisted with court data. Transparent game atlases are lossless WebP. Images outside the initial viewport should use browser lazy loading. Keep uploaded user media in backend object storage rather than this repository.

## Local development

For the complete isolated workspace stack, run from `BAM_backend`:

```bash
docker compose -p jbam_workspace -f docker-compose.workspace.yml up -d --build
```

Open <http://127.0.0.1:5173>. API: <http://127.0.0.1:8082/api>. Mailpit: <http://127.0.0.1:8026>. This stack uses separate volumes and ports from the server stack.

To run Vite directly, use Node 22 and the locked dependencies:

```bash
npm ci
npm run dev
```

Vite proxies `/api` to local port 8082. Use `VITE_API_URL=/api` for same-origin access. Values prefixed `VITE_` are public in the browser bundle; never put secrets in them.

## Build and deploy

```bash
npm ci
npm run build
docker build --build-arg VITE_API_URL=/api -t jbam-frontend:verify .
```

The Dockerfile also runs `npm ci` before building. `.github/workflows/deploy.yml` requires a successful locked install, Vite build and production image build before SSH deploy to `/home/ubuntu/BAM_frontend`. The production Compose file mounts Let's Encrypt certificates, exposes 80/443 and joins the backend's `jb_net`. The backend must be reachable as `api` on that network. Check the site and `/api/` after deploy. For HTTP-only local Compose details, see [DOCKER.md](DOCKER.md).

If a deploy serves stale assets, check the `web` container image and Nginx logs, then rebuild from the intended Git commit. Vite asset filenames are hashed, so do not persist those URLs in the database; use stable public paths or backend object storage for long-lived media.
