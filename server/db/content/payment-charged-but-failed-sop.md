# Payment Charged But Failed SOP

**SOP-PAY-002**

## Purpose

Reconcile cases where the **provider shows SUCCESS (customer charged)** but **Airepro shows FAILED** (or order not fulfilled).

## When to use

Provider confirmation of charge + Airepro failure / missing fulfillment.

## Before you start

- Capture provider payment id and Airepro transaction id
- Do not tell the customer “we have no record” without provider check

## Step 1 — Confirm both sides

### Check

- Provider: SUCCESS / captured / paid
- Airepro: FAILED / missing / not applied to entitlement

### Expected result

Mismatch documented with both references.

## Step 2 — Stop casual refunds

### Check

- Do not issue ad-hoc refunds outside Payments policy and tools

### Expected result

Case owned as reconciliation, not a support guess.

## Step 3 — Escalate reconciliation

### Check

- Evidence pack: both IDs, amounts, timestamps, customer claim
- Route to payments / payouts owners per Escalation Policy

### Expected result

Payments owns reconciliation; customer gets an update timeline if Support retains the ticket.

## DO

- Preserve provider receipts / dashboard references in approved systems
- Follow Payment Escalation SOP for packaging

## DON'T

- Mark “resolved” because Airepro alone shows failed
- Ignore duplicate charge risk

## Escalate when

- Mismatch persists after engineering/payments look
- High-value amount
- Suspected fraud / card testing
