# Troubleshooting

First-look checklist for backend engineers. Prefer reading the dedicated guide after you identify the surface.

## IDV / liveness

| Symptom | Check first |
| --- | --- |
| Booked in Meet but Hire shows no slot | Meet webhook → Hire logs; `MEET_BOOKING_WEBHOOK_SECRET`; row in `liveness_idv_bookings` |
| Slot exists but no Join button | `meet_link` still null or still Google placeholder; registration path / IDV API |
| Email has wrong / missing link | Email template + `ensureMeetLinkOnBooking` / IDV generate; must be `idv.airepro.in` |
| Signature / 401 on webhook | HMAC header `x-meet-booking-signature` vs secret mismatch |
| IDV API errors | `IDV_SERVER_URL`, credentials, `credential` diagnostic tooling |

Smoke scripts: `backend/scripts/smoke-meet-booking-webhook.mjs`, `smoke-idv-webhook.mjs`.  
Deep dive: [IDV backend operations](/training/idv-backend-ops) and `backend/docs/idv_liveness.md`.

## OBO

| Symptom | Check first |
| --- | --- |
| Login works but empty sidebar | Role seed / route matrix; wrong DB env (stage vs prod) |
| Toggle Stage↔Prod “breaks” session | Expected — forced re-login after env switch |
| Approve Identity queue stale | Hire IDV submission state vs OBO filters; hire DB connectivity |
| Trust KPI suspensions wrong | TNS internal active-suspensions API + `TNS_BASE_URL` |

Deep dive: [OBO operations](/training/obo-ops), `obo_backend/TESTING_README.md`.

## Trust & Safety

| Symptom | Check first |
| --- | --- |
| Suspension in OBO ≠ TNS | Which product wrote the row; TNS as SoR |
| FE cannot load cases | `trustNSafety-f` API base URL; TNS BE health |
| KPI filter empty | Network path from OBO BE → TNS internal endpoint |

Deep dive: [Trust & Safety](/training/trust-and-safety).

## Escalation map

| If stuck on… | Escalate / open |
| --- | --- |
| Meet booking product | Meet service owners |
| IDV session creation | IDV server (`obo-idv-interview-tns/idv`) |
| Hire persistence / webhooks | Hire `backend` owners |
| OBO roles / schema | `obo_backend` owners |
| Suspension SoR | `trustNSafety-b` owners |

## Keeping this portal updated

Edit guides via `/admin` on this site (writes `public/training/*.md` + `resources.json`). Production content persists on Docker volume `airepro-training-content`.
