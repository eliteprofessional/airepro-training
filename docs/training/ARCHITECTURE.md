# Airepro Agent Training Portal — Architecture

## Purpose

Internal **Agent Training & Operations** portal for Airepro back-office agents (IDV, payments, support, jobs, internships, fraud/moderation). Not a public LMS.

## Stack

- **Frontend:** React 19 + Vite SPA (`training.airepro.in`)
- **API:** Express 5 (`training-s.airepro.in`)
- **DB:** SQLite via Node `node:sqlite` (`TRAINING_DB_PATH`), schema migratable toward MySQL later
- **Auth:** OBO login proxy (`AUTH_MODE=obo`) or local demo users (`AUTH_MODE=demo`)
- **Session:** JWT (`TRAINING_JWT_SECRET`) in Bearer header + httpOnly cookie

## Request flow

```
Browser → SPA → /api/* → Express
                      ├─ /api/auth/*     login, me, logout
                      ├─ /api/portal/*   authenticated agent APIs
                      └─ /api/admin/*    training admin APIs
Express → SQLite (users, courses, docs, quizzes, certifications, audit)
Express → OBO POST {OBO_API_BASE_URL}/auth/login  (when AUTH_MODE=obo)
```

## Domains / env

| Env | Frontend | API |
| --- | --- | --- |
| Production | `training.airepro.in` | `training-s.airepro.in` |
| Staging | `training-staging.airepro.in` | `training-s-staging.airepro.in` |
| Local | Vite `:5174` | Express `:8787` |

Never hard-code production URLs in application logic — use `DOMAIN`, `VITE_API_BASE_URL`, `CORS_ORIGIN`, `OBO_API_BASE_URL`.

## Phases delivered (1–8)

1. Foundation / evolve existing portal  
2. Portal shell (dashboard, nav)  
3. OBO + demo auth  
4. RBAC  
5. Courses + documents  
6. SOPs  
7. Decision trees  
8. Quizzes + certifications  

## Deferred (9+)

- Back Office certification gating  
- Full analytics suite  
- Full security audit program  
- Production infra beyond existing Docker/Jenkins patterns  
