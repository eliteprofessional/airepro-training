import { Link, Outlet, useLocation } from 'react-router-dom';

function AppLayout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/training' || pathname === '/training/';

  return (
    <div className={`app-shell${isHome ? ' app-shell--home' : ''}`}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="site-header__inner">
          <Link className="brand" to="/training">
            <img className="brand__logo" src="/ap-3.png" alt="Airepro" width="120" height="32" />
            <span className="brand__label">Training</span>
          </Link>
          <nav className="site-nav" aria-label="Primary">
            <Link to="/training" aria-current={isHome ? 'page' : undefined}>
              Guides
            </Link>
          </nav>
        </div>
      </header>
      <main id="main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="site-footer__inner">
          <span>Airepro Training</span>
          <span className="site-footer__sep" aria-hidden="true">
            ·
          </span>
          <span>Backend ops for IDV, OBO, and Trust &amp; Safety</span>
        </div>
      </footer>
    </div>
  );
}

export default AppLayout;
