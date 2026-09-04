import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  adminLogout,
  clearAdminToken,
  deleteAdminDocument,
  fetchAdminDocuments,
} from '../../lib/api';

function AdminDocumentsPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    setStatus('loading');
    setError('');
    try {
      const data = await fetchAdminDocuments();
      setDocuments(data);
      setStatus('ready');
    } catch (err) {
      if (err.status === 401) {
        clearAdminToken();
        navigate('/admin/login', { replace: true });
        return;
      }
      setStatus('error');
      setError(err.message || 'Failed to load documents');
    }
  }

  useEffect(() => {
    document.title = 'Admin — Support Documents';
    load();
  }, []);

  async function handleLogout() {
    try {
      await adminLogout();
    } catch {
      // ignore network errors on logout
    }
    clearAdminToken();
    navigate('/admin/login', { replace: true });
  }

  async function handleDelete(doc) {
    const ok = window.confirm(
      `Delete “${doc.title}” (${doc.slug})? This removes the catalog entry and markdown file.`,
    );
    if (!ok) return;

    setMessage('');
    try {
      await deleteAdminDocument(doc.slug);
      setMessage(`Deleted ${doc.slug}.`);
      await load();
    } catch (err) {
      if (err.status === 401) {
        clearAdminToken();
        navigate('/admin/login', { replace: true });
        return;
      }
      setError(err.message || 'Delete failed');
    }
  }

  return (
    <div className="page admin-page">
      <header className="admin-header">
        <div>
          <p className="page-hero__eyebrow">Admin</p>
          <h1>Support documents</h1>
        </div>
        <div className="admin-header__actions">
          <Link className="button button--primary" to="/admin/documents/new">
            New document
          </Link>
          <Link className="button button--ghost" to="/support">
            View portal
          </Link>
          <button className="button button--ghost" type="button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      {message && <p className="admin-alert admin-alert--ok">{message}</p>}
      {error && (
        <p className="admin-alert admin-alert--error" role="alert">
          {error}
        </p>
      )}

      {status === 'loading' && <p className="doc-status">Loading…</p>}

      {status === 'ready' && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Slug</th>
                <th scope="col">Preview</th>
                <th scope="col">Download</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 && (
                <tr>
                  <td colSpan={5}>No documents yet.</td>
                </tr>
              )}
              {documents.map((doc) => (
                <tr key={doc.slug}>
                  <td>{doc.title}</td>
                  <td>
                    <code>{doc.slug}</code>
                  </td>
                  <td>{doc.preview ? 'Yes' : 'No'}</td>
                  <td>{doc.download ? 'Yes' : 'No'}</td>
                  <td className="admin-table__actions">
                    <Link
                      className="button button--secondary"
                      to={`/admin/documents/${doc.slug}/edit`}
                    >
                      Edit
                    </Link>
                    <button
                      className="button button--danger"
                      type="button"
                      onClick={() => handleDelete(doc)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminDocumentsPage;
