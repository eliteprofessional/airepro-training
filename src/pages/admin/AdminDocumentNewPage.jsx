import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DocumentForm from '../../components/admin/DocumentForm';
import { clearAdminToken, createAdminDocument } from '../../lib/api';

function AdminDocumentNewPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'New document — Admin';
  }, []);

  async function handleSubmit(payload) {
    try {
      const created = await createAdminDocument(payload);
      navigate(`/admin/documents/${created.slug}/edit`, { replace: true });
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
          <h1>New document</h1>
        </div>
        <Link className="button button--ghost" to="/admin">
          Back to list
        </Link>
      </header>
      <div className="admin-card">
        <DocumentForm
          submitLabel="Create document"
          onSubmit={handleSubmit}
          allowSlugEdit
          autoSlugFromTitle
        />
      </div>
    </div>
  );
}

export default AdminDocumentNewPage;
