# Admin guide

## Who can administer

Users with `SUPER_ADMIN` / `OPERATIONS_ADMIN` (permissions `training.admin` or `training.content.manage`).

## Capabilities (UI `/admin`)

- Documents & SOPs: create/edit/publish/delete, role visibility  
- Users: provision email, roles, `training_access`  
- Certifications: list / revoke  
- Announcements: publish  

## Demo vs OBO

- Local: `AUTH_MODE=demo` with seeded users  
- Stage/prod: `AUTH_MODE=obo` + `OBO_API_BASE_URL`; provision training access after first login if needed  

## Resetting local DB

```bash
npm run db:reset
```
