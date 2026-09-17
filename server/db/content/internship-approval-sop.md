# Internship Approval SOP (Intern → Freelancer)

**SOP-INT-002**

## Purpose

Approve a pending intern → freelancer conversion when eligibility and review checks pass.

## When to use

Pending conversion in `/intern-conversion` after review.

## Step 1 — Confirm eligibility still true

### Check

- User still `intern`
- Qualifying hired application still valid
- Eligibility window reached
- Request still `pending`

### Expected result

System will allow approve; if not, do not force.

## Step 2 — Approve in OBO

### Expected side effects

1. `users.accountType = freelancer`
2. Create/update `freelancers_profile` from intern profile fields
3. Intern profile / applications left intact
4. Request marked `approved`
5. **Connects are not migrated**

### Expected result

User must refresh / re-login to see freelancer dashboard.

## DO

- Inform that re-login may be required
- Note approval in OBO fields if available

## DON'T

- Manually edit `accountType` outside the conversion flow
- Promise migrated connects balance

## Escalate when

- Approve errors after eligibility looks valid
- Profile copy fails mid-approve
