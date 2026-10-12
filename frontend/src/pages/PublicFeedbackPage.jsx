import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ShieldCheck,
  Send,
  CheckCircle2,
  Lock,
  AlertCircle,
  Sparkles,
  Heart,
  AlertTriangle,
  MessageCircle,
  RefreshCw,
} from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import apiClient, { extractErrorMessage } from '../api/client';

const CATEGORIES = [
  {
    value: 'SUGGESTION',
    label: 'Suggestion',
    description: 'Ideas to improve events, processes, or workflows',
    icon: Sparkles,
  },
  {
    value: 'APPRECIATION',
    label: 'Appreciation',
    description: 'Positive shoutouts and things that worked well',
    icon: Heart,
  },
  {
    value: 'CONCERN',
    label: 'Concern',
    description: 'Issues, blockers, or areas needing attention',
    icon: AlertTriangle,
  },
  {
    value: 'GENERAL',
    label: 'General',
    description: 'Any other candid thoughts or comments',
    icon: MessageCircle,
  },
];

export default function PublicFeedbackPage() {
  const { token } = useParams();

  const [room, setRoom] = useState(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [roomError, setRoomError] = useState('');

  const [category, setCategory] = useState('SUGGESTION');
  const [message, setMessage] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState(''); // Honeypot field
  const [fieldError, setFieldError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedInfo, setSubmittedInfo] = useState(null);

  useEffect(() => {
    let active = true;
    setLoadingRoom(true);
    setRoomError('');
    apiClient
      .get(`/public/rooms/${token}`)
      .then((res) => {
        if (active) setRoom(res.data);
      })
      .catch((err) => {
        if (active) {
          setRoomError(
            extractErrorMessage(err, 'This feedback room could not be found or the link is invalid.')
          );
        }
      })
      .finally(() => {
        if (active) setLoadingRoom(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setFieldError('');
    setSubmitError('');

    const trimmed = message.trim();
    if (!trimmed) {
      setFieldError('Please write your feedback message before submitting.');
      return;
    }
    if (trimmed.length < 3) {
      setFieldError('Feedback message must be at least 3 characters long.');
      return;
    }
    if (trimmed.length > 5000) {
      setFieldError('Feedback message must not exceed 5,000 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiClient.post(`/public/rooms/${token}/feedback`, {
        category,
        message: trimmed,
        websiteUrl,
      });
      setSubmittedInfo(response.data);
      setMessage('');
    } catch (err) {
      setSubmitError(
        extractErrorMessage(err, 'Could not submit your feedback. Please try again.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-bg-app)',
      }}
    >
      {/* Minimal Header */}
      <header
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--color-border)',
          padding: '0.9rem 1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: 760,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link to="/">
            <BrandLogo size={18} />
          </Link>
          <span className="badge badge-new">
            <ShieldCheck size={14} />
            <span>Anonymous Submission Mode</span>
          </span>
        </div>
      </header>

      <main
        style={{
          flex: 1,
          maxWidth: 720,
          width: '100%',
          margin: '0 auto',
          padding: '2.25rem 1.25rem 3.5rem',
        }}
      >
        {loadingRoom ? (
          <div className="card">
            <div className="skeleton" style={{ height: 32, width: '65%', marginBottom: '1rem' }} />
            <div className="skeleton" style={{ height: 80, marginBottom: '1.5rem' }} />
            <div className="skeleton" style={{ height: 220 }} />
          </div>
        ) : roomError ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <AlertCircle size={26} />
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Room Not Found
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
              {roomError}
            </p>
            <Link to="/" className="btn btn-primary">
              Return to HonestRoom Home
            </Link>
          </div>
        ) : room.status !== 'OPEN' ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1.75rem' }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                backgroundColor: 'var(--color-bg-subtle)',
                color: 'var(--color-text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Lock size={24} />
            </div>
            <span className="badge badge-closed" style={{ marginBottom: '0.75rem' }}>
              ROOM CLOSED
            </span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              {room.title}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: 480, margin: '0 auto 1.5rem' }}>
              This feedback room is currently closed by its organizer and is no longer accepting new
              submissions.
            </p>
            <Link to="/" className="btn btn-secondary">
              Back to Home
            </Link>
          </div>
        ) : submittedInfo ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1.75rem' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                color: '#047857',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <CheckCircle2 size={30} />
            </div>
            <h1 style={{ fontSize: '1.55rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Thank you for your honest feedback!
            </h1>
            <p
              style={{
                color: 'var(--color-text-secondary)',
                maxWidth: 460,
                margin: '0 auto 1.75rem',
              }}
            >
              Your message was delivered anonymously to <strong>{room.title}</strong> without any
              name or email attached.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSubmittedInfo(null)}
              >
                <RefreshCw size={16} />
                <span>Submit Another Response</span>
              </button>
              <Link to="/" className="btn btn-ghost">
                Learn About HonestRoom
              </Link>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span className="badge badge-open">OPEN FOR FEEDBACK</span>
              </div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.45rem' }}>
                {room.title}
              </h1>
              {room.description && (
                <p style={{ color: 'var(--color-text-secondary)', whiteSpace: 'pre-line' }}>
                  {room.description}
                </p>
              )}
            </div>

            {submitError && (
              <div className="alert-banner alert-error" role="alert">
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Category Selector */}
              <div className="form-group">
                <label className="form-label">Select a Category</label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
                    gap: '0.65rem',
                  }}
                >
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const selected = category === cat.value;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        aria-pressed={selected}
                        style={{
                          textAlign: 'left',
                          padding: '0.75rem 0.85rem',
                          borderRadius: 'var(--radius-md)',
                          border: selected
                            ? '2px solid var(--color-primary-600)'
                            : '1px solid var(--color-border-strong)',
                          backgroundColor: selected ? 'var(--color-primary-50)' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            color: selected ? 'var(--color-primary-800)' : 'var(--color-text-primary)',
                            marginBottom: '0.2rem',
                          }}
                        >
                          <Icon size={16} />
                          <span>{cat.label}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.35 }}>
                          {cat.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Honeypot anti-spam field (hidden from real users) */}
              <div
                style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}
                aria-hidden="true"
              >
                <label htmlFor="websiteUrl">Website</label>
                <input
                  id="websiteUrl"
                  name="websiteUrl"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
              </div>

              {/* Feedback Message Textarea */}
              <div className="form-group">
                <label htmlFor="feedback-message" className="form-label">
                  <span>Your Honest Feedback *</span>
                  <span className="form-hint">{message.length}/5000 characters</span>
                </label>
                <textarea
                  id="feedback-message"
                  rows={6}
                  maxLength={5000}
                  placeholder="Share your suggestion, appreciation, or concern constructively. Do not include your name or contact info if you wish to remain anonymous."
                  className={`form-textarea ${fieldError ? 'input-error' : ''}`}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (fieldError) setFieldError('');
                    if (submitError) setSubmitError('');
                  }}
                />
                {fieldError && <div className="form-error">{fieldError}</div>}
              </div>

              {/* Privacy Explanation Box */}
              <div className="alert-banner alert-info" style={{ marginBottom: '1.25rem' }}>
                <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: '0.825rem', lineHeight: 1.5 }}>
                  <strong>Privacy Notice:</strong> No account, name, or email is collected on this
                  form, and your identity is not stored in the feedback database. Avoid including
                  identifying details inside your message text.
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={submitting}
                style={{ width: '100%' }}
              >
                <Send size={18} />
                <span>{submitting ? 'Submitting Anonymously...' : 'Submit Anonymous Feedback'}</span>
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
