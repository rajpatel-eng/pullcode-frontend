import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminUserProvider, IamUserProvider } from "../context/UserContext"; // ← CHANGED

// Auth
import LoginPage from "../features/auth/pages/LoginPage";
import ManagementLoginPage from "../features/auth/pages/ManagementLoginPage";
import HomePage from "../features/auth/pages/HomePage";
import OAuthCallbackPage from "../features/auth/pages/OAuthCallbackPage";

// Admin
import AdminDashboard from "../features/admin/pages/DashboardPage";
import AdminIamManagement from "../features/admin/pages/IamManagementPage";
import AdminAiModels from "../features/admin/pages/AiModelsPage";
import AdminSettings from "../features/admin/pages/SettingsPage";
import AdminAuditLog from "../features/admin/pages/AuditLogPage";
import AdminProfile from "../features/admin/pages/ProfilePage";

// Analytics
import AnalyticsDashboard from "../features/analytics/pages/AnalyticsDashboardPage";
import ModelAnalytics from "../features/analytics/pages/ModelAnalyticsPage";

// IAM user
import IamDashboard from "../features/iam/pages/DashboardPage";
import IamAiModels from "../features/iam/pages/AiModelsPage";
import IamSettings from "../features/iam/pages/SettingsPage";
import IamProfile from "../features/iam/pages/ProfilePage";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/user/login" element={<LoginPage />} />
        <Route path="/management/login" element={<ManagementLoginPage />} />
        <Route path="/login-success" element={<OAuthCallbackPage />} />

        {/* ── Admin routes — all wrapped in AdminUserProvider ── */}
        {/* CHANGED: wrap admin routes so every page shares the same user/photo */}
        <Route path="/admin/*" element={
          <AdminUserProvider>
            <Routes>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="iam" element={<AdminIamManagement />} />
              <Route path="ai-models" element={<AdminAiModels />} />
              <Route path="ai-models/:modelId/analytics" element={<ModelAnalytics />} />
              <Route path="analytics" element={<AnalyticsDashboard />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="audit-logs" element={<AdminAuditLog />} />
              <Route path="profile" element={<AdminProfile />} />
            </Routes>
          </AdminUserProvider>
        } />

        {/* ── IAM routes — all wrapped in IamUserProvider ── */}
        {/* CHANGED: wrap iam routes so every page shares the same user/photo */}
        <Route path="/iam/*" element={
          <IamUserProvider>
            <Routes>
              <Route path="dashboard" element={<IamDashboard />} />
              <Route path="ai-models" element={<IamAiModels />} />
              <Route path="ai-models/:modelId/analytics" element={<ModelAnalytics />} />
              <Route path="settings" element={<IamSettings />} />
              <Route path="profile" element={<IamProfile />} />
            </Routes>
          </IamUserProvider>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;