import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DocumentForm from '../../components/admin/DocumentForm';
import {
  clearAdminToken,
  fetchAdminDocument,
  updateAdminDocument,
} from '../../lib/api';

function AdminDocumentEditPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    document.title = `Edit ${slug} — Admin`;
    let cancelled = false;

    async function load() {
      setStatus('loading');
      setError('');
      try {
        const data = await fetchAdminDocument(slug);
        if (!cancelled) {
          setDoc(data);
          setStatus('ready');
        }
      } catch (err) {
        if (err.status === 401) {
          clearAdminToken();
          navigate('/admin/login', { replace: true });
          return;
        }
        if (!cancelled) {
          setStatus('error');
          setError(err.message || 'Failed to load document');
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug, navigate]);

  async function handleSubmit(payload) {
    setSavedMessage('');
    try {
      const updated = await updateAdminDocument(slug, payload);
      setDoc(updated);
      setSavedMessage('Saved.');
      if (updated.slug !== slug) {
        navigate(`/admin/documents/${updated.slug}/edit`, { replace: true });
      }
    } catch (err) {
      if (err.status === 401) {
        clearAdminToken();
        navigate('/admin/login', { replace: true });
        return;
      }
      throw err;
    }
  }

  return (
    <div className="page admin-page">
      <header className="admin-header">
        <div>
          <p className="page-hero__eyebrow">Admin</p>
          <h1>Edit document</h1>
        </div>
        <div className="admin-header__actions">
          {doc && (
            <Link className="button button--ghost" to={`/training/${doc.slug}`}>
              Preview
            </Link>
          )}
          <Link className="button button--ghost" to="/admin">
            Back to list
          </Link>
        </div>
      </header>

      {savedMessage && <p className="admin-alert admin-alert--ok">{savedMessage}</p>}
      {status === 'loading' && <p className="doc-status">Loading…</p>}
      {status === 'error' && (
        <p className="admin-alert admin-alert--error" role="alert">
          {error}
        </p>
      )}
      {status === 'ready' && doc && (
        <div className="admin-card">
          <DocumentForm
            key={doc.slug}
            initial={doc}
            submitLabel="Save changes"
            onSubmit={handleSubmit}
            allowSlugEdit
          />
        </div>
      )}
    </div>
  );
}

export default AdminDocumentEditPage;
