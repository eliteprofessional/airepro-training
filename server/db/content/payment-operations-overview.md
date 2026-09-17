# Payment Operations Overview

Orient agents to Hire payments, OBO financial queues, and the payment-airepro withdrawal/payout stack.

## Surfaces

| Surface | What it is | Agent relevance |
| --- | --- | --- |
| Hire | Customer payments / wallet / withdrawals initiated by users | Support questions often start here |
| OBO | `/BankAccountApprovalRequest`, `/withdrawalRequest`, payment verification routes | Day-to-day agent queues |
| payment-airepro | Withdrawal Ops (`/app/withdrawals/*`), batches, retries, beneficiaries, settlements | Payout rail / ops console |

## Keys and rails (awareness)

Payment vs payout platform keys differ (for example live payment keys vs `wp_live_` payout keys). Do not mix dashboards when checking a case.

Common payout providers in ops docs: **Cashfree** (payouts setup), and payment provider checks for **Razorpay / Cashfree** on customer payment failures.

## Typical agent flow for a payment complaint

1. Locate Airepro transaction / withdrawal ID.
2. Confirm status in Hire/OBO.
3. Confirm provider status in the correct console.
4. Branch: not charged → inform retry; charged-but-failed → reconciliation SOP; pending → wait/recheck; unknown → escalate.

## Withdrawal ops modules (payment-airepro)

Ops UI areas used in testing/runbooks:

- Queue & detail (`/app/withdrawals/queue`)
- Approval center (withdrawals / batches / SLA)
- Retry queue
- Beneficiaries (including KYC verify actions)
- Batches / settlements / reports

## DO

- Check **Airepro first**, then the **correct provider**
- Keep transaction IDs in every note

## DON'T

- Refund immediately without status checks
- Assume OBO bank approval equals provider payout success

## Escalate when

- Provider SUCCESS + Airepro FAILED (or reverse)
- Duplicate charge / reconciliation mismatch
- High-value or suspicious payout
