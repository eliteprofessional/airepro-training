# Airepro Agent Training & Operations Portal

Internal portal for Airepro back-office agents: training courses, SOPs, decision guides, quizzes, and certifications.

**Domains:** `training.airepro.in` (SPA) · `training-s.airepro.in` (API)  
**Staging (env):** `training-staging.airepro.in` / `training-s-staging.airepro.in`

This is **not** a public learning site. Agents must be provisioned (OBO + training access).

## Stack

- React 19 + Vite
- Express API + SQLite (`node:sqlite`)
- OBO auth (`AUTH_MODE=obo`) or local demo auth (`AUTH_MODE=demo`)
- JWT sessions (`TRAINING_JWT_SECRET`)

See `docs/training/` for ARCHITECTURE, RBAC, CONTENT_MODEL, SOP_GUIDELINES, ADMIN_GUIDE, DEPLOYMENT, SECURITY.

## Quick start (demo mode)

```bash
cp .env.example .env
# AUTH_MODE=demo (default)
# set TRAINING_JWT_SECRET to any long string
npm install
npm run dev
```

- App: http://127.0.0.1:5174/login  
- API: http://127.0.0.1:8787/api/health  

### Demo credentials

| Email | Password | Role |
| --- | --- | --- |
| `admin@airepro.local` | `demo-admin` | SUPER_ADMIN |
| `idv@airepro.local` | `demo-agent` | IDV_AGENT |
| `payment@airepro.local` | `demo-agent` | PAYMENT_AGENT |
| `support@airepro.local` | `demo-agent` | SUPPORT_AGENT |
| `ops@airepro.local` | `demo-agent` | OPERATIONS_AGENT |
| `trainer1@airepro.local` | `Train@2026` | IDV_AGENT (Priya Sharma) |
| `trainer2@airepro.local` | `Train@2026` | PAYMENT_AGENT (Rahul Mehta) |
| `trainer3@airepro.local` | `Train@2026` | SUPPORT_AGENT (Ananya Gupta) |
| `trainer4@airepro.local` | `Train@2026` | OPERATIONS_AGENT (Vikram Singh) |
| `trainer5@airepro.local` | `Train@2026` | FRAUD_AGENT (Neha Kapoor) |

Early production (`training.airepro.in`) uses `AUTH_MODE=demo` so these accounts work. Switch to `AUTH_MODE=obo` when OBO identities are ready.

Reset DB + reseed: `npm run db:reset`

Seed markdown lives in `server/db/content/`. Wave 1 docs are **PUBLISHED**; Wave 2 (Support/Jobs/Refunds/fraud) stay **IN_REVIEW** until ops approves (admins can still open them).

## OBO auth (stage/prod)

```env
AUTH_MODE=obo
OBO_API_BASE_URL=http://localhost:8082/api/v1
TRAINING_JWT_SECRET=...
```

Login calls `POST {OBO_API_BASE_URL}/auth/login`. Users are linked on first success; access requires `training_access` (auto when OBO role maps to a training role, else admin provisions in `/admin/users`).

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite + API |
| `npm run build` | Production SPA → `dist/` |
| `npm start` | API (+ SPA if `SERVE_FRONTEND=true`) |
| `npm test` | Auth, RBAC, quiz, certification tests |
| `npm run db:reset` | Wipe SQLite and reseed |

## End-to-end agent flow

1. Sign in → `/dashboard` (role, progress, required courses)  
2. **My Training** → complete lessons  
3. **SOPs** / **Decision Guides** → walk procedures  
4. **Quizzes** → submit → certification issued  
5. Admin (`/admin`) → manage documents, users, certs, announcements  

## Environment

See `.env.example`. Important vars:

- `AUTH_MODE` — `demo` \| `obo`  
- `OBO_API_BASE_URL` — OBO API prefix ending in `/api/v1`  
- `TRAINING_JWT_SECRET` — session signing  
- `TRAINING_DB_PATH` — SQLite file  
- `VITE_API_BASE_URL` / `CORS_ORIGIN` / `DOMAIN` — no hard-coded prod URLs in code  

## Docker / Jenkins

Split FE/BE compose + Jenkins pipeline retained. Volumes:

- content: `airepro-training-content`  
- data: `airepro-training-data` (SQLite)

```bash
docker compose up --build -d
```

## Phases

**Delivered:** Phase 1–8 (foundation, OBO/demo auth, RBAC, courses/docs, SOPs, decision trees, quizzes, certifications, admin CMS, docs, tests).

**Deferred (Phase 9+):** Back Office certification gating, full analytics, full security audit suite, expanded prod deploy infra beyond current Docker/Jenkins.
