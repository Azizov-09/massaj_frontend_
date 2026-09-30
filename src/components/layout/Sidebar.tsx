// ═══════════════════════════════════════════════════════
//  Sidebar Navigation
// ═══════════════════════════════════════════════════════
import { useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Baby, Calendar, Clock, ClipboardList,
  Stethoscope, Activity, Target, Wallet, CreditCard, BarChart3,
  FileText, Bell, ScrollText, Settings, ChevronLeft, ChevronRight,
  LogOut, User, Shield, Briefcase, Heart, TrendingDown, TrendingUp, X,
} from 'lucide-react';
import { cn, getRoleLabel } from '@/utils';
import { useAuth, useSidebar, useStore } from '@/store';
import { Avatar } from '@/components/ui/primitives';

type NavItem = {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

function getSuperAdminNav(unreadCount: number): NavGroup[] {
  return [
    {
      label: 'Umumiy',
      items: [{ label: 'Dashboard', path: '/dashboard/super-admin', icon: <LayoutDashboard className="w-4 h-4" /> }],
    },
    {
      label: 'Boshqaruv',
      items: [
        { label: 'Adminlar', path: '/dashboard/super-admin/admins', icon: <Shield className="w-4 h-4" /> },
        { label: 'Xodimlar', path: '/dashboard/super-admin/employees', icon: <Briefcase className="w-4 h-4" /> },
        { label: 'Mutaxassislar', path: '/dashboard/super-admin/specialists', icon: <Stethoscope className="w-4 h-4" /> },
        { label: 'Ota-onalar', path: '/dashboard/super-admin/parents', icon: <Users className="w-4 h-4" /> },
        { label: 'Bolalar', path: '/dashboard/super-admin/children', icon: <Baby className="w-4 h-4" /> },
      ],
    },
    {
      label: 'Operatsiyalar',
      items: [
        { label: 'Uchrashuvlar', path: '/dashboard/super-admin/appointments', icon: <Calendar className="w-4 h-4" /> },
        { label: 'Jadval', path: '/dashboard/super-admin/schedule', icon: <Clock className="w-4 h-4" /> },
        { label: 'Davomat', path: '/dashboard/super-admin/attendance', icon: <ClipboardList className="w-4 h-4" /> },
        { label: 'Seanslar', path: '/dashboard/super-admin/sessions', icon: <Activity className="w-4 h-4" /> },
        { label: 'Xizmatlar', path: '/dashboard/super-admin/services', icon: <Heart className="w-4 h-4" /> },
      ],
    },
    {
      label: 'Rivojlanish',
      items: [
        { label: 'Baholashlar', path: '/dashboard/super-admin/assessments', icon: <Stethoscope className="w-4 h-4" /> },
        { label: 'Rivojlanish', path: '/dashboard/super-admin/progress', icon: <TrendingUp className="w-4 h-4" /> },
        { label: 'Maqsadlar', path: '/dashboard/super-admin/goals', icon: <Target className="w-4 h-4" /> },
      ],
    },
    {
      label: 'Moliya',
      items: [
        { label: "To'lovlar", path: '/dashboard/super-admin/payments', icon: <Wallet className="w-4 h-4" /> },
        { label: 'Tranzaksiyalar', path: '/dashboard/super-admin/transactions', icon: <CreditCard className="w-4 h-4" /> },
        { label: 'Balanslar', path: '/dashboard/super-admin/balance', icon: <TrendingUp className="w-4 h-4" /> },
        { label: 'Qarzdorlar', path: '/dashboard/super-admin/debtors', icon: <TrendingDown className="w-4 h-4" /> },
      ],
    },
    {
      label: 'Tahlil',
      items: [
        { label: 'Analitika', path: '/dashboard/super-admin/analytics', icon: <BarChart3 className="w-4 h-4" /> },
        { label: 'Hisobotlar', path: '/dashboard/super-admin/reports', icon: <FileText className="w-4 h-4" /> },
      ],
    },
    {
      label: 'Tizim',
      items: [
        { label: 'Bildirishnomalar', path: '/dashboard/super-admin/notifications', icon: <Bell className="w-4 h-4" />, badge: unreadCount || undefined },
        { label: 'Faollik jurnali', path: '/dashboard/super-admin/activity-logs', icon: <ScrollText className="w-4 h-4" /> },
        { label: 'Sozlamalar', path: '/dashboard/super-admin/settings', icon: <Settings className="w-4 h-4" /> },
      ],
    },
  ];
}
function getParentNav(unreadCount: number): NavGroup[] {
  return [
    { label: 'Umumiy', items: [{ label: 'Dashboard', path: '/dashboard/parent', icon: <LayoutDashboard className="w-4 h-4" /> }] },
    {
      label: 'Bolalarim',
      items: [
        { label: 'Bolalarim', path: '/dashboard/parent/children', icon: <Baby className="w-4 h-4" /> },
        { label: 'Uchrashuvlar', path: '/dashboard/parent/appointments', icon: <Calendar className="w-4 h-4" /> },
        { label: 'Seans tarixi', path: '/dashboard/parent/sessions', icon: <Activity className="w-4 h-4" /> },
        { label: 'Rivojlanish', path: '/dashboard/parent/progress', icon: <TrendingUp className="w-4 h-4" /> },
      ],
    },
    {
      label: 'Moliya',
      items: [
        { label: "To'lovlar", path: '/dashboard/parent/payments', icon: <Wallet className="w-4 h-4" /> },
        { label: 'Balans', path: '/dashboard/parent/balance', icon: <TrendingUp className="w-4 h-4" /> },
        { label: 'Qarz', path: '/dashboard/parent/debt', icon: <TrendingDown className="w-4 h-4" /> },
      ],
    },
    {
      label: 'Tizim',
      items: [
        { label: 'Bildirishnomalar', path: '/dashboard/parent/notifications', icon: <Bell className="w-4 h-4" />, badge: unreadCount || undefined },
        { label: 'Profilim', path: '/dashboard/parent/profile', icon: <User className="w-4 h-4" /> },
      ],
    },
  ];
}

function getSpecialistNav(unreadCount: number): NavGroup[] {
  return [
    {
      label: 'Umumiy',
      items: [
        { label: 'Dashboard', path: '/dashboard/specialist', icon: <LayoutDashboard className="w-4 h-4" /> },
      ],
    },
    {
      label: 'Klinik faoliyat',
      items: [
        { label: 'Seanslar', path: '/dashboard/specialist/sessions', icon: <Activity className="w-4 h-4" /> },
        { label: 'Uchrashuvlar', path: '/dashboard/specialist/appointments', icon: <Calendar className="w-4 h-4" /> },
        { label: 'Jadvalim', path: '/dashboard/specialist/schedule', icon: <Clock className="w-4 h-4" /> },
        { label: 'Davomat', path: '/dashboard/specialist/attendance', icon: <ClipboardList className="w-4 h-4" /> },
        { label: 'Bolalar', path: '/dashboard/specialist/children', icon: <Baby className="w-4 h-4" /> },
      ],
    },
    {
      label: 'Tashxis va rivojlanish',
      items: [
        { label: 'Baholashlar', path: '/dashboard/specialist/assessments', icon: <Stethoscope className="w-4 h-4" /> },
        { label: 'Rivojlanish', path: '/dashboard/specialist/progress', icon: <TrendingUp className="w-4 h-4" /> },
        { label: 'Maqsadlar', path: '/dashboard/specialist/goals', icon: <Target className="w-4 h-4" /> },
      ],
    },
    {
      label: 'Tizim',
      items: [
        { label: 'Bildirishnomalar', path: '/dashboard/specialist/notifications', icon: <Bell className="w-4 h-4" />, badge: unreadCount || undefined },
        { label: 'Profilim', path: '/dashboard/specialist/profile', icon: <User className="w-4 h-4" /> },
      ],
    },
  ];
}

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const { currentUser, logout } = useAuth();
  const { collapsed, toggle } = useSidebar();
  const navigate = useNavigate();
  const notifications = useStore(s => s.notifications);
  const unreadCount = notifications.filter(n => n.userId === currentUser?.id && !n.isRead).length;

  const navGroups = useMemo(() => {
    if (!currentUser) return [];
    switch (currentUser.role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return getSuperAdminNav(unreadCount);
      case 'SPECIALIST':
        return getSpecialistNav(unreadCount);
      case 'PARENT':
        return getParentNav(unreadCount);
      default: return [];
    }
  }, [currentUser, unreadCount]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn('flex items-center px-4 py-5 border-b border-warm-100', collapsed && 'justify-center px-3')}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-[10px] bg-brand-500 flex items-center justify-center flex-shrink-0">
            <Heart className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="min-w-0"
            >
              <p className="text-sm font-bold text-charcoal-900 leading-none">MASSAJ</p>
              <p className="text-[10px] text-charcoal-400 font-medium tracking-wider uppercase">CRM</p>
            </motion.div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={toggle}
            className="ml-auto p-1 rounded-[8px] text-charcoal-400 hover:text-charcoal-700 hover:bg-warm-100 transition-colors"
            aria-label="Yopish"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Collapse button when collapsed */}
      {collapsed && (
        <button
          onClick={toggle}
          className="mx-auto mt-2 p-1.5 rounded-[8px] text-charcoal-400 hover:text-charcoal-700 hover:bg-warm-100 transition-colors"
          aria-label="Kengaytirish"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Role badge */}
      {!collapsed && currentUser && (
        <div className="px-4 py-2">
          <div className="px-2 py-1 rounded-[8px] bg-brand-50 inline-flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            <span className="text-xs font-medium text-brand-700">{getRoleLabel(currentUser.role)}</span>
          </div>
        </div>
      )}

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide py-2 px-2" aria-label="Asosiy navigatsiya">
        {navGroups.map(group => (
          <div key={group.label} className="mb-1">
            {!collapsed && (
              <p className="px-2 py-1.5 text-[10px] font-semibold text-charcoal-400 uppercase tracking-wider">
                {group.label}
              </p>
            )}
            {group.items.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path.split('/').length <= 3}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-sm font-medium transition-all duration-150 relative group',
                    collapsed && 'justify-center px-2',
                    isActive
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'text-charcoal-600 hover:bg-warm-100 hover:text-charcoal-900'
                  )
                }
                title={collapsed ? item.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    <span className={cn('flex-shrink-0', isActive ? 'text-white' : 'text-charcoal-400 group-hover:text-charcoal-700')}>
                      {item.icon}
                    </span>
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {!collapsed && item.badge && item.badge > 0 && (
                      <span className={cn(
                        'ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                        isActive ? 'bg-white/20 text-white' : 'bg-brand-500 text-white'
                      )}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                    {collapsed && item.badge && item.badge > 0 && (
                      <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-brand-500" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User profile */}
      <div className={cn('border-t border-warm-100 p-3', collapsed && 'flex flex-col items-center')}>
        {currentUser && (
          <div className={cn('flex items-center gap-2.5 mb-2', collapsed && 'justify-center')}>
            <Avatar name={currentUser.fullName} src={currentUser.avatar} size="sm" />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-charcoal-900 truncate">{currentUser.fullName}</p>
                <p className="text-[10px] text-charcoal-400 truncate">{currentUser.email}</p>
              </div>
            )}
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-2 text-xs font-medium text-charcoal-500 hover:text-danger-main px-2 py-1.5 rounded-[8px] hover:bg-red-50 transition-colors w-full',
            collapsed && 'justify-center'
          )}
          aria-label="Chiqish"
        >
          <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
          {!collapsed && 'Chiqish'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:flex flex-col bg-white border-r border-warm-200 h-screen sticky top-0 overflow-hidden flex-shrink-0"
        style={{ zIndex: 40 }}
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-charcoal-900/30 backdrop-blur-sm z-40 lg:hidden"
              onClick={onMobileClose}
              aria-hidden
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed left-0 top-0 bottom-0 w-[260px] bg-white border-r border-warm-200 z-50 lg:hidden flex flex-col"
            >
              <button
                onClick={onMobileClose}
                className="absolute top-4 right-4 p-1.5 rounded-full text-charcoal-400 hover:text-charcoal-700 hover:bg-warm-100"
                aria-label="Yopish"
              >
                <X className="w-5 h-5" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
