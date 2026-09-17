# Airepro Platform Overview

Audience: **back-office agents** operating Hire via OBO, IDV, payments, and Trust & Safety.

This portal is internal training — not end-user Hire help (`support.airepro.in`).

## How the systems relate

```
Hire user  →  IDV wizard  →  Hire backend
                            ├─ documents / bank / education stages
                            ├─ Meet booking webhook
                            └─ IDV server (liveness session)

OBO agent  →  obo_ui2  →  obo_backend  →  Hire APIs (+ KPI reads from TNS)

TNS analyst →  trustNSafety-f  →  trustNSafety-b
                                  └─ system of record for suspensions
```

| Surface | Role for agents |
| --- | --- |
| Hire IDV | User completes verification stages in Settings → Identity Verification |
| OBO Approve Identity | You review / approve document submissions |
| Meet + IDV server | Liveness booking and join links (Hire backend owns timing — not OBO) |
| OBO Bank / Withdrawal | Financial ops queues |
| Trust & Safety | Authoritative suspensions / fraud case work |

## Ownership cheat sheet

| Concern | Primary owner | Also touches |
| --- | --- | --- |
| Document / stage approval | OBO **Approve Identity** (`/approveidentity`) | Hire IDV models |
| Liveness Meet slot + join link | Hire backend + Meet + IDV server | Not OBO for slot timing |
| Active suspensions | **TNS backend** | OBO KPI Trust may filter via TNS API |
| Disputes / withdrawals / bank | OBO | Hire / payment backends |
| Fraud signals | OBO Fraud Detection **and** TNS | Confirm which product owns the case |

## What you should do

1. Map the customer issue to **IDV**, **Payments/Payouts**, **Support**, **Jobs**, **Internships**, or **Fraud/TNS**.
2. Open the matching Operations guide or SOP in this portal.
3. Escalate using the Escalation Policy when systems disagree or risk is high.

## DO

- Use approved Back Office tools only
- Keep synthetic examples in training notes — never paste real PAN/Aadhaar into chats

## DON'T

- Assume OBO and TNS write the same suspension row
- Treat Meet “Google placeholder” links as valid IDV join URLs

## Escalate when

- Provider / Hire / OBO statuses disagree and you cannot reconcile
- Suspected fraud or account takeover
- You lack route access for the required queue
