# Content model

## Document types

`article`, `sop`, `checklist`, `faq`, `troubleshooting`, `tutorial`, `policy`, plus interactive `decision_trees` and `quizzes` as first-class tables.

## SOP metadata

SOPs live as `documents` (`type=sop`) plus `sops` row:

- `sop_code` (e.g. `SOP-IDV-001`)
- purpose / prerequisites / escalation (on document)
- do / don't / related SOP codes
- version, status (`DRAFT` | `IN_REVIEW` | `PUBLISHED` | `ARCHIVED`)

Bodies remain Markdown.

## Courses

`courses` → `modules` → `lessons` → linked `quizzes` → `certifications`.

## Decision trees

JSON node graph: prompts, options, outcomes, escalate flags, what-to-check / why / what-not-to-do.

## Quizzes

Question types: `mcq`, `true_false`, `scenario`. Attempts stored with score/pass. Correct answers never returned until submit.

## Certifications

Statuses: `NOT_STARTED`, `IN_PROGRESS`, `PASSED`, `FAILED`, `EXPIRED`, `REVOKED`. Optional `cert_expiry_days` on course.

## Seed policy

Content lives in [`server/db/content/*.md`](../server/db/content) and is loaded by [`server/db/seed.js`](../server/db/seed.js).

| Wave | Status | Meaning |
| --- | --- | --- |
| **Wave 1** | `PUBLISHED` | Adapted from Hire/OBO/payments source docs (IDV, payouts, conversion, security, escalation). No placeholder banners. |
| **Wave 2** | `IN_REVIEW` | Derived from OBO UI/code (Support, Jobs, Refunds, fraud awareness). Banner: **Pending ops approval**. Visible to admins until published. |

Reset local DB after seed changes:

```bash
node --experimental-sqlite server/scripts/resetDb.js
```

Agents only see `PUBLISHED` documents. Do not treat `IN_REVIEW` as final policy. Training examples must use synthetic PII only.
