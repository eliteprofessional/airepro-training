# Failed Payment SOP

**SOP-PAY-001**

## Purpose

Guide agents when Airepro payment status is FAILED (or customer reports a failed payment).

## When to use

Customer or system shows payment failure; you need to decide inform / wait / reconcile / escalate.

## Before you start

- Collect Airepro transaction ID
- Do not refund before provider check

## Step 1 — Confirm Airepro status

### Check

- Status is FAILED (or equivalent)
- Amount, user, timestamp

### Expected result

Failure confirmed in Airepro.

## Step 2 — Identify provider

### Check

- Razorpay vs Cashfree vs other
- Provider reference / order id if present

### Expected result

Correct provider console selected.

## Step 3 — Check provider response

### Check

- SUCCESS / FAILED / PENDING / UNKNOWN

### Expected result

Branch selected:

- Provider FAILED → customer typically **not charged** → inform + retry guidance
- Provider SUCCESS → **Charged but failed** SOP
- PENDING → wait/recheck with follow-up
- UNKNOWN → Payment Escalation SOP

## Step 4 — Communicate

### Check

- Customer message matches facts (no guessing)
- Ticket notes include both IDs

### Expected result

Customer has a clear next step; case documented.

## Escalate when

- Provider success but Airepro failed
- Duplicate charge
- High-value mismatch
- Provider UI unavailable / unknown status
