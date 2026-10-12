import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Copy,
  Edit3,
  Trash2,
  MessageSquare,
  Lock,
  Unlock,
  ExternalLink,
  FolderKanban,
} from 'lucide-react';
import apiClient, { extractErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

export default function RoomsPage() {
  const toast = useToast();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [roomToDelete, setRoomToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      const response = await apiClient.get('/rooms', { params });
      setRooms(response.data || []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load your feedback rooms.'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRooms();
    }, 180);
    return () => clearTimeout(timer);
  }, [loadRooms]);

  const handleCopyPublicLink = async (token) => {
    const url = `${window.location.origin}/f/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Public feedback link copied!');
    } catch {
      toast.info(`Public link: ${url}`);
    }
  };

  const handleToggleStatus = async (room) => {
    const nextStatus = room.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    setTogglingId(room.id);
    try {
      const response = await apiClient.patch(`/rooms/${room.id}/status`, { status: nextStatus });
      setRooms((prev) => prev.map((r) => (r.id === room.id ? response.data : r)));
      toast.success(`Room "${room.title}" is now ${nextStatus}.`);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Could not update room status.'));
    } finally {
      setTogglingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!roomToDelete) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/rooms/${roomToDelete.id}`);
      setRooms((prev) => prev.filter((r) => r.id !== roomToDelete.id));
      toast.success(`Deleted room "${roomToDelete.title}".`);
      setRoomToDelete(null);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to delete room.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Feedback Rooms</h1>
          <p className="page-subtitle">
            Create, share, open or close rooms, and manage anonymous submissions.
          </p>
        </div>
        <Link to="/rooms/new" className="btn btn-primary">
          <Plus size={18} />
          <span>Create New Room</span>
        </Link>
      </div>

      {/* Search & Filter Controls */}
      <div className="filter-bar">
        <div className="search-input-box">
          <Search size={17} />
          <input
            type="text"
            className="form-input"
            placeholder="Search rooms by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search rooms"
          />
        </div>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: 170 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open Rooms</option>
          <option value="CLOSED">Closed Rooms</option>
        </select>
      </div>

      {error && (
        <div className="alert-banner alert-error" role="alert">
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="rooms-grid">
          {[1, 2, 3].map((n) => (
            <div key={n} className="skeleton" style={{ height: 240 }} />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FolderKanban size={24} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>
            No feedback rooms found
          </h3>
          <p
            style={{
              color: 'var(--color-text-secondary)',
              maxWidth: 420,
              margin: '0 auto 1.25rem',
              fontSize: '0.9rem',
            }}
          >
            {search || statusFilter
              ? 'No rooms matched your current search or filter criteria.'
              : 'Create a feedback room and share its link to start receiving anonymous insights.'}
          </p>
          <Link to="/rooms/new" className="btn btn-primary">
            <Plus size={18} />
            <span>Create Room</span>
          </Link>
        </div>
      ) : (
        <div className="rooms-grid">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="card card-interactive"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1.1rem',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    marginBottom: '0.65rem',
                  }}
                >
                  <span className={`badge ${room.status === 'OPEN' ? 'badge-open' : 'badge-closed'}`}>
                    {room.status === 'OPEN' ? 'OPEN' : 'CLOSED'}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                    Created {new Date(room.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.45rem' }}>
                  {room.title}
                </h2>
                <p
                  style={{
                    color: 'var(--color-text-secondary)',
                    fontSize: '0.9rem',
                    lineHeight: 1.55,
                    marginBottom: '0.75rem',
                  }}
                >
                  {room.description || 'No description provided.'}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.75rem',
                    backgroundColor: 'var(--color-bg-app)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.8rem',
                  }}
                >
                  <span
                    style={{
                      color: 'var(--color-text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    /f/{room.publicToken}
                  </span>
                  <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleCopyPublicLink(room.publicToken)}
                      title="Copy public submission link"
                    >
                      <Copy size={14} />
                      <span>Copy</span>
                    </button>
                    <Link
                      to={`/f/${room.publicToken}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-ghost btn-sm"
                      title="Open public feedback page"
                    >
                      <ExternalLink size={14} />
                    </Link>
                  </div>
                </div>
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.825rem',
                    color: 'var(--color-text-secondary)',
                    padding: '0.65rem 0',
                    borderTop: '1px solid var(--color-border)',
                    marginBottom: '0.65rem',
                  }}
                >
                  <span>
                    <strong>{room.feedbackCount}</strong> Feedback
                  </span>
                  <span>
                    <strong>{room.newFeedbackCount}</strong> New
                  </span>
                  <span>
                    <strong>{room.reviewedFeedbackCount}</strong> Reviewed
                  </span>
                  <span>
                    <strong>{room.resolvedFeedbackCount}</strong> Resolved
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Link
                    to={`/rooms/${room.id}/feedback`}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                  >
                    <MessageSquare size={15} />
                    <span>Manage Feedback</span>
                  </Link>

                  <Link
                    to={`/rooms/${room.id}/edit`}
                    className="btn btn-secondary btn-sm"
                    title="Edit room details"
                  >
                    <Edit3 size={15} />
                    <span>Edit</span>
                  </Link>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={togglingId === room.id}
                    onClick={() => handleToggleStatus(room)}
                    title={room.status === 'OPEN' ? 'Close room' : 'Reopen room'}
                  >
                    {room.status === 'OPEN' ? <Lock size={15} /> : <Unlock size={15} />}
                    <span>{room.status === 'OPEN' ? 'Close' : 'Reopen'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger-outline btn-sm"
                    onClick={() => setRoomToDelete(room)}
                    title="Delete room"
                    aria-label={`Delete ${room.title}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={Boolean(roomToDelete)}
        title="Delete Feedback Room?"
        description={`Are you sure you want to permanently delete "${roomToDelete?.title}"? All ${roomToDelete?.feedbackCount ?? 0} feedback submissions and private responses in this room will also be deleted.`}
        confirmLabel="Delete Room"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setRoomToDelete(null)}
      />
    </div>
  );
}
