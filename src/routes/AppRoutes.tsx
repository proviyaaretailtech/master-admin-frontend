import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { DashboardPage } from "../pages/DashboardPage";
import { ProfilePage } from "../pages/ProfilePage";
import { UsersManagementPage } from "../pages/UsersManagementPage";
import { Organization360Page } from "../pages/Organization360Page";
import { PartnerDetailPage } from "../pages/PartnerDetailPage";
import { DomainPlaceholderPage } from "../pages/DomainPlaceholderPage";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ProtectedRoute } from "../components/common/ProtectedRoute";

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* ============================================================== */}
      {/* PUBLIC AUTHENTICATION ROUTES                                    */}
      {/* ============================================================== */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* ============================================================== */}
      {/* PROTECTED ROUTES (AUTHENTICATED ONLY)                          */}
      {/* ============================================================== */}
      <Route element={<ProtectedRoute />}>
        {/* All protected routes use the unified DashboardLayout */}
        <Route element={<DashboardLayout />}>
          {/* Main Dashboard / Onboarding System (matches screenshot 1) */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/overview" element={<DashboardPage />} />
          <Route path="/organizations" element={<DashboardPage />} />

          {/* User Account / My Profile (matches screenshot 2 dropdown destination) */}
          <Route path="/profile" element={<ProfilePage />} />

          {/* Access Control: Users Management (System Accounts) */}
          <Route path="/users" element={<UsersManagementPage />} />
          <Route path="/access-control" element={<UsersManagementPage />} />
          <Route path="/access-control/users" element={<UsersManagementPage />} />
          <Route path="/access-control/roles" element={<DomainPlaceholderPage />} />
          <Route path="/access-control/policies" element={<DomainPlaceholderPage />} />
          <Route path="/access-control/audit-logs" element={<DomainPlaceholderPage />} />

          {/* Organization Submenu Items */}
          <Route path="/organizations/360" element={<Organization360Page />} />
          <Route path="/organizations/partner-detail" element={<PartnerDetailPage />} />
          <Route path="/organizations/360/:id" element={<PartnerDetailPage />} />
          <Route path="/partner-detail" element={<PartnerDetailPage />} />
          <Route path="/brands" element={<DomainPlaceholderPage />} />
          <Route path="/locations" element={<DomainPlaceholderPage />} />
          <Route path="/departments" element={<DomainPlaceholderPage />} />
          <Route path="/employees" element={<DomainPlaceholderPage />} />
          <Route path="/invitations" element={<DomainPlaceholderPage />} />

          {/* System Domains */}
          <Route path="/commercials" element={<DomainPlaceholderPage />} />
          <Route path="/platform-core" element={<DomainPlaceholderPage />} />
          <Route path="/commerce-engine" element={<DomainPlaceholderPage />} />
          <Route path="/inventory-supply" element={<DomainPlaceholderPage />} />
          <Route path="/fulfilment" element={<DomainPlaceholderPage />} />
          <Route path="/intelligence" element={<DomainPlaceholderPage />} />
          <Route path="/operations" element={<DomainPlaceholderPage />} />
          <Route path="/support" element={<DomainPlaceholderPage />} />
          <Route path="/developer" element={<DomainPlaceholderPage />} />
          <Route path="/audit" element={<DomainPlaceholderPage />} />
        </Route>
      </Route>

      {/* ============================================================== */}
      {/* FALLBACK REDIRECT                                              */}
      {/* ============================================================== */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
