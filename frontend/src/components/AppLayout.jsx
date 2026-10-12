import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  PlusCircle,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import BrandLogo from './BrandLogo';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.info('You have been logged out.');
    navigate('/login');
  };

  const initials = (user?.name || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <div className="app-shell">
      {mobileMenuOpen && (
        <div
          onClick={closeMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            zIndex: 35,
          }}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`} aria-label="Sidebar Navigation">
        <div className="sidebar-header">
          <Link to="/dashboard" onClick={closeMobile}>
            <BrandLogo />
          </Link>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={closeMobile}
            style={{ display: mobileMenuOpen ? 'inline-flex' : 'none' }}
            aria-label="Close navigation menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/dashboard"
            onClick={closeMobile}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/rooms"
            end
            onClick={closeMobile}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <FolderKanban size={18} />
            <span>Feedback Rooms</span>
          </NavLink>

          <NavLink
            to="/rooms/new"
            onClick={closeMobile}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <PlusCircle size={18} />
            <span>Create Room</span>
          </NavLink>

          <NavLink
            to="/settings"
            onClick={closeMobile}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Settings size={18} />
            <span>Profile & Settings</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar" aria-hidden="true">
              {initials}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.name}
              </div>
              <div
                style={{
                  fontSize: '0.775rem',
                  color: 'var(--color-text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.email}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleLogout}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="mobile-topbar">
          <Link to="/dashboard">
            <BrandLogo />
          </Link>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu size={18} />
          </button>
        </header>

        <main className="page-container">{children}</main>
      </div>
    </div>
  );
}
