// ═══════════════════════════════════════════════════════
//  App Router — React Router with Code-Splitting & RBAC
// ═══════════════════════════════════════════════════════
import { Suspense } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  useLocation,
} from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  ProtectedRoute,
  RoleRedirect,
  NotFoundPage,
  ForbiddenPage,
} from "@/features/auth/guards";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import {
  RouteErrorPage,
  DashboardSectionError,
} from "@/components/ui/RouteErrorPage";
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { Orb } from "@/components/ui/thinking-orbs";

// Loading fallback component (3D Dotted Globus / Orb)
const PageLoader = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
    <Orb
      state="working"
      size={42}
      className="text-brand-500"
      label="Yuklanmoqda"
    />
    <span className="text-xs font-medium text-charcoal-400">
      Yuklanmoqda...
    </span>
  </div>
);

// Helper for lazy loading components with suspense
const withSuspense = (
  Component: React.LazyExoticComponent<React.ComponentType<any>>,
) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

// ─── Lazy Pages (with automatic chunk reload recovery) ───

// Public
const LoginPage = lazyWithRetry(() =>
  import("@/features/auth/LoginPage").then((m) => ({ default: m.LoginPage })),
);

// Dashboards
const SuperAdminDashboard = lazyWithRetry(() =>
  import("@/features/dashboard/SuperAdminDashboard").then((m) => ({
    default: m.SuperAdminDashboard,
  })),
);
const ParentTransactionsPage = lazyWithRetry(() =>
  import("@/features/transactions/ParentTransactionsPage").then((m) => ({
    default: m.ParentTransactionsPage,
  })),
);
const ParentDashboard = lazyWithRetry(() =>
  import("@/features/dashboard/ParentDashboard").then((m) => ({
    default: m.ParentDashboard,
  })),
);
const SpecialistDashboard = lazyWithRetry(() =>
  import("@/features/dashboard/SpecialistDashboard").then((m) => ({
    default: m.SpecialistDashboard,
  })),
);

// Operations & Clinical
const SchedulePage = lazyWithRetry(() =>
  import("@/features/schedule/SchedulePage").then((m) => ({
    default: m.SchedulePage,
  })),
);
const AttendancePage = lazyWithRetry(() =>
  import("@/features/attendance/AttendancePage").then((m) => ({
    default: m.AttendancePage,
  })),
);
const ServicesPage = lazyWithRetry(() =>
  import("@/features/services/ServicesPage").then((m) => ({
    default: m.ServicesPage,
  })),
);
const AssessmentsPage = lazyWithRetry(() =>
  import("@/features/assessments/AssessmentsPage").then((m) => ({
    default: m.AssessmentsPage,
  })),
);
const ProgressPage = lazyWithRetry(() =>
  import("@/features/progress/ProgressPage").then((m) => ({
    default: m.ProgressPage,
  })),
);

// Entities
const ChildrenPage = lazyWithRetry(() =>
  import("@/features/children/ChildrenPage").then((m) => ({
    default: m.ChildrenPage,
  })),
);
const ParentsPage = lazyWithRetry(() =>
  import("@/features/parents/ParentsPage").then((m) => ({
    default: m.ParentsPage,
  })),
);

// Finance
const PaymentsPage = lazyWithRetry(() =>
  import("@/features/payments/PaymentsPage").then((m) => ({
    default: m.PaymentsPage,
  })),
);
const BalancePage = lazyWithRetry(() =>
  import("@/features/balance/BalancePage").then((m) => ({
    default: m.BalancePage,
  })),
);
const DebtorsPage = lazyWithRetry(() =>
  import("@/features/debtors/DebtorsPage").then((m) => ({
    default: m.DebtorsPage,
  })),
);

// Insights & System
const NotificationsPage = lazyWithRetry(() =>
  import("@/features/notifications/NotificationsPage").then((m) => ({
    default: m.NotificationsPage,
  })),
);
const ProfilePage = lazyWithRetry(() =>
  import("@/features/profile/ProfilePage").then((m) => ({
    default: m.ProfilePage,
  })),
);

// ─── Super Admin Routes (full access) ────────────────────

const CashPage = lazyWithRetry(() =>
  import("@/features/payments/CashPage").then((m) => ({ default: m.CashPage })),
);
const OwnerSettingsPage = lazyWithRetry(() =>
  import("@/features/settings/OwnerSettingsPage").then((m) => ({
    default: m.OwnerSettingsPage,
  })),
);
const ReportsWorkspacePage = lazyWithRetry(() =>
  import("@/features/reports/ReportsWorkspacePage").then((m) => ({
    default: m.ReportsWorkspacePage,
  })),
);
function LegacyRoute({ to }: { to: string }) {
  const location = useLocation();
  const [path, query] = to.split("?");
  const params = new URLSearchParams(location.search);
  new URLSearchParams(query).forEach((value, key) => params.set(key, value));
  return (
    <Navigate
      to={path + (params.size ? "?" + params.toString() : "")}
      replace
    />
  );
}

