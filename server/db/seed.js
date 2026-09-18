import { createHash } from 'node:crypto';
import { getDb, nowIso, uid, parseJson } from './index.js';
import {
  ROLES,
  ROLE_LIST,
  PERMISSIONS,
  ROLE_PERMISSION_MAP,
  OBO_ROLE_MAP,
} from '../rbac.js';
import { loadMd } from './content/load.js';

function hashPassword(password) {
  return createHash('sha256').update(`airepro-training:${password}`).digest('hex');
}

function insertRoles(db) {
  const descriptions = {
    [ROLES.SUPER_ADMIN]: 'Full training portal administration',
    [ROLES.OPERATIONS_ADMIN]: 'Operations training content admin',
    [ROLES.OPERATIONS_AGENT]: 'General operations agent',
    [ROLES.IDV_AGENT]: 'Identity verification agent',
    [ROLES.PAYMENT_AGENT]: 'Payment operations agent',
    [ROLES.PAYOUT_AGENT]: 'Payout operations agent',
    [ROLES.SUPPORT_AGENT]: 'Support ticket agent',
    [ROLES.FRAUD_AGENT]: 'Fraud / risk agent',
    [ROLES.MODERATION_AGENT]: 'Content moderation agent',
    [ROLES.REPORTING_ANALYST]: 'Reporting analyst',
    [ROLES.AUDITOR]: 'Read-only auditor',
  };

  const roleStmt = db.prepare(
    'INSERT OR IGNORE INTO roles (id, name, description) VALUES (?, ?, ?)',
  );
  for (const id of ROLE_LIST) {
    roleStmt.run(id, id.replaceAll('_', ' '), descriptions[id] || id);
  }

  const permStmt = db.prepare(
    'INSERT OR IGNORE INTO permissions (id, description) VALUES (?, ?)',
  );
  for (const [id, description] of Object.entries(PERMISSIONS)) {
    permStmt.run(id, description);
  }

  const rpStmt = db.prepare(
    'INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
  );
  for (const [roleId, perms] of Object.entries(ROLE_PERMISSION_MAP)) {
    for (const perm of perms) {
      rpStmt.run(roleId, perm);
    }
  }

  const mapStmt = db.prepare(
    'INSERT OR IGNORE INTO role_obo_mappings (obo_role_type, training_role_id) VALUES (?, ?)',
  );
  for (const [obo, training] of Object.entries(OBO_ROLE_MAP)) {
    mapStmt.run(obo, training);
  }
}

