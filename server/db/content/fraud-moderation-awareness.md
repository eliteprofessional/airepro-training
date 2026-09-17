> **Pending ops approval — derived from product**
> Derived from Trust & Safety overview + OBO Fraud/Suspension routes as of 2026-09-17. No fabricated case law.

# Fraud and Moderation Awareness

## Purpose

Help agents choose **OBO vs TNS** and avoid unsafe approvals.

## Surfaces

| Surface | Path / product | Role |
| --- | --- | --- |
| OBO Fraud Detection | `/FraudDetection` | Fraud review in OBO |
| OBO Suspension | `/suspension`, `/createSuspension` | May overlap TNS — confirm SoR |
| TNS | Suspension Management, Fraud Detection, Safety Dashboard, KYC | Authoritative suspensions |

## Ownership rules

| Action | Prefer |
| --- | --- |
| Day-to-day identity / dispute / withdrawal | **OBO** |
| Authoritative suspension state / TNS case work | **TNS** |
| Payment fraud queue in payment console | **payment-airepro** fraud review (approve/reject) |

**Active suspensions:** treat **TNS backend** as system of record unless Payments/OBO explicitly owns that row.

## Agent checklist

1. Do not force-approve IDV or jobs when fraud signals exist — escalate.
2. If OBO and TNS both show suspension UI, verify which API/DB is authoritative before acting.
3. For payment fraud queues, follow payment console procedures; do not invent risk scores.

## DO

- Escalate high-risk identity / scam jobs / duplicate payouts
- Keep evidence in approved systems

## DON'T

- Assume dual-write between OBO and TNS
- Clear fraud flags to reduce queue size

## Escalate when

- Safety of a person is at risk
- Organized fraud patterns
- Suspension state conflicts across systems
