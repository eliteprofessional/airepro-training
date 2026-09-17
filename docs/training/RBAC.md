# RBAC

## Training roles

- `SUPER_ADMIN`
- `OPERATIONS_ADMIN`
- `OPERATIONS_AGENT`
- `IDV_AGENT`
- `PAYMENT_AGENT`
- `PAYOUT_AGENT`
- `SUPPORT_AGENT`
- `FRAUD_AGENT`
- `MODERATION_AGENT`
- `REPORTING_ANALYST`
- `AUDITOR`

Stored in `roles` / `user_roles`. Portal JWT embeds `roles` + `permissions`.

## Permissions (admin)

Examples: `training.course.*`, `training.quiz.*`, `training.certification.*`, `training.content.manage`, `training.users.manage`, `training.admin`.

`training.admin` implies all training admin permissions.

## Content gating

Documents, SOPs, decision trees, and courses are linked to roles. Agents see **PUBLISHED** content assigned to at least one of their roles (or unrestricted if no roles linked). Admins with content permissions can see drafts.

## OBO mapping

`role_obo_mappings` maps OBO role `type` strings (e.g. `idv`, `payment`) to training roles. First successful OBO login creates/links a `users` row; `training_access` must be true (auto if mapped roles exist, otherwise admin provisions).

## Access denial

Authenticated but `training_access = 0` → HTTP 403 `NO_TRAINING_ACCESS` with administrator contact message. No portal content is returned.
