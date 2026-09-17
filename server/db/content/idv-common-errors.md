# IDV Common Errors

Troubleshooting guide for frequent IDV / liveness failures. Use this after identifying whether the issue is **document review** (OBO) or **liveness plumbing** (Hire/Meet/IDV).

## Document / stage issues (agent)

| Symptom | Check first | Agent action |
| --- | --- | --- |
| Stage stuck / locked | Prior stage not approved | Complete earlier stage per path-by-role |
| Blurry / glare rejection | Capture quality | Request new clear photo; do not guess fields |
| Name mismatch | Profile vs ID spelling | Guide customer to correct profile or resubmit matching ID |
| Wrong person (Client/TSM) | Authorized person vs employee | Reject with accurate reason; request authorized signatory docs |

## Liveness / Meet / join link (often engineering)

| Symptom | Check first | Notes |
| --- | --- | --- |
| Booked in Meet but Hire shows no slot | Meet webhook → Hire; booking row in `liveness_idv_bookings` | Not an OBO timing table |
| Slot exists but no Join button | `meet_link` null or Google Meet placeholder | Valid links are `idv.airepro.in` only |
| Email missing / wrong link | Registration + IDV generate path | Session IDs should not appear in customer email |
| Webhook 401 | HMAC `x-meet-booking-signature` vs secret | Engineering |

## Design rules (for agent awareness)

- Bookings live on **Hire DB** — OBO is not the source of truth for slot timing.
- **Join Meeting** must use **`idv.airepro.in`** from the IDV API — never `meet.google.com/new?airepro=...` placeholders.

## Customer coaching (safe to say)

- Stable internet; quiet space for liveness
- Complete stages in order
- Names should match across documents and Hire profile
- Clear photos: no glare, no crop hiding edges, no expired IDs

## Escalate when

- You confirmed a Hire/Meet mismatch and cannot fix it in OBO
- Repeated IDV API failures
- Suspected fraud rather than capture quality
