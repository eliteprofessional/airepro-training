# IDV backend operations

Starter guide for **Hire identity verification** with emphasis on **Visual Verification → Liveness** (Meet booking + IDV session).

Canonical deep runbook in monorepo: `backend/docs/idv_liveness.md`.

## Architecture (liveness path)

| System | Typical URL | Role |
| --- | --- | --- |
| Hire frontend | stage / prod Hire | `/dashboard/settings/identity_verification` |
| Hire backend | Hire API | Bookings table, registration, emails, webhooks |
| Airepro Meet | `meeting.airepro.in` | Slot picker; fires booking webhook |
| IDV API | `IDV_SERVER_URL` (e.g. `idv-server.airepro.in`) | Creates verification session |
| IDV join URL | `https://idv.airepro.in/...` | User-facing liveness link |

**Design rules backend must enforce:**

- Bookings live on the **Hire DB** (`liveness_idv_bookings`) — OBO is **not** the source of truth for slot timing.
- **Join Meeting** / confirmation email must use an **`idv.airepro.in`** link from the IDV API — never a Google Meet placeholder from Meet.
- Session / Verification IDs stay internal (`IdvVerificationLog`); do not surface them in user email/UI placeholders.

## Happy path (condensed)

1. User opens Liveness Check and books via Meet (`/book/agent/idv?...`).
2. Meet POSTs webhook → Hire `POST /api/v1/identity-verification/meet-booking-webhook` (HMAC signature).
3. Hire upserts `liveness_idv_bookings` (`meet_link` often `null` until registration).
4. User refreshes / poll → Hire `POST .../register-idv-verification`.
5. Hire calls IDV API if `needsIdvMeetLinkGeneration(meet_link)`, stores `idv.airepro.in` link, sends confirmation email.

## Meet link sanitization

Shared util: `backend/src/utils/idvMeetLink.util.js` (FE mirror in `verificationMeet.js`).

| Link type | Keep? |
| --- | --- |
| `https://idv.airepro.in/verify/...` | Yes |
| Google Meet placeholder (`meet.google.com/new?airepro=...`) | **No** — strip; regenerate via IDV |
| Empty / null | Call IDV on register |

## Key Hire endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/identity-verification/scheduled-interview-info/:userId` | Current booking for UI |
| POST | `/api/v1/identity-verification/meet-booking-webhook` | Meet → Hire booking upsert |
| POST | `/api/v1/identity-verification/register-idv-verification` | Create IDV session + email |
| IDV service routes | `/api/v1/idv/...` | Doc fetch / service integrations |

Webhook header: `x-meet-booking-signature` = HMAC-SHA256 of JSON body with `MEET_BOOKING_WEBHOOK_SECRET`.

## Env / secrets to know

Check Hire `backend/.env.*` (names may vary by env):

- `IDV_SERVER_URL`, IDV API credentials
- `MEET_BOOKING_WEBHOOK_SECRET`
- Meet booking base URL used by Hire FE
- Email service config for IDV confirmation

Also see `credential` project for IDV key diagnostics.

## Smoke / verification

From Hire backend (adjust paths if renamed):

- `backend/scripts/smoke-meet-booking-webhook.mjs`
- `backend/scripts/smoke-idv-webhook.mjs`

Manual checklist:

1. Book a test slot → row appears in `liveness_idv_bookings`.
2. Register → `meet_link` is `idv.airepro.in`, not Google placeholder.
3. Confirmation email contains join URL only (no session id rows).
4. Cancel / reschedule from Meet updates Hire via webhook.

## Where code lives

| Layer | Location |
| --- | --- |
| FE wizard | `hireFrontend/.../IdentityVerification/` |
| Hire service | `backend/src/services/idvVerification.service.js` |
| Meet link util | `backend/src/utils/idvMeetLink.util.js` |
| Full runbook | `backend/docs/idv_liveness.md` |

## Next

- [OBO operations](/training/obo-ops) — document approval after upload
- [Troubleshooting](/training/troubleshooting) — booking / link / webhook failures
