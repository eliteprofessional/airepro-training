# IDV Rejection SOP

**SOP-IDV-002**

## Purpose

Reject verification with accurate reason codes so the customer knows how to remediate.

## When to use

Evidence fails policy checks (unreadable doc, mismatch, expired ID, wrong person for Client/TSM, etc.) and fraud escalation is not required.

## Before you start

- Prefer the most specific reason code available in OBO
- Do not invent free-text reasons that contradict structured codes

## Step 1 — Confirm failure mode

### Check

- Unreadable vs mismatch vs expired vs wrong document type vs wrong person
- Whether customer can remediate with a new upload

### Expected result

Clear primary failure mode selected.

## Step 2 — Reject with correct reason

### Check

- Reason matches evidence
- Notes (if required) stay in approved fields; minimize PII duplication

### Expected result

Customer receives accurate guidance; stage stays blocked until they remediate.

## Step 3 — Ambiguous cases

### Check

- Partial match + suspicious signals → Escalation SOP, not a soft approve

### Expected result

Ambiguity goes to fraud/senior review instead of an inaccurate reject.

## DO

- Choose the most accurate rejection reason
- Allow retry when policy allows remediable failures

## DON'T

- Reject as “fraud” without following Escalation SOP
- Approve “temporarily” when evidence fails

## Escalate when

- Suspected forgery or synthetic identity
- Conflicting documents across stages
- You lack a reason code that fits the evidence
