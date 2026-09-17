# Platform overview

Audience: **backend engineers** supporting Hire identity verification (IDV), the OBO ops console, and Trust & Safety (TNS).

This portal is internal training — not end-user Hire help (`support.airepro.in`).

## How the three systems relate

```
Hire user  →  IDV wizard (hireFrontend)  →  Hire backend
                                           ├─ documents / bank / education stages
                                           ├─ Meet booking webhook
                                           └─ IDV server (liveness session)

OBO agent  →  obo_ui2  →  obo_backend  →  Hire APIs (+ KPI reads from TNS)

TNS analyst →  trustNSafety-f  →  trustNSafety-b (external repo)
                                  └─ system of record for suspensions
```

| Surface | Repo (stage workspace) | Role |
| --- | --- | --- |
| Hire IDV UI / API | `hireFrontend`, `backend` | User completes verification; backend owns bookings + webhooks |
| External IDV server | `obo-idv-interview-tns/idv` (outside this tree) | Liveness sessions at `idv.airepro.in` / `idv-server.airepro.in` |
| OBO | `obo_ui2`, `obo_backend` | Agents approve identity, disputes, withdrawals, interviews |
| Trust & Safety FE | `trustNSafety-f` | Suspensions, fraud, KYC, safety dashboard |
| Trust & Safety BE | `obo-idv-interview-tns/trustNSafety-b` | Authoritative suspension APIs |

## Ownership cheat sheet

| Concern | Primary owner | Also touches |
| --- | --- | --- |
| Document / stage approval in Hire | OBO **Approve Identity** | Hire IDV models |
| Liveness Meet slot + join link | Hire backend + Meet + IDV server | Not OBO for slot timing |
| Active suspensions | **TNS backend** | OBO KPI Trust dashboard filters via TNS internal API |
| Disputes / withdrawals / bank | OBO | Hire / payment backends |
| Fraud signals | OBO Fraud Detection + TNS Fraud modules | Overlap — confirm which product owns the case |

## Suggested reading order

1. [IDV backend operations](/training/idv-backend-ops) — webhooks, env, smoke
2. [OBO operations](/training/obo-ops) — console routes and role matrix
3. [Trust & Safety](/training/trust-and-safety) — suspension authority
4. [Troubleshooting](/training/troubleshooting) — first-look checklist

## Related product portals

| Portal | URL | Audience |
| --- | --- | --- |
| Hire Support (end users) | `support.airepro.in` | Candidates / hiring teams |
| This Training hub | `training.airepro.in` | Backend / ops engineers |
