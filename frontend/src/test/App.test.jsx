import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import RoomFormPage from '../pages/RoomFormPage';
import PublicFeedbackPage from '../pages/PublicFeedbackPage';
import ProtectedRoute from '../components/ProtectedRoute';
import { ToastProvider } from '../context/ToastContext';
import apiClient from '../api/client';

vi.mock('../api/client', async () => {
  const actual = await vi.importActual('../api/client');
  return {
    ...actual,
    default: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      interceptors: { request: { use: vi.fn() } },
    },
  };
});

const mockAuthState = {
  user: null,
  isAuthenticated: false,
  initializing: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuthState,
  AuthProvider: ({ children }) => <>{children}</>,
}));

function renderWithRouter(ui, initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ToastProvider>{ui}</ToastProvider>
    </MemoryRouter>
  );
}

describe('HonestRoom Frontend Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState.user = null;
    mockAuthState.isAuthenticated = false;
    mockAuthState.initializing = false;
  });

  it('validates required fields on LoginPage before calling backend', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />, ['/login']);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/email address is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    expect(mockAuthState.login).not.toHaveBeenCalled();
  });

  it('validates registration fields including email format and password match', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegisterPage />, ['/register']);

    await user.type(screen.getByLabelText(/full name/i), 'Al');
    await user.type(screen.getByLabelText(/email address/i), 'invalid-email');
    await user.type(screen.getByLabelText(/^password/i), 'short');
    await user.type(screen.getByLabelText(/^confirm password$/i), 'different');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/valid email address/i)).toBeInTheDocument();
    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(mockAuthState.register).not.toHaveBeenCalled();
  });

  it('validates and submits room creation form', async () => {
    const user = userEvent.setup();
    apiClient.post.mockResolvedValueOnce({
      data: { id: 101, title: 'Engineering Sprint Retro', status: 'OPEN' },
    });

    renderWithRouter(
      <Routes>
        <Route path="/rooms/new" element={<RoomFormPage mode="create" />} />
        <Route path="/rooms/:id/feedback" element={<div>Feedback Page Loaded</div>} />
      </Routes>,
      ['/rooms/new']
    );

    // Submit empty form to trigger validation
    await user.click(screen.getByRole('button', { name: /create room/i }));
    expect(await screen.findByText(/room title is required/i)).toBeInTheDocument();

    // Fill valid title and submit
    await user.type(screen.getByLabelText(/room title/i), 'Engineering Sprint Retro');
    await user.type(screen.getByLabelText(/description/i), 'Share sprint ideas');
    await user.click(screen.getByRole('button', { name: /create room/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/rooms', {
        title: 'Engineering Sprint Retro',
        description: 'Share sprint ideas',
        status: 'OPEN',
      });
    });
  });

  it('loads public feedback room, validates input, and submits anonymous feedback', async () => {
    const user = userEvent.setup();
    apiClient.get.mockResolvedValueOnce({
      data: {
        title: 'Campus Hackathon Room',
        description: 'Anonymous event feedback',
        publicToken: 'token12345678901234567890',
        status: 'OPEN',
      },
    });
    apiClient.post.mockResolvedValueOnce({
      data: {
        submitted: true,
        message: 'Your anonymous feedback has been submitted.',
      },
    });

    renderWithRouter(
      <Routes>
        <Route path="/f/:token" element={<PublicFeedbackPage />} />
      </Routes>,
      ['/f/token12345678901234567890']
    );

    expect(await screen.findByText('Campus Hackathon Room')).toBeInTheDocument();

    // Empty submission validation
    await user.click(screen.getByRole('button', { name: /submit anonymous feedback/i }));
    expect(await screen.findByText(/please write your feedback message/i)).toBeInTheDocument();

    // Valid submission
    await user.type(
      screen.getByLabelText(/your honest feedback/i),
      'Great workshops and helpful mentors!'
    );
    await user.click(screen.getByRole('button', { name: /submit anonymous feedback/i }));

    expect(
      await screen.findByText(/thank you for your honest feedback/i)
    ).toBeInTheDocument();
  });

  it('displays closed room state when public room status is CLOSED', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: {
        title: 'Closed Retro Room',
        description: 'Ended',
        publicToken: 'closedToken123',
        status: 'CLOSED',
      },
    });

    renderWithRouter(
      <Routes>
        <Route path="/f/:token" element={<PublicFeedbackPage />} />
      </Routes>,
      ['/f/closedToken123']
    );

    expect(await screen.findByText(/no longer accepting new submissions/i)).toBeInTheDocument();
  });

  it('redirects unauthenticated users from ProtectedRoute to /login', async () => {
    mockAuthState.isAuthenticated = false;
    mockAuthState.initializing = false;

    renderWithRouter(
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div>Private Dashboard Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Screen Redirected</div>} />
      </Routes>,
      ['/dashboard']
    );

    expect(await screen.findByText('Login Screen Redirected')).toBeInTheDocument();
  });
});
