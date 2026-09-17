# Trust & Safety

**Trust & Safety (TNS)** is the platform integrity product: suspensions, fraud tooling, KYC management, compliance, and the safety dashboard.

| Layer | Location |
| --- | --- |
| Frontend | `airepro-stage/trustNSafety-f` |
| Backend | `obo-idv-interview-tns/trustNSafety-b` (**outside** airepro-stage) |

TNS is typically treated as a **single-host** product (unlike Hire’s stage/prod split). Confirm the active `TNS_BASE_URL` in OBO/Hire env before debugging KPI or suspension sync.

## What TNS owns

| Module (FE) | Purpose |
| --- | --- |
| Suspension Management | Create / list / resume suspensions |
| Safety Dashboard | Metrics, open cases, health, recent activity |
| Fraud Detection | Overview, scanner, suspension types, apply suspension |
| KYC Management | KYC workflows |
| User Management / Compliance / Permissions | Ops + access |

**Active suspensions:** treat **TNS backend** as system of record. OBO KPI Trust filtering pulls via an internal API such as:

`GET {TNS_BASE_URL}/api/internal/obo/active-suspensions`

(Exact path may evolve — check `obo_backend` KPI suspension filter service.)

## OBO vs TNS

| Action | Prefer |
| --- | --- |
| Day-to-day hire agent identity / dispute / withdrawal | **OBO** |
| Authoritative suspension state / TNS case work | **TNS** |
| Trust KPI charts in OBO | OBO UI reading Hire + TNS feeds |

OBO still exposes suspension screens (`/suspension`, `/createSuspension`). When both UIs can act, **do not assume dual-write** — verify which API the screen calls and which DB is authoritative for the incident you are handling.

## Backend engineer checklist

1. Locate `TNS_BASE_URL` / credentials in OBO and related services.
2. Confirm FE (`trustNSafety-f`) points at the intended TNS API host.
3. For KPI “missing suspensions,” check TNS internal OBO endpoint + network allowlists before blaming OBO UI.
4. Read TNS BE docs/runbooks in the external `trustNSafety-b` repo — they are not duplicated here.

## Next

- [Platform overview](/training/overview)
- [Troubleshooting](/training/troubleshooting)
