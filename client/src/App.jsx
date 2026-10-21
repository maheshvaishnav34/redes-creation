import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { AppLayout } from './components/layout/AppLayout.jsx';

// Pages
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';
import CustomerFeedbackPage from './pages/CustomerFeedbackPage.jsx';

import DashboardPage from './pages/DashboardPage.jsx';
import BusinessIntelligencePage from './pages/BusinessIntelligencePage.jsx';
import GoogleProfilePage from './pages/GoogleProfilePage.jsx';
import GoogleReviewsDashboardPage from './pages/GoogleReviewsDashboardPage.jsx';
import ReviewsPage from './pages/ReviewsPage.jsx';
import ReviewCampaignsPage from './pages/ReviewCampaignsPage.jsx';
import KeywordsPage from './pages/KeywordsPage.jsx';
import GeoGridPage from './pages/GeoGridPage.jsx';
import SeoAuditPage from './pages/SeoAuditPage.jsx';
import CompetitorsPage from './pages/CompetitorsPage.jsx';
import AiCenterPage from './pages/AiCenterPage.jsx';
import TasksPage from './pages/TasksPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import WebsiteAnalyticsPage from './pages/WebsiteAnalyticsPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import BillingPage from './pages/BillingPage.jsx';
import PlansPage from './pages/PlansPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import TrendsPage from './pages/TrendsPage.jsx';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#034bc0] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-slate-500">Authenticating Session...</span>
        </div>
      </div>
    );
  }

  const isAuthed = Boolean(isAuthenticated || user || localStorage.getItem('redes_token'));

  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Super Admin Protected Route Guard
const SuperAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  const isSuperAdmin = user && ['super_admin', 'owner'].includes(user.role?.toLowerCase());
  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/feedback/:slug" element={<CustomerFeedbackPage />} />
        <Route path="/r/:slug" element={<CustomerFeedbackPage />} />

        {/* Multi-Step Onboarding */}
        <Route 
          path="/onboarding" 
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          } 
        />

        {/* Protected SaaS App Layout */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/business-intelligence" element={<BusinessIntelligencePage />} />
          <Route path="/google" element={<GoogleProfilePage />} />
          <Route path="/google/callback" element={<GoogleProfilePage />} />
          <Route path="/google-reviews" element={<GoogleReviewsDashboardPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/campaigns" element={<ReviewCampaignsPage />} />
          <Route path="/review-campaigns" element={<ReviewCampaignsPage />} />
          <Route path="/review-campaigns/:id" element={<ReviewCampaignsPage />} />
          <Route path="/keywords" element={<KeywordsPage />} />
          <Route path="/trends" element={<TrendsPage />} />
          <Route path="/geo-grid" element={<GeoGridPage />} />
          <Route path="/seo" element={<SeoAuditPage />} />
          <Route path="/competitors" element={<CompetitorsPage />} />
          <Route path="/ai-center" element={<AiCenterPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/website-analytics" element={<WebsiteAnalyticsPage />} />
          <Route path="/website-analytics/callback" element={<WebsiteAnalyticsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/upgrade" element={<PlansPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route 
            path="/admin" 
            element={
              <SuperAdminRoute>
                <AdminPage />
              </SuperAdminRoute>
            } 
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
