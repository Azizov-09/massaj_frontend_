// ═══════════════════════════════════════════════════════
//  Dashboard Layout — Main app shell
// ═══════════════════════════════════════════════════════
import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '@/components/ui/Toast';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useStore } from '@/store';

export function DashboardLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const dataError = useStore(state => state.dataError);
  const isLoadingData = useStore(state => state.isLoadingData);
  const fetchInitialData = useStore(state => state.fetchInitialData);

  return (
    <div className="flex h-screen h-[100dvh] bg-warm-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        <Header
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
        />
        {dataError && (
          <div
            role="alert"
            className="mx-3 mt-3 sm:mx-4 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-3 text-amber-950 shadow-xs"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Server bilan sinxronlash to‘liq tugamadi</p>
              <p className="mt-0.5 text-xs text-amber-800">{dataError}</p>
            </div>
            <button
              type="button"
              onClick={() => void fetchInitialData()}
              disabled={isLoadingData}
              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-amber-900 hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingData ? 'animate-spin' : ''}`} aria-hidden />
              Qayta urinish
            </button>
          </div>
        )}
        <main className="flex-1 overflow-y-auto pb-6" id="main-content">
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
      </div>

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
}
