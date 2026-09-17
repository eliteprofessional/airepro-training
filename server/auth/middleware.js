import {
  extractToken,
  verifySessionToken,
  clearAuthCookie,
} from './jwt.js';
import { getUserById, toPublicUser, loadUserPermissions } from './service.js';
import { hasPermission } from '../rbac.js';

export function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const payload = verifySessionToken(token);
    const user = getUserById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = toPublicUser(user);
    req.tokenPayload = payload;
    return next();
  } catch {
    clearAuthCookie(res);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireTrainingAccess(req, res, next) {
  if (!req.user?.trainingAccess) {
    return res.status(403).json({
      error: 'NO_TRAINING_ACCESS',
      message:
        'You do not currently have access to the Airepro Agent Portal. Contact your administrator.',
    });
  }
  return next();
}

export function requirePermission(...permissions) {
  return (req, res, next) => {
    const userPerms = req.user?.permissions || loadUserPermissions(req.user?.id);
    const ok = permissions.some((p) => hasPermission(userPerms, p));
    if (!ok) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    return next();
  };
}

/** Content visible if published AND (no role restriction OR user has one of the roles). Admins see all. */
export function userCanSeeRoleGated(user, assignedRoleIds = []) {
  if (!user) return false;
  if (hasPermission(user.permissions || [], 'training.admin')) return true;
  if (!assignedRoleIds.length) return true;
  return assignedRoleIds.some((r) => user.roles.includes(r));
}
