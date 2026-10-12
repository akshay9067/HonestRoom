import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Users,
  EyeOff,
  Sliders,
} from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
      {/* Top Navigation */}
      <header
        style={{
          borderBottom: '1px solid var(--color-border)',
          position: 'sticky',
          top: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(8px)',
          zIndex: 30,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 1.5rem',
            height: 70,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link to="/">
            <BrandLogo />
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <a href="#how-it-works" className="btn btn-ghost btn-sm">
              How It Works
            </a>
            <a href="#privacy" className="btn btn-ghost btn-sm">
              Privacy
            </a>
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary">
                Go to Dashboard
                <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Create Your Room
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section
        style={{
          padding: '5rem 1.5rem 4.25rem',
          background:
            'radial-gradient(circle at 50% 0%, rgba(237, 233, 254, 0.75) 0%, rgba(255, 255, 255, 1) 70%)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div style={{ maxWidth: 880, margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.9rem',
              borderRadius: '9999px',
              backgroundColor: 'var(--color-primary-50)',
              border: '1px solid var(--color-primary-200)',
              color: 'var(--color-primary-700)',
              fontSize: '0.825rem',
              fontWeight: 600,
              marginBottom: '1.5rem',
            }}
          >
            <Sparkles size={15} />
            <span>Built for Candid, Constructive & Anonymous Feedback</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.25rem, 4.5vw, 3.5rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              marginBottom: '1.25rem',
            }}
          >
            Give your community a safe space to speak{' '}
            <span style={{ color: 'var(--color-primary-600)' }}>honestly</span>.
          </h1>

          <p
            style={{
              fontSize: '1.125rem',
              color: 'var(--color-text-secondary)',
              maxWidth: 680,
              margin: '0 auto 2.25rem',
              lineHeight: 1.65,
            }}
          >
            Create dedicated feedback rooms in seconds and share a single link. Team members,
            students, and attendees can submit suggestions, appreciation, or concerns without
            creating an account or revealing their identity.
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <Link to={isAuthenticated ? '/rooms/new' : '/register'} className="btn btn-primary btn-lg">
              <span>Create Your Room</span>
              <ArrowRight size={18} />
            </Link>
            <a href="#how-it-works" className="btn btn-secondary btn-lg">
              <span>Explore How It Works</span>
            </a>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section style={{ padding: '4.5rem 1.5rem', backgroundColor: 'var(--color-bg-app)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 3rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              Everything you need to run structured feedback loops
            </h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Designed for college clubs, engineering teams, event organizers, and community leads.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.35rem',
            }}
          >
            <div className="card">
              <div className="stat-icon" style={{ marginBottom: '1rem' }}>
                <EyeOff size={20} />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Zero-Account Submissions
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                Contributors never sign up or enter names or emails. A shared public room link is
                all it takes to submit candid thoughts.
              </p>
            </div>

            <div className="card">
              <div className="stat-icon" style={{ marginBottom: '1rem' }}>
                <Sliders size={20} />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Structured Triage & Statuses
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                Filter submissions by Suggestion, Appreciation, Concern, or General, and track each
                item from New to Reviewed and Resolved.
              </p>
            </div>

            <div className="card">
              <div className="stat-icon" style={{ marginBottom: '1rem' }}>
                <MessageSquare size={20} />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Private Owner Responses
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                Document action items and internal follow-up notes directly alongside each feedback
                submission inside your private dashboard.
              </p>
            </div>

            <div className="card">
              <div className="stat-icon" style={{ marginBottom: '1rem' }}>
                <Lock size={20} />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Full Room Lifecycle Control
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                Open rooms during an event or retrospective, and close them with one click when the
                collection window ends.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ padding: '4.5rem 1.5rem', backgroundColor: '#ffffff' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 3rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              How the anonymous submission process works
            </h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Three simple steps from creating a room to acting on real insights.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}
          >
            <div className="card" style={{ backgroundColor: 'var(--color-bg-app)' }}>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  color: 'var(--color-primary-600)',
                  marginBottom: '0.5rem',
                }}
              >
                STEP 01
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Create a Feedback Room
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                Register as an organizer and create a room for your event, sprint, or club. Our
                server generates an unpredictable cryptographic link token.
              </p>
            </div>

            <div className="card" style={{ backgroundColor: 'var(--color-bg-app)' }}>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  color: 'var(--color-primary-600)',
                  marginBottom: '0.5rem',
                }}
              >
                STEP 02
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Share the Public Link
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                Participants open your `/f/:token` link, choose a category, and submit their honest
                thoughts—no login, no email field, and no tracking cookies.
              </p>
            </div>

            <div className="card" style={{ backgroundColor: 'var(--color-bg-app)' }}>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  color: 'var(--color-primary-600)',
                  marginBottom: '0.5rem',
                }}
              >
                STEP 03
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Review, Respond & Resolve
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                Search and filter incoming feedback, mark items as Reviewed or Resolved, and write
                private owner responses to track improvements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section
        id="privacy"
        style={{
          padding: '4rem 1.5rem',
          backgroundColor: 'var(--color-primary-900)',
          color: '#ffffff',
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Shield size={24} color="#c4b5fd" />
          </div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff' }}>
            Transparent Privacy by Architecture
          </h2>
          <p style={{ color: '#ddd6fe', maxWidth: 720, lineHeight: 1.65 }}>
            HonestRoom never asks feedback contributors for their name, email address, or account
            credentials. Our database schema for feedback submissions contains zero columns for
            sender identity, IP addresses, or browser fingerprints. While standard network
            infrastructure and hosting providers process basic connection metadata in transit, the
            application itself does not store who submitted a message.
          </p>
          <div style={{ marginTop: '0.5rem' }}>
            <Link to={isAuthenticated ? '/dashboard' : '/register'} className="btn btn-primary btn-lg">
              Get Started Free
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          marginTop: 'auto',
          borderTop: '1px solid var(--color-border)',
          backgroundColor: '#ffffff',
          padding: '2.25rem 1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <BrandLogo size={18} />
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.825rem', marginTop: '0.35rem' }}>
              Anonymous Feedback Platform powered by React, Spring Boot & TiDB Cloud.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            <Link to="/login">Sign In</Link>
            <Link to="/register">Register</Link>
            <Link to="/dashboard">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
