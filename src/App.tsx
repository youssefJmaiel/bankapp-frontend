import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { ProtectedRoute, PublicOnlyRoute, AdminRoute } from '@/routes/ProtectedRoute';
import { AppLayout } from '@/layouts/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { EmployeesPage } from '@/pages/EmployeesPage';
import { DepartmentsPage } from '@/pages/DepartmentsPage';
import { MissionsPage } from '@/pages/MissionsPage';
import { MessagesPage } from '@/pages/MessagesPage';
import { PartnersPage } from '@/pages/PartnersPage';
import { PaymentsPage } from '@/pages/PaymentsPage';
import { LeavesPage } from '@/pages/LeavesPage';
import { AIChatPage } from '@/pages/AIChatPage';
import { AccountManagementPage } from '@/pages/AccountManagementPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          } />
          <Route element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/departments" element={<DepartmentsPage />} />
            <Route path="/missions" element={<MissionsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/partners" element={<PartnersPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/accounts" element={<AdminRoute><AccountManagementPage /></AdminRoute>} />
            <Route path="/leaves" element={<LeavesPage />} />
            <Route path="/ai-assistant" element={<AIChatPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