function insertUser(db, { email, name, department, roles, password, access = 1 }) {
  const id = uid('user');
  const ts = nowIso();
  db.prepare(
    `INSERT INTO users (id, email, name, department, training_access, demo_password_hash, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, email, name, department, access, password ? hashPassword(password) : null, ts, ts);

  const ur = db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');
  for (const role of roles) {
    ur.run(id, role);
  }
  return id;
}

function insertDocument(db, doc, roleIds = []) {
  const id = uid('doc');
  const ts = nowIso();
  const status = doc.status || 'PUBLISHED';
  db.prepare(
    `INSERT INTO documents (
      id, slug, title, type, category, department, status, version, body_md, summary,
      owner, estimated_minutes, purpose, prerequisites_json, escalation_rules_json, sla,
      effective_date, review_date, tags_json, change_summary, author, reviewer,
      created_at, updated_at, published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    doc.slug,
    doc.title,
    doc.type,
    doc.category || null,
    doc.department || null,
    status,
    doc.version || '1.1',
    doc.body_md,
    doc.summary || null,
    doc.owner || 'Training Content',
    doc.estimated_minutes || 10,
    doc.purpose || null,
    JSON.stringify(doc.prerequisites || []),
    JSON.stringify(doc.escalation || []),
    doc.sla || null,
    doc.effective_date || ts.slice(0, 10),
    doc.review_date || null,
    JSON.stringify(doc.tags || []),
    doc.change_summary || 'Content v1.1 from ops sources / product-derived review',
    doc.author || 'system',
    doc.reviewer || null,
    ts,
    ts,
    status === 'PUBLISHED' ? ts : null,
  );

  const dr = db.prepare('INSERT INTO document_roles (document_id, role_id) VALUES (?, ?)');
  for (const roleId of roleIds) {
    dr.run(id, roleId);
  }

  if (doc.type === 'sop' && doc.sop_code) {
    db.prepare(
      `INSERT INTO sops (document_id, sop_code, do_items_json, dont_items_json, related_sop_codes_json)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(
      id,
      doc.sop_code,
      JSON.stringify(doc.do_items || ['Follow published steps']),
      JSON.stringify(doc.dont_items || ['Skip checks']),
      JSON.stringify(doc.related || []),
    );
  }

  return id;
}

function seedContent(db) {
  const allAgents = [
    ROLES.OPERATIONS_AGENT,
    ROLES.IDV_AGENT,
    ROLES.PAYMENT_AGENT,
    ROLES.PAYOUT_AGENT,
    ROLES.SUPPORT_AGENT,
    ROLES.FRAUD_AGENT,
    ROLES.MODERATION_AGENT,
    ROLES.OPERATIONS_ADMIN,
    ROLES.SUPER_ADMIN,
  ];
  const idvRoles = [ROLES.IDV_AGENT, ROLES.OPERATIONS_ADMIN, ROLES.SUPER_ADMIN, ROLES.FRAUD_AGENT];
  const payRoles = [
    ROLES.PAYMENT_AGENT,
    ROLES.PAYOUT_AGENT,
    ROLES.OPERATIONS_ADMIN,
    ROLES.SUPER_ADMIN,
  ];
  const supportRoles = [ROLES.SUPPORT_AGENT, ROLES.OPERATIONS_ADMIN, ROLES.SUPER_ADMIN];
  const jobRoles = [
    ROLES.OPERATIONS_AGENT,
    ROLES.MODERATION_AGENT,
    ROLES.OPERATIONS_ADMIN,
    ROLES.SUPER_ADMIN,
  ];
  const fraudRoles = [
    ROLES.FRAUD_AGENT,
    ROLES.MODERATION_AGENT,
    ROLES.OPERATIONS_ADMIN,
    ROLES.SUPER_ADMIN,
    ROLES.IDV_AGENT,
  ];

  const wave1Meta = {
    version: '1.1',
    status: 'PUBLISHED',
    change_summary: 'Adapted from Hire/OBO/payments source docs — Wave 1',
    owner: 'Operations',
  };
  const wave2Meta = {
    version: '1.1',
    status: 'IN_REVIEW',
    change_summary: 'Derived from OBO UI/code — pending ops approval — Wave 2',
    owner: 'Operations (pending)',
  };

  const general = [
    {
      slug: 'airepro-platform-overview',
      title: 'Airepro Platform Overview',
      type: 'article',
      category: 'general',
      summary: 'How Hire, IDV, payments, OBO, and TNS relate for agents.',
      body_md: loadMd('airepro-platform-overview'),
      tags: ['basics', 'overview'],
      ...wave1Meta,
    },
    {
      slug: 'back-office-introduction',
      title: 'Back Office Introduction',
      type: 'article',
      category: 'general',
      summary: 'OBO navigation, roles, and Stage/Prod hygiene.',
      body_md: loadMd('back-office-introduction'),
      tags: ['basics', 'obo'],
      ...wave1Meta,
    },
    {
      slug: 'agent-security',
      title: 'Agent Security',
      type: 'policy',
      category: 'general',
      summary: 'Credential and session security for agents.',
      body_md: loadMd('agent-security'),
      tags: ['security'],
      ...wave1Meta,
    },
    {
      slug: 'pii-handling',
      title: 'PII Handling',
      type: 'policy',
      category: 'general',
      summary: 'Need-to-know PII rules for ops work.',
      body_md: loadMd('pii-handling'),
      tags: ['privacy', 'pii'],
      ...wave1Meta,
    },
    {
      slug: 'escalation-policy',
      title: 'Escalation Policy',
      type: 'article',
      category: 'general',
      summary: 'When and how to escalate across Hire, OBO, and TNS.',
      body_md: loadMd('escalation-policy'),
      tags: ['escalation'],
      ...wave1Meta,
    },
  ];
  for (const doc of general) insertDocument(db, doc, allAgents);

  const idvDocs = [
    {
      slug: 'idv-agent-overview',
      title: 'IDV Agent Overview',
      type: 'article',
      category: 'idv',
      department: 'IDV',
      summary: 'IDV stages, OBO vs liveness ownership.',
      body_md: loadMd('idv-agent-overview'),
      ...wave1Meta,
    },
    {
      slug: 'idv-verification-sop',
      title: 'IDV Verification SOP',
      type: 'sop',
      category: 'idv',
      department: 'IDV',
      sop_code: 'SOP-IDV-001',
      purpose: 'Standard approve path for identity verification.',
      summary: 'Consent → readable → match → risk → approve.',
      body_md: loadMd('idv-verification-sop'),
      do_items: ['Follow check order', 'Confirm consent first'],
      dont_items: ['Approve without consent', 'Guess unreadable fields'],
      related: ['SOP-IDV-002', 'SOP-IDV-003'],
      ...wave1Meta,
    },
    {
      slug: 'idv-rejection-sop',
      title: 'IDV Rejection SOP',
      type: 'sop',
      category: 'idv',
      department: 'IDV',
      sop_code: 'SOP-IDV-002',
      summary: 'Reject with accurate reason codes.',
      body_md: loadMd('idv-rejection-sop'),
      related: ['SOP-IDV-001', 'SOP-IDV-003'],
      ...wave1Meta,
    },
    {
      slug: 'idv-escalation-sop',
      title: 'IDV Escalation SOP',
      type: 'sop',
      category: 'idv',
      department: 'IDV',
      sop_code: 'SOP-IDV-003',
      summary: 'Escalate high-risk or system-blocked IDV cases.',
      body_md: loadMd('idv-escalation-sop'),
      related: ['SOP-IDV-001', 'SOP-IDV-002'],
      ...wave1Meta,
    },
    {
      slug: 'idv-common-errors',
      title: 'IDV Common Errors',
      type: 'troubleshooting',
      category: 'idv',
      department: 'IDV',
      summary: 'Document vs liveness failure triage.',
      body_md: loadMd('idv-common-errors'),
      ...wave1Meta,
    },
  ];
  for (const doc of idvDocs) insertDocument(db, doc, idvRoles);

  const payDocs = [
    {
      slug: 'payment-operations-overview',
      title: 'Payment Operations Overview',
      type: 'article',
      category: 'payments',
      department: 'Payments',
      summary: 'Hire, OBO, and payment-airepro withdrawal surfaces.',
      body_md: loadMd('payment-operations-overview'),
      ...wave1Meta,
    },
    {
      slug: 'payment-status-guide',
      title: 'Payment Status Guide',
      type: 'article',
      category: 'payments',
      department: 'Payments',
      summary: 'SUCCESS / FAILED / PENDING / mismatch branching.',
      body_md: loadMd('payment-status-guide'),
      ...wave1Meta,
    },
    {
      slug: 'failed-payment-sop',
      title: 'Failed Payment SOP',
      type: 'sop',
      category: 'payments',
      department: 'Payments',
      sop_code: 'SOP-PAY-001',
      summary: 'Handle FAILED payment status.',
      body_md: loadMd('failed-payment-sop'),
      related: ['SOP-PAY-002', 'SOP-PAY-004'],
      ...wave1Meta,
    },
    {
      slug: 'payment-charged-but-failed-sop',
      title: 'Payment Charged But Failed SOP',
      type: 'sop',
      category: 'payments',
      department: 'Payments',
      sop_code: 'SOP-PAY-002',
      summary: 'Provider charged but Airepro failed.',
      body_md: loadMd('payment-charged-but-failed-sop'),
      related: ['SOP-PAY-001', 'SOP-PAY-004'],
      ...wave1Meta,
    },
    {
      slug: 'refund-sop',
      title: 'Refund SOP',
      type: 'sop',
      category: 'payments',
      department: 'Payments',
      sop_code: 'SOP-PAY-003',
      summary: 'Safe refund behavior — eligibility pending Payments.',
      body_md: loadMd('refund-sop'),
      related: ['SOP-PAY-002', 'SOP-PAY-004'],
      ...wave2Meta,
    },
    {
      slug: 'payment-escalation-sop',
      title: 'Payment Escalation SOP',
      type: 'sop',
      category: 'payments',
      department: 'Payments',
      sop_code: 'SOP-PAY-004',
      summary: 'Escalate payment and payout exceptions.',
      body_md: loadMd('payment-escalation-sop'),
      related: ['SOP-PAY-001', 'SOP-PAY-002'],
      ...wave1Meta,
    },
  ];
  for (const doc of payDocs) insertDocument(db, doc, payRoles);

  const supportDocs = [
    {
      slug: 'support-ticket-lifecycle',
      title: 'Support Ticket Lifecycle',
      type: 'article',
      category: 'support',
      department: 'Support',
      summary: 'Ticket states and OBO support surfaces.',
      body_md: loadMd('support-ticket-lifecycle'),
      ...wave2Meta,
    },
    {
      slug: 'ticket-prioritization',
      title: 'Ticket Prioritization',
      type: 'checklist',
      category: 'support',
      department: 'Support',
      summary: 'Illustrative priority model — SLA pending Support.',
      body_md: loadMd('ticket-prioritization'),
      ...wave2Meta,
    },
    {
      slug: 'first-response-sop',
      title: 'First Response SOP',
      type: 'sop',
      category: 'support',
      department: 'Support',
      sop_code: 'SOP-SUP-001',
      summary: 'Acknowledge and set expectations.',
      body_md: loadMd('first-response-sop'),
      related: ['SOP-SUP-002', 'SOP-SUP-003'],
      ...wave2Meta,
    },
    {
      slug: 'ticket-escalation-sop',
      title: 'Ticket Escalation SOP',
      type: 'sop',
      category: 'support',
      department: 'Support',
      sop_code: 'SOP-SUP-002',
      summary: 'Escalate to specialist queues.',
      body_md: loadMd('ticket-escalation-sop'),
      related: ['SOP-SUP-001'],
      ...wave2Meta,
    },
    {
      slug: 'ticket-closure-sop',
      title: 'Ticket Closure SOP',
      type: 'sop',
      category: 'support',
      department: 'Support',
      sop_code: 'SOP-SUP-003',
      summary: 'Close only when resolved or handed off.',
      body_md: loadMd('ticket-closure-sop'),
      related: ['SOP-SUP-001'],
      ...wave2Meta,
    },
  ];
  for (const doc of supportDocs) insertDocument(db, doc, supportRoles);

  const jobDocs = [
    {
      slug: 'job-review-sop',
      title: 'Job Review SOP',
      type: 'sop',
      category: 'jobs',
      department: 'Jobs',
      sop_code: 'SOP-JOB-001',
      summary: 'Review job posts for policy compliance.',
      body_md: loadMd('job-review-sop'),
      related: ['SOP-JOB-002', 'SOP-JOB-003'],
      ...wave2Meta,
    },
    {
      slug: 'job-approval-sop',
      title: 'Job Approval SOP',
      type: 'sop',
      category: 'jobs',
      department: 'Jobs',
      sop_code: 'SOP-JOB-002',
      summary: 'Approve compliant jobs.',
      body_md: loadMd('job-approval-sop'),
      related: ['SOP-JOB-001'],
      ...wave2Meta,
    },
    {
      slug: 'job-rejection-sop',
      title: 'Job Rejection SOP',
      type: 'sop',
      category: 'jobs',
      department: 'Jobs',
      sop_code: 'SOP-JOB-003',
      summary: 'Reject non-compliant jobs.',
      body_md: loadMd('job-rejection-sop'),
      related: ['SOP-JOB-001'],
      ...wave2Meta,
    },
  ];
  for (const doc of jobDocs) insertDocument(db, doc, jobRoles);

  const internshipDocs = [
    {
      slug: 'internship-review-sop',
      title: 'Internship Review SOP',
      type: 'sop',
      category: 'internships',
      department: 'Internships',
      sop_code: 'SOP-INT-001',
      summary: 'Review intern → freelancer conversion requests.',
      body_md: loadMd('internship-review-sop'),
      related: ['SOP-INT-002', 'SOP-INT-003'],
      ...wave1Meta,
    },
    {
      slug: 'internship-approval-sop',
      title: 'Internship Approval SOP',
      type: 'sop',
      category: 'internships',
      department: 'Internships',
      sop_code: 'SOP-INT-002',
      summary: 'Approve eligible conversions.',
      body_md: loadMd('internship-approval-sop'),
      related: ['SOP-INT-001'],
      ...wave1Meta,
    },
    {
      slug: 'internship-rejection-sop',
      title: 'Internship Rejection SOP',
      type: 'sop',
      category: 'internships',
      department: 'Internships',
      sop_code: 'SOP-INT-003',
      summary: 'Reject conversions with required reason.',
      body_md: loadMd('internship-rejection-sop'),
      related: ['SOP-INT-001'],
      ...wave1Meta,
    },
  ];
  for (const doc of internshipDocs) insertDocument(db, doc, jobRoles);

  insertDocument(
    db,
    {
      slug: 'fraud-moderation-awareness',
      title: 'Fraud and Moderation Awareness',
      type: 'article',
      category: 'general',
      department: 'Trust & Safety',
      summary: 'OBO vs TNS ownership for fraud and suspensions.',
      body_md: loadMd('fraud-moderation-awareness'),
      tags: ['fraud', 'tns'],
      ...wave2Meta,
    },
    fraudRoles,
  );

  const idvTreeNodes = {
    start: {
      id: 'start',
      prompt: 'Was user consent / authorization captured?',
      whatToCheck: 'Consent timestamp or Client/TSM authorized-person attestation',
      whyItMatters: 'Processing identity without consent violates policy',
      whatNotToDo: 'Do not continue verification without consent',
      escalateWhen: 'Consent tooling broken or disputed',
      options: [
        { label: 'YES — Continue', next: 'readable' },
        { label: 'NO — Stop', next: 'stop_consent' },
      ],
    },
    stop_consent: {
      id: 'stop_consent',
      type: 'outcome',
      title: 'Stop verification',
      action: 'Request consent before continuing. Do not approve. See SOP-IDV-001.',
      escalate: false,
    },
    readable: {
      id: 'readable',
      prompt: 'Is the document readable and unexpired?',
      whatToCheck: 'Blur, glare, crop, language, expiry, edges visible',
      whyItMatters: 'Unreadable docs cause false accepts/rejects',
      whatNotToDo: 'Do not guess identity fields',
      escalateWhen: 'Document appears altered or synthetic',
      options: [
        { label: 'YES — Continue', next: 'match' },
        { label: 'NO — Request new document', next: 'request_doc' },
      ],
    },
    request_doc: {
      id: 'request_doc',
      type: 'outcome',
      title: 'Request new document',
      action: 'Ask for a clear resubmit. Use SOP-IDV-002 if a formal reject reason is required.',
      escalate: false,
    },
    match: {
      id: 'match',
      prompt: 'Do identity fields match the Hire profile / companion docs?',
      whatToCheck: 'Name, DOB, PAN/Aadhaar expectations; Client authorized person vs employee',
      whyItMatters: 'Mismatch may be data error or fraud',
      whatNotToDo: 'Do not manually override without policy',
      escalateWhen: 'Partial match with fraud signals',
      options: [
        { label: 'YES — Continue', next: 'suspicious' },
        { label: 'NO — Reject / Escalate', next: 'reject_mismatch' },
      ],
    },
    reject_mismatch: {
      id: 'reject_mismatch',
      type: 'outcome',
      title: 'Reject or escalate',
      action: 'Follow SOP-IDV-002 Rejection; use SOP-IDV-003 if fraud suspected.',
      escalate: true,
    },
    suspicious: {
      id: 'suspicious',
      prompt: 'Is there a suspicious / fraud signal?',
      whatToCheck: 'Altered doc, duplicate identity, device anomalies, queue fraud flags',
      whyItMatters: 'Suspicious cases need fraud review — not force-approve',
      whatNotToDo: 'Do not approve to clear queue pressure',
      escalateWhen: 'Any high-risk fraud flag',
      options: [
        { label: 'NO — Continue', next: 'liveness' },
        { label: 'YES — Fraud review', next: 'fraud' },
      ],
    },
    fraud: {
      id: 'fraud',
      type: 'outcome',
      title: 'Fraud review',
      action: 'Escalate using SOP-IDV-003. Confirm OBO vs TNS ownership if suspension is involved.',
      escalate: true,
    },
    liveness: {
      id: 'liveness',
      prompt: 'Is the remaining blocker document approval or liveness/Meet join?',
      whatToCheck: 'Hire liveness status; meet_link must be idv.airepro.in (not Google placeholder)',
      whyItMatters: 'OBO does not own Meet slot timing',
      whatNotToDo: 'Do not look for slot timing in OBO tables',
      escalateWhen: 'Booked in Meet but Hire has no booking / invalid join link',
      options: [
        { label: 'Document path complete — Approve', next: 'approve' },
        { label: 'Liveness / join-link issue', next: 'liveness_eng' },
        { label: 'Incomplete / blocked', next: 'escalate_incomplete' },
      ],
    },
    liveness_eng: {
      id: 'liveness_eng',
      type: 'outcome',
      title: 'Route to IDV / Hire engineering',
      action: 'Use IDV Common Errors checklist; escalate Meet/webhook/IDV server owners. Do not force-approve documents to “fix” join links.',
      escalate: true,
    },
    approve: {
      id: 'approve',
      type: 'outcome',
      title: 'Approve',
      action: 'Approve in OBO Approve Identity per SOP-IDV-001 and confirm status update.',
      escalate: false,
    },
    escalate_incomplete: {
      id: 'escalate_incomplete',
      type: 'outcome',
      title: 'Escalate incomplete case',
      action: 'Escalate with missing-check details (SOP-IDV-003).',
      escalate: true,
    },
  };

  const payTreeNodes = {
    start: {
      id: 'start',
      prompt: 'Payment status is FAILED (or customer reports failure). First check?',
      whatToCheck: 'Airepro transaction ID and status',
      whyItMatters: 'Confirms failure in our system before provider work',
      whatNotToDo: 'Do not refund immediately without checks',
      escalateWhen: 'Transaction ID not found',
      options: [{ label: 'Confirm Airepro transaction status', next: 'provider' }],
    },
    provider: {
      id: 'provider',
      prompt: 'Which payment provider owns this charge?',
      whatToCheck: 'Provider field on transaction (Razorpay / Cashfree / other)',
      whyItMatters: 'Wrong dashboard wastes time and causes wrong advice',
      whatNotToDo: 'Do not check a different provider',
      escalateWhen: 'Provider unknown',
      options: [
        { label: 'Razorpay', next: 'provider_status' },
        { label: 'Cashfree', next: 'provider_status' },
        { label: 'Other / unknown', next: 'escalate_pay' },
      ],
    },
    provider_status: {
      id: 'provider_status',
      prompt: 'What does the provider show?',
      whatToCheck: 'Provider payment status vs Airepro',
      whyItMatters: 'Detects charged-but-failed mismatches',
      whatNotToDo: 'Do not trust customer claim alone',
      escalateWhen: 'Provider UI unavailable',
      options: [
        { label: 'SUCCESS (charged)', next: 'charged_path' },
        { label: 'FAILED (not charged)', next: 'not_charged' },
        { label: 'PENDING', next: 'pending' },
        { label: 'UNKNOWN', next: 'escalate_pay' },
      ],
    },
    charged_path: {
      id: 'charged_path',
      type: 'outcome',
      title: 'Charged but failed',
      action: 'Follow SOP-PAY-002 and escalate reconciliation (SOP-PAY-004). Do not close as “failed only.”',
      escalate: true,
    },
    not_charged: {
      id: 'not_charged',
      type: 'outcome',
      title: 'Inform customer — not charged',
      action: 'Per SOP-PAY-001: advise retry; document both IDs; close if no further issues.',
      escalate: false,
    },
    pending: {
      id: 'pending',
      type: 'outcome',
      title: 'Wait and recheck',
      action: 'Mark waiting, set follow-up, recheck provider. Escalate if SLA breached (Support/Payments owned targets).',
      escalate: false,
    },
    escalate_pay: {
      id: 'escalate_pay',
      type: 'outcome',
      title: 'Escalate payment issue',
      action: 'Use SOP-PAY-004 evidence pack (Airepro + provider IDs, amounts, timestamps).',
      escalate: true,
    },
  };

  const ts = nowIso();
  const idvTreeId = uid('tree');
  db.prepare(
    `INSERT INTO decision_trees (id, slug, title, category, status, version, description, root_node_id, nodes_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    idvTreeId,
    'idv-decision-tree',
    'IDV Decision Guide',
    'idv',
    'PUBLISHED',
    '1.1',
    'Guided IDV path: consent → readability → match → fraud → liveness ownership → approve.',
    'start',
    JSON.stringify(idvTreeNodes),
    ts,
    ts,
  );
  for (const r of idvRoles) {
    db.prepare('INSERT INTO decision_tree_roles (tree_id, role_id) VALUES (?, ?)').run(idvTreeId, r);
  }

  const payTreeId = uid('tree');
  db.prepare(
    `INSERT INTO decision_trees (id, slug, title, category, status, version, description, root_node_id, nodes_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    payTreeId,
    'failed-payment-decision-tree',
    'Failed Payment Decision Guide',
    'payments',
    'PUBLISHED',
    '1.1',
    'FAILED payment triage: Airepro → provider → charged vs not → escalate.',
    'start',
    JSON.stringify(payTreeNodes),
    ts,
    ts,
  );
  for (const r of payRoles) {
    db.prepare('INSERT INTO decision_tree_roles (tree_id, role_id) VALUES (?, ?)').run(payTreeId, r);
  }

  function createCourse({
    slug,
    title,
    description,
    roles,
    modules,
    quiz,
    certExpiryDays = 365,
    sortOrder = 0,
  }) {
    const courseId = uid('course');
    db.prepare(
      `INSERT INTO courses (id, slug, title, description, status, version, estimated_minutes, passing_score, cert_expiry_days, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'PUBLISHED', '1.1', ?, 80, ?, ?, ?, ?)`,
    ).run(courseId, slug, title, description, 60, certExpiryDays, sortOrder, ts, ts);

    for (const roleId of roles) {
      db.prepare(
        'INSERT INTO course_roles (course_id, role_id, required) VALUES (?, ?, 1)',
      ).run(courseId, roleId);
    }

    modules.forEach((mod, mi) => {
      const moduleId = uid('mod');
      db.prepare(
        'INSERT INTO modules (id, course_id, title, description, sort_order) VALUES (?, ?, ?, ?, ?)',
      ).run(moduleId, courseId, mod.title, mod.description || null, mi);
      (mod.lessons || []).forEach((lesson, li) => {
        db.prepare(
          `INSERT INTO lessons (id, module_id, title, sort_order, document_id, body_md, duration_minutes)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          uid('lesson'),
          moduleId,
          lesson.title,
          li,
          null,
          lesson.body_md,
          lesson.duration || 8,
        );
      });
    });

    if (quiz) {
      const quizId = uid('quiz');
      db.prepare(
        `INSERT INTO quizzes (id, course_id, slug, title, description, passing_score, max_attempts, status, created_at)
         VALUES (?, ?, ?, ?, ?, 80, 5, 'PUBLISHED', ?)`,
      ).run(quizId, courseId, quiz.slug, quiz.title, quiz.description || null, ts);
      quiz.questions.forEach((q, qi) => {
        db.prepare(
          `INSERT INTO quiz_questions (id, quiz_id, type, prompt, options_json, correct_option_ids_json, explanation, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          uid('qq'),
          quizId,
          q.type,
          q.prompt,
          JSON.stringify(q.options),
          JSON.stringify(q.correct),
          q.explanation || null,
          qi,
        );
      });
    }

    return courseId;
  }

  createCourse({
    slug: 'airepro-basics',
    title: 'Airepro Basics',
    description: 'Required foundation: platform map, OBO orientation, escalation.',
    roles: allAgents,
    sortOrder: 1,
    modules: [
      {
        title: 'Platform basics',
        lessons: [
          {
            title: 'What Airepro is',
            body_md: [
              `# What Airepro is`,
              ``,
              `Read **Airepro Platform Overview** in Knowledge Base.`,
              ``,
              `Key takeaway: map each issue to IDV, Payments, Support, Jobs/Internships, or Fraud/TNS before acting.`,
              ``,
              `Related: Escalation Policy ownership table.`,
            ].join('\n'),
          },
          {
            title: 'Back Office orientation',
            body_md: [
              `# Back Office orientation`,
              ``,
              `Read **Back Office Introduction**.`,
              ``,
              `- Use provisioned OBO login only`,
              `- Confirm Stage vs Prod when the toggle is enabled`,
              `- Approve Identity ≠ Meet liveness timing`,
            ].join('\n'),
          },
        ],
      },
    ],
    quiz: {
      slug: 'airepro-basics-quiz',
      title: 'Airepro Basics Knowledge Check',
      questions: [
        {
          type: 'mcq',
          prompt: 'A user booked IDV liveness but cannot join. Where should you look first?',
          options: [
            { id: 'a', text: 'OBO slot timing tables' },
            { id: 'b', text: 'Hire Meet booking / IDV join link path (idv.airepro.in)' },
            { id: 'c', text: 'TNS suspension list' },
          ],
          correct: ['b'],
          explanation: 'OBO does not own Meet slot timing; valid join links are idv.airepro.in.',
        },
        {
          type: 'mcq',
          prompt: 'What should an agent do first when unsure how to proceed?',
          options: [
            { id: 'a', text: 'Guess and close the ticket' },
            { id: 'b', text: 'Follow the relevant SOP / escalate when blocked' },
            { id: 'c', text: 'Share credentials with a teammate' },
          ],
          correct: ['b'],
        },
        {
          type: 'true_false',
          prompt: 'Active suspensions should be treated as owned by TNS unless another system is confirmed as SoR.',
          options: [
            { id: 't', text: 'True' },
            { id: 'f', text: 'False' },
          ],
          correct: ['t'],
        },
        {
          type: 'mcq',
          prompt: 'Switching OBO Stage ↔ Prod typically:',
          options: [
            { id: 'a', text: 'Keeps your session' },
            { id: 'b', text: 'Forces re-login' },
            { id: 'c', text: 'Deletes all tickets' },
          ],
          correct: ['b'],
        },
      ],
    },
  });

  createCourse({
    slug: 'security-privacy',
    title: 'Security & Privacy',
    description: 'Credential hygiene and PII need-to-know rules.',
    roles: allAgents,
    sortOrder: 2,
    certExpiryDays: 180,
    modules: [
      {
        title: 'Security',
        lessons: [
          {
            title: 'Credential hygiene',
            body_md: `# Credential hygiene\n\nRead **Agent Security**.\n\n- Lock workstation\n- Never paste JWTs/API keys into chat\n- Report phishing immediately`,
          },
          {
            title: 'PII handling',
            body_md: `# PII handling\n\nRead **PII Handling**.\n\n- Need-to-know only\n- No ID photos on WhatsApp\n- Training uses synthetic examples only`,
          },
        ],
      },
    ],
    quiz: {
      slug: 'security-privacy-quiz',
      title: 'Security & Privacy Quiz',
      questions: [
        {
          type: 'scenario',
          prompt:
            'A teammate asks you to paste a customer ID document into WhatsApp for a “quick check”. What should you do?',
          options: [
            { id: 'a', text: 'Paste it to help quickly' },
            { id: 'b', text: 'Refuse and use approved tools / escalate if needed' },
            { id: 'c', text: 'Email the document to a personal inbox instead' },
          ],
          correct: ['b'],
          explanation: 'PII must stay in approved systems.',
        },
        {
          type: 'true_false',
          prompt: 'You may leave your Back Office session unlocked when stepping away briefly.',
          options: [
            { id: 't', text: 'True' },
            { id: 'f', text: 'False' },
          ],
          correct: ['f'],
        },
        {
          type: 'mcq',
          prompt: 'Which field should never appear in free-text chat notes?',
          options: [
            { id: 'a', text: 'Ticket ID' },
            { id: 'b', text: 'Full Aadhaar / PAN image data' },
            { id: 'c', text: 'Queue name' },
          ],
          correct: ['b'],
        },
        {
          type: 'mcq',
          prompt: 'Training screenshots in this portal should use:',
          options: [
            { id: 'a', text: 'Live production customer documents' },
            { id: 'b', text: 'Synthetic / anonymized examples' },
            { id: 'c', text: 'Whatever is fastest' },
          ],
          correct: ['b'],
        },
      ],
    },
  });

  createCourse({
    slug: 'idv-fundamentals',
    title: 'IDV Fundamentals',
    description: 'Required for IDV agents — SOP-IDV-001 order and liveness ownership.',
    roles: idvRoles,
    sortOrder: 3,
    modules: [
      {
        title: 'Verification basics',
        lessons: [
          {
            title: 'Consent first',
            body_md: `# Consent first\n\nFollow **SOP-IDV-001** and the **IDV Decision Guide**.\n\nMissing consent → stop. Do not approve.`,
          },
          {
            title: 'Document + face match + liveness',
            body_md: `# Document + match + liveness\n\n1. Readable document\n2. Identity match\n3. Fraud signals → escalate (SOP-IDV-003)\n4. Liveness join links must be idv.airepro.in — see **IDV Common Errors**`,
          },
        ],
      },
    ],
    quiz: {
      slug: 'idv-fundamentals-quiz',
      title: 'IDV Fundamentals Quiz',
      questions: [
        {
          type: 'mcq',
          prompt: 'Consent is missing. What is the correct action?',
          options: [
            { id: 'a', text: 'Approve anyway if document looks fine' },
            { id: 'b', text: 'Stop and request consent' },
            { id: 'c', text: 'Reject as fraud immediately' },
          ],
          correct: ['b'],
        },
        {
          type: 'true_false',
          prompt: 'Suspicious signals should be sent to fraud review rather than force-approved.',
          options: [
            { id: 't', text: 'True' },
            { id: 'f', text: 'False' },
          ],
          correct: ['t'],
        },
        {
          type: 'mcq',
          prompt: 'Which join link is valid for IDV liveness?',
          options: [
            { id: 'a', text: 'https://meet.google.com/new?airepro=agent' },
            { id: 'b', text: 'https://idv.airepro.in/verify/…' },
            { id: 'c', text: 'Any Zoom link the customer invents' },
          ],
          correct: ['b'],
        },
        {
          type: 'scenario',
          prompt: 'Document is blurry but the name seems right. Best next step?',
          options: [
            { id: 'a', text: 'Approve based on guess' },
            { id: 'b', text: 'Request a new clear capture / reject with accurate reason' },
            { id: 'c', text: 'Ask customer to WhatsApp the ID' },
          ],
          correct: ['b'],
        },
        {
          type: 'mcq',
          prompt: 'Client/TSM identity docs should belong to:',
          options: [
            { id: 'a', text: 'Any employee' },
            { id: 'b', text: 'The authorized person / signatory' },
            { id: 'c', text: 'A freelancers random PAN' },
          ],
          correct: ['b'],
        },
      ],
    },
  });

  createCourse({
    slug: 'payment-operations',
    title: 'Payment Operations',
    description: 'Failed payment triage, charged-but-failed, escalation.',
    roles: payRoles,
    sortOrder: 4,
    modules: [
      {
        title: 'Failed payments',
        lessons: [
          {
            title: 'Status guide',
            body_md: `# Status guide\n\nRead **Payment Status Guide** and walk the **Failed Payment Decision Guide**.\n\nOrder: Airepro status → correct provider → branch.`,
          },
          {
            title: 'Charged but failed',
            body_md: `# Charged but failed\n\nProvider SUCCESS + Airepro FAILED → **SOP-PAY-002** + escalate (**SOP-PAY-004**).\n\nRefunds: see **Refund SOP** (IN_REVIEW — confirm with Payments).`,
          },
        ],
      },
    ],
    quiz: {
      slug: 'payment-operations-quiz',
      title: 'Payment Operations Quiz',
      questions: [
        {
          type: 'scenario',
          prompt:
            'Customer says money was deducted but payment failed. What should you check first?',
          options: [
            { id: 'a', text: 'Immediately issue a refund' },
            { id: 'b', text: 'Airepro transaction status, then provider status' },
            { id: 'c', text: 'Ask the customer to wait 30 days with no checks' },
          ],
          correct: ['b'],
        },
        {
          type: 'mcq',
          prompt: 'Provider shows SUCCESS but Airepro shows FAILED. Next step?',
          options: [
            { id: 'a', text: 'Tell customer nothing is wrong' },
            { id: 'b', text: 'Follow charged-but-failed / escalate reconciliation' },
            { id: 'c', text: 'Delete the transaction' },
          ],
          correct: ['b'],
        },
        {
          type: 'true_false',
          prompt: 'Training Refund SOP text is final Payments legal policy.',
          options: [
            { id: 't', text: 'True' },
            { id: 'f', text: 'False' },
          ],
          correct: ['f'],
          explanation: 'Refund SOP is IN_REVIEW — confirm eligibility with Payments.',
        },
        {
          type: 'mcq',
          prompt: 'Withdrawal batch / retry tooling primarily lives in:',
          options: [
            { id: 'a', text: 'End-user Hire FAQ only' },
            { id: 'b', text: 'payment-airepro Withdrawal Ops (+ OBO bank/withdrawal queues)' },
            { id: 'c', text: 'Meet booking admin' },
          ],
          correct: ['b'],
        },
      ],
    },
  });

  createCourse({
    slug: 'support-operations',
    title: 'Support Operations',
    description: 'Ticket workflow — content pending Support ops approval (IN_REVIEW docs).',
    roles: supportRoles,
    sortOrder: 5,
    modules: [
      {
        title: 'Ticket workflow',
        lessons: [
          {
            title: 'Lifecycle',
            body_md: `# Lifecycle\n\nRead **Support Ticket Lifecycle** (IN_REVIEW).\n\nOBO surfaces: Help and Support, Message, Contact Management.`,
          },
          {
            title: 'First response',
            body_md: `# First response\n\nFollow **SOP-SUP-001** (IN_REVIEW): acknowledge, restate, set next update — never ask for passwords or full ID images in chat.`,
          },
        ],
      },
    ],
    quiz: {
      slug: 'support-operations-quiz',
      title: 'Support Operations Quiz',
      questions: [
        {
          type: 'mcq',
          prompt: 'A good first response includes:',
          options: [
            { id: 'a', text: 'Only “ok”' },
            { id: 'b', text: 'Acknowledgement, restated issue, and next update time' },
            { id: 'c', text: 'Customer password request' },
          ],
          correct: ['b'],
        },
        {
          type: 'true_false',
          prompt: 'You should escalate with steps already tried and customer impact noted.',
          options: [
            { id: 't', text: 'True' },
            { id: 'f', text: 'False' },
          ],
          correct: ['t'],
        },
        {
          type: 'mcq',
          prompt: 'Illustrative P1 examples include:',
          options: [
            { id: 'a', text: 'Cosmetic profile photo tip' },
            { id: 'b', text: 'Account lockout or active payment loss / safety' },
            { id: 'c', text: 'Marketing newsletter preference' },
          ],
          correct: ['b'],
        },
        {
          type: 'scenario',
          prompt: 'Customer reports charged-but-failed payment. Support should:',
          options: [
            { id: 'a', text: 'Close as Hire bug without IDs' },
            { id: 'b', text: 'Collect IDs and follow Payments SOPs / escalate with evidence pack' },
            { id: 'c', text: 'Ask for full card number in chat' },
          ],
          correct: ['b'],
        },
      ],
    },
  });

  db.prepare(
    `INSERT INTO announcements (id, title, body_md, importance, status, published_at, created_at)
     VALUES (?, ?, ?, ?, 'PUBLISHED', ?, ?)`,
  ).run(
    uid('ann'),
    'Training content Wave 1 published',
    [
      '**Wave 1 (PUBLISHED):** Platform overview, OBO intro, security/PII, escalation, IDV SOPs, payment failed/charged-but-failed/escalation, intern→freelancer conversion SOPs, and updated decision guides.',
      '',
      '**Wave 2 (IN_REVIEW — admins only until approved):** Support ticket SOPs, job review SOPs, Refund SOP, fraud/moderation awareness. Derived from OBO UI/code — pending ops sign-off.',
      '',
      'Start with **Airepro Basics** and **Security & Privacy**.',
    ].join('\n'),
    'IMPORTANT',
    ts,
    ts,
  );
}

