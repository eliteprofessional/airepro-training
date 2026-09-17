# Airepro Training

Standalone React + Vite documentation portal for **backend-team training** on Hire **IDV**, **OBO**, and **Trust & Safety** operations. Co-located Express admin API for CRUD on training markdown.

Independent of `hireFrontend` and end-user [Airepro Support](https://support.airepro.in/). Deployed separately at **https://training.airepro.in**.

## Stack

- React 19 + Vite (JSX)
- `react-router-dom`, `react-markdown`, `remark-gfm`, `rehype-sanitize`
- Express API reading/writing `public/training/*.md` + `public/training/resources.json`
- Shared `ADMIN_PASSWORD` → JWT (Bearer + httpOnly cookie)

## Quick start

```bash
cp .env.example .env
# set ADMIN_PASSWORD and ADMIN_TOKEN_SECRET (and other REPLACE_ME values)
# for local: leave VITE_API_BASE_URL empty so Vite serves /api via proxy
npm install
npm run dev
```

- Public app (Vite): http://127.0.0.1:5174/training  
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
| `npm start` | Serve `dist/` + API + writable training files (set `NODE_ENV=production`) |
| `npm run preview` | Vite static preview (no admin API) |

Production (single Node process):

```bash
npm run build
npm start
```

Open http://localhost:8787/training (port from `PORT`).

## Environment

See [`.env.example`](.env.example) — copy to `.env` and replace placeholders before deploy.

| Variable | Description |
| --- | --- |
| `DOMAIN` | Public frontend hostname (`training.airepro.in`) |
| `BACKEND_DOMAIN` | Public API hostname (`training-s.airepro.in`) |
| `FRONTEND_PORT` | Host port for SPA container (default `410`) |
| `BACKEND_PORT` | Host port for API container (default `1411`) — tunnel target for `training-s` |
| `VITE_API_BASE_URL` | Public API origin baked into the SPA (`https://training-s.airepro.in`) |
| `CORS_ORIGIN` | Allowed frontend origin(s) for API CORS (`https://training.airepro.in`) |
| `PORT` | Express listen port **inside** the container / local Node (default `8787`) |
| `HOST` | Bind address (default `0.0.0.0`) |
| `SERVE_FRONTEND` | `true` only for combined single-container mode |
| `ADMIN_PASSWORD` | Shared password for `/admin/login` |
| `ADMIN_TOKEN_SECRET` | JWT signing secret |

Do not commit `.env`. For Jenkins, copy `ADMIN_*` (and any overrides) to `/var/lib/jenkins/.secrets/airepro-training.env` on the agent.

## Changing content later

Catalog + bodies live under `public/training/`. Prefer the **Admin UI** so files and `resources.json` stay in sync.

### Local / repo edits

1. Open http://127.0.0.1:5174/admin/login (or production Admin URL).
2. Create / edit / delete documents — each save writes `public/training/<slug>.md` and updates `resources.json`.
3. Or edit files by hand:
   - Add `public/training/my-doc.md`
   - Add a matching entry in `public/training/resources.json` (`id`, `slug`, `title`, `description`, `file`, `preview`)
4. Slugs must match `[a-z0-9-]+`.

Commit and push markdown/catalog changes if you want them in the image seed; otherwise production edits persist on the Docker volume (below).

### Seeded guides (v1)

| Slug | Topic |
| --- | --- |
| `overview` | How IDV, OBO, and TNS relate |
| `idv-backend-ops` | Hire IDV, Meet liveness, webhooks, smoke |
| `obo-ops` | OBO console workflows and roles |
| `trust-and-safety` | TNS modules and suspension authority |
| `troubleshooting` | First-look failure checklist |

### Production (Docker / Jenkins)

| What | Where |
| --- | --- |
| Live content | Docker volume `airepro-training-content` → `/app/public/training` |
| Seed (first boot only) | Files baked into the backend image from `public/training/` |

On first start, if the volume has no `resources.json`, the entrypoint copies the image seed into the volume. **Later edits via Admin** update the volume only — they are not overwritten by redeploys.

To reset production content to the repo seed: remove/recreate the volume (destructive), then redeploy.

```bash
# inspect live files on the agent (example)
docker exec -it airepro-training-backend ls -la /app/public/training
```

## Content layout

```
public/training/
  resources.json    # catalog (source of truth for cards + API)
  *.md              # document bodies (one file per slug)
```

Public portal loads the catalog from `GET /api/training/resources`. Markdown is served by the **backend** at `/training/<slug>.md` (not from the SPA nginx image).

## Public routes

| Path | Page |
| --- | --- |
| `/` | Redirects to `/training` |
| `/training` | Landing / catalog |
| `/training/:slug` | Markdown preview |

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
| Frontend | `training.airepro.in` | `410` | nginx SPA |
| Backend | `training-s.airepro.in` | `1411` | Express API + markdown |

```bash
cp .env.example .env
# set strong ADMIN_PASSWORD and ADMIN_TOKEN_SECRET
docker compose up --build -d
```

- Frontend: http://localhost:410/training  
- Backend health: http://localhost:1411/api/health  
- Admin UI: http://localhost:410/admin/login  

Point reverse proxies / Cloudflare Tunnel:

- `training.airepro.in` → host port **410**
- `training-s.airepro.in` → host port **1411**

Compose builds:

- `Dockerfile.frontend` with `VITE_API_BASE_URL=https://training-s.airepro.in` (markdown folder is stripped from the SPA image so `/training` is not a static directory)
- `Dockerfile.backend` with `CORS_ORIGIN=https://training.airepro.in`
- Volume `training-content` / `airepro-training-content` persists admin-edited markdown/catalog

```bash
docker compose logs -f
docker compose ps
docker compose down
```

Optional combined image (API serves SPA too): `docker build -f Dockerfile -t airepro-training:all-in-one .` with `SERVE_FRONTEND=true`.

## Jenkins

Repo root [`Jenkinsfile`](Jenkinsfile) deploys both containers on the agent:

| Service | Domain | Loopback port |
| --- | --- | --- |
| Frontend | `training.airepro.in` | `410` |
| Backend | `training-s.airepro.in` | `1411` |

Provide `ADMIN_PASSWORD` and `ADMIN_TOKEN_SECRET` as Jenkins job env, or place them in `~/.secrets/airepro-training.env` on the agent. If the Jenkins user cannot talk to Docker, set job env `DOCKER=sudo docker`.

Create a **new Jenkins job** (do not reuse the support job) pointed at this repository.

## Separate GitHub repo (required before push)

This folder still has its own `.git`. Until a dedicated remote exists, **do not push** to `eliteprofessional/airepro-support`.

1. Create empty GitHub repo: `eliteprofessional/airepro-training`
2. Retarget and push:

```bash
cd airepro-training
git remote set-url origin git@github.com:eliteprofessional/airepro-training.git
git remote -v
# commit local training changes, then:
git push -u origin main
```

3. Wire Cloudflare Tunnel / reverse proxy to ports **410** / **1411**
4. Add Jenkins secrets file and run the pipeline

## Deploy notes

Prefer **split** frontend/backend: SPA on `training.airepro.in:410`, API on `training-s.airepro.in:1411`. The SPA calls the API via `VITE_API_BASE_URL`; markdown files are served by the backend under `/training/*.md`.

## Out of scope

Search facets, categories, OAuth/SSO, databases, and any imports from `hireFrontend`. End-user Hire help remains on `support.airepro.in`.
