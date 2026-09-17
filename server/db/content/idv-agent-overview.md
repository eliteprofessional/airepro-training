# IDV Agent Overview

Identity Verification (IDV) confirms who a Hire user is so they can apply, unlock marketplace actions, and complete payouts.

## Where the user works

Hire: **Settings → Identity Verification** (`/dashboard/settings/identity_verification`).

## Paths by role (user-facing stages)

### Intern or Freelancer

1. Identity Verification (PAN & Aadhaar)
2. Education Verification
3. Skill Evaluation
4. Bank Verification
5. Visual Verification (document upload + liveness / Airepro Meet)

### Client or TSM

1. Authorized person identity
2. Business Verification
3. Bank Verification
4. Visual Verification (document upload + liveness / Airepro Meet)

Stages complete **in order** — later stages stay locked until earlier ones are approved.

## Your OBO role

| Step | System |
| --- | --- |
| User uploads docs / completes Hire stages | Hire IDV |
| Agent reviews / approves identity documents | **OBO** `/approveidentity` |
| Meet booking + IDV join link | **Hire backend** + Meet + IDV server |

## Liveness path (what engineering owns)

Happy path (condensed):

1. User books Meet for IDV liveness.
2. Meet webhooks Hire → `liveness_idv_bookings`.
3. Hire registers IDV verification and generates an **`idv.airepro.in`** join link (never a Google Meet placeholder).
4. User joins liveness session.

If the customer says “I booked but can’t join,” treat it as a **liveness / Meet / IDV server** issue first — not an OBO slot table issue.

## Order of checks for document review

1. Consent / authorization to process identity
2. Document readable (no blur/glare/crop; not expired)
3. Identity fields match profile / other docs
4. Face / visual checks as required by stage
5. Fraud / suspicious signals → do not force-approve

## Related

- SOP-IDV-001 Verification
- SOP-IDV-002 Rejection
- SOP-IDV-003 Escalation
- IDV Common Errors
- IDV Decision Guide
