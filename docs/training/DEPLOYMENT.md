# Deployment

## Split containers (preferred)

| Service | Domain | Port |
| --- | --- | --- |
| Frontend nginx | `training.airepro.in` | `1918` |
| API | `training-s.airepro.in` | `1919` |

Staging: `training-staging.airepro.in` / `training-s-staging.airepro.in` via env overrides.

## Volumes

- `airepro-training-content` → `/app/public/training` (legacy markdown seed)  
- `airepro-training-data` → `/app/data` (SQLite)

## Required secrets

- `TRAINING_JWT_SECRET` (or `ADMIN_TOKEN_SECRET`)  
- `AUTH_MODE=demo` for seeded `@airepro.local` accounts (default early prod); set `obo` + `OBO_API_BASE_URL` when cutting over  
- `CORS_ORIGIN` / `VITE_API_BASE_URL`

Jenkins: `/var/lib/jenkins/.secrets/airepro-training.env` — ensure `AUTH_MODE=demo` (or set Jenkins job `AUTH_MODE=demo`; deploy passes it after `--env-file`).

```bash
docker compose up --build -d
```

Health: `GET /api/health`
