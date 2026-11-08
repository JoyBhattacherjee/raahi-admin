import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BadgePercent,
  Bell,
  Car,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  UserCheck,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Avatar, Toasts } from './ui';
import Logo from './Logo';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/rides', label: 'Rides', icon: Car },
  { to: '/drivers', label: 'Drivers', icon: UserCheck },
  { to: '/riders', label: 'Riders', icon: Users },
  { to: '/pricing', label: 'Pricing & Promos', icon: BadgePercent },
];

export default function Layout() {
  const { user, logout, theme, toggleTheme, toasts, drivers, rides } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [query, setQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const notifRef = useRef(null);

  const pending = drivers.filter((d) => d.status === 'pending').length;
  const ongoing = rides.filter((r) => r.status === 'ongoing').length;
  const current = NAV.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)));

  useEffect(() => {
    setMenuOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!notifOpen) return undefined;
    const close = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [notifOpen]);

  const submitSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/rides?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="app">
      <div className={`scrim nav-scrim ${menuOpen ? 'show' : ''}`} onClick={() => setMenuOpen(false)} />

      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand">
          <Logo size={38} />
          <div>
            <strong>Raahi</strong>
            <span>Admin console</span>
          </div>
        </div>

        <nav className="nav" aria-label="Main">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}>
              <Icon size={19} />
              <span>{label}</span>
              {to === '/drivers' && pending > 0 && <em className="count">{pending}</em>}
              {to === '/rides' && ongoing > 0 && <em className="count live">{ongoing} live</em>}
            </NavLink>
          ))}
        </nav>

        <div className="side-foot">
          <div className="side-card">
            <strong>Live operations</strong>
            <p>{ongoing} rides in progress across Kolkata right now.</p>
          </div>
          <button type="button" className="logout" onClick={logout}>
            <LogOut size={18} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button type="button" className="icon-btn menu-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <h1>{current ? current.label : 'Raahi Admin'}</h1>

          <form className="search" onSubmit={submitSearch} role="search">
            <Search size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search rides, riders or drivers…"
              aria-label="Search rides"
            />
          </form>

          <div className="top-actions">
            <button
              type="button"
              className="icon-btn"
              onClick={toggleTheme}
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            <div className="notif" ref={notifRef}>
              <button type="button" className="icon-btn" onClick={() => setNotifOpen((o) => !o)} aria-label="Notifications">
                <Bell size={18} />
                {pending > 0 && <i className="ping" />}
              </button>
              {notifOpen && (
                <div className="dropdown">
                  <h4>Notifications</h4>
                  <button type="button" onClick={() => navigate('/drivers')}>
                    <strong>{pending} driver applications</strong>
                    <span>Waiting for document review</span>
                  </button>
                  <button type="button" onClick={() => navigate('/pricing')}>
                    <strong>Surge active on Raahi Auto</strong>
                    <span>1.2× multiplier in effect</span>
                  </button>
                  <button type="button" onClick={() => navigate('/rides')}>
                    <strong>{ongoing} rides in progress</strong>
                    <span>Tap to monitor live trips</span>
                  </button>
                </div>
              )}
            </div>

            <div className="user-chip">
              <Avatar name={user?.name || 'Admin'} size={34} />
              <div>
                <strong>{user?.name}</strong>
                <span>{user?.role}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="page">
          <Outlet />
        </main>
      </div>

      <Toasts toasts={toasts} />
    </div>
  );
}
