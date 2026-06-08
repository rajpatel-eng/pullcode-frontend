import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from "../features/auth/pages/LoginPage";
import UserDashboard from "../features/user/pages/DashboardPage";
import AdminDashboard from "../features/admin/pages/DashboardPage";
import IamDashboard from "../features/iam/pages/DashboardPage";
import ManagementLoginPage from "../features/auth/pages/ManagementLoginPage";
import HomePage from "../features/auth/pages/HomePage";

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/user/login" element={<LoginPage />} />
                <Route path="/management/login" element={<ManagementLoginPage />} />
                <Route path="/user/dashboard" element={<UserDashboard />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/iam/dashboard" element={<IamDashboard />} />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;