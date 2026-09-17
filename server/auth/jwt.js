import jwt from 'jsonwebtoken';

const TOKEN_TTL = process.env.TRAINING_JWT_TTL || '12h';
export const COOKIE_NAME = 'airepro_training_session';

function getSecret() {
  const secret = process.env.TRAINING_JWT_SECRET || process.env.ADMIN_TOKEN_SECRET;
  if (!secret) {
    throw new Error('TRAINING_JWT_SECRET (or ADMIN_TOKEN_SECRET) is not configured');
  }
  return secret;
}

export function issueSessionToken(payload) {
  return jwt.sign(
    {
      sub: payload.userId,
      email: payload.email,
      name: payload.name,
      roles: payload.roles || [],
      permissions: payload.permissions || [],
      trainingAccess: Boolean(payload.trainingAccess),
    },
    getSecret(),
    { expiresIn: TOKEN_TTL },
  );
}

export function verifySessionToken(token) {
  return jwt.verify(token, getSecret());
}

export function extractToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  if (req.cookies?.[COOKIE_NAME]) {
    return req.cookies[COOKIE_NAME];
  }
  return null;
}

export function setAuthCookie(res, token) {
  const crossSite = Boolean(process.env.CORS_ORIGIN);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: crossSite ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production' || crossSite,
    maxAge: 12 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearAuthCookie(res) {
  const crossSite = Boolean(process.env.CORS_ORIGIN);
  res.clearCookie(COOKIE_NAME, {
    path: '/',
    sameSite: crossSite ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production' || crossSite,
  });
}
