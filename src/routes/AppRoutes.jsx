import { BrowserRouter, Routes, Route } from "react-router-dom";

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

// IAM
import IamDashboard from "../features/iam/pages/DashboardPage";
import IamAiModels from "../features/iam/pages/AiModelsPage";
import IamSettings from "../features/iam/pages/SettingsPage";

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public */}
                <Route path="/" element={<HomePage />} />
                <Route path="/user/login" element={<LoginPage />} />
                <Route path="/management/login" element={<ManagementLoginPage />} />
                <Route path="/login-success" element={<OAuthCallbackPage />} />

                {/* Admin */}
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/iam" element={<AdminIamManagement />} />
                <Route path="/admin/ai-models" element={<AdminAiModels />} />
                <Route path="/admin/settings" element={<AdminSettings />} />

                {/* IAM user */}
                <Route path="/iam/dashboard" element={<IamDashboard />} />
                <Route path="/iam/ai-models" element={<IamAiModels />} />
                <Route path="/iam/settings" element={<IamSettings />} />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;
