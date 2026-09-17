# Escalation Policy

When and how to stop and escalate. Routing is based on system ownership used by Hire, OBO, and Trust & Safety.

## Attempt standard SOP first

1. Identify the surface (IDV, payment/payout, support, jobs, internships, fraud/TNS).
2. Follow the published SOP / decision guide for that surface.
3. Escalate only when blocked, mismatched, or high-risk.

## Evidence pack (always include)

- User / ticket / transaction / application IDs
- Environment (stage vs prod) if relevant
- What you already checked
- Current statuses in each system
- Customer claim (paraphrased — minimize PII)

## Ownership map

| If stuck on… | Escalate / open |
| --- | --- |
| Meet booking product | Meet service owners |
| IDV session creation / join link | IDV server owners + Hire backend |
| Hire persistence / webhooks | Hire `backend` owners |
| OBO roles / schema / queues | `obo_backend` owners |
| Suspension system of record | Trust & Safety (`trustNSafety-b`) |
| Withdrawal batch / Cashfree / Razorpay payout rails | Payments / payout ops + payment-airepro owners |
| Content / fraud case ownership unclear | Confirm OBO vs TNS before acting |

## OBO vs TNS

| Action | Prefer |
| --- | --- |
| Day-to-day identity / dispute / withdrawal | **OBO** |
| Authoritative suspension state / TNS case work | **TNS** |
| Trust KPI charts | OBO reading Hire + TNS feeds |

Do **not** assume dual-write between OBO suspension screens and TNS.

## DO

- Escalate with actionable IDs and checks already done
- Mark the ticket/case as waiting on escalation

## DON'T

- Escalate empty “please help” notes
- Approve or refund to clear pressure when systems disagree

## Escalate immediately when

- Provider confirms success but Airepro shows failed (or the reverse)
- Duplicate charge / reconciliation mismatch
- High-value or suspicious transaction
- Missing consent or suspected forged documents
- Suspected account compromise
