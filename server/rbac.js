/** Role and permission constants for the training portal. */

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  OPERATIONS_ADMIN: 'OPERATIONS_ADMIN',
  OPERATIONS_AGENT: 'OPERATIONS_AGENT',
  IDV_AGENT: 'IDV_AGENT',
  PAYMENT_AGENT: 'PAYMENT_AGENT',
  PAYOUT_AGENT: 'PAYOUT_AGENT',
  SUPPORT_AGENT: 'SUPPORT_AGENT',
  FRAUD_AGENT: 'FRAUD_AGENT',
  MODERATION_AGENT: 'MODERATION_AGENT',
  REPORTING_ANALYST: 'REPORTING_ANALYST',
  AUDITOR: 'AUDITOR',
};

export const ROLE_LIST = Object.values(ROLES);

export const PERMISSIONS = {
  'training.course.read': 'Read courses',
  'training.course.create': 'Create courses',
  'training.course.update': 'Update courses',
  'training.course.publish': 'Publish courses',
  'training.course.archive': 'Archive courses',
  'training.lesson.create': 'Create lessons',
  'training.lesson.update': 'Update lessons',
  'training.quiz.create': 'Create quizzes',
  'training.quiz.update': 'Update quizzes',
  'training.certification.read': 'Read certifications',
  'training.certification.revoke': 'Revoke certifications',
  'training.analytics.read': 'Read analytics (stub)',
  'training.content.publish': 'Publish content',
  'training.content.manage': 'Manage documents/SOPs/trees',
  'training.users.manage': 'Provision users and roles',
  'training.admin': 'Full training admin access',
};

/** Default permission sets by role */
export const ROLE_PERMISSION_MAP = {
  [ROLES.SUPER_ADMIN]: Object.keys(PERMISSIONS),
  [ROLES.OPERATIONS_ADMIN]: [
    'training.course.read',
    'training.course.create',
    'training.course.update',
    'training.course.publish',
    'training.lesson.create',
    'training.lesson.update',
    'training.quiz.create',
    'training.quiz.update',
    'training.certification.read',
    'training.content.publish',
    'training.content.manage',
    'training.users.manage',
    'training.admin',
  ],
  [ROLES.OPERATIONS_AGENT]: ['training.course.read'],
  [ROLES.IDV_AGENT]: ['training.course.read'],
  [ROLES.PAYMENT_AGENT]: ['training.course.read'],
  [ROLES.PAYOUT_AGENT]: ['training.course.read'],
  [ROLES.SUPPORT_AGENT]: ['training.course.read'],
  [ROLES.FRAUD_AGENT]: ['training.course.read'],
  [ROLES.MODERATION_AGENT]: ['training.course.read'],
  [ROLES.REPORTING_ANALYST]: ['training.course.read', 'training.analytics.read'],
  [ROLES.AUDITOR]: [
    'training.course.read',
    'training.certification.read',
    'training.analytics.read',
  ],
};

/** Map OBO role `type` strings to training roles where known */
export const OBO_ROLE_MAP = {
  admin: ROLES.SUPER_ADMIN,
  super_admin: ROLES.SUPER_ADMIN,
  operations: ROLES.OPERATIONS_AGENT,
  idv: ROLES.IDV_AGENT,
  payment: ROLES.PAYMENT_AGENT,
  payout: ROLES.PAYOUT_AGENT,
  support: ROLES.SUPPORT_AGENT,
  fraud: ROLES.FRAUD_AGENT,
  moderation: ROLES.MODERATION_AGENT,
  kpi: ROLES.REPORTING_ANALYST,
  auditor: ROLES.AUDITOR,
};

export function isAdminRole(roleIds = []) {
  return roleIds.includes(ROLES.SUPER_ADMIN) || roleIds.includes(ROLES.OPERATIONS_ADMIN);
}

export function hasPermission(userPermissions = [], permission) {
  if (userPermissions.includes('training.admin')) return true;
  return userPermissions.includes(permission);
}
