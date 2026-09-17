# Payment Status Guide

Meaning of statuses agents use when triaging payments and payouts. Always confirm in-system labels for your environment — provider wording may differ.

## Customer payment statuses (agent view)

| Status | Meaning | Typical agent action |
| --- | --- | --- |
| SUCCESS | Provider + Airepro agree paid | Confirm and close if inquiry only |
| FAILED | Payment did not complete in Airepro | Follow Failed Payment SOP / decision guide |
| PENDING | Awaiting provider confirmation | Wait / recheck; escalate if SLA breached |
| UNKNOWN / mismatch | Systems disagree or status unreadable | Escalate reconciliation — do not guess |

## Withdrawal / payout awareness

Withdrawal Ops tracks queue statuses such as pending approval, approved, retries, reversed, and batch membership. On detail pages, use the **status timeline** before telling the customer “it is stuck.”

## Provider check

1. Identify provider on the transaction (Razorpay, Cashfree, other).
2. Open that provider’s dashboard/tools — not a different one.
3. Compare provider status to Airepro status before choosing an SOP branch.

## Charged vs not charged

| Provider | Airepro | Branch |
| --- | --- | --- |
| FAILED | FAILED | Inform customer not charged; advise retry |
| SUCCESS | FAILED | **Charged but failed** SOP / escalate |
| PENDING | PENDING/FAILED | Wait and recheck; set follow-up |
| UNKNOWN | any | Escalate with both IDs |

## DO

- Record both Airepro and provider references
- Use the Failed Payment Decision Guide for FAILED complaints

## DON'T

- Trust the customer claim alone
- Issue refunds without eligibility and status confirmation
