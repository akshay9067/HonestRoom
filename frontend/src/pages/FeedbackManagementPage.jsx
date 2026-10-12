import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Copy,
  CheckCircle2,
  Eye,
  RotateCcw,
  Trash2,
  MessageSquarePlus,
  Edit3,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Edit,
} from 'lucide-react';
import apiClient, { extractErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

export default function FeedbackManagementPage() {
  const { id } = useParams();
  const toast = useToast();

  const [room, setRoom] = useState(null);
  const [stats, setStats] = useState(null);
  const [feedbackPage, setFeedbackPage] = useState({
    content: [],
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
    last: true,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Query filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('createdAt,desc');
  const [page, setPage] = useState(0);

  // Action states
  const [feedbackToDelete, setFeedbackToDelete] = useState(null);
  const [deletingFeedback, setDeletingFeedback] = useState(false);

  // Private owner response editor state
  const [activeResponseEditorId, setActiveResponseEditorId] = useState(null);
  const [responseDraft, setResponseDraft] = useState('');
  const [editingResponseId, setEditingResponseId] = useState(null);
  const [savingResponse, setSavingResponse] = useState(false);
  const [responseToDelete, setResponseToDelete] = useState(null);
  const [deletingResponse, setDeletingResponse] = useState(false);

  const loadRoomAndFeedback = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        size: 10,
        sort: sortOrder,
      };
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (search.trim()) params.search = search.trim();

      const [roomRes, statsRes, feedbackRes] = await Promise.all([
        apiClient.get(`/rooms/${id}`),
        apiClient.get(`/rooms/${id}/feedback/stats`),
        apiClient.get(`/rooms/${id}/feedback`, { params }),
      ]);

      setRoom(roomRes.data);
      setStats(statsRes.data);
      setFeedbackPage(feedbackRes.data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load feedback for this room.'));
    } finally {
      setLoading(false);
    }
  }, [id, page, sortOrder, statusFilter, categoryFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRoomAndFeedback();
    }, 150);
    return () => clearTimeout(timer);
  }, [loadRoomAndFeedback]);

  const handleCopyShareLink = async () => {
    if (!room) return;
    const url = `${window.location.origin}/f/${room.publicToken}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Public feedback link copied to clipboard!');
    } catch {
      toast.info(`Share link: ${url}`);
    }
  };

  const handleUpdateStatus = async (feedbackId, nextStatus) => {
    try {
      await apiClient.patch(`/feedback/${feedbackId}/status`, { status: nextStatus });
      toast.success(`Feedback marked as ${nextStatus}.`);
      loadRoomAndFeedback();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Could not update feedback status.'));
    }
  };

  const handleConfirmDeleteFeedback = async () => {
    if (!feedbackToDelete) return;
    setDeletingFeedback(true);
    try {
      await apiClient.delete(`/feedback/${feedbackToDelete.id}`);
      toast.success('Feedback submission deleted.');
      setFeedbackToDelete(null);
      loadRoomAndFeedback();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to delete feedback item.'));
    } finally {
      setDeletingFeedback(false);
    }
  };

  const openCreateResponse = (item) => {
    setActiveResponseEditorId(item.id);
    setEditingResponseId(null);
    setResponseDraft('');
  };

  const openEditResponse = (item) => {
    setActiveResponseEditorId(item.id);
    setEditingResponseId(item.response.id);
    setResponseDraft(item.response.message);
  };

  const closeResponseEditor = () => {
    setActiveResponseEditorId(null);
    setEditingResponseId(null);
    setResponseDraft('');
  };

  const handleSaveResponse = async (feedbackId) => {
    const trimmed = responseDraft.trim();
    if (trimmed.length < 2) {
      toast.error('Response message must be at least 2 characters.');
      return;
    }

    setSavingResponse(true);
    try {
      if (editingResponseId) {
        await apiClient.put(`/responses/${editingResponseId}`, { message: trimmed });
        toast.success('Private response updated.');
      } else {
        await apiClient.post(`/feedback/${feedbackId}/responses`, { message: trimmed });
        toast.success('Private response saved.');
      }
      closeResponseEditor();
      loadRoomAndFeedback();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to save response.'));
    } finally {
      setSavingResponse(false);
    }
  };

  const handleConfirmDeleteResponse = async () => {
    if (!responseToDelete) return;
    setDeletingResponse(true);
    try {
      await apiClient.delete(`/responses/${responseToDelete.id}`);
      toast.success('Private response deleted.');
      setResponseToDelete(null);
      loadRoomAndFeedback();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to delete response.'));
    } finally {
      setDeletingResponse(false);
    }
  };

  if (error && !room) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
        <p style={{ color: 'var(--color-danger-text)', fontWeight: 600, marginBottom: '1rem' }}>
          {error}
        </p>
        <Link to="/rooms" className="btn btn-secondary">
          Back to Rooms
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/rooms" className="btn btn-ghost btn-sm">
          <ArrowLeft size={16} />
          <span>Back to All Rooms</span>
        </Link>
      </div>

      {/* Room Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <h1 className="page-title">{room?.title || 'Room Feedback'}</h1>
            {room && (
              <span className={`badge ${room.status === 'OPEN' ? 'badge-open' : 'badge-closed'}`}>
                {room.status}
              </span>
            )}
          </div>
          {room?.description && <p className="page-subtitle">{room.description}</p>}
        </div>

        {room && (
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary" onClick={handleCopyShareLink}>
              <Copy size={16} />
              <span>Copy Public Link</span>
            </button>
            <Link to={`/rooms/${room.id}/edit`} className="btn btn-secondary">
              <Edit size={16} />
              <span>Edit Room</span>
            </Link>
          </div>
        )}
      </div>

      {/* Status Counts Bar */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-card-top">Total Submissions</div>
          <div className="stat-value">{stats?.total ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">New (Unread)</div>
          <div className="stat-value" style={{ color: 'var(--color-primary-700)' }}>
            {stats?.newCount ?? 0}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">Reviewed</div>
          <div className="stat-value" style={{ color: '#1d4ed8' }}>
            {stats?.reviewedCount ?? 0}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">Resolved</div>
          <div className="stat-value" style={{ color: '#047857' }}>
            {stats?.resolvedCount ?? 0}
          </div>
        </div>
      </div>

      {/* Search, Category, Status & Sort Bar */}
      <div className="filter-bar">
        <div className="search-input-box">
          <Search size={17} />
          <input
            type="text"
            className="form-input"
            placeholder="Search feedback message text..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            aria-label="Search feedback text"
          />
        </div>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: 155 }}
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(0);
          }}
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          <option value="SUGGESTION">Suggestion</option>
          <option value="APPRECIATION">Appreciation</option>
          <option value="CONCERN">Concern</option>
          <option value="GENERAL">General</option>
        </select>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: 150 }}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="NEW">New</option>
          <option value="REVIEWED">Reviewed</option>
          <option value="RESOLVED">Resolved</option>
        </select>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: 155 }}
          value={sortOrder}
          onChange={(e) => {
            setSortOrder(e.target.value);
            setPage(0);
          }}
          aria-label="Sort feedback"
        >
          <option value="createdAt,desc">Newest First</option>
          <option value="createdAt,asc">Oldest First</option>
        </select>
      </div>

      {/* Feedback List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map((n) => (
            <div key={n} className="skeleton" style={{ height: 170 }} />
          ))}
        </div>
      ) : feedbackPage.content.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Inbox size={24} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>
            No feedback submissions match this view
          </h3>
          <p
            style={{
              color: 'var(--color-text-secondary)',
              maxWidth: 440,
              margin: '0 auto 1.25rem',
              fontSize: '0.9rem',
            }}
          >
            {search || categoryFilter || statusFilter
              ? 'Try clearing your search or adjusting the category and status filters.'
              : 'Share your public room link with participants to begin receiving anonymous submissions.'}
          </p>
          {room && (
            <button type="button" className="btn btn-primary" onClick={handleCopyShareLink}>
              <Copy size={16} />
              <span>Copy Public Feedback Link</span>
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {feedbackPage.content.map((item) => (
            <div key={item.id} className="card">
              {/* Top Metadata Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  marginBottom: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={`badge badge-${item.category.toLowerCase()}`}>
                    {item.category}
                  </span>
                  <span className={`badge badge-${item.status.toLowerCase()}`}>
                    {item.status}
                  </span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Submitted {new Date(item.createdAt).toLocaleString()}
                </span>
              </div>

              {/* Safely rendered feedback text (React escapes text nodes automatically) */}
              <p
                style={{
                  fontSize: '0.975rem',
                  color: 'var(--color-text-primary)',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.65,
                  marginBottom: '1.1rem',
                }}
              >
                {item.message}
              </p>

              {/* Private Owner Response Display or Editor */}
              {activeResponseEditorId === item.id ? (
                <div
                  style={{
                    backgroundColor: 'var(--color-primary-50)',
                    border: '1px solid var(--color-primary-200)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    marginBottom: '1rem',
                  }}
                >
                  <label
                    htmlFor={`response-textarea-${item.id}`}
                    className="form-label"
                    style={{ marginBottom: '0.4rem', color: 'var(--color-primary-800)' }}
                  >
                    <span>{editingResponseId ? 'Edit Private Owner Response' : 'Write Private Owner Response'}</span>
                    <span className="form-hint">Visible only to you</span>
                  </label>
                  <textarea
                    id={`response-textarea-${item.id}`}
                    rows={3}
                    maxLength={3000}
                    className="form-textarea"
                    placeholder="Document your action plan, follow-up notes, or resolution details..."
                    value={responseDraft}
                    onChange={(e) => setResponseDraft(e.target.value)}
                  />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '0.5rem',
                      marginTop: '0.65rem',
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={closeResponseEditor}
                      disabled={savingResponse}
                    >
                      <X size={14} />
                      <span>Cancel</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleSaveResponse(item.id)}
                      disabled={savingResponse}
                    >
                      <Save size={14} />
                      <span>{savingResponse ? 'Saving...' : 'Save Response'}</span>
                    </button>
                  </div>
                </div>
              ) : item.response ? (
                <div
                  style={{
                    backgroundColor: 'var(--color-bg-app)',
                    borderLeft: '3px solid var(--color-primary-600)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.85rem 1rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.35rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--color-primary-700)',
                      }}
                    >
                      Private Owner Response • {new Date(item.response.updatedAt).toLocaleDateString()}
                    </span>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => openEditResponse(item)}
                      >
                        <Edit3 size={14} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--color-danger-text)' }}
                        onClick={() => setResponseToDelete(item.response)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap' }}>
                    {item.response.message}
                  </p>
                </div>
              ) : null}

              {/* Action Controls */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.6rem',
                  paddingTop: '0.85rem',
                  borderTop: '1px solid var(--color-border)',
                }}
              >
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {item.status === 'NEW' && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleUpdateStatus(item.id, 'REVIEWED')}
                    >
                      <Eye size={15} />
                      <span>Mark Reviewed</span>
                    </button>
                  )}

                  {item.status !== 'RESOLVED' && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleUpdateStatus(item.id, 'RESOLVED')}
                    >
                      <CheckCircle2 size={15} />
                      <span>Mark Resolved</span>
                    </button>
                  )}

                  {item.status === 'RESOLVED' && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleUpdateStatus(item.id, 'REVIEWED')}
                    >
                      <RotateCcw size={15} />
                      <span>Reopen Feedback</span>
                    </button>
                  )}

                  {!item.response && activeResponseEditorId !== item.id && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => openCreateResponse(item)}
                    >
                      <MessageSquarePlus size={15} />
                      <span>Add Private Response</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  className="btn btn-danger-outline btn-sm"
                  onClick={() => setFeedbackToDelete(item)}
                >
                  <Trash2 size={15} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}

          {/* Pagination Bar */}
          {feedbackPage.totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.9rem 1.15rem',
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                marginTop: '0.5rem',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                Page <strong>{feedbackPage.page + 1}</strong> of{' '}
                <strong>{feedbackPage.totalPages}</strong> ({feedbackPage.totalElements} items)
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={feedbackPage.page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft size={15} />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={feedbackPage.last}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <span>Next</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Feedback Confirmation Modal */}
      <ConfirmModal
        open={Boolean(feedbackToDelete)}
        title="Delete Feedback Submission?"
        description="Are you sure you want to permanently delete this anonymous feedback item and any associated private response?"
        confirmLabel="Delete Feedback"
        loading={deletingFeedback}
        onConfirm={handleConfirmDeleteFeedback}
        onCancel={() => setFeedbackToDelete(null)}
      />

      {/* Delete Response Confirmation Modal */}
      <ConfirmModal
        open={Boolean(responseToDelete)}
        title="Delete Private Response?"
        description="Are you sure you want to delete your private response to this feedback item?"
        confirmLabel="Delete Response"
        loading={deletingResponse}
        onConfirm={handleConfirmDeleteResponse}
        onCancel={() => setResponseToDelete(null)}
      />
    </div>
  );
}
