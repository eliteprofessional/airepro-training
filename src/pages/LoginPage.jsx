import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

function LoginPage() {
  const { user, login, loading, authMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [denied, setDenied] = useState('');
  const [hint, setHint] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.authConfig().then((c) => setHint(c.forgotPasswordHint || '')).catch(() => {});
  }, []);

  if (!loading && user) {
    return <Navigate to={location.state?.from || '/dashboard'} replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setDenied('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      if (err.code === 'NO_TRAINING_ACCESS' || err.status === 403) {
        setDenied(
          err.data?.message ||
            'You do not currently have access to the Airepro Agent Portal. Contact your administrator.',
        );
      } else {
        setError(err.message || 'Sign in failed');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <section className="login-brand-panel" aria-label="Airepro brand">
        <img className="login-brand-panel__logo" src="/ap-3.png" alt="" width="180" height="48" />
        <p className="login-brand-panel__product">Airepro</p>
        <p className="login-brand-panel__tag">
          Agent Training &amp; Operations — guided procedures for IDV, payments, and support.
        </p>
        <div className="login-brand-panel__meta">
          <span className="status-badge status-badge--accent">Ops-grade</span>
          <span className="status-badge">Role-aware content</span>
          <span className="status-badge">Decision guides</span>
        </div>
      </section>

      <div className="login-form-panel">
        <div className="login-card">
          <img className="login-card__logo" src="/ap-3.png" alt="Airepro" width="140" height="38" />
          <h1>Sign in</h1>
          <p className="muted">Use your provisioned Airepro / OBO account.</p>

          {denied ? (
            <div className="callout callout--warn" role="alert">
              {denied}
            </div>
          ) : null}
          {error ? (
            <div className="callout callout--danger" role="alert">
              {error}
            </div>
          ) : null}

          <form className="stack-form" onSubmit={onSubmit}>
            <label>
              Email
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <button className="btn btn--primary btn--lg" type="submit" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="muted login-hint">
            Forgot password? {hint || 'Contact your administrator.'}
          </p>
          {authMode === 'demo' ? (
            <p className="login-demo">
              Demo mode is active. Seed credentials are listed in the project README.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
