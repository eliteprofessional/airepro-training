> **Pending ops approval — derived from product**
> **Refunds are incomplete / evolving in Payments.** Confirm every refund with Payments owners. Do not invent eligibility rules. Gap notes referenced from payment-airepro functional audits.

# Refund SOP

**SOP-PAY-003**

## Purpose

Describe **safe agent behavior** when a customer asks for a refund — not a final eligibility policy.

## When to use

Customer requests refund for subscription, payment, or related charge.

## Before you start

- Locate original transaction ID and provider reference
- Confirm whether the product surface even supports refunds for that charge type

## Step 1 — Do not self-serve invent policy

### Check

- Is there a published refund policy linked from checkout / Support?
- Has Payments confirmed this charge type is refundable in this environment?

### Expected result

If unclear → **escalate to Payments** (do not promise refund).

## Step 2 — Status prerequisites

### Check

- Payment actually captured / succeeded
- Not already refunded / charged-back
- Not a charged-but-failed case that needs reconciliation first (SOP-PAY-002)

### Expected result

Correct branch: reconciliation vs refund vs deny.

## Step 3 — Execute only in approved tools

### Check

- Use Payments-approved console / workflow only
- Record refund reference in ticket

### Expected result

Refund initiated by authorized process — or escalated.

## DO

- Escalate ambiguous eligibility
- Keep provider + Airepro IDs together

## DON'T

- Promise refund timelines without Payments confirmation
- Refund to “make the customer happy” when fraud is suspected
- Treat training text as legal policy

## Escalate when

- Any uncertainty on eligibility
- Partial refunds / currency mismatches
- Chargebacks already opened at provider