const superAdminRoutes = {
  path: "/dashboard/super-admin",
  errorElement: <DashboardSectionError />,
  element: (
    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
      <DashboardLayout />
    </ProtectedRoute>
  ),
  children: [
    { index: true, element: withSuspense(SuperAdminDashboard) },
    {
      path: "admins",
      element: <LegacyRoute to="/dashboard/super-admin/settings?tab=profile" />,
    },
    {
      path: "employees",
      element: <LegacyRoute to="/dashboard/super-admin/settings?tab=profile" />,
    },
    {
      path: "specialists",
      element: <LegacyRoute to="/dashboard/super-admin/settings?tab=profile" />,
    },
    { path: "parents", element: withSuspense(ParentsPage) },
    { path: "children", element: withSuspense(ChildrenPage) },
    {
      path: "schedule",
      element: <LegacyRoute to="/dashboard/super-admin/attendance" />,
    },
    { path: "attendance", element: withSuspense(AttendancePage) },
    { path: "services", element: withSuspense(ServicesPage) },
    {
      path: "assessments",
      element: (
        <LegacyRoute to="/dashboard/super-admin/children?section=assessments" />
      ),
    },
    {
      path: "progress",
      element: (
        <LegacyRoute to="/dashboard/super-admin/children?section=progress" />
      ),
    },
    {
      path: "goals",
      element: (
        <LegacyRoute to="/dashboard/super-admin/children?section=progress" />
      ),
    },
    {
      path: "payments",
      element: <LegacyRoute to="/dashboard/super-admin/cash?tab=payments" />,
    },
    {
      path: "transactions",
      element: (
        <LegacyRoute to="/dashboard/super-admin/cash?tab=transactions" />
      ),
    },
    {
      path: "balance",
      element: <LegacyRoute to="/dashboard/super-admin/cash?tab=payments" />,
    },
    { path: "cash", element: withSuspense(CashPage) },
    { path: "debtors", element: withSuspense(DebtorsPage) },
    {
      path: "analytics",
      element: (
        <LegacyRoute to="/dashboard/super-admin/reports?tab=analytics" />
      ),
    },
    { path: "reports", element: withSuspense(ReportsWorkspacePage) },
    { path: "notifications", element: withSuspense(NotificationsPage) },
    {
      path: "activity-logs",
      element: (
        <LegacyRoute to="/dashboard/super-admin/settings?tab=activity" />
      ),
    },
    { path: "settings", element: withSuspense(OwnerSettingsPage) },
    {
      path: "profile",
      element: <LegacyRoute to="/dashboard/super-admin/settings?tab=profile" />,
    },
  ],
};

// ─── Specialist Routes ───────────────────────────────────

const specialistRoutes = {
  path: "/dashboard/specialist",
  errorElement: <DashboardSectionError />,
  element: (
    <ProtectedRoute allowedRoles={["SPECIALIST"]}>
      <DashboardLayout />
    </ProtectedRoute>
  ),
  children: [
    { index: true, element: withSuspense(SpecialistDashboard) },
    { path: "schedule", element: withSuspense(SchedulePage) },
    { path: "attendance", element: withSuspense(AttendancePage) },
    { path: "children", element: withSuspense(ChildrenPage) },
    { path: "assessments", element: withSuspense(AssessmentsPage) },
    { path: "progress", element: withSuspense(ProgressPage) },
    {
      path: "goals",
      element: <Navigate to="/dashboard/specialist/progress" replace />,
    },
    { path: "notifications", element: withSuspense(NotificationsPage) },
    { path: "profile", element: withSuspense(ProfilePage) },
  ],
};

// ─── Parent Routes ────────────────────────────────────────

const parentRoutes = {
  path: "/dashboard/parent",
  errorElement: <DashboardSectionError />,
  element: (
    <ProtectedRoute allowedRoles={["PARENT"]}>
      <DashboardLayout />
    </ProtectedRoute>
  ),
  children: [
    { index: true, element: withSuspense(ParentDashboard) },
    { path: "children", element: withSuspense(ChildrenPage) },
    { path: "progress", element: withSuspense(ProgressPage) },
    { path: "payments", element: withSuspense(PaymentsPage) },
    { path: "transactions", element: withSuspense(ParentTransactionsPage) },
    { path: "balance", element: withSuspense(BalancePage) },
    { path: "debt", element: withSuspense(DebtorsPage) },
    { path: "notifications", element: withSuspense(NotificationsPage) },
    { path: "profile", element: withSuspense(ProfilePage) },
  ],
};

// ─── Root Router ──────────────────────────────────────────

const router = createBrowserRouter([
  {
    path: "/",
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <RoleRedirect /> },
      { path: "login", element: withSuspense(LoginPage) },
      { path: "403", element: <ForbiddenPage /> },
      { path: "404", element: <NotFoundPage /> },
      superAdminRoutes,
      specialistRoutes,
      parentRoutes,
      { path: "*", element: <NotFoundPage /> },
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
