import { useEffect } from 'react';
import { Link } from 'react-router-dom';

function NotFoundPage() {
  useEffect(() => {
    document.title = 'Page Not Found — Airepro Support';
  }, []);

  return (
    <div className="page">
      <div className="not-found">
        <h1>Page not found</h1>
        <p>That URL does not match a support page. Head back to the documentation hub.</p>
        <Link className="button button--primary" to="/support">
          Back to Support
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
