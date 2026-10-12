import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, LogOut, Save, Eye, EyeOff } from 'lucide-react';
import apiClient, { extractErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function SettingsPage() {
  const { user, updateUserState, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [nameError, setNameError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setNameError('');
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setNameError('Full name must be at least 2 characters.');
      return;
    }

    setSavingProfile(true);
    try {
      const res = await apiClient.put('/users/me', { name: trimmed });
      updateUserState(res.data);
      toast.success('Profile updated successfully.');
    } catch (err) {
      setNameError(extractErrorMessage(err, 'Failed to update profile.'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      await apiClient.put('/users/me/password', {
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      toast.success('Password updated successfully.');
    } catch (err) {
      setPasswordError(extractErrorMessage(err, 'Could not update password.'));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.info('Signed out of your account.');
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: 740, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile & Settings</h1>
          <p className="page-subtitle">
            Manage your organizer profile, account security, and active session.
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
          <span className="stat-icon">
            <User size={18} />
          </span>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Profile Information</h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
              Your display name shown in your private dashboard
            </p>
          </div>
        </div>

        <form onSubmit={handleProfileUpdate} noValidate>
          <div className="form-group">
            <label htmlFor="profile-email" className="form-label">
              Email Address
            </label>
            <input
              id="profile-email"
              type="email"
              className="form-input"
              value={user?.email || ''}
              disabled
              readOnly
              style={{ backgroundColor: 'var(--color-bg-subtle)', color: 'var(--color-text-secondary)' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="profile-name" className="form-label">
              Full Name
            </label>
            <input
              id="profile-name"
              type="text"
              className={`form-input ${nameError ? 'input-error' : ''}`}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError('');
              }}
            />
            {nameError && <div className="form-error">{nameError}</div>}
          </div>

          <button type="submit" className="btn btn-primary" disabled={savingProfile}>
            <Save size={16} />
            <span>{savingProfile ? 'Saving...' : 'Update Name'}</span>
          </button>
        </form>
      </div>

      {/* Password Change Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span className="stat-icon">
              <Lock size={18} />
            </span>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Change Password</h2>
              <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                Requires verification of your current password
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setShowPasswords((p) => !p)}
          >
            {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
            <span>{showPasswords ? 'Hide' : 'Show'}</span>
          </button>
        </div>

        {passwordError && (
          <div className="alert-banner alert-error" role="alert">
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handlePasswordUpdate} noValidate>
          <div className="form-group">
            <label htmlFor="current-password" className="form-label">
              Current Password
            </label>
            <input
              id="current-password"
              type={showPasswords ? 'text' : 'password'}
              className="form-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="new-password" className="form-label">
              <span>New Password</span>
              <span className="form-hint">Min. 8 characters</span>
            </label>
            <input
              id="new-password"
              type={showPasswords ? 'text' : 'password'}
              className="form-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm-new-password" className="form-label">
              Confirm New Password
            </label>
            <input
              id="confirm-new-password"
              type={showPasswords ? 'text' : 'password'}
              className="form-input"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={savingPassword}>
            <Lock size={16} />
            <span>{savingPassword ? 'Updating Password...' : 'Change Password'}</span>
          </button>
        </form>
      </div>

      {/* Session Sign Out Card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Active Session</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            Sign out of your account on this browser.
          </p>
        </div>
        <button type="button" className="btn btn-danger-outline" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
