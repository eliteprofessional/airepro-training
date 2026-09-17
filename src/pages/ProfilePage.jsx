import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import Skeleton from '../components/ui/Skeleton';

function ProfilePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .profile()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="page">
        <div className="callout callout--danger">{error}</div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="page">
        <Skeleton rows={5} />
      </div>
    );
  }

  const { user, certifications, courses } = data;

  return (
    <div className="page">
      <PageHeader
        eyebrow="My Profile"
        title={user.name || user.email}
        lede={user.email}
        actions={<StatusBadge status={user.roles?.[0]}>{user.roles?.[0]}</StatusBadge>}
      />
      <div className="grid-2">
        <section className="panel">
          <h2>Roles</h2>
          <div className="meta-row">
            {user.roles.map((r) => (
              <StatusBadge key={r} status={r}>
                {r}
              </StatusBadge>
            ))}
          </div>
          <p className="muted" style={{ marginTop: '0.75rem' }}>
            Department: {user.department || '—'}
          </p>
        </section>
        <section className="panel">
          <h2>Certifications</h2>
          <ul className="link-list">
            {certifications.map((c) => (
              <li key={c.id}>
                <span>{c.course_title}</span>
                <StatusBadge status={c.status}>{c.status}</StatusBadge>
              </li>
            ))}
            {!certifications.length ? <li className="muted">None yet</li> : null}
          </ul>
        </section>
      </div>
      <section className="panel">
        <h2>Course progress</h2>
        <ul className="link-list">
          {courses.map((c) => (
            <li key={c.id}>
              <span>{c.title}</span>
              <span className="muted">
                {c.progress?.percent || 0}% · {c.certificationStatus}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default ProfilePage;
