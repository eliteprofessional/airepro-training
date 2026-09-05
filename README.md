# Airepro Support

Standalone React + Vite documentation portal for Airepro (AD-1471), with a co-located Express admin API for CRUD on support markdown.

Independent of `hireFrontend` and other monorepo frontends. UI theme matches [stage.airepro.in](https://stage.airepro.in/) (magenta/violet accents, Inter/Poppins, Airepro logo).

## Stack

- React 19 + Vite (JSX)
- `react-router-dom`, `react-markdown`, `remark-gfm`, `rehype-sanitize`
- Express API reading/writing `public/support/*.md` + `public/support/resources.json`
- Shared `ADMIN_PASSWORD` → JWT (Bearer + httpOnly cookie)

## Quick start

```bash
cp .env.example .env
# set ADMIN_PASSWORD and ADMIN_TOKEN_SECRET (and other REPLACE_ME values)
npm install
npm run dev
```

- Public app (Vite): http://127.0.0.1:5174/support  
- API (Express): http://127.0.0.1:8787/api/…  
- Admin: http://127.0.0.1:5174/admin/login  

Vite listens on **5174** (avoids clashing with Hire on 5173) and proxies `/api` to Express in development.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite + Express together |
| `npm run dev:web` | Vite only |
| `npm run dev:server` | Express API only |
| `npm run build` | Production frontend build → `dist/` |
| `npm start` | Serve `dist/` + API + writable support files (set `NODE_ENV=production`) |
| `npm run preview` | Vite static preview (no admin API) |

Production (single Node process):

```bash
npm run build
npm start
```

Open http://localhost:8787/support (port from `PORT`).

## Environment

See [`.env.example`](.env.example) — copy to `.env` and replace placeholders before deploy.

| Variable | Description |
| --- | --- |
| `DOMAIN` | Public frontend hostname (`support.airepro.in`) |
| `BACKEND_DOMAIN` | Public API hostname (`support-s.airepro.in`) |
| `FRONTEND_PORT` | Host port for SPA container (default `409`) |
| `BACKEND_PORT` | Host port for API container (default `1410`) — tunnel target for `support-s` |
| `VITE_API_BASE_URL` | Public API origin baked into the SPA (`https://support-s.airepro.in`) |
| `CORS_ORIGIN` | Allowed frontend origin(s) for API CORS (`https://support.airepro.in`) |
| `PORT` | Express listen port **inside** the container / local Node (default `8787`) |
| `HOST` | Bind address (default `0.0.0.0`) |
| `SERVE_FRONTEND` | `true` only for combined single-container mode |
| `ADMIN_PASSWORD` | Shared password for `/admin/login` |
| `ADMIN_TOKEN_SECRET` | JWT signing secret |

Do not commit `.env`. For Jenkins, copy `ADMIN_*` (and any overrides) to `/var/lib/jenkins/.secrets/airepro-support.env` on the agent.

## Changing content later

Catalog + bodies live under `public/support/`. Prefer the **Admin UI** so files and `resources.json` stay in sync.

### Local / repo edits

1. Open http://127.0.0.1:5174/admin/login (or production Admin URL).
2. Create / edit / delete documents — each save writes `public/support/<slug>.md` and updates `resources.json`.
3. Or edit files by hand:
   - Add `public/support/my-doc.md`
   - Add a matching entry in `public/support/resources.json` (`id`, `slug`, `title`, `description`, `file`, `preview`)
4. Slugs must match `[a-z0-9-]+`.

Commit and push markdown/catalog changes if you want them in the image seed; otherwise production edits persist on the Docker volume (below).

### Production (Docker / Jenkins)

| What | Where |
| --- | --- |
| Live content | Docker volume `airepro-support-content` → `/app/public/support` |
| Seed (first boot only) | Files baked into the backend image from `public/support/` |

On first start, if the volume has no `resources.json`, the entrypoint copies the image seed into the volume. **Later edits via Admin** update the volume only — they are not overwritten by redeploys.

To reset production content to the repo seed: remove/recreate the volume (destructive), then redeploy.

```bash
# inspect live files on the agent (example)
docker exec -it airepro-support-backend ls -la /app/public/support
```

## Content layout

```
public/support/
  resources.json    # catalog (source of truth for cards + API)
  *.md              # document bodies (one file per slug)
```

Public portal loads the catalog from `GET /api/support/resources`. Markdown is served by the **backend** at `/support/<slug>.md` (not from the SPA nginx image).

## Public routes

| Path | Page |
| --- | --- |
| `/` | Redirects to `/support` |
| `/support` | Landing / catalog |
| `/support/:slug` | Markdown preview |

## Admin routes

| Path | Page |
| --- | --- |
| `/admin/login` | Password login |
| `/admin` | Document list |
| `/admin/documents/new` | Create |
| `/admin/documents/:slug/edit` | Edit |

Auth model: one shared password (not multi-user SSO). Login returns a JWT stored in `sessionStorage` and also sets an httpOnly cookie. Mutating admin API routes require a valid token.

### Admin API

- `POST /api/admin/login` `{ "password": "…" }`
- `POST /api/admin/logout`
- `GET /api/admin/documents` (auth)
- `GET /api/admin/documents/:slug` (auth, includes markdown)
- `POST /api/admin/documents` (auth)
- `PUT /api/admin/documents/:slug` (auth)
- `DELETE /api/admin/documents/:slug` (auth)

Path traversal is rejected.

## Docker (split frontend / backend)

Production targets:

| Service | Host | Host port | Container |
| --- | --- | --- | --- |
| Frontend | `support.airepro.in` | `409` | nginx SPA |
| Backend | `support-s.airepro.in` | `1410` | Express API + markdown |

```bash
cp .env.example .env
# set strong ADMIN_PASSWORD and ADMIN_TOKEN_SECRET
docker compose up --build -d
```

- Frontend: http://localhost:409/support  
- Backend health: http://localhost:1410/api/health  
- Admin UI: http://localhost:409/admin/login  

Point reverse proxies / Cloudflare Tunnel:

- `support.airepro.in` → host port **409**
- `support-s.airepro.in` → host port **1410**

Compose builds:

- `Dockerfile.frontend` with `VITE_API_BASE_URL=https://support-s.airepro.in` (markdown folder is stripped from the SPA image so `/support` is not a static directory)
- `Dockerfile.backend` with `CORS_ORIGIN=https://support.airepro.in`
- Volume `support-content` / `airepro-support-content` persists admin-edited markdown/catalog

```bash
docker compose logs -f
docker compose ps
docker compose down
```

Optional combined image (API serves SPA too): `docker build -f Dockerfile -t airepro-support:all-in-one .` with `SERVE_FRONTEND=true`.

## Jenkins

Repo root [`Jenkinsfile`](Jenkinsfile) deploys both containers on the agent:

| Service | Domain | Loopback port |
| --- | --- | --- |
| Frontend | `support.airepro.in` | `409` |
| Backend | `support-s.airepro.in` | `1410` |

Provide `ADMIN_PASSWORD` and `ADMIN_TOKEN_SECRET` as Jenkins job env, or place them in `~/.secrets/airepro-support.env` on the agent. If the Jenkins user cannot talk to Docker, set job env `DOCKER=sudo docker`.

## Deploy notes

Prefer **split** frontend/backend: SPA on `support.airepro.in:409`, API on `support-s.airepro.in:1410`. The SPA calls the API via `VITE_API_BASE_URL`; markdown files are served by the backend under `/support/*.md`.

## Out of scope

Search, categories, OAuth/SSO, databases, and any imports from `hireFrontend`.
