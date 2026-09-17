# PII Handling

Minimize exposure of customer personally identifiable information while performing ops work.

## Purpose

Agents see ID documents, bank details, and contact data in Hire/OBO/TNS. Training and day-to-day work must keep that data inside approved systems.

## Need-to-know

1. Access PII **only** when required for the ticket or verification case.
2. Prefer IDs (user id, application id, transaction id) in handoffs — not full document images.
3. Do not download, screenshot, or email ID documents unless a written policy and approved channel allow it.
4. Training content and screenshots in this portal must use **synthetic / anonymized** examples only.

## Platform masking expectations

Engineering systems are expected to mask fields such as PAN, Aadhaar, OTP, JWT, and card data in logs. Agents must still:

- Avoid pasting raw PII into free-text internal notes when a structured field exists
- Never move PII to personal devices or unmanaged cloud drives

## DO

- Use Back Office / Hire / TNS UIs as the system of record
- Redact PII when escalating to vendors unless they already have access

## DON'T

- Share ID photos over WhatsApp “for a quick check”
- Export bulk user lists without authorization
- Put real customer documents into this training portal

## Escalate when

- You are asked to bypass PII controls
- A data leak is suspected
- A case requires sharing documents outside approved tools
