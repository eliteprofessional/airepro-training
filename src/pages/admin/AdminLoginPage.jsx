import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  adminLogin,
  getAdminToken,
  setAdminToken,
} from '../../lib/api';

function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Admin Login — Airepro Support';
  }, []);

  if (getAdminToken()) {
    return <Navigate to="/admin" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await adminLogin(password);
      setAdminToken(data.token);
      const dest = location.state?.from || '/admin';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page admin-page">
      <header className="page-hero">
        <p className="page-hero__eyebrow">Admin</p>
        <h1>Support portal login</h1>
        <p>Sign in with the shared admin password to manage documentation.</p>
      </header>

      <form className="admin-card admin-form" onSubmit={handleSubmit}>
        {error && (
          <p className="admin-alert admin-alert--error" role="alert">
            {error}
          </p>
        )}
        <label className="admin-field">
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <div className="admin-form__actions">
          <button className="button button--primary" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
          <Link className="button button--ghost" to="/support">
            Back to Support
          </Link>
        </div>
      </form>
    </div>
  );
}

export default AdminLoginPage;
