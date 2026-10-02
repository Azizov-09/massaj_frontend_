// ═══════════════════════════════════════════════════════
//  Dashboard Layout — Main app shell
// ═══════════════════════════════════════════════════════
import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Baby, Calendar, Wallet, Menu as MoreIcon,
} from 'lucide-react';
import { cn } from '@/utils';
import { useAuth } from '@/store';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '@/components/ui/Toast';

// Mobile bottom navigation
function MobileBottomNav({ onMoreClick }: { onMoreClick: () => void }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getNavItems = () => {
    if (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN') {
      const base = '/dashboard/super-admin';
      return [
        { label: 'Bosh', path: base, icon: <LayoutDashboard className="w-5 h-5" />, action: undefined },
        { label: 'Bolalar', path: `${base}/children`, icon: <Baby className="w-5 h-5" />, action: undefined },
        { label: 'Uchrashuvlar', path: `${base}/appointments`, icon: <Calendar className="w-5 h-5" />, action: undefined },
        { label: 'Moliya', path: `${base}/payments`, icon: <Wallet className="w-5 h-5" />, action: undefined },
        { label: "Ko'proq", path: null, icon: <MoreIcon className="w-5 h-5" />, action: onMoreClick },
      ];
    }
    if (currentUser?.role === 'SPECIALIST') {
      const base = '/dashboard/specialist';
      return [
        { label: 'Bosh', path: base, icon: <LayoutDashboard className="w-5 h-5" />, action: undefined },
        { label: 'Jadval', path: `${base}/schedule`, icon: <Calendar className="w-5 h-5" />, action: undefined },
        { label: 'Seanslar', path: `${base}/sessions`, icon: <Calendar className="w-5 h-5" />, action: undefined },
        { label: 'Bolalar', path: `${base}/children`, icon: <Baby className="w-5 h-5" />, action: undefined },
        { label: "Ko'proq", path: null, icon: <MoreIcon className="w-5 h-5" />, action: onMoreClick },
      ];
    }
    // PARENT
    const base = '/dashboard/parent';
    return [
      { label: 'Bosh', path: base, icon: <LayoutDashboard className="w-5 h-5" />, action: undefined },
      { label: 'Bolalar', path: `${base}/children`, icon: <Baby className="w-5 h-5" />, action: undefined },
      { label: 'Uchrashuvlar', path: `${base}/appointments`, icon: <Calendar className="w-5 h-5" />, action: undefined },
      { label: 'Balans', path: `${base}/balance`, icon: <Wallet className="w-5 h-5" />, action: undefined },
      { label: "Ko'proq", path: null, icon: <MoreIcon className="w-5 h-5" />, action: onMoreClick },
    ];
  };

  const items = getNavItems();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-warm-200/90 safe-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.03)]" aria-label="Pastki navigatsiya">
      <div className="flex items-center justify-around h-14">
        {items.map(item => {
          const isActive = item.path ? (item.path === location.pathname || location.pathname.startsWith(item.path + '/')) : false;
          return (
            <button
              key={item.label}
              onClick={() => {
                if (item.action) item.action();
                else if (item.path) navigate(item.path);
              }}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 h-full py-1 px-1 text-[10px] font-semibold transition-colors cursor-pointer select-none',
                isActive ? 'text-brand-600' : 'text-charcoal-400 hover:text-charcoal-700 active:scale-95'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={cn('transition-transform duration-150', isActive && 'text-brand-500 scale-105')}>{item.icon}</span>
              <span className="truncate max-w-[64px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function DashboardLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-warm-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-6" id="main-content">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
        <MobileBottomNav onMoreClick={() => setMobileMenuOpen(true)} />
      </div>

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
}
