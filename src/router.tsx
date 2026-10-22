// ═══════════════════════════════════════════════════════
//  App Router — React Router with Code-Splitting & RBAC
// ═══════════════════════════════════════════════════════
import { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute, RoleRedirect, NotFoundPage, ForbiddenPage } from '@/features/auth/guards';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { RouteErrorPage, DashboardSectionError } from '@/components/ui/RouteErrorPage';
import { lazyWithRetry } from '@/utils/lazyWithRetry';
import { Orb } from '@/components/ui/thinking-orbs';

// Loading fallback component (3D Dotted Globus / Orb)
const PageLoader = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
    <Orb state="working" size={42} className="text-brand-500" label="Yuklanmoqda" />
    <span className="text-xs font-medium text-charcoal-400">Yuklanmoqda...</span>
  </div>
);

// Helper for lazy loading components with suspense
const withSuspense = (Component: React.LazyExoticComponent<React.ComponentType<any>>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

// ─── Lazy Pages (with automatic chunk reload recovery) ───

// Public
const LoginPage = lazyWithRetry(() => import('@/features/auth/LoginPage').then(m => ({ default: m.LoginPage })));

// Dashboards
const SuperAdminDashboard = lazyWithRetry(() => import('@/features/dashboard/SuperAdminDashboard').then(m => ({ default: m.SuperAdminDashboard })));
const ParentDashboard = lazyWithRetry(() => import('@/features/dashboard/ParentDashboard').then(m => ({ default: m.ParentDashboard })));
const SpecialistDashboard = lazyWithRetry(() => import('@/features/dashboard/SpecialistDashboard').then(m => ({ default: m.SpecialistDashboard })));

// Operations & Clinical
const SchedulePage = lazyWithRetry(() => import('@/features/schedule/SchedulePage').then(m => ({ default: m.SchedulePage })));
const AttendancePage = lazyWithRetry(() => import('@/features/attendance/AttendancePage').then(m => ({ default: m.AttendancePage })));
const ServicesPage = lazyWithRetry(() => import('@/features/services/ServicesPage').then(m => ({ default: m.ServicesPage })));
const AssessmentsPage = lazyWithRetry(() => import('@/features/assessments/AssessmentsPage').then(m => ({ default: m.AssessmentsPage })));
const ProgressPage = lazyWithRetry(() => import('@/features/progress/ProgressPage').then(m => ({ default: m.ProgressPage })));

// Entities
const ChildrenPage = lazyWithRetry(() => import('@/features/children/ChildrenPage').then(m => ({ default: m.ChildrenPage })));
const ParentsPage = lazyWithRetry(() => import('@/features/parents/ParentsPage').then(m => ({ default: m.ParentsPage })));
const SpecialistsPage = lazyWithRetry(() => import('@/features/specialists/SpecialistsPage').then(m => ({ default: m.SpecialistsPage })));
const AdminsPage = lazyWithRetry(() => import('@/features/admins/AdminsPage').then(m => ({ default: m.AdminsPage })));

// Finance
const PaymentsPage = lazyWithRetry(() => import('@/features/payments/PaymentsPage').then(m => ({ default: m.PaymentsPage })));
const TransactionsPage = lazyWithRetry(() => import('@/features/transactions/TransactionsPage').then(m => ({ default: m.TransactionsPage })));
const BalancePage = lazyWithRetry(() => import('@/features/balance/BalancePage').then(m => ({ default: m.BalancePage })));
const DebtorsPage = lazyWithRetry(() => import('@/features/debtors/DebtorsPage').then(m => ({ default: m.DebtorsPage })));

// Insights & System
const AnalyticsPage = lazyWithRetry(() => import('@/features/analytics/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const ReportsPage = lazyWithRetry(() => import('@/features/reports/ReportsPage').then(m => ({ default: m.ReportsPage })));
const NotificationsPage = lazyWithRetry(() => import('@/features/notifications/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const ActivityLogsPage = lazyWithRetry(() => import('@/features/activity-logs/ActivityLogsPage').then(m => ({ default: m.ActivityLogsPage })));
const SettingsPage = lazyWithRetry(() => import('@/features/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const ProfilePage = lazyWithRetry(() => import('@/features/profile/ProfilePage').then(m => ({ default: m.ProfilePage })));

// ─── Super Admin Routes (full access) ────────────────────

const superAdminRoutes = {
  path: '/dashboard/super-admin',
  errorElement: <DashboardSectionError />,
  element: (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
      <DashboardLayout />
    </ProtectedRoute>
  ),
  children: [
    { index: true, element: withSuspense(SuperAdminDashboard) },
    { path: 'admins', element: withSuspense(AdminsPage) },
    { path: 'employees', element: <Navigate to="/dashboard/super-admin/specialists" replace /> },
    { path: 'specialists', element: withSuspense(SpecialistsPage) },
    { path: 'parents', element: withSuspense(ParentsPage) },
    { path: 'children', element: withSuspense(ChildrenPage) },
    { path: 'schedule', element: withSuspense(SchedulePage) },
    { path: 'attendance', element: withSuspense(AttendancePage) },
    { path: 'services', element: withSuspense(ServicesPage) },
    { path: 'assessments', element: withSuspense(AssessmentsPage) },
    { path: 'progress', element: withSuspense(ProgressPage) },
    { path: 'goals', element: <Navigate to="/dashboard/super-admin/progress" replace /> },
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
  errorElement: <DashboardSectionError />,
  element: (
    <ProtectedRoute allowedRoles={['SPECIALIST']}>
      <DashboardLayout />
    </ProtectedRoute>
  ),
  children: [
    { index: true, element: withSuspense(SpecialistDashboard) },
    { path: 'schedule', element: withSuspense(SchedulePage) },
    { path: 'attendance', element: withSuspense(AttendancePage) },
    { path: 'children', element: withSuspense(ChildrenPage) },
    { path: 'assessments', element: withSuspense(AssessmentsPage) },
    { path: 'progress', element: withSuspense(ProgressPage) },
    { path: 'goals', element: <Navigate to="/dashboard/specialist/progress" replace /> },
    { path: 'notifications', element: withSuspense(NotificationsPage) },
    { path: 'profile', element: withSuspense(ProfilePage) },
  ],
};

// ─── Parent Routes ────────────────────────────────────────

const parentRoutes = {
  path: '/dashboard/parent',
  errorElement: <DashboardSectionError />,
  element: (
    <ProtectedRoute allowedRoles={['PARENT']}>
      <DashboardLayout />
    </ProtectedRoute>
  ),
  children: [
    { index: true, element: withSuspense(ParentDashboard) },
    { path: 'children', element: withSuspense(ChildrenPage) },
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
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <RoleRedirect /> },
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
