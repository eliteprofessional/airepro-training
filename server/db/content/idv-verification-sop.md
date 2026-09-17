# Identity Verification — Standard Agent Procedure

**SOP-IDV-001** · Status: ACTIVE (training v1.1)

## Purpose

Approve identity verification when all required checks pass in OBO Approve Identity and Hire stage state is consistent.

## When to use

User submitted IDV documents / stages and the case appears in `/approveidentity` (or equivalent queue).

## Before you start

- Confirm your role includes Approve Identity access
- Confirm Stage vs Prod if the toggle is enabled
- Open the case in OBO — do not ask the customer to resend IDs over chat

## Step 1 — Consent / authorization

### Check

- Consent or authorized-person attestation is present for the stage
- For Client/TSM: documents belong to the **authorized person**, not a random employee

### Expected result

Consent is present. If missing → stop (see Decision Guide) and request consent; do not approve.

## Step 2 — Document readability

### Check

- No blur, glare, heavy crop
- Edges and text visible; document not expired
- Names spelled consistently with Hire profile where required

### Expected result

Document is usable. If not → request new capture (do not guess fields).

## Step 3 — Identity match

### Check

- Name, DOB, document numbers vs profile / companion docs
- Intern/Freelancer: PAN & Aadhaar path expectations
- Client/TSM: authorized person PAN / Aadhaar last 4 / designation

### Expected result

Fields match within policy. Clear mismatch → Rejection SOP; ambiguous + risk → Escalation SOP.

## Step 4 — Visual / liveness awareness

### Check

- Visual verification / liveness stage status in Hire if applicable
- Join links for liveness must be `idv.airepro.in` — Google Meet placeholders are invalid

### Expected result

You understand whether remaining blockers are **document approval** (you) vs **liveness engineering** (Hire/Meet/IDV).

## Step 5 — Approve

### Check

- No open fraud flags you are required to escalate
- Correct reason/notes if the UI requires them

### Expected result

Stage/status updates to approved in system of record.

## DO

- Follow check order: consent → readable → match → risk → approve
- Document outcomes in OBO/Hire fields

## DON'T

- Approve without consent
- Guess unreadable fields
- Force-approve to clear the queue

## Escalate when

- Document appears altered
- High-confidence mismatch with fraud signals
- System prevents completion unexpectedly
- Liveness booked but join link never becomes `idv.airepro.in` (engineering)

## Related SOPs

- SOP-IDV-002 Rejection
- SOP-IDV-003 Escalation
- IDV Decision Guide
