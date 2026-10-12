import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RoomsPage from './pages/RoomsPage';
import RoomFormPage from './pages/RoomFormPage';
import PublicFeedbackPage from './pages/PublicFeedbackPage';
import FeedbackManagementPage from './pages/FeedbackManagementPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';

function ProtectedScreen({ children }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/f/:token" element={<PublicFeedbackPage />} />
      <Route path="/unauthorized" element={<NotFoundPage unauthorized />} />

      {/* Protected Owner Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedScreen>
            <DashboardPage />
          </ProtectedScreen>
        }
      />
      <Route
        path="/rooms"
        element={
          <ProtectedScreen>
            <RoomsPage />
          </ProtectedScreen>
        }
      />
      <Route
        path="/rooms/new"
        element={
          <ProtectedScreen>
            <RoomFormPage mode="create" />
          </ProtectedScreen>
        }
      />
      <Route
        path="/rooms/:id/edit"
        element={
          <ProtectedScreen>
            <RoomFormPage mode="edit" />
          </ProtectedScreen>
        }
      />
      <Route
        path="/rooms/:id/feedback"
        element={
          <ProtectedScreen>
            <FeedbackManagementPage />
          </ProtectedScreen>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedScreen>
            <SettingsPage />
          </ProtectedScreen>
        }
      />

      {/* Fallback 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
