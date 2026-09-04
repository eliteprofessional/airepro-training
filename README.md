# Airepro Support

Standalone React + Vite documentation portal for Airepro (AD-1471), with a co-located Express admin API for CRUD on support markdown.

Independent of `hireFrontend` and other monorepo frontends.

## Stack

- React 19 + Vite (JSX)
- `react-router-dom`, `react-markdown`, `remark-gfm`, `rehype-sanitize`
- Express API reading/writing `public/support/*.md` + `public/support/resources.json`
- Shared `ADMIN_PASSWORD` → JWT (Bearer + httpOnly cookie)

## Quick start

```bash
cp .env.example .env
# edit ADMIN_PASSWORD and ADMIN_TOKEN_SECRET
npm install
npm run dev:all
```

- Public app (Vite): http://127.0.0.1:5174/support  
- API (Express): http://127.0.0.1:8787/api/…  
- Admin: http://127.0.0.1:5174/admin/login  

Vite listens on **5174** (avoids clashing with Hire on 5173) and proxies `/api` to Express in development.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite only |
| `npm run dev:server` | Express API only |
| `npm run dev:all` | Vite + Express together |
| `npm run build` | Production frontend build → `dist/` |
| `npm start` | Serve `dist/` + API + writable support files (set `NODE_ENV=production`) |
| `npm run preview` | Vite static preview (no admin API) |

Production:

```bash
npm run build
npm start
```

Open http://localhost:8787/support (port from `PORT`).

## Environment

See `.env.example`:

| Variable | Description |
| --- | --- |
| `PORT` | Express listen port (default `8787`) |
| `HOST` | Bind address (default `0.0.0.0`) |
| `ADMIN_PASSWORD` | Shared password for `/admin/login` |
| `ADMIN_TOKEN_SECRET` | JWT signing secret |

Do not commit `.env`.

## Docker

Single production service: Express API + built SPA + writable support docs.

```bash
cp .env.example .env
# set strong ADMIN_PASSWORD and ADMIN_TOKEN_SECRET
docker compose up --build -d
```

Open http://localhost:8787/support (and `/admin/login`).

- Image build is multi-stage (`Dockerfile`)
- Compose maps port `8787` and mounts volume `support-content` for persisted markdown/catalog
- On first boot, empty volumes are seeded from the image’s support docs

Useful commands:

```bash
docker compose logs -f airepro-support
docker compose ps
docker compose down
```

## Content layout

```
public/support/
  resources.json    # catalog (source of truth)
  *.md              # document bodies
```

Public portal loads the catalog from `GET /api/support/resources`. Markdown is still served as static files at `/support/<slug>.md` for preview and download.

## Public routes

| Path | Page |
| --- | --- |
| `/` | Redirects to `/support` |
| `/support` | Landing cards |
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

Slugs must match `[a-z0-9-]+`. Path traversal is rejected.

## Manual content edits

You can still add a doc by:

1. Creating `public/support/my-doc.md`
2. Adding an entry to `public/support/resources.json`

Prefer the Admin UI so catalog and files stay in sync.

## Deploy notes

Default hosting is a **single Express process**: API + `dist/` SPA + writable `public/support/`. Prefer **Docker Compose** for production-like deploys. CDN-only static hosting cannot use admin CRUD unless the Node server is running.

## Out of scope

Search, categories, OAuth/SSO, databases, and any imports from `hireFrontend`.
