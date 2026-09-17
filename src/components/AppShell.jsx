import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_GROUPS = [
  {
    label: 'Learn',
    items: [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/training', label: 'My Training' },
      { to: '/quizzes', label: 'Quizzes' },
      { to: '/certifications', label: 'Certifications' },
    ],
  },
  {
    label: 'Operate',
    items: [
      { to: '/operations', label: 'Operations' },
      { to: '/knowledge', label: 'Knowledge' },
      { to: '/decision-guides', label: 'Decision Guides' },
      { to: '/sops', label: 'SOPs' },
      { to: '/announcements', label: 'Announcements' },
    ],
  },
  {
    label: 'Account',
    items: [{ to: '/profile', label: 'Profile' }],
  },
];

function AppShell() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const [search, setSearch] = useState('');

  async function onLogout() {
    await logout();
    navigate('/login');
  }

  function closeNav() {
    setNavOpen(false);
  }

  function onSearch(e) {
    e.preventDefault();
    const q = search.trim();
    closeNav();
    navigate(q ? `/knowledge?q=${encodeURIComponent(q)}` : '/knowledge');
  }

  return (
    <div className={`app-shell app-shell--ops${navOpen ? ' is-nav-open' : ''}`}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <div
        className="ops-sidebar-backdrop"
        onClick={closeNav}
        onKeyDown={(e) => e.key === 'Escape' && closeNav()}
        role="presentation"
      />

      <aside className="ops-sidebar" aria-label="Primary">
        <Link className="ops-sidebar__brand" to="/dashboard" onClick={closeNav}>
          <img src="/ap-3.png" alt="Airepro" width="120" height="32" />
          <span className="ops-sidebar__product">
            <strong>Agent Portal</strong>
            <span>Training & Ops</span>
          </span>
        </Link>

        <form className="ops-sidebar__search" onSubmit={onSearch} role="search">
          <label className="visually-hidden" htmlFor="ops-global-search">
            Search knowledge
          </label>
          <input
            id="ops-global-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search knowledge…"
          />
        </form>

        <nav className="ops-sidebar__nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="ops-nav-group">
              <p className="ops-nav-group__label">{group.label}</p>
              <div className="ops-nav">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={closeNav}
                    className={({ isActive }) => (isActive ? 'is-active' : undefined)}
                  >
                    {item.label}
                  </NavLink>
                ))}
                {group.label === 'Account' && isAdmin ? (
                  <NavLink
                    to="/admin"
                    onClick={closeNav}
                    className={({ isActive }) => (isActive ? 'is-active' : undefined)}
                  >
                    Admin
                  </NavLink>
                ) : null}
              </div>
            </div>
          ))}
        </nav>

        <div className="ops-sidebar__foot">
          <div className="ops-sidebar__user">
            <strong>{user?.name || user?.email}</strong>
            <span>{user?.roles?.[0] || 'Agent'}</span>
          </div>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <header className="ops-topbar">
        <button
          type="button"
          className="ops-topbar__menu"
          aria-expanded={navOpen}
          aria-controls="ops-sidebar"
          onClick={() => setNavOpen((v) => !v)}
        >
          Menu
        </button>
        <Link className="brand" to="/dashboard" onClick={closeNav}>
          <img className="brand__logo" src="/ap-3.png" alt="Airepro" width="100" height="28" />
        </Link>
        <span className="muted">{user?.roles?.[0]}</span>
      </header>

      <main id="main" className="portal-main">
        <Outlet />
      </main>

      <footer className="ops-footer">
        <div className="ops-footer__inner">
          <span>Airepro Agent Training &amp; Operations</span>
          <span aria-hidden="true">·</span>
          <span>Internal use only</span>
        </div>
      </footer>
    </div>
  );
}

export default AppShell;
