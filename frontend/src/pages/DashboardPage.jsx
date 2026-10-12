import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  FolderOpen,
  MessageSquare,
  Clock,
  CheckCircle2,
  Plus,
  Search,
  Copy,
  ArrowUpRight,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import apiClient, { extractErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function DashboardPage() {
  const toast = useToast();
  const [summary, setSummary] = useState(null);
  const [recentFeedback, setRecentFeedback] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [roomSearch, setRoomSearch] = useState('');
  const [roomStatusFilter, setRoomStatusFilter] = useState('ALL');

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [summaryRes, recentFeedbackRes, roomsRes] = await Promise.all([
        apiClient.get('/dashboard/summary'),
        apiClient.get('/dashboard/recent-feedback?limit=6'),
        apiClient.get('/rooms'),
      ]);
      setSummary(summaryRes.data);
      setRecentFeedback(recentFeedbackRes.data || []);
      setRooms(roomsRes.data || []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load dashboard data.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesStatus = roomStatusFilter === 'ALL' || room.status === roomStatusFilter;
      const query = roomSearch.trim().toLowerCase();
      const matchesSearch =
        !query ||
        room.title.toLowerCase().includes(query) ||
        (room.description || '').toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [rooms, roomSearch, roomStatusFilter]);

  const handleCopyLink = async (token) => {
    const publicUrl = `${window.location.origin}/f/${token}`;
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success('Public feedback link copied to clipboard!');
    } catch {
      toast.info(`Share link: ${publicUrl}`);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Owner Dashboard</h1>
            <p className="page-subtitle">Loading your live feedback rooms and analytics...</p>
          </div>
        </div>
        <div className="stats-grid">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="skeleton" style={{ height: 112 }} />
          ))}
        </div>
        <div className="skeleton" style={{ height: 280, marginBottom: '1.5rem' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
        <p style={{ color: 'var(--color-danger-text)', marginBottom: '1rem', fontWeight: 600 }}>
          {error}
        </p>
        <button type="button" className="btn btn-primary" onClick={fetchDashboardData}>
          Retry Loading Dashboard
        </button>
      </div>
    );
  }

  const hasChartData = (summary?.totalFeedback || 0) > 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Owner Dashboard</h1>
          <p className="page-subtitle">
            Real-time overview of your feedback rooms, recent submissions, and resolution progress.
          </p>
        </div>
        <Link to="/rooms/new" className="btn btn-primary">
          <Plus size={18} />
          <span>Create Room</span>
        </Link>
      </div>

      {/* Live Metric Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-top">
            <span>Total Rooms</span>
            <span className="stat-icon">
              <FolderKanban size={18} />
            </span>
          </div>
          <div className="stat-value" data-testid="stat-total-rooms">
            {summary?.totalRooms ?? 0}
          </div>
          <div className="stat-meta">{summary?.closedRooms ?? 0} closed</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span>Open Rooms</span>
            <span className="stat-icon" style={{ backgroundColor: '#ecfdf5', color: '#047857' }}>
              <FolderOpen size={18} />
            </span>
          </div>
          <div className="stat-value" data-testid="stat-open-rooms">
            {summary?.openRooms ?? 0}
          </div>
          <div className="stat-meta">Accepting submissions</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span>Total Feedback</span>
            <span className="stat-icon">
              <MessageSquare size={18} />
            </span>
          </div>
          <div className="stat-value" data-testid="stat-total-feedback">
            {summary?.totalFeedback ?? 0}
          </div>
          <div className="stat-meta">{summary?.newFeedback ?? 0} unread new</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span>Pending Feedback</span>
            <span className="stat-icon" style={{ backgroundColor: '#fffbeb', color: '#b45309' }}>
              <Clock size={18} />
            </span>
          </div>
          <div className="stat-value" data-testid="stat-pending-feedback">
            {summary?.pendingFeedback ?? 0}
          </div>
          <div className="stat-meta">New + Under review</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span>Resolved Feedback</span>
            <span className="stat-icon" style={{ backgroundColor: '#ecfdf5', color: '#047857' }}>
              <CheckCircle2 size={18} />
            </span>
          </div>
          <div className="stat-value" data-testid="stat-resolved-feedback">
            {summary?.resolvedFeedback ?? 0}
          </div>
          <div className="stat-meta">Completed action items</div>
        </div>
      </div>

      {/* Activity Chart & Recent Feedback */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.35rem',
          marginBottom: '2rem',
        }}
      >
        <div className="card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>7-Day Feedback Activity</h2>
              <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                Daily anonymous submissions across your rooms
              </p>
            </div>
            <BarChart3 size={20} color="#6d28d9" />
          </div>

          {hasChartData ? (
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary?.activityTimeline || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Submissions" fill="#6d28d9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div
              style={{
                height: 220,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-muted)',
                textAlign: 'center',
                padding: '1rem',
                backgroundColor: 'var(--color-bg-app)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <BarChart3 size={28} style={{ marginBottom: '0.5rem', opacity: 0.6 }} />
              <p style={{ fontSize: '0.885rem', fontWeight: 500 }}>
                No feedback activity yet. Share a room link to start seeing submission trends.
              </p>
            </div>
          )}
        </div>

        <div className="card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Feedback</h2>
              <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                Latest submissions across all your rooms
              </p>
            </div>
            <Link to="/rooms" className="btn btn-ghost btn-sm">
              View All Rooms
            </Link>
          </div>

          {recentFeedback.length === 0 ? (
            <div
              style={{
                padding: '2.25rem 1rem',
                textAlign: 'center',
                backgroundColor: 'var(--color-bg-app)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-muted)',
                fontSize: '0.885rem',
              }}
            >
              No feedback has been submitted yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentFeedback.slice(0, 4).map((item) => (
                <Link
                  key={item.id}
                  to={`/rooms/${item.roomId}/feedback`}
                  style={{
                    display: 'block',
                    padding: '0.8rem 0.95rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-app)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      marginBottom: '0.35rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.775rem',
                        fontWeight: 700,
                        color: 'var(--color-primary-700)',
                      }}
                    >
                      {item.roomTitle}
                    </span>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <span className={`badge badge-${item.category.toLowerCase()}`}>
                        {item.category}
                      </span>
                      <span className={`badge badge-${item.status.toLowerCase()}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--color-text-primary)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {item.message}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rooms Directory with Search & Status Filter */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Your Feedback Rooms</h2>
        <Link to="/rooms" className="btn btn-secondary btn-sm">
          Manage All Rooms
          <ArrowUpRight size={15} />
        </Link>
      </div>

      <div className="filter-bar">
        <div className="search-input-box">
          <Search size={17} />
          <input
            type="text"
            className="form-input"
            placeholder="Search rooms by title or description..."
            value={roomSearch}
            onChange={(e) => setRoomSearch(e.target.value)}
            aria-label="Search rooms"
          />
        </div>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: 160 }}
          value={roomStatusFilter}
          onChange={(e) => setRoomStatusFilter(e.target.value)}
          aria-label="Filter rooms by status"
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open Only</option>
          <option value="CLOSED">Closed Only</option>
        </select>
      </div>

      {filteredRooms.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FolderKanban size={24} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>
            {rooms.length === 0 ? 'Create your first feedback room' : 'No matching rooms found'}
          </h3>
          <p
            style={{
              color: 'var(--color-text-secondary)',
              maxWidth: 440,
              margin: '0 auto 1.25rem',
              fontSize: '0.9rem',
            }}
          >
            {rooms.length === 0
              ? 'Set up a dedicated space for your event, club, or team and share the public link with participants.'
              : 'Try clearing your search or changing the status filter.'}
          </p>
          {rooms.length === 0 && (
            <Link to="/rooms/new" className="btn btn-primary">
              <Plus size={18} />
              <span>Create Your First Room</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="rooms-grid">
          {filteredRooms.slice(0, 6).map((room) => (
            <div key={room.id} className="card card-interactive" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    marginBottom: '0.6rem',
                  }}
                >
                  <span className={`badge ${room.status === 'OPEN' ? 'badge-open' : 'badge-closed'}`}>
                    {room.status}
                  </span>
                  <span style={{ fontSize: '0.775rem', color: 'var(--color-text-muted)' }}>
                    {new Date(room.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                  {room.title}
                </h3>
                <p
                  style={{
                    color: 'var(--color-text-secondary)',
                    fontSize: '0.885rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {room.description || 'No description provided.'}
                </p>
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    fontSize: '0.825rem',
                    color: 'var(--color-text-secondary)',
                    padding: '0.65rem 0',
                    borderTop: '1px solid var(--color-border)',
                    marginBottom: '0.5rem',
                  }}
                >
                  <span>
                    <strong>{room.feedbackCount}</strong> total
                  </span>
                  <span>
                    <strong>{room.newFeedbackCount}</strong> new
                  </span>
                  <span>
                    <strong>{room.resolvedFeedbackCount}</strong> resolved
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Link
                    to={`/rooms/${room.id}/feedback`}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                  >
                    Manage Feedback
                  </Link>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleCopyLink(room.publicToken)}
                  >
                    <Copy size={14} />
                    <span>Copy Link</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
