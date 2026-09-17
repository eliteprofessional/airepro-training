import { getDb, nowIso, uid } from '../db/index.js';
import { OBO_ROLE_MAP, ROLES } from '../rbac.js';
import { verifyDemoPassword } from '../db/seed.js';

function getOboBaseUrl() {
  return String(process.env.OBO_API_BASE_URL || '')
    .trim()
    .replace(/\/$/, '');
}

export function getAuthMode() {
  const mode = String(process.env.AUTH_MODE || 'demo').toLowerCase();
  return mode === 'obo' ? 'obo' : 'demo';
}

export function loadUserPermissions(userId) {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT DISTINCT p.id AS permission_id
       FROM user_roles ur
       JOIN role_permissions rp ON rp.role_id = ur.role_id
       JOIN permissions p ON p.id = rp.permission_id
       WHERE ur.user_id = ?`,
    )
    .all(userId);
  return rows.map((r) => r.permission_id);
}

export function loadUserRoles(userId) {
  const db = getDb();
  return db
    .prepare('SELECT role_id FROM user_roles WHERE user_id = ?')
    .all(userId)
    .map((r) => r.role_id);
}

export function getUserByEmail(email) {
  return getDb()
    .prepare('SELECT * FROM users WHERE lower(email) = lower(?)')
    .get(email);
}

export function getUserById(id) {
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id);
}

export function toPublicUser(user) {
  if (!user) return null;
  const roles = loadUserRoles(user.id);
  const permissions = loadUserPermissions(user.id);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    department: user.department,
    trainingAccess: Boolean(user.training_access),
    roles,
    permissions,
    oboUserId: user.obo_user_id || null,
  };
}

function mapOboRolesToTraining(oboRoles = []) {
  const mapped = new Set();
  for (const role of oboRoles) {
    const type = String(role?.type || role?.name || role || '')
      .toLowerCase()
      .trim();
    const fromTable = getDb()
      .prepare('SELECT training_role_id FROM role_obo_mappings WHERE lower(obo_role_type) = ?')
      .get(type);
    if (fromTable) mapped.add(fromTable.training_role_id);
    else if (OBO_ROLE_MAP[type]) mapped.add(OBO_ROLE_MAP[type]);
  }
  return [...mapped];
}

function upsertFromObo(oboUser, trainingRoles) {
  const db = getDb();
  const email = oboUser.email;
  const name =
    [oboUser.firstName, oboUser.lastName].filter(Boolean).join(' ') ||
    oboUser.name ||
    email;
  const oboUserId = String(oboUser.userId || oboUser.id || '');
  const existing =
    (oboUserId &&
      db.prepare('SELECT * FROM users WHERE obo_user_id = ?').get(oboUserId)) ||
    getUserByEmail(email);

  const ts = nowIso();
  if (existing) {
    db.prepare(
      `UPDATE users SET obo_user_id = COALESCE(?, obo_user_id), name = ?, last_login_at = ?, updated_at = ?
       WHERE id = ?`,
    ).run(oboUserId || null, name, ts, ts, existing.id);

    if (trainingRoles.length && !loadUserRoles(existing.id).length) {
      const stmt = db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)');
      for (const role of trainingRoles) stmt.run(existing.id, role);
    }
    return getUserById(existing.id);
  }

  // First OBO login: create linked user. Access remains gated by training_access
  // unless roles were pre-provisioned via mapping + auto-grant for known roles.
  const id = uid('user');
  const autoAccess = trainingRoles.length > 0 ? 1 : 0;
  db.prepare(
    `INSERT INTO users (id, obo_user_id, email, name, department, training_access, created_at, updated_at, last_login_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, oboUserId || null, email, name, null, autoAccess, ts, ts, ts);

  const stmt = db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');
  const rolesToAssign = trainingRoles.length ? trainingRoles : [ROLES.OPERATIONS_AGENT];
  // Still no access unless training_access=1 — first-time users without mapping need admin provision
  if (autoAccess) {
    for (const role of rolesToAssign) stmt.run(id, role);
  }
  return getUserById(id);
}

async function loginViaObo(email, password) {
  const base = getOboBaseUrl();
  if (!base) {
    const err = new Error('OBO_API_BASE_URL is not configured');
    err.status = 500;
    throw err;
  }

  const response = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const err = new Error(data?.message || data?.error || 'Invalid email or password');
    err.status = 401;
    throw err;
  }

  const payload = data?.data || data;
  const oboUser = payload?.user || payload;
  if (!oboUser?.email) {
    const err = new Error('Unexpected OBO login response');
    err.status = 502;
    throw err;
  }

  const oboRoles = payload?.roles || oboUser.roles || [];
  const trainingRoles = mapOboRolesToTraining(oboRoles);
  return upsertFromObo(oboUser, trainingRoles);
}

function loginViaDemo(email, password) {
  const user = getUserByEmail(email);
  if (!user || !verifyDemoPassword(user, password)) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }
  const ts = nowIso();
  getDb()
    .prepare('UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?')
    .run(ts, ts, user.id);
  return getUserById(user.id);
}

export async function authenticate(email, password) {
  if (!email || !password) {
    const err = new Error('Email and password are required');
    err.status = 400;
    throw err;
  }

  const mode = getAuthMode();
  const user = mode === 'obo' ? await loginViaObo(email, password) : loginViaDemo(email, password);
  return toPublicUser(user);
}

export function writeAudit({ userId, action, resourceType, resourceId, meta }) {
  getDb()
    .prepare(
      `INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, meta_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      uid('audit'),
      userId || null,
      action,
      resourceType || null,
      resourceId || null,
      meta ? JSON.stringify(meta) : null,
      nowIso(),
    );
}
