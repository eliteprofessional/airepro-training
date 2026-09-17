# Payment Escalation SOP

**SOP-PAY-004**

## Purpose

Escalate payment and payout exceptions with a complete evidence pack.

## When to use

- Status UNKNOWN or systems disagree
- Charged-but-failed reconciliation
- Duplicate charge / high-value / suspicious transaction
- Withdrawal batch / Cashfree / retry failures that exceed agent tooling

## Before you start

- Attempt Failed Payment / Charged-but-failed / Withdrawal Ops checks first when applicable

## Step 1 — Build evidence pack

### Check

- Airepro transaction / withdrawal ID
- Provider reference
- Amounts and timestamps
- Customer claim (minimize PII)
- What you already checked

### Expected result

Receiving team can act without re-asking basics.

## Step 2 — Route

| Issue | Prefer |
| --- | --- |
| Customer payment mismatch | Payments + Hire payment owners |
| Withdrawal queue / batch / beneficiary KYC | payment-airepro Withdrawal Ops owners |
| Bank approval in OBO only | OBO financial queue owners |
| Fraud signal on payment | Fraud / TNS per ownership |

## Step 3 — Ticket state

### Expected result

Ticket marked waiting on escalation; customer informed of next update if Support-owned.

## DO

- Escalate mismatches early rather than guessing refunds
- Include both system statuses

## DON'T

- Escalate empty notes
- Bypass Withdrawal Ops approvals “manually” outside tools
