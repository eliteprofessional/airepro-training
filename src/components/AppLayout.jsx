import { Link, Outlet, useLocation } from 'react-router-dom';

function AppLayout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/support' || pathname === '/support/';

  return (
    <div className={`app-shell${isHome ? ' app-shell--home' : ''}`}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="site-header__inner">
          <Link className="brand" to="/support">
            <span className="brand__mark">Airepro</span>
            <span className="brand__label">Support</span>
          </Link>
          <nav className="site-nav" aria-label="Primary">
            <Link to="/support" aria-current={isHome ? 'page' : undefined}>
              Docs
            </Link>
          </nav>
        </div>
      </header>
      <main id="main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="site-footer__inner">
          <span>Airepro Support</span>
          <span className="site-footer__sep" aria-hidden="true">
            ·
          </span>
          <span>Documentation for candidates and hiring teams</span>
        </div>
      </footer>
    </div>
  );
}

export default AppLayout;
