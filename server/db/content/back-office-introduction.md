# Back Office Introduction

**OBO** (“on behalf of”) is the internal admin console hire agents use to operate the Hire platform.

| Service | Typical local port | Notes |
| --- | --- | --- |
| OBO UI (`obo_ui2`) | ~3307 | Agent console |
| OBO API (`obo_backend`) | ~8082 | Auth + ops APIs |
| DB | `elitepro_obo` | Stage/prod pools via toggle when enabled |

## Core workflows (UI paths)

| Workflow | Path | What you do |
| --- | --- | --- |
| Approve Identity | `/approveidentity` | Review Hire IDV document submissions |
| Interview Management | `/interview-verification` | Interview slot verification |
| Suspension | `/suspension`, `/createSuspension` | Overlaps TNS — confirm system of record |
| Dispute | `/dispute`, `/disputeDashboard` | Dispute handling |
| Fraud Detection | `/FraudDetection` | Fraud review |
| Bank / Withdrawal | `/BankAccountApprovalRequest`, `/withdrawalRequest` | Financial ops |
| Intern → Freelancer | `/intern-conversion` | Conversion approval queue |
| Help and Support | `/help-and-support` | Agent support dashboard |
| Trust KPI | `/kpi/trust` | Metrics; suspensions often filtered via TNS |

## Roles (access)

OBO uses route-based RBAC. Typical types:

| Role | Typical access |
| --- | --- |
| admin | Full routes / bypass |
| agent | Identity, suspensions, dispute, withdrawal, bank, interview |
| viewer | Read-ish subset |
| support | Messaging + interview/support |

Sidebar filtering uses `hasRouteAccess` / `RequireRouteAccess`. If a menu item is missing, you likely lack that route — do not work around via shared logins.

## Stage vs production DB toggle

When enabled:

- Backend honors `X-OBO-DB-ENV`
- UI shows Stage / Prod toggle

**Switching env forces re-login.** Default without header is **stage**. Never assume you are on prod without checking the toggle.

## Identity approval vs IDV liveness

| Step | System |
| --- | --- |
| User uploads docs / completes Hire stages | Hire IDV |
| Agent reviews / approves identity | **OBO** Approve Identity |
| Meet booking + IDV join link | **Hire backend** (not OBO timing) |

If a user says “I booked liveness but can’t join,” start with IDV Common Errors / engineering — not OBO slot tables.

## DO

- Confirm Stage vs Prod before mutating data
- Work only queues your role can access

## DON'T

- Share OBO credentials
- Force-approve to clear queue pressure

## Escalate when

- Wrong DB env may have caused a production change
- Route access blocks a case you were assigned
- Suspension ownership between OBO and TNS is unclear
