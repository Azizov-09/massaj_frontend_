// ═══════════════════════════════════════════════════════
//  App Router — React Router with Code-Splitting & RBAC
// ═══════════════════════════════════════════════════════
import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute, RoleRedirect, NotFoundPage, ForbiddenPage } from '@/features/auth/guards';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Orb } from '@/components/ui/thinking-orbs';

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
    <Orb state="working" size={40} className="text-brand-500" label="Yuklanmoqda" />
    <span className="text-xs font-medium text-charcoal-400">Yuklanmoqda...</span>
  </div>
);

// Helper for lazy loading components with suspense
const withSuspense = (Component: React.LazyExoticComponent<React.ComponentType<any>>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

// ─── Lazy Pages ───────────────────────────────────────────

// Public
const LandingPage = lazy(() => import('@/features/landing/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('@/features/auth/LoginPage').then(m => ({ default: m.LoginPage })));

// Dashboards
const SuperAdminDashboard = lazy(() => import('@/features/dashboard/SuperAdminDashboard').then(m => ({ default: m.SuperAdminDashboard })));
const ParentDashboard = lazy(() => import('@/features/dashboard/ParentDashboard').then(m => ({ default: m.ParentDashboard })));
const SpecialistDashboard = lazy(() => import('@/features/dashboard/SpecialistDashboard').then(m => ({ default: m.SpecialistDashboard })));

// Operations & Clinical
const AppointmentsPage = lazy(() => import('@/features/appointments/AppointmentsPage').then(m => ({ default: m.AppointmentsPage })));
const SchedulePage = lazy(() => import('@/features/schedule/SchedulePage').then(m => ({ default: m.SchedulePage })));
const AttendancePage = lazy(() => import('@/features/attendance/AttendancePage').then(m => ({ default: m.AttendancePage })));
const SessionsPage = lazy(() => import('@/features/sessions/SessionsPage').then(m => ({ default: m.SessionsPage })));
const ServicesPage = lazy(() => import('@/features/services/ServicesPage').then(m => ({ default: m.ServicesPage })));
const AssessmentsPage = lazy(() => import('@/features/assessments/AssessmentsPage').then(m => ({ default: m.AssessmentsPage })));
const ProgressPage = lazy(() => import('@/features/progress/ProgressPage').then(m => ({ default: m.ProgressPage })));
const GoalsPage = lazy(() => import('@/features/goals/GoalsPage').then(m => ({ default: m.GoalsPage })));

// Entities
const ChildrenPage = lazy(() => import('@/features/children/ChildrenPage').then(m => ({ default: m.ChildrenPage })));
const ParentsPage = lazy(() => import('@/features/parents/ParentsPage').then(m => ({ default: m.ParentsPage })));
const SpecialistsPage = lazy(() => import('@/features/specialists/SpecialistsPage').then(m => ({ default: m.SpecialistsPage })));
const AdminsPage = lazy(() => import('@/features/admins/AdminsPage').then(m => ({ default: m.AdminsPage })));
const EmployeesPage = lazy(() => import('@/features/employees/EmployeesPage').then(m => ({ default: m.EmployeesPage })));

// Finance
const PaymentsPage = lazy(() => import('@/features/payments/PaymentsPage').then(m => ({ default: m.PaymentsPage })));
const TransactionsPage = lazy(() => import('@/features/transactions/TransactionsPage').then(m => ({ default: m.TransactionsPage })));
const BalancePage = lazy(() => import('@/features/balance/BalancePage').then(m => ({ default: m.BalancePage })));
const DebtorsPage = lazy(() => import('@/features/debtors/DebtorsPage').then(m => ({ default: m.DebtorsPage })));

// Insights & System
const AnalyticsPage = lazy(() => import('@/features/analytics/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const ReportsPage = lazy(() => import('@/features/reports/ReportsPage').then(m => ({ default: m.ReportsPage })));
const NotificationsPage = lazy(() => import('@/features/notifications/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const ActivityLogsPage = lazy(() => import('@/features/activity-logs/ActivityLogsPage').then(m => ({ default: m.ActivityLogsPage })));
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const ProfilePage = lazy(() => import('@/features/profile/ProfilePage').then(m => ({ default: m.ProfilePage })));

// ─── Super Admin Routes (full access) ────────────────────

const superAdminRoutes = {
  path: '/dashboard/super-admin',
  element: (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
      <DashboardLayout />
    </ProtectedRoute>
  ),
  children: [
    { index: true, element: withSuspense(SuperAdminDashboard) },
    { path: 'admins', element: withSuspense(AdminsPage) },
    { path: 'employees', element: withSuspense(EmployeesPage) },
    { path: 'specialists', element: withSuspense(SpecialistsPage) },
    { path: 'parents', element: withSuspense(ParentsPage) },
    { path: 'children', element: withSuspense(ChildrenPage) },
    { path: 'appointments', element: withSuspense(AppointmentsPage) },
    { path: 'schedule', element: withSuspense(SchedulePage) },
    { path: 'attendance', element: withSuspense(AttendancePage) },
    { path: 'sessions', element: withSuspense(SessionsPage) },
    { path: 'services', element: withSuspense(ServicesPage) },
    { path: 'assessments', element: withSuspense(AssessmentsPage) },
    { path: 'progress', element: withSuspense(ProgressPage) },
    { path: 'goals', element: withSuspense(GoalsPage) },
    { path: 'payments', element: withSuspense(PaymentsPage) },
    { path: 'transactions', element: withSuspense(TransactionsPage) },
    { path: 'balance', element: withSuspense(BalancePage) },
    { path: 'debtors', element: withSuspense(DebtorsPage) },
    { path: 'analytics', element: withSuspense(AnalyticsPage) },
    { path: 'reports', element: withSuspense(ReportsPage) },
    { path: 'notifications', element: withSuspense(NotificationsPage) },
    { path: 'activity-logs', element: withSuspense(ActivityLogsPage) },
    { path: 'settings', element: withSuspense(SettingsPage) },
    { path: 'profile', element: withSuspense(ProfilePage) },
  ],
};

// ─── Specialist Routes ───────────────────────────────────

const specialistRoutes = {
  path: '/dashboard/specialist',
  element: (
    <ProtectedRoute allowedRoles={['SPECIALIST']}>
      <DashboardLayout />
    </ProtectedRoute>
  ),
  children: [
    { index: true, element: withSuspense(SpecialistDashboard) },
    { path: 'appointments', element: withSuspense(AppointmentsPage) },
    { path: 'schedule', element: withSuspense(SchedulePage) },
    { path: 'attendance', element: withSuspense(AttendancePage) },
    { path: 'sessions', element: withSuspense(SessionsPage) },
    { path: 'children', element: withSuspense(ChildrenPage) },
    { path: 'assessments', element: withSuspense(AssessmentsPage) },
    { path: 'progress', element: withSuspense(ProgressPage) },
    { path: 'goals', element: withSuspense(GoalsPage) },
    { path: 'notifications', element: withSuspense(NotificationsPage) },
    { path: 'profile', element: withSuspense(ProfilePage) },
  ],
};

// ─── Parent Routes ────────────────────────────────────────

const parentRoutes = {
  path: '/dashboard/parent',
  element: (
    <ProtectedRoute allowedRoles={['PARENT']}>
      <DashboardLayout />
    </ProtectedRoute>
  ),
  children: [
    { index: true, element: withSuspense(ParentDashboard) },
    { path: 'children', element: withSuspense(ChildrenPage) },
    { path: 'appointments', element: withSuspense(AppointmentsPage) },
    { path: 'sessions', element: withSuspense(SessionsPage) },
    { path: 'progress', element: withSuspense(ProgressPage) },
    { path: 'payments', element: withSuspense(PaymentsPage) },
    { path: 'balance', element: withSuspense(BalancePage) },
    { path: 'debt', element: withSuspense(DebtorsPage) },
    { path: 'notifications', element: withSuspense(NotificationsPage) },
    { path: 'profile', element: withSuspense(ProfilePage) },
  ],
};

// ─── Root Router ──────────────────────────────────────────

const router = createBrowserRouter([
  {
    path: '/',
    errorElement: (
      <ErrorBoundary>
        <NotFoundPage />
      </ErrorBoundary>
    ),
    children: [
      { index: true, element: <RoleRedirect /> },
      { path: 'landing', element: withSuspense(LandingPage) },
      { path: 'login', element: withSuspense(LoginPage) },
      { path: '403', element: <ForbiddenPage /> },
      { path: '404', element: <NotFoundPage /> },
      superAdminRoutes,
      specialistRoutes,
      parentRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export function AppRouter() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}
