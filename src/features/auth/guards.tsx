// ═══════════════════════════════════════════════════════
//  Route Guards + Error Pages
// ═══════════════════════════════════════════════════════
import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/store';
import type { UserRole } from '@/types';

const ROLE_REDIRECTS: Record<UserRole, string> = {
  SUPER_ADMIN: '/dashboard/super-admin',
  ADMIN: '/dashboard/super-admin',       // fallback — treat ADMIN as super-admin
  SPECIALIST: '/dashboard/super-admin',  // fallback
  PARENT: '/dashboard/parent',
};

// ─── Protected Route ──────────────────────────────────────

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { currentUser, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}

// ─── Role Redirect ────────────────────────────────────────

export function RoleRedirect() {
  const { currentUser, isAuthenticated } = useAuth();
  if (!isAuthenticated || !currentUser) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_REDIRECTS[currentUser.role]} replace />;
}

// ─── 404 Page ─────────────────────────────────────────────

export function NotFoundPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex items-center justify-center bg-warm-100 p-6"
    >
      <div className="text-center max-w-sm">
        <div className="text-8xl font-black text-warm-300 mb-4 leading-none select-none">404</div>
        <h1 className="text-xl font-bold text-charcoal-900 mb-2">Sahifa topilmadi</h1>
        <p className="text-sm text-charcoal-400 mb-8">
          Siz qidirgan sahifa mavjud emas yoki ko'chirilgan bo'lishi mumkin.
        </p>
        <div className="flex items-center justify-center gap-3">
          <a
            href="javascript:history.back()"
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] border border-warm-300 text-sm font-medium text-charcoal-700 hover:bg-warm-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Orqaga
          </a>
          <a
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
          >
            <Home className="w-4 h-4" /> Bosh sahifa
          </a>
        </div>
      </div>
    </motion.div>
  );
}

// ─── 403 Page ─────────────────────────────────────────────

export function ForbiddenPage() {
  const { currentUser } = useAuth();
  const redirectTo = currentUser ? ROLE_REDIRECTS[currentUser.role] : '/login';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex items-center justify-center bg-warm-100 p-6"
    >
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-9 h-9 text-danger-main" />
        </div>
        <h1 className="text-xl font-bold text-charcoal-900 mb-2">Ruxsat yo'q</h1>
        <p className="text-sm text-charcoal-400 mb-8">
          Sizda ushbu sahifani ko'rish huquqi mavjud emas. Iltimos administratorga murojaat qiling.
        </p>
        <a
          href={redirectTo}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          <Home className="w-4 h-4" /> Dashboardga qaytish
        </a>
      </div>
    </motion.div>
  );
}
