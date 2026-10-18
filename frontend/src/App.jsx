import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { AreaVoterListPage } from './pages/AreaVoterListPage';
import { ElectionsPage } from './pages/voter/ElectionsPage';
import { ResultsPage } from './pages/voter/ResultsPage';
import { BallotVerificationPage } from './pages/voter/BallotVerificationPage';
import { VoterDashboardPage } from './pages/voter/VoterDashboardPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { VoterAssistantChat } from './components/ai/VoterAssistantChat';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-[#0A0D16] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/areas" element={<AreaVoterListPage />} />
              <Route path="/results" element={<ResultsPage />} />

              {/* Protected Voter Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <VoterDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/elections"
                element={
                  <ProtectedRoute>
                    <ElectionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/verify"
                element={
                  <ProtectedRoute>
                    <BallotVerificationPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin Console */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
          <VoterAssistantChat />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
