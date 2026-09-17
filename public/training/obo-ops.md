# OBO operations

**OBO** (“on behalf of”) is the internal admin console hire agents use to operate the Hire platform.

| Service | Path | Default local port |
| --- | --- | --- |
| OBO UI | `obo_ui2` | ~3307 |
| OBO API | `obo_backend` | ~8082 |
| DB | `elitepro_obo` | stage/prod pools via toggle |

Canonical access testing: `obo_backend/TESTING_README.md`.

## Core workflows (UI)

| Workflow | Path | Backend relevance |
| --- | --- | --- |
| Approve Identity | `/approveidentity` | Reviews Hire IDV document submissions |
| Interview Management | `/interview-verification` | Interview slot verification |
| Suspension list / create | `/suspension`, `/createSuspension` | Overlaps TNS — confirm product of record |
| Dispute / Dispute Verify | `/dispute`, `/disputeDashboard` | Dispute handling |
| Fraud Detection | `/FraudDetection` | Fraud review |
| Bank / Withdrawal | `/BankAccountApprovalRequest`, `/withdrawalRequest` | Financial ops |
| Intern → Freelancer | `/intern-conversion` | Admin conversion queue |
| Help and Support | `/help-and-support` | Agent support dashboard |
| Trust KPI | `/kpi/trust` | Metrics; suspensions often filtered via TNS API |

## Roles (local matrix)

Local seed users (password `password` **local only** — never reuse in prod):

| Role | Example email | Typical access |
| --- | --- | --- |
| admin | `obo-agent@airepro.in` | Full routes / bypass |
| agent | `obo-agent-ops@airepro.in` | Identity, suspensions, dispute, withdrawal, bank, interview |
| viewer | `obo-viewer@airepro.in` | Read-ish subset |
| support | `obo-support@airepro.in` | Messaging + interview/support |

Route ids `1`–`18` (identity, suspensions, dispute, withdrawal, bank, fraud, interview, intern conversion, …) are gated in UI via `hasRouteAccess` / `RequireRouteAccess`. See `TESTING_README.md` for the full matrix.

## Stage vs production DB toggle

When enabled:

- Backend: `ENABLE_DB_ENV_TOGGLE=true` honors `X-OBO-DB-ENV`
- UI: `VITE_ENABLE_DB_ENV_TOGGLE=true` shows Stage / Prod toggle

Switching env **forces re-login**. Default without header is **stage**.

## Schema align (ops awareness)

Additive Stage↔Prod schema sync lives under `obo_backend/scripts/schemaAlign.js` + allowlists. Always dry-run and review `planned_ddl.sql` before apply. Not day-to-day agent work — backend ownership.

## Identity approval vs IDV liveness

| Step | System |
| --- | --- |
| User uploads docs / completes Hire stages | Hire IDV |
| Agent reviews / approves identity | **OBO** Approve Identity |
| Meet booking + IDV join link | **Hire backend** (not OBO timing) |

If a user says “I booked liveness but can’t join,” start with [IDV backend ops](/training/idv-backend-ops), not OBO slot tables.

## Next

- [Trust & Safety](/training/trust-and-safety) — suspension system of record
- [Troubleshooting](/training/troubleshooting)
