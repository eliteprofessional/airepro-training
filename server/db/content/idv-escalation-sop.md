# IDV Escalation SOP

**SOP-IDV-003**

## Purpose

Hand off high-risk or ambiguous IDV cases to fraud / senior review / engineering without losing evidence.

## When to use

- Suspicious document or identity signals
- Partial match with risk indicators
- System errors blocking completion
- Liveness / Meet / IDV server failures after basic checks

## Before you start

- Collect case / user IDs (not full ID images in chat)
- Note which stage and which system shows the blocker

## Step 1 — Package the case

### Check

- User ID, application/stage, OBO case link if available
- What you checked (consent, readability, match)
- Screenshots only from approved tools if required

### Expected result

Actionable escalation packet.

## Step 2 — Route correctly

| Signal | Route |
| --- | --- |
| Forgery / duplicate identity / fraud flags | Fraud review (OBO Fraud and/or TNS per ownership) |
| Meet booked, no Hire booking row / bad webhook | Hire backend / Meet owners |
| Booking exists, join link is Google placeholder or empty | Hire IDV registration / IDV server |
| OBO cannot load Hire submission | Hire DB connectivity / OBO filters |

## Step 3 — Do not force-approve

### Expected result

Case remains pending escalation; customer is not given a false approval.

## DO

- Escalate with IDs and checks already performed
- Keep PII inside approved systems

## DON'T

- Approve to clear queue pressure
- Paste PAN/Aadhaar images into Slack

## Escalate when (always)

- Any high-risk fraud flag
- Provider/system mismatch you cannot reconcile
- Suspected account takeover affecting IDV
