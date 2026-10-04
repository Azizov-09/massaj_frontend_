// ═══════════════════════════════════════════════════════
//  Header — Sticky top navigation bar
// ═══════════════════════════════════════════════════════
import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, Bell, Search, ChevronDown, LogOut, User, Settings, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatRelativeTime } from '@/utils';
import { useAuth, useStore } from '@/store';
import { Avatar } from '@/components/ui/primitives';

interface HeaderProps {
  onMobileMenuOpen: () => void;
  title?: string;
  breadcrumbs?: { label: string; path?: string }[];
}

export function Header({ onMobileMenuOpen, title, breadcrumbs }: HeaderProps) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const notifications = useStore(s => s.notifications);
  const markRead = useStore(s => s.markNotificationRead);
  const markAll = useStore(s => s.markAllNotificationsRead);
  const children = useStore(s => s.children);
  const parents = useStore(s => s.parents);
  const specialists = useStore(s => s.specialists);

  const userNotifs = notifications
    .filter(n => n.userId === currentUser?.id || currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  const unreadCount = userNotifs.filter(n => !n.isRead).length;

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Search results
  const searchResults = searchQuery.length >= 2 ? (() => {
    const q = searchQuery.toLowerCase();
    if (currentUser?.role === 'PARENT') {
      return children
        .filter(c => c.parentId === currentUser.id && c.fullName.toLowerCase().includes(q))
        .slice(0, 5)
        .map(c => ({ type: 'child', label: c.fullName, id: c.id }));
    }
    if (currentUser?.role === 'SPECIALIST') {
      return [
        ...children.filter(c => c.assignedSpecialistId === currentUser.id && c.fullName.toLowerCase().includes(q)).slice(0, 3).map(c => ({ type: 'child', label: c.fullName, id: c.id })),
        ...specialists.filter(s => s.fullName.toLowerCase().includes(q)).slice(0, 2).map(s => ({ type: 'specialist', label: s.fullName, id: s.id })),
      ];
    }
    return [
      ...children.filter(c => c.fullName.toLowerCase().includes(q)).slice(0, 3).map(c => ({ type: 'child', label: c.fullName, id: c.id })),
      ...parents.filter(p => p.fullName.toLowerCase().includes(q)).slice(0, 2).map(p => ({ type: 'parent', label: p.fullName, id: p.id })),
      ...specialists.filter(s => s.fullName.toLowerCase().includes(q)).slice(0, 2).map(s => ({ type: 'specialist', label: s.fullName, id: s.id })),
    ];
  })() : [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    switch (currentUser?.role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return '/dashboard/super-admin';
      case 'SPECIALIST':
        return '/dashboard/specialist';
      case 'PARENT':
        return '/dashboard/parent';
      default:
        return '/';
    }
  };

  return (
    <header className="sticky top-0 z-40 shrink-0 bg-white/90 backdrop-blur-md border-b border-warm-200/80 px-3.5 sm:px-4 lg:px-6 h-14 flex items-center gap-2.5 sm:gap-4 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] safe-top">
      {/* Mobile menu button */}
      <button
        onClick={onMobileMenuOpen}
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-[10px] text-charcoal-700 hover:bg-warm-100 active:bg-warm-200 transition-colors cursor-pointer shrink-0"
        aria-label="Menyu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Breadcrumbs / Title */}
      <div className="flex-1 min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <>
            <nav aria-label="Joylashuv" className="hidden sm:flex items-center gap-1.5 text-sm">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-charcoal-300">/</span>}
                  {crumb.path ? (
                    <Link to={crumb.path} className="text-charcoal-400 hover:text-charcoal-700 transition-colors font-medium">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-charcoal-800 font-semibold">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
            <h1 className="sm:hidden text-sm font-bold text-charcoal-900 truncate">
              {breadcrumbs[breadcrumbs.length - 1]?.label}
            </h1>
          </>
        ) : title ? (
          <h1 className="text-sm font-bold text-charcoal-900 truncate">{title}</h1>
        ) : null}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Search */}
        <div className="relative" ref={undefined}>
          <button
            onClick={() => setSearchOpen(v => !v)}
            className="w-9 h-9 flex items-center justify-center rounded-[9px] text-charcoal-500 hover:text-charcoal-800 hover:bg-warm-100 active:bg-warm-200 transition-colors cursor-pointer"
            aria-label="Qidirish"
          >
            <Search className="w-4.5 h-4.5" />
          </button>
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-16 sm:top-full mt-2 w-auto sm:w-80 max-w-sm bg-white rounded-[14px] shadow-[0_10px_40px_-8px_rgb(0_0_0/0.12)] border border-warm-200 overflow-hidden z-50"
              >
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-warm-100">
                  <Search className="w-4 h-4 text-charcoal-400 flex-shrink-0" />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Qidirish..."
                    className="flex-1 text-sm outline-none bg-transparent text-charcoal-900 placeholder:text-charcoal-400"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-charcoal-300 hover:text-charcoal-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {searchResults.length > 0 ? (
                  <div className="py-1">
                    {searchResults.map((r, i) => (
                      <button
                        key={i}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-warm-50 text-left transition-colors"
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery('');
                          const basePath = getDashboardPath();
                          if (r.type === 'child') navigate(`${basePath}/children`);
                          else if (r.type === 'parent') navigate(`${basePath}/parents`);
                          else if (r.type === 'specialist') navigate(`${basePath}/specialists`);
                        }}
                      >
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-[6px] bg-brand-100 text-brand-700 uppercase">
                          {r.type === 'child' ? 'Bola' : r.type === 'parent' ? 'Ota-ona' : 'Mutaxassis'}
                        </span>
                        <span className="text-sm text-charcoal-800">{r.label}</span>
                      </button>
                    ))}
                  </div>
                ) : searchQuery.length >= 2 ? (
                  <p className="px-3 py-4 text-sm text-charcoal-400 text-center">Hech narsa topilmadi</p>
                ) : (
                  <p className="px-3 py-3 text-xs text-charcoal-400">Qidirish uchun yozing...</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(v => !v)}
            className="relative p-2 rounded-[8px] text-charcoal-500 hover:text-charcoal-800 hover:bg-warm-100 transition-colors"
            aria-label={`Bildirishnomalar${unreadCount > 0 ? `, ${unreadCount} o'qilmagan` : ''}`}
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-brand-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-16 sm:top-full mt-2 w-auto sm:w-80 max-w-sm bg-white/98 backdrop-blur-md rounded-2xl shadow-[0_16px_40px_-6px_rgba(24,24,27,0.14),0_6px_16px_-4px_rgba(24,24,27,0.06)] border border-warm-200/90 overflow-hidden z-50"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-warm-100">
                  <span className="text-sm font-semibold text-charcoal-900">Bildirishnomalar</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAll(currentUser?.id, currentUser?.role)}
                      className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                    >
                      Barchasini o'qildi deb belgilash
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {userNotifs.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-charcoal-400 text-center">Bildirishnomalar yo'q</p>
                  ) : (
                    userNotifs.map(notif => (
                      <button
                        key={notif.id}
                        onClick={() => markRead(notif.id)}
                        className={cn(
                          'w-full flex items-start gap-3 px-4 py-3 hover:bg-warm-50 text-left border-b border-warm-50 transition-colors',
                          !notif.isRead && 'bg-brand-50/50'
                        )}
                      >
                        <div className={cn('w-2 h-2 rounded-full mt-2 flex-shrink-0', notif.isRead ? 'bg-warm-200' : 'bg-brand-500')} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-charcoal-900">{notif.title}</p>
                          <p className="text-xs text-charcoal-500 mt-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-[10px] text-charcoal-400 mt-1">{formatRelativeTime(notif.createdAt)}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <div className="px-4 py-2.5 border-t border-warm-100">
                  <Link
                    to={`${getDashboardPath()}/notifications`}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                    onClick={() => setNotifOpen(false)}
                  >
                    Barcha bildirishnomalarni ko'rish →
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(v => !v)}
            className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-[10px] hover:bg-warm-100 transition-colors"
            aria-expanded={profileOpen}
            aria-haspopup="menu"
          >
            {currentUser && <Avatar name={currentUser.fullName} src={currentUser.avatar} size="xs" />}
            <span className="hidden sm:block text-sm font-medium text-charcoal-800 max-w-[120px] truncate">
              {currentUser?.fullName}
            </span>
            <ChevronDown className={cn('w-3.5 h-3.5 text-charcoal-400 transition-transform duration-200', profileOpen && 'rotate-180')} />
          </button>
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                role="menu"
                className="absolute right-0 top-full mt-2 w-52 bg-white/98 backdrop-blur-md rounded-2xl shadow-[0_16px_40px_-6px_rgba(24,24,27,0.14),0_6px_16px_-4px_rgba(24,24,27,0.06)] border border-warm-200/90 p-1.5 overflow-hidden z-50 space-y-0.5"
              >
                <div className="px-3 py-2 border-b border-warm-100/80 mb-1">
                  <p className="text-xs font-bold text-charcoal-900 truncate">{currentUser?.fullName}</p>
                  <p className="text-[10px] text-charcoal-400 truncate">{currentUser?.email}</p>
                </div>
                <Link
                  to={`${getDashboardPath()}/profile`}
                  role="menuitem"
                  className="flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm font-medium text-charcoal-700 hover:bg-warm-100/70 hover:text-charcoal-900 rounded-xl transition-all"
                  onClick={() => setProfileOpen(false)}
                >
                  <User className="w-3.5 h-3.5 text-charcoal-500" /> Profil
                </Link>
                <Link
                  to={`${getDashboardPath()}/settings`}
                  role="menuitem"
                  className="flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm font-medium text-charcoal-700 hover:bg-warm-100/70 hover:text-charcoal-900 rounded-xl transition-all"
                  onClick={() => setProfileOpen(false)}
                >
                  <Settings className="w-3.5 h-3.5 text-charcoal-500" /> Sozlamalar
                </Link>
                <div className="border-t border-warm-100/80 mt-1 pt-1">
                  <button
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl transition-all w-full text-left cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Chiqish
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
