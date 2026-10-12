import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import apiClient, { extractErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function RoomFormPage({ mode = 'create' }) {
  const { id } = useParams();
  const isEdit = mode === 'edit' || Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('OPEN');
  const [publicToken, setPublicToken] = useState('');

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loadingRoom, setLoadingRoom] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit || !id) return;
    let active = true;
    setLoadingRoom(true);
    apiClient
      .get(`/rooms/${id}`)
      .then((res) => {
        if (!active) return;
        setTitle(res.data.title || '');
        setDescription(res.data.description || '');
        setStatus(res.data.status || 'OPEN');
        setPublicToken(res.data.publicToken || '');
      })
      .catch((err) => {
        if (!active) return;
        setServerError(extractErrorMessage(err, 'Unable to load room details.'));
      })
      .finally(() => {
        if (active) setLoadingRoom(false);
      });

    return () => {
      active = false;
    };
  }, [isEdit, id]);

  const validate = () => {
    const nextErrors = {};
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      nextErrors.title = 'Room title is required.';
    } else if (trimmedTitle.length < 3) {
      nextErrors.title = 'Room title must be at least 3 characters.';
    } else if (trimmedTitle.length > 150) {
      nextErrors.title = 'Room title must not exceed 150 characters.';
    }

    if (description && description.length > 2000) {
      nextErrors.description = 'Description must not exceed 2,000 characters.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        status,
      };

      if (isEdit) {
        await apiClient.put(`/rooms/${id}`, payload);
        toast.success('Feedback room updated successfully.');
        navigate('/rooms');
      } else {
        const res = await apiClient.post('/rooms', payload);
        toast.success('Feedback room created!');
        navigate(`/rooms/${res.data.id}/feedback`);
      }
    } catch (err) {
      const fieldErrors = err.response?.data?.fieldErrors;
      if (fieldErrors) {
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
      }
      setServerError(extractErrorMessage(err, 'Failed to save feedback room.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingRoom) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div className="skeleton" style={{ height: 340 }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <Link to="/rooms" className="btn btn-ghost btn-sm">
          <ArrowLeft size={16} />
          <span>Back to Rooms</span>
        </Link>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.35rem' }}>
          {isEdit ? 'Edit Feedback Room' : 'Create a New Feedback Room'}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          {isEdit
            ? 'Update your room title, prompt description, or submission availability.'
            : 'Define a clear title and instructions. The server will automatically generate a secure public link token.'}
        </p>

        {serverError && (
          <div className="alert-banner alert-error" role="alert">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="room-title" className="form-label">
              <span>Room Title *</span>
              <span className="form-hint">{title.length}/150</span>
            </label>
            <input
              id="room-title"
              type="text"
              maxLength={150}
              placeholder="e.g. CS Club Spring Hackathon Feedback"
              className={`form-input ${errors.title ? 'input-error' : ''}`}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
              }}
            />
            {errors.title && <div className="form-error">{errors.title}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="room-description" className="form-label">
              <span>Description & Prompt</span>
              <span className="form-hint">{description.length}/2000</span>
            </label>
            <textarea
              id="room-description"
              rows={4}
              maxLength={2000}
              placeholder="Tell participants what kind of suggestions, appreciation, or concerns you are looking for..."
              className={`form-textarea ${errors.description ? 'input-error' : ''}`}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
              }}
            />
            {errors.description && <div className="form-error">{errors.description}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="room-status" className="form-label">
              {isEdit ? 'Room Status' : 'Initial Status'}
            </label>
            <select
              id="room-status"
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="OPEN">OPEN — Accepting anonymous submissions</option>
              <option value="CLOSED">CLOSED — Paused / No new submissions</option>
            </select>
          </div>

          {isEdit && publicToken && (
            <div className="form-group">
              <label className="form-label">Public Share Token (Server-Generated)</label>
              <input
                type="text"
                className="form-input"
                value={`${window.location.origin}/f/${publicToken}`}
                disabled
                readOnly
                style={{ backgroundColor: 'var(--color-bg-subtle)', color: 'var(--color-text-secondary)' }}
              />
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '1.5rem',
            }}
          >
            <Link to="/rooms" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Save size={17} />
              <span>{submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Room'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
