import { useEffect } from 'react';
import { Link } from 'react-router-dom';

function NotFoundPage() {
  useEffect(() => {
    document.title = 'Page Not Found — Airepro Training';
  }, []);

  return (
    <div className="page">
      <div className="doc-paper doc-paper--narrow not-found">
        <h1>Page not found</h1>
        <p>That URL does not match a training page. Head back to the guides hub.</p>
        <Link className="button button--primary" to="/training">
          Back to Training
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
