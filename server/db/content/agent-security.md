# Agent Security

Protect credentials, sessions, and operational systems. Adapted from platform security checklists (Hire observability + OBO security guidance).

## Purpose

Keep Back Office, payment consoles, and customer PII safe while you work tickets and queues.

## Before you start

- Use your own provisioned account (OBO / training portal)
- Confirm you are on the intended environment (stage vs prod)

## Rules

1. **Unique credentials** — never reuse personal passwords; never share admin passwords.
2. **Lock your workstation** when you step away — even briefly.
3. **No secrets in chat** — do not paste JWTs, API keys, webhook secrets, or session tokens into Slack/WhatsApp/email.
4. **HTTPS / approved tools only** outside local development tooling owned by engineering.
5. **Fail closed** — if auth looks wrong, stop and escalate; do not disable checks “temporarily.”
6. **Logging** — do not copy request bodies with PII into personal notes or tickets outside approved fields.

## Fields that must never leak

Treat these as sensitive (mask / do not export): password, OTP, JWT, bearer tokens, authorization headers, PAN, Aadhaar, CVV, full card numbers, cookies, access/session tokens.

## DO

- Lock screen + end unused sessions
- Report phishing that targets Airepro logins immediately

## DON'T

- Leave Back Office unlocked
- Commit or screenshot `.env` / secret panels
- Use `BYPASS_AUTH`-style shortcuts in production

## Escalate when

- Suspected account compromise
- Phishing involving Airepro systems
- Accidental secret exposure in a ticket or chat
