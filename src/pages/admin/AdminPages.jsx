import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';

function AdminHomePage() {
  return (
    <div className="page admin-dense">
      <PageHeader
        eyebrow="Admin"
        title="Training content management"
        lede="Publish SOPs, provision access, and manage certifications."
      />
      <div className="card-grid">
        <Link className="ops-card ops-card--tone-default" to="/admin/documents">
          <h2>Documents &amp; SOPs</h2>
          <p>Create, edit, publish training content.</p>
        </Link>
        <Link className="ops-card ops-card--tone-default" to="/admin/users">
          <h2>Users &amp; access</h2>
          <p>Provision training access and roles.</p>
        </Link>
        <Link className="ops-card ops-card--tone-default" to="/admin/certifications">
          <h2>Certifications</h2>
          <p>Review and revoke certifications.</p>
        </Link>
        <Link className="ops-card ops-card--tone-default" to="/admin/announcements">
          <h2>Announcements</h2>
          <p>Publish operational updates.</p>
        </Link>
      </div>
    </div>
  );
}

function AdminDocumentsPage() {
  const [docs, setDocs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .adminDocuments()
      .then((d) => setDocs(d.documents))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="page admin-dense">
      <p>
        <Link to="/admin">← Admin</Link>
      </p>
      <PageHeader
        title="Documents"
        actions={
          <Link className="btn btn--primary" to="/admin/documents/new">
            New document
          </Link>
        }
      />
      {error ? <div className="callout callout--danger">{error}</div> : null}
      <table className="admin-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>Status</th>
            <th>Version</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((d) => (
            <tr key={d.id}>
              <td>
                <Link to={`/admin/documents/${d.id}`}>{d.title}</Link>
              </td>
              <td>
                <StatusBadge status={d.type}>{d.type}</StatusBadge>
              </td>
              <td>
                <StatusBadge status={d.status}>{d.status}</StatusBadge>
              </td>
              <td>v{d.version}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminDocumentFormPage({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meta, setMeta] = useState(null);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    type: 'article',
    category: 'general',
    status: 'DRAFT',
    version: '1.0',
    summary: '',
    bodyMd: '',
    sopCode: '',
    roles: [],
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.adminMeta().then(setMeta).catch(() => {});
    if (mode === 'edit' && id) {
      api
        .adminDocument(id)
        .then((d) => {
          const doc = d.document;
          setForm({
            title: doc.title,
            slug: doc.slug,
            type: doc.type,
            category: doc.category || 'general',
            status: doc.status,
            version: doc.version,
            summary: doc.summary || '',
            bodyMd: doc.body_md || '',
            sopCode: doc.sop_code || '',
            roles: doc.roles || [],
          });
        })
        .catch((err) => setError(err.message));
    }
  }, [mode, id]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleRole(role) {
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(role) ? f.roles.filter((r) => r !== role) : [...f.roles, role],
    }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (mode === 'new') {
        const created = await api.adminCreateDocument(form);
        navigate(`/admin/documents/${created.id}`);
      } else {
        await api.adminUpdateDocument(id, form);
        navigate('/admin/documents');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!window.confirm('Delete this document?')) return;
    await api.adminDeleteDocument(id);
    navigate('/admin/documents');
  }

  return (
    <div className="page">
      <p>
        <Link to="/admin/documents">← Documents</Link>
      </p>
      <h1>{mode === 'new' ? 'New document' : 'Edit document'}</h1>
      {error ? <div className="callout callout--danger">{error}</div> : null}
      <form className="panel stack-form" onSubmit={onSubmit}>
        <label>
          Title
          <input value={form.title} onChange={(e) => update('title', e.target.value)} required />
        </label>
        {mode === 'new' ? (
          <label>
            Slug (optional)
            <input value={form.slug} onChange={(e) => update('slug', e.target.value)} />
          </label>
        ) : null}
        <div className="form-row">
          <label>
            Type
            <select value={form.type} onChange={(e) => update('type', e.target.value)}>
              {(meta?.documentTypes || ['article', 'sop']).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label>
            Category
            <select value={form.category} onChange={(e) => update('category', e.target.value)}>
              {(meta?.categories || []).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select value={form.status} onChange={(e) => update('status', e.target.value)}>
              {(meta?.statuses || []).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Summary
          <input value={form.summary} onChange={(e) => update('summary', e.target.value)} />
        </label>
        {form.type === 'sop' ? (
          <label>
            SOP code
            <input value={form.sopCode} onChange={(e) => update('sopCode', e.target.value)} />
          </label>
        ) : null}
        <label>
          Body (Markdown)
          <textarea
            rows={16}
            value={form.bodyMd}
            onChange={(e) => update('bodyMd', e.target.value)}
          />
        </label>
        <fieldset>
          <legend>Visible to roles</legend>
          <div className="chip-row">
            {(meta?.roles || []).map((role) => (
              <label key={role} className="chip">
                <input
                  type="checkbox"
                  checked={form.roles.includes(role)}
                  onChange={() => toggleRole(role)}
                />
                {role}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="choice-row">
          <button className="btn btn--primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          {mode === 'edit' ? (
            <button type="button" className="btn btn--ghost" onClick={onDelete}>
              Delete
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}

function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '',
    name: '',
    password: '',
    roles: ['OPERATIONS_AGENT'],
    trainingAccess: true,
  });

  async function load() {
    const [u, m] = await Promise.all([api.adminUsers(), api.adminMeta()]);
    setUsers(u.users);
    setMeta(m);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function createUser(e) {
    e.preventDefault();
    await api.adminCreateUser(form);
    setForm({
      email: '',
      name: '',
      password: '',
      roles: ['OPERATIONS_AGENT'],
      trainingAccess: true,
    });
    await load();
  }

  async function toggleAccess(user) {
    await api.adminUpdateUser(user.id, { trainingAccess: !user.trainingAccess });
    await load();
  }

  return (
    <div className="page">
      <p>
        <Link to="/admin">← Admin</Link>
      </p>
      <h1>Users</h1>
      {error ? <div className="callout callout--danger">{error}</div> : null}
      <form className="panel stack-form" onSubmit={createUser}>
        <h2>Provision user</h2>
        <label>
          Email
          <input
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label>
          Name
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label>
          Demo password (optional)
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>
        <label>
          Role
          <select
            value={form.roles[0]}
            onChange={(e) => setForm({ ...form, roles: [e.target.value] })}
          >
            {(meta?.roles || []).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn--primary" type="submit">
          Create
        </button>
      </form>
      <ul className="link-list">
        {users.map((u) => (
          <li key={u.id}>
            <span>
              {u.name} ({u.email}) — {u.roles.join(', ')}
            </span>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => toggleAccess(u)}>
              {u.trainingAccess ? 'Revoke access' : 'Grant access'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AdminCertificationsPage() {
  const [certs, setCerts] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    const d = await api.adminCertifications();
    setCerts(d.certifications);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function revoke(id) {
    const reason = window.prompt('Revoke reason?') || 'Revoked by admin';
    await api.adminRevokeCert(id, reason);
    await load();
  }

  return (
    <div className="page">
      <p>
        <Link to="/admin">← Admin</Link>
      </p>
      <h1>Certifications</h1>
      {error ? <div className="callout callout--danger">{error}</div> : null}
      <ul className="link-list">
        {certs.map((c) => (
          <li key={c.id}>
            <span>
              {c.name || c.email} — {c.course_title} [{c.status}]
            </span>
            {c.status === 'PASSED' ? (
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => revoke(c.id)}>
                Revoke
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AdminAnnouncementsPage() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [bodyMd, setBodyMd] = useState('');

  async function load() {
    const d = await api.adminAnnouncements();
    setItems(d.announcements);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function create(e) {
    e.preventDefault();
    await api.adminCreateAnnouncement({ title, bodyMd, importance: 'IMPORTANT' });
    setTitle('');
    setBodyMd('');
    await load();
  }

  return (
    <div className="page">
      <p>
        <Link to="/admin">← Admin</Link>
      </p>
      <h1>Announcements</h1>
      <form className="panel stack-form" onSubmit={create}>
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label>
          Body
          <textarea rows={6} value={bodyMd} onChange={(e) => setBodyMd(e.target.value)} />
        </label>
        <button className="btn btn--primary" type="submit">
          Publish
        </button>
      </form>
      <ul className="link-list">
        {items.map((a) => (
          <li key={a.id}>
            <span>{a.title}</span>
            <span className="muted">{a.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export {
  AdminHomePage,
  AdminDocumentsPage,
  AdminDocumentFormPage,
  AdminUsersPage,
  AdminCertificationsPage,
  AdminAnnouncementsPage,
};
