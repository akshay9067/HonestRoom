import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Compass, Home } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';

export default function NotFoundPage({ unauthorized = false }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.25rem',
        backgroundColor: 'var(--color-bg-app)',
        textAlign: 'center',
      }}
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/">
          <BrandLogo />
        </Link>
      </div>

      <div className="card" style={{ maxWidth: 460, width: '100%', padding: '2.5rem 2rem' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: unauthorized ? '#fef2f2' : 'var(--color-primary-50)',
            color: unauthorized ? '#dc2626' : 'var(--color-primary-600)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}
        >
          {unauthorized ? <ShieldAlert size={28} /> : <Compass size={28} />}
        </div>

        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          {unauthorized ? '403 — Access Denied' : '404 — Page Not Found'}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.75rem', fontSize: '0.925rem' }}>
          {unauthorized
            ? 'You do not have permission to view this private room or resource.'
            : 'The page or feedback link you are looking for does not exist or may have been moved.'}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
          <Link to="/" className="btn btn-primary">
            <Home size={16} />
            <span>Back to Home</span>
          </Link>
          <Link to="/dashboard" className="btn btn-secondary">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
