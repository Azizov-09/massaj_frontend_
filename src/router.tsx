// ═══════════════════════════════════════════════════════
//  App Router — React Router v6 (Super Admin + Parent only)
// ═══════════════════════════════════════════════════════
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoginPage } from '@/features/auth/LoginPage';
import { ProtectedRoute, RoleRedirect, NotFoundPage, ForbiddenPage } from '@/features/auth/guards';
import { SuperAdminDashboard } from '@/features/dashboard/SuperAdminDashboard';
import { ParentDashboard } from '@/features/dashboard/ParentDashboard';
import { ChildrenPage } from '@/features/children/ChildrenPage';
import { ParentsPage } from '@/features/parents/ParentsPage';
import { SpecialistsPage } from '@/features/specialists/SpecialistsPage';
import { AppointmentsPage } from '@/features/appointments/AppointmentsPage';
import { SessionsPage } from '@/features/sessions/SessionsPage';
import { PaymentsPage } from '@/features/payments/PaymentsPage';
import { DebtorsPage } from '@/features/debtors/DebtorsPage';
import { ServicesPage } from '@/features/services/ServicesPage';
import { NotificationsPage } from '@/features/notifications/NotificationsPage';
import { LandingPage } from '@/features/landing/LandingPage';
import { SchedulePage } from '@/features/schedule/SchedulePage';
import { AttendancePage } from '@/features/attendance/AttendancePage';
import { AssessmentsPage } from '@/features/assessments/AssessmentsPage';
import { ProgressPage } from '@/features/progress/ProgressPage';
import { GoalsPage } from '@/features/goals/GoalsPage';
import { TransactionsPage } from '@/features/transactions/TransactionsPage';
import { BalancePage } from '@/features/balance/BalancePage';
import { AnalyticsPage } from '@/features/analytics/AnalyticsPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { ActivityLogsPage } from '@/features/activity-logs/ActivityLogsPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { AdminsPage } from '@/features/admins/AdminsPage';
import { EmployeesPage } from '@/features/employees/EmployeesPage';

// ─── Super Admin Routes (full access) ────────────────────

const superAdminRoutes = {
  path: '/dashboard/super-admin',
  element: <ProtectedRoute allowedRoles={['SUPER_ADMIN']}><DashboardLayout /></ProtectedRoute>,
  children: [
    { index: true, element: <SuperAdminDashboard /> },
    { path: 'admins', element: <AdminsPage /> },
    { path: 'employees', element: <EmployeesPage /> },
    { path: 'specialists', element: <SpecialistsPage /> },
    { path: 'parents', element: <ParentsPage /> },
    { path: 'children', element: <ChildrenPage /> },
    { path: 'appointments', element: <AppointmentsPage /> },
    { path: 'schedule', element: <SchedulePage /> },
    { path: 'attendance', element: <AttendancePage /> },
    { path: 'sessions', element: <SessionsPage /> },
    { path: 'services', element: <ServicesPage /> },
    { path: 'assessments', element: <AssessmentsPage /> },
    { path: 'progress', element: <ProgressPage /> },
    { path: 'goals', element: <GoalsPage /> },
    { path: 'payments', element: <PaymentsPage /> },
    { path: 'transactions', element: <TransactionsPage /> },
    { path: 'balance', element: <BalancePage /> },
    { path: 'debtors', element: <DebtorsPage /> },
    { path: 'analytics', element: <AnalyticsPage /> },
    { path: 'reports', element: <ReportsPage /> },
    { path: 'notifications', element: <NotificationsPage /> },
    { path: 'activity-logs', element: <ActivityLogsPage /> },
    { path: 'settings', element: <SettingsPage /> },
    { path: 'profile', element: <ProfilePage /> },
  ],
};

// ─── Parent Routes ────────────────────────────────────────

const parentRoutes = {
  path: '/dashboard/parent',
  element: <ProtectedRoute allowedRoles={['PARENT']}><DashboardLayout /></ProtectedRoute>,
  children: [
    { index: true, element: <ParentDashboard /> },
    { path: 'children', element: <ChildrenPage /> },
    { path: 'appointments', element: <AppointmentsPage /> },
    { path: 'sessions', element: <SessionsPage /> },
    { path: 'progress', element: <ProgressPage /> },
    { path: 'payments', element: <PaymentsPage /> },
    { path: 'balance', element: <BalancePage /> },
    { path: 'debt', element: <DebtorsPage /> },
    { path: 'notifications', element: <NotificationsPage /> },
    { path: 'profile', element: <ProfilePage /> },
  ],
};

// ─── Root Router ──────────────────────────────────────────

const router = createBrowserRouter([
  { path: '/', element: <RoleRedirect /> },
  { path: '/landing', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/403', element: <ForbiddenPage /> },
  { path: '/404', element: <NotFoundPage /> },
  superAdminRoutes,
  parentRoutes,
  { path: '*', element: <NotFoundPage /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
