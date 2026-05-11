import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/Layout/Layout';
import { UserRole } from './types';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

import DashboardPage from './pages/DashboardPage';
import ApplicationsPage from './pages/ApplicationsPage';
import ApplicationDetailPage from './pages/ApplicationDetailPage';
import NewApplicationPage from './pages/NewApplicationPage';
import CatalogPage from './pages/CatalogPage';
import AuditPage from './pages/AuditPage';

import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminDepartmentsPage from './pages/admin/AdminDepartmentsPage';
import AdminInstitutionTypesPage from './pages/admin/AdminInstitutionTypesPage';
import AdminLicenseTypesPage from './pages/admin/AdminLicenseTypesPage';

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false } },
});

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/applications" element={<ApplicationsPage />} />
              <Route path="/applications/:id" element={<ApplicationDetailPage />} />
              <Route
                path="/applications/new"
                element={
                  <ProtectedRoute roles={[UserRole.APPLICANT]}>
                    <NewApplicationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/catalog"
                element={
                  <ProtectedRoute roles={[UserRole.APPLICANT]}>
                    <CatalogPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/audit"
                element={
                  <ProtectedRoute roles={[UserRole.ADMIN, UserRole.APPROVER, UserRole.REVIEWER]}>
                    <AuditPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={<ProtectedRoute roles={[UserRole.ADMIN]}><AdminUsersPage /></ProtectedRoute>}
              />
              <Route
                path="/admin/departments"
                element={<ProtectedRoute roles={[UserRole.ADMIN]}><AdminDepartmentsPage /></ProtectedRoute>}
              />
              <Route
                path="/admin/institution-types"
                element={<ProtectedRoute roles={[UserRole.ADMIN]}><AdminInstitutionTypesPage /></ProtectedRoute>}
              />
              <Route
                path="/admin/license-types"
                element={<ProtectedRoute roles={[UserRole.ADMIN]}><AdminLicenseTypesPage /></ProtectedRoute>}
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