export function seedIfEmpty() {
  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (count > 0) return { seeded: false };

  db.exec('BEGIN');
  try {
    insertRoles(db);
    for (const user of DEMO_USERS) {
      insertUser(db, user);
    }
    seedContent(db);
    db.exec('COMMIT');
    console.log('Seeded training database (demo users + Wave 1/2 content)');
    return { seeded: true };
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

/** Demo accounts used for local + early production access (AUTH_MODE=demo). */
export const DEMO_USERS = [
  {
    email: 'admin@airepro.local',
    name: 'Training Admin',
    department: 'Operations',
    roles: [ROLES.SUPER_ADMIN],
    password: 'demo-admin',
  },
  {
    email: 'idv@airepro.local',
    name: 'IDV Demo Agent',
    department: 'IDV',
    roles: [ROLES.IDV_AGENT],
    password: 'demo-agent',
  },
  {
    email: 'payment@airepro.local',
    name: 'Payment Demo Agent',
    department: 'Payments',
    roles: [ROLES.PAYMENT_AGENT],
    password: 'demo-agent',
  },
  {
    email: 'support@airepro.local',
    name: 'Support Demo Agent',
    department: 'Support',
    roles: [ROLES.SUPPORT_AGENT],
    password: 'demo-agent',
  },
  {
    email: 'ops@airepro.local',
    name: 'Ops Demo Agent',
    department: 'Operations',
    roles: [ROLES.OPERATIONS_AGENT],
    password: 'demo-agent',
  },
  {
    email: 'trainer1@airepro.local',
    name: 'Priya Sharma',
    department: 'IDV',
    roles: [ROLES.IDV_AGENT],
    password: 'Train@2026',
  },
  {
    email: 'trainer2@airepro.local',
    name: 'Rahul Mehta',
    department: 'Payments',
    roles: [ROLES.PAYMENT_AGENT],
    password: 'Train@2026',
  },
  {
    email: 'trainer3@airepro.local',
    name: 'Ananya Gupta',
    department: 'Support',
    roles: [ROLES.SUPPORT_AGENT],
    password: 'Train@2026',
  },
  {
    email: 'trainer4@airepro.local',
    name: 'Vikram Singh',
    department: 'Operations',
    roles: [ROLES.OPERATIONS_AGENT],
    password: 'Train@2026',
  },
  {
    email: 'trainer5@airepro.local',
    name: 'Neha Kapoor',
    department: 'Fraud',
    roles: [ROLES.FRAUD_AGENT],
    password: 'Train@2026',
  },
];

/**
 * Upsert demo users + roles so AUTH_MODE=demo works on existing DBs
 * (e.g. production volume that was seeded before trainers were added).
 */
export function ensureDemoUsers() {
  const db = getDb();
  insertRoles(db);
  const ts = nowIso();
  let created = 0;
  let updated = 0;

  for (const user of DEMO_USERS) {
    const existing = db
      .prepare('SELECT id FROM users WHERE lower(email) = lower(?)')
      .get(user.email);
    const hash = user.password ? hashPassword(user.password) : null;

    if (existing) {
      db.prepare(
        `UPDATE users SET name = ?, department = ?, training_access = 1,
         demo_password_hash = ?, updated_at = ? WHERE id = ?`,
      ).run(user.name, user.department || null, hash, ts, existing.id);
      db.prepare('DELETE FROM user_roles WHERE user_id = ?').run(existing.id);
      const ur = db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');
      for (const role of user.roles) {
        ur.run(existing.id, role);
      }
      updated += 1;
    } else {
      insertUser(db, user);
      created += 1;
    }
  }

  if (created || updated) {
    console.log(`Demo users ensured (created=${created}, updated=${updated})`);
  }
  return { created, updated };
}

export function verifyDemoPassword(user, password) {
  if (!user?.demo_password_hash || !password) return false;
  return user.demo_password_hash === hashPassword(password);
}

export { hashPassword, parseJson };
