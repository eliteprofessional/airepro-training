import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  authenticate,
  getAuthMode,
  toPublicUser,
  getUserById,
  writeAudit,
} from '../auth/service.js';
import { issueSessionToken, setAuthCookie, clearAuthCookie } from '../auth/jwt.js';
import { requireAuth } from '../auth/middleware.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again later.' },
});

router.get('/config', (_req, res) => {
  res.json({
    authMode: getAuthMode(),
    forgotPasswordHint:
      getAuthMode() === 'obo'
        ? 'Reset password via your OBO / Airepro identity administrator.'
        : 'Demo mode: use seeded credentials from README.',
  });
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await authenticate(email, password);

    if (!user.trainingAccess) {
      writeAudit({
        userId: user.id,
        action: 'login.denied_no_access',
        resourceType: 'user',
        resourceId: user.id,
      });
      return res.status(403).json({
        error: 'NO_TRAINING_ACCESS',
        message:
          'You do not currently have access to the Airepro Agent Portal. Contact your administrator.',
        user: { email: user.email, name: user.name },
      });
    }

    const token = issueSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      permissions: user.permissions,
      trainingAccess: user.trainingAccess,
    });
    setAuthCookie(res, token);
    writeAudit({
      userId: user.id,
      action: 'login.success',
      resourceType: 'user',
      resourceId: user.id,
    });
    return res.json({ token, user });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Login failed' });
  }
});

router.post('/logout', requireAuth, (req, res) => {
  writeAudit({
    userId: req.user.id,
    action: 'logout',
    resourceType: 'user',
    resourceId: req.user.id,
  });
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  const fresh = toPublicUser(getUserById(req.user.id));
  res.json({ user: fresh, authMode: getAuthMode() });
});

export default router;
