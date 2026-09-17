-- Airepro Training Portal — initial schema (SQLite; MySQL-compatible column types)

CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  description TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id TEXT NOT NULL,
  permission_id TEXT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (permission_id) REFERENCES permissions(id)
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  obo_user_id TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  department TEXT,
  training_access INTEGER NOT NULL DEFAULT 0,
  demo_password_hash TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS role_obo_mappings (
  obo_role_type TEXT PRIMARY KEY,
  training_role_id TEXT NOT NULL,
  FOREIGN KEY (training_role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT,
  department TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  version TEXT NOT NULL DEFAULT '1.0',
  body_md TEXT,
  summary TEXT,
  owner TEXT,
  estimated_minutes INTEGER,
  purpose TEXT,
  prerequisites_json TEXT,
  escalation_rules_json TEXT,
  sla TEXT,
  effective_date TEXT,
  review_date TEXT,
  tags_json TEXT,
  change_summary TEXT,
  author TEXT,
  reviewer TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  published_at TEXT
);

CREATE TABLE IF NOT EXISTS document_roles (
  document_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  PRIMARY KEY (document_id, role_id),
  FOREIGN KEY (document_id) REFERENCES documents(id),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS sops (
  document_id TEXT PRIMARY KEY,
  sop_code TEXT UNIQUE NOT NULL,
  do_items_json TEXT,
  dont_items_json TEXT,
  related_sop_codes_json TEXT,
  FOREIGN KEY (document_id) REFERENCES documents(id)
);

CREATE TABLE IF NOT EXISTS decision_trees (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  version TEXT NOT NULL DEFAULT '1.0',
  description TEXT,
  root_node_id TEXT,
  nodes_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS decision_tree_roles (
  tree_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  PRIMARY KEY (tree_id, role_id),
  FOREIGN KEY (tree_id) REFERENCES decision_trees(id),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  version TEXT NOT NULL DEFAULT '1.0',
  estimated_minutes INTEGER,
  passing_score INTEGER NOT NULL DEFAULT 80,
  cert_expiry_days INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS course_roles (
  course_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  required INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (course_id, role_id),
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS modules (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  document_id TEXT,
  body_md TEXT,
  duration_minutes INTEGER,
  FOREIGN KEY (module_id) REFERENCES modules(id),
  FOREIGN KEY (document_id) REFERENCES documents(id)
);

CREATE TABLE IF NOT EXISTS quizzes (
  id TEXT PRIMARY KEY,
  course_id TEXT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER NOT NULL DEFAULT 80,
  max_attempts INTEGER,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  created_at TEXT NOT NULL,
  FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id TEXT PRIMARY KEY,
  quiz_id TEXT NOT NULL,
  type TEXT NOT NULL,
  prompt TEXT NOT NULL,
  options_json TEXT,
  correct_option_ids_json TEXT NOT NULL,
  explanation TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id TEXT PRIMARY KEY,
  quiz_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  score INTEGER,
  passed INTEGER,
  answers_json TEXT,
  started_at TEXT NOT NULL,
  submitted_at TEXT,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS certifications (
  id TEXT PRIMARY KEY,
  certificate_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  quiz_attempt_id TEXT,
  status TEXT NOT NULL,
  score INTEGER,
  issued_at TEXT,
  expires_at TEXT,
  version TEXT,
  revoked_at TEXT,
  revoke_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (quiz_attempt_id) REFERENCES quiz_attempts(id)
);

CREATE TABLE IF NOT EXISTS user_lesson_progress (
  user_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  PRIMARY KEY (user_id, lesson_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (lesson_id) REFERENCES lessons(id)
);

CREATE TABLE IF NOT EXISTS user_course_progress (
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED',
  percent INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, course_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body_md TEXT,
  importance TEXT NOT NULL DEFAULT 'NORMAL',
  status TEXT NOT NULL DEFAULT 'PUBLISHED',
  published_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS announcement_acks (
  announcement_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  acknowledged_at TEXT NOT NULL,
  PRIMARY KEY (announcement_id, user_id),
  FOREIGN KEY (announcement_id) REFERENCES announcements(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS document_acknowledgements (
  document_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  version TEXT NOT NULL,
  acknowledged_at TEXT NOT NULL,
  PRIMARY KEY (document_id, user_id, version),
  FOREIGN KEY (document_id) REFERENCES documents(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  meta_json TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS search_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  query TEXT NOT NULL,
  result_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
