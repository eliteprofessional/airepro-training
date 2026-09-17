# Internship Review SOP (Intern → Freelancer conversion)

**SOP-INT-001**

## Purpose

Review intern → freelancer conversion requests in OBO. Conversion is **never** applied at request time — an OBO admin must approve before `accountType` flips to freelancer.

## When to use

OBO **Intern → Freelancer** queue (`/intern-conversion`) shows a pending request.

## Product flow (summary)

1. Client hires intern → `hired_at` set on qualifying application.
2. Intern waits eligibility window (default **6 months** from `hired_at`, env `INTERN_CONVERSION_MONTHS`).
3. Intern requests conversion in Hire Settings → row `status=pending`; user stays intern.
4. OBO approves or rejects.
5. On approve: `accountType=freelancer` + freelancer profile created/updated from intern profile.

## Eligibility rules (must hold)

| Rule | Detail |
| --- | --- |
| Account type | Still `intern` |
| Hired application | Qualifying selected/completed/accepted with `hired_at` |
| Clock | Earliest qualifying `hired_at` + months ≤ now |
| Open request | Pending row exists for review |
| Already approved | Must not already have an approved conversion |

## Step 1 — Open the pending request

### Check

- User still intern
- Request status pending
- `hired_at` / `eligible_at` make sense

### Expected result

Eligible case ready for approve/reject decision.

## Step 2 — Review profile completeness

### Check

- Intern profile data that will copy to freelancer profile (title, skills, education, links, resume, picture)
- No obvious fraud / policy flags requiring escalation

### Expected result

Safe to approve or clear reject reason.

## DO

- Re-check eligibility on approve (system also re-checks)
- Require rejection reason in OBO UI when rejecting

## DON'T

- Promise conversion before OBO approval
- Assume connects/wallet migrate (freelancer wallet starts fresh)

## Escalate when

- Eligibility data looks corrupted
- Suspected fake hire / abuse of conversion
- Approve fails after UI says eligible
