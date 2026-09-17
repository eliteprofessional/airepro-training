# Security

## Implemented (Phase 1–8)

- No public self-registration  
- Auth required for all portal/admin APIs (except `/api/health`, `/api/auth/config`, `/api/auth/login`)  
- Training access gate (`training_access`)  
- Role-based content filtering  
- Admin permission checks  
- JWT sessions + httpOnly cookie  
- Login rate limiting  
- Audit log for login, views, quiz, cert issue/revoke, content changes  
- `noindex` on SPA  

## Explicitly out of scope here (Phase 9–11)

- MFA enforcement  
- Full CSRF suite beyond SameSite cookies  
- Back Office cert gating  
- Comprehensive penetration / IDOR audit program  
- Formal security test matrix execution  

## Data rule

Training content must use mock/synthetic examples only — never production customer data.
