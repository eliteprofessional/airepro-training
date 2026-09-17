# Deployment

## Split containers (preferred)

| Service | Domain | Port |
| --- | --- | --- |
| Frontend nginx | `training.airepro.in` | `410` |
| API | `training-s.airepro.in` | `1411` |

Staging: `training-staging.airepro.in` / `training-s-staging.airepro.in` via env overrides.

## Volumes

- `airepro-training-content` → `/app/public/training` (legacy markdown seed)  
- `airepro-training-data` → `/app/data` (SQLite)

## Required secrets

- `TRAINING_JWT_SECRET` (or `ADMIN_TOKEN_SECRET`)  
- `AUTH_MODE=obo`  
- `OBO_API_BASE_URL`  
- `CORS_ORIGIN` / `VITE_API_BASE_URL`

Jenkins: `/var/lib/jenkins/.secrets/airepro-training.env`

```bash
docker compose up --build -d
```

Health: `GET /api/health`
