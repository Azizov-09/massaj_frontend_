// ═══════════════════════════════════════════════════════
// Notifications Page — Modernized Senior Grade Notifications Center
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, BellOff, BellRing, CheckCheck, CreditCard,
  Calendar, Activity, ClipboardCheck, Clock, Search,
  X, Check, RotateCcw, ArrowRight, Sparkles, Filter,
  CalendarDays, Layers, Inbox
} from 'lucide-react';
import { parseISO, isToday, isYesterday, differenceInCalendarDays } from 'date-fns';
import { useStore, useAuth } from '@/store';
import { formatRelativeTime, formatDateTime, cn } from '@/utils';
import { Card, Badge, EmptyState, Select } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader, KpiCard } from '@/components/ui/KpiCard';
import type { Notification, NotificationType, UserRole } from '@/types';

type NotificationTab = 'ALL' | 'UNREAD' | 'APPOINTMENT' | 'PAYMENT' | 'SESSION' | 'ASSESSMENT' | 'SCHEDULE' | 'SYSTEM';
type ReadStatusFilter = 'ALL' | 'UNREAD' | 'READ';
type SortOrder = 'NEWEST' | 'OLDEST';

interface TypeConfig {
  label: string;
  badgeVariant: 'warning' | 'success' | 'info' | 'primary' | 'secondary' | 'neutral';
  icon: typeof Bell;
  iconBg: string;
  iconColor: string;
  borderColor: string;
}

const TYPE_CONFIG: Record<NotificationType, TypeConfig> = {
  appointment: {
    label: 'Uchrashuv',
    badgeVariant: 'warning',
    icon: Calendar,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    borderColor: 'border-amber-200/80',
  },
  payment: {
    label: "To'lov",
    badgeVariant: 'success',
    icon: CreditCard,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    borderColor: 'border-emerald-200/80',
  },
  session: {
    label: 'Seans',
    badgeVariant: 'primary',
    icon: Activity,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    borderColor: 'border-purple-200/80',
  },
  assessment: {
    label: 'Baholash',
    badgeVariant: 'info',
    icon: ClipboardCheck,
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    borderColor: 'border-teal-200/80',
  },
  schedule: {
    label: 'Jadval',
    badgeVariant: 'info',
    icon: Clock,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    borderColor: 'border-blue-200/80',
  },
  system: {
    label: 'Tizim',
    badgeVariant: 'secondary',
    icon: Bell,
    iconBg: 'bg-warm-100',
    iconColor: 'text-charcoal-700',
    borderColor: 'border-warm-200/80',
  },
};

export function NotificationsPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const notifications = useStore(s => s.notifications);
  const markRead = useStore(s => s.markNotificationRead);
  const markUnread = useStore(s => s.markNotificationUnread);
  const markAll = useStore(s => s.markAllNotificationsRead);
  const addToast = useStore(s => s.addToast);

  const [activeTab, setActiveTab] = useState<NotificationTab>('ALL');
  const [search, setSearch] = useState('');
  const [readFilter, setReadFilter] = useState<ReadStatusFilter>('ALL');
  const [sortOrder, setSortOrder] = useState<SortOrder>('NEWEST');

  // Base list filtered strictly by user role
  const userNotifs = useMemo(() => {
    return notifications
      .filter(n => n.userId === currentUser?.id || currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN');
  }, [notifications, currentUser]);

  const unreadTotal = useMemo(() => userNotifs.filter(n => !n.isRead).length, [userNotifs]);

  // Counts by category
  const categoryCounts = useMemo(() => {
    const c = {
      all: userNotifs.length,
      unread: unreadTotal,
      appointment: 0,
      payment: 0,
      session: 0,
      assessment: 0,
      schedule: 0,
      system: 0,
    };
    userNotifs.forEach(n => {
      if (n.type in c) {
        c[n.type as keyof typeof c]++;
      }
    });
    return c;
  }, [userNotifs, unreadTotal]);

  // Filtered & sorted notifications
  const filteredNotifs = useMemo(() => {
    let result = [...userNotifs];

    // Filter by active tab
    if (activeTab === 'UNREAD') {
      result = result.filter(n => !n.isRead);
    } else if (activeTab === 'APPOINTMENT') {
      result = result.filter(n => n.type === 'appointment');
    } else if (activeTab === 'PAYMENT') {
      result = result.filter(n => n.type === 'payment');
    } else if (activeTab === 'SESSION') {
      result = result.filter(n => n.type === 'session');
    } else if (activeTab === 'ASSESSMENT') {
      result = result.filter(n => n.type === 'assessment');
    } else if (activeTab === 'SCHEDULE') {
      result = result.filter(n => n.type === 'schedule');
    } else if (activeTab === 'SYSTEM') {
      result = result.filter(n => n.type === 'system');
    }

    // Filter by secondary read status
    if (readFilter === 'UNREAD') {
      result = result.filter(n => !n.isRead);
    } else if (readFilter === 'READ') {
      result = result.filter(n => n.isRead);
    }

    // Filter by search query
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q)
      );
    }

    // Sort order
    result.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === 'NEWEST' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [userNotifs, activeTab, readFilter, search, sortOrder]);

  // Group notifications into time buckets
  const timeGroups = useMemo(() => {
    const today: Notification[] = [];
    const yesterday: Notification[] = [];
    const thisWeek: Notification[] = [];
    const earlier: Notification[] = [];

    const now = new Date();

    filteredNotifs.forEach(n => {
      try {
        const d = parseISO(n.createdAt);
        if (isToday(d)) {
          today.push(n);
        } else if (isYesterday(d)) {
          yesterday.push(n);
        } else if (differenceInCalendarDays(now, d) <= 7) {
          thisWeek.push(n);
        } else {
          earlier.push(n);
        }
      } catch {
        earlier.push(n);
      }
    });

    return [
      { key: 'today', label: 'Bugungi bildirishnomalar', items: today },
      { key: 'yesterday', label: 'Kechagi bildirishnomalar', items: yesterday },
      { key: 'thisWeek', label: 'Oxirgi 7 kun', items: thisWeek },
      { key: 'earlier', label: 'Avvalgi xabarlar', items: earlier },
    ].filter(g => g.items.length > 0);
  }, [filteredNotifs]);

  // Helper to determine destination URL
  const getDestination = (notif: Notification) => {
    const role = currentUser?.role;
    const basePath = role === 'PARENT'
      ? '/dashboard/parent'
      : role === 'SPECIALIST'
      ? '/dashboard/specialist'
      : '/dashboard/super-admin';

    if (notif.relatedEntity) {
      if (notif.relatedEntity.type === 'appointment') return { path: `${basePath}/appointments`, label: "Qabullarga o'tish" };
      if (notif.relatedEntity.type === 'session') return { path: `${basePath}/sessions`, label: "Seanslarga o'tish" };
      if (notif.relatedEntity.type === 'child') return { path: `${basePath}/children`, label: "Bolalar sahifasiga" };
      if (notif.relatedEntity.type === 'payment') return { path: role === 'PARENT' ? `${basePath}/payments` : `${basePath}/transactions`, label: "To'lovlarga o'tish" };
      if (notif.relatedEntity.type === 'specialist') return { path: `${basePath}/specialists`, label: "Mutaxassisga o'tish" };
    }

    if (notif.type === 'appointment') return { path: `${basePath}/appointments`, label: "Qabullarga o'tish" };
    if (notif.type === 'session') return { path: `${basePath}/sessions`, label: "Seanslarga o'tish" };
    if (notif.type === 'payment') return { path: role === 'PARENT' ? `${basePath}/payments` : `${basePath}/transactions`, label: "Moliya bo'limiga" };
    if (notif.type === 'schedule') return { path: `${basePath}/schedule`, label: "Jadvalga o'tish" };
    if (notif.type === 'assessment') return { path: role === 'PARENT' ? `${basePath}/children` : `${basePath}/assessments`, label: "Baholashga o'tish" };

    return null;
  };

  const handleMarkAll = () => {
    markAll(currentUser?.id, currentUser?.role);
    addToast({
      type: 'success',
      title: "Barcha bildirishnomalar o'qildi",
      description: `${unreadTotal} ta yangi bildirishnoma o'qilgan deb belgilandi`,
    });
  };

  const handleNavigateToEntity = (notif: Notification) => {
    if (!notif.isRead) markRead(notif.id);
    const dest = getDestination(notif);
    if (dest) {
      navigate(dest.path);
    }
  };

  const clearAllFilters = () => {
    setActiveTab('ALL');
    setSearch('');
    setReadFilter('ALL');
    setSortOrder('NEWEST');
  };

  const hasActiveFilters = activeTab !== 'ALL' || search.trim() !== '' || readFilter !== 'ALL' || sortOrder !== 'NEWEST';

  return (
    <div className="px-4 lg:px-6 py-6 max-w-5xl mx-auto space-y-5">
      {/* Page Header */}
      <PageHeader
        icon={<Bell className="w-5 h-5 text-white" />}
        title="Bildirishnomalar"
        description={
          unreadTotal > 0
            ? `${unreadTotal} ta o‘qilmagan xabar • Jami ${userNotifs.length} ta bildirishnoma`
            : `Barcha bildirishnomalar o‘qilgan • Jami ${userNotifs.length} ta`
        }
        actions={
          unreadTotal > 0 && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<CheckCheck className="w-4 h-4 text-emerald-600" />}
              onClick={handleMarkAll}
              className="w-full sm:w-auto font-semibold shadow-xs cursor-pointer hover:bg-warm-50"
            >
              Barchasini o‘qilgan deb belgilash
            </Button>
          )
        }
      />

      {/* KPI Cards Strip — interactive click-to-filter */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        <div
          onClick={() => {
            setActiveTab('ALL');
            setReadFilter('ALL');
          }}
          className={cn(
            'cursor-pointer transition-all duration-200 rounded-[14px]',
            activeTab === 'ALL' && readFilter === 'ALL' ? 'ring-2 ring-brand-500 shadow-sm' : 'hover:scale-[1.01]'
          )}
          title="Barcha bildirishnomalarni ko'rsatish"
        >
          <KpiCard
            label="Jami xabarlar"
            value={categoryCounts.all}
            description="Barcha bildirishnomalar"
            icon={<Bell className="w-5 h-5 text-brand-600" />}
            accentColor="brand"
            index={0}
          />
        </div>

        <div
          onClick={() => {
            setActiveTab('ALL');
            setReadFilter('UNREAD');
          }}
          className={cn(
            'cursor-pointer transition-all duration-200 rounded-[14px]',
            readFilter === 'UNREAD' ? 'ring-2 ring-amber-500 shadow-sm' : 'hover:scale-[1.01]'
          )}
          title="Faqat o'qilmagan bildirishnomalar"
        >
          <KpiCard
            label="O‘qilmagan"
            value={categoryCounts.unread}
            description="Yangi bildirishnomalar"
            icon={<BellRing className="w-5 h-5 text-amber-600" />}
            accentColor="warning"
            index={1}
          />
        </div>

        <div
          onClick={() => {
            setActiveTab('APPOINTMENT');
            setReadFilter('ALL');
          }}
          className={cn(
            'cursor-pointer transition-all duration-200 rounded-[14px]',
            activeTab === 'APPOINTMENT' ? 'ring-2 ring-purple-500 shadow-sm' : 'hover:scale-[1.01]'
          )}
          title="Uchrashuvlar bo'yicha bildirishnomalar"
        >
          <KpiCard
            label="Qabullar & Jadval"
            value={categoryCounts.appointment + categoryCounts.schedule}
            description="Rejalashtirilgan qabullar"
            icon={<Calendar className="w-5 h-5 text-purple-600" />}
            accentColor="primary"
            index={2}
          />
        </div>

        <div
          onClick={() => {
            setActiveTab('PAYMENT');
            setReadFilter('ALL');
          }}
          className={cn(
            'cursor-pointer transition-all duration-200 rounded-[14px]',
            activeTab === 'PAYMENT' ? 'ring-2 ring-emerald-500 shadow-sm' : 'hover:scale-[1.01]'
          )}
          title="To'lovlar bo'yicha bildirishnomalar"
        >
          <KpiCard
            label="To‘lovlar & Moliya"
            value={categoryCounts.payment}
            description="Kirim va to'lov xabarlari"
            icon={<CreditCard className="w-5 h-5 text-emerald-600" />}
            accentColor="success"
            index={3}
          />
        </div>
      </div>

      {/* Control Card: Tabs & Search Filter Strip */}
      <Card className="p-3 sm:p-3.5 border border-warm-200/90 shadow-xs space-y-3">
        {/* Row 1: Filter Tabs (Pills) */}
        <div className="flex items-center gap-1.5 overflow-x-auto touch-scroll-x scrollbar-thin py-0.5 -mx-1 px-1">
          {[
            { key: 'ALL', label: 'Barchasi', count: categoryCounts.all },
            { key: 'UNREAD', label: 'O‘qilmagan', count: categoryCounts.unread },
            { key: 'APPOINTMENT', label: 'Uchrashuvlar', count: categoryCounts.appointment },
            { key: 'PAYMENT', label: 'To‘lovlar', count: categoryCounts.payment },
            { key: 'SESSION', label: 'Seanslar', count: categoryCounts.session },
            { key: 'ASSESSMENT', label: 'Baholash', count: categoryCounts.assessment },
            { key: 'SCHEDULE', label: 'Jadval', count: categoryCounts.schedule },
            { key: 'SYSTEM', label: 'Tizim', count: categoryCounts.system },
          ].map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as NotificationTab)}
                className={cn(
                  'shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap select-none',
                  isActive
                    ? 'bg-charcoal-900 text-white shadow-xs'
                    : 'bg-white text-charcoal-600 hover:text-charcoal-900 hover:bg-warm-100 border border-warm-200/90 shadow-2xs'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums',
                    isActive ? 'bg-white/20 text-white' : 'bg-warm-100 text-charcoal-700'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Row 2: Search input and dropdowns */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Bildirishnomalardan qidirish..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-8.5 pr-8 text-xs border border-warm-300 rounded-[10px] bg-white shadow-2xs placeholder:text-charcoal-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100/80 outline-none transition-all font-medium text-charcoal-800"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-700 p-0.5 rounded-full cursor-pointer"
                title="Qidiruvni tozalash"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Read status filter */}
          <div className="w-full sm:w-44">
            <Select
              size="sm"
              value={readFilter}
              onChange={e => setReadFilter(e.target.value as ReadStatusFilter)}
              options={[
                { value: 'ALL', label: 'Barcha holatlar' },
                { value: 'UNREAD', label: "O'qilmaganlar" },
                { value: 'READ', label: "O'qilganlar" },
              ]}
              triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300 font-medium w-full"
              aria-label="Holat bo'yicha saralash"
            />
          </div>

          {/* Sort order */}
          <div className="w-full sm:w-44">
            <Select
              size="sm"
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as SortOrder)}
              options={[
                { value: 'NEWEST', label: 'Eng yangilari oldin' },
                { value: 'OLDEST', label: 'Eng eskilari oldin' },
              ]}
              triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300 font-medium w-full"
              aria-label="Vaqt bo'yicha tartiblash"
            />
          </div>

          {/* Reset button if active */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-9 px-3 text-xs font-semibold text-charcoal-500 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
              title="Barcha filtrlarni tozalash"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Tozalash
            </Button>
          )}
        </div>
      </Card>

      {/* Main Content Area */}
      {userNotifs.length === 0 ? (
        <Card className="border border-warm-200/90 shadow-xs">
          <EmptyState
            title="Bildirishnomalar mavjud emas"
            description="Hozircha sizning hisobingiz uchun yangi bildirishnomalar kelib tushmagan."
            icon={<Bell className="w-6 h-6 text-charcoal-400" />}
            className="py-16"
          />
        </Card>
      ) : filteredNotifs.length === 0 ? (
        <Card className="border border-warm-200/90 shadow-xs p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-warm-100 flex items-center justify-center mx-auto text-charcoal-400 mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-charcoal-900 mb-1">Mos keluvchi bildirishnoma topilmadi</h3>
          <p className="text-xs text-charcoal-500 max-w-sm mx-auto mb-4">
            Qidiruv so‘rovingiz yoki tanlangan filtr parametrlariga mos bildirishnomalar mavjud emas.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={clearAllFilters}
            className="mx-auto text-xs font-semibold"
          >
            Filtrlarni bekor qilish
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {timeGroups.map(group => (
            <div key={group.key} className="space-y-3">
              {/* Group Section Header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
                    {group.label}
                  </h2>
                  <span className="text-[11px] font-semibold text-charcoal-400 bg-warm-100 px-2 py-0.5 rounded-full">
                    {group.items.length}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2.5">
                {group.items.map(notif => {
                  const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.system;
                  const Icon = cfg.icon;
                  const dest = getDestination(notif);

                  return (
                    <div
                      key={notif.id}
                      className={cn(
                        'group relative flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-[14px] border transition-all duration-200',
                        !notif.isRead
                          ? 'bg-[#fffcf9] hover:bg-[#fff9f3] border-brand-200/90 shadow-2xs'
                          : 'bg-white hover:bg-warm-50/50 border-warm-200/80 shadow-2xs'
                      )}
                    >
                      {/* Left Block: Status Indicator, Icon & Text Info */}
                      <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                        {/* Status Indicator Dot on the far left */}
                        <div className="pt-2 sm:pt-2.5 shrink-0 flex items-center justify-center">
                          {!notif.isRead ? (
                            <span className="relative flex h-2.5 w-2.5" title="O'qilmagan xabar">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500 ring-2 ring-brand-100" />
                            </span>
                          ) : (
                            <span className="w-2.5 h-2.5 rounded-full bg-transparent block" />
                          )}
                        </div>

                        {/* Type Icon Badge */}
                        <div
                          className={cn(
                            'w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105',
                            cfg.iconBg,
                            cfg.borderColor
                          )}
                        >
                          <Icon className={cn('w-5 h-5', cfg.iconColor)} />
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 min-w-0">
                          {/* Row 1: Title, Category Badge & Status Badge */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={cn('text-sm font-bold text-charcoal-900', !notif.isRead && 'text-charcoal-950 font-extrabold')}>
                              {notif.title}
                            </span>

                            <Badge variant={cfg.badgeVariant} className="text-[10px] px-1.5 py-0.2 font-semibold">
                              {cfg.label}
                            </Badge>

                            {!notif.isRead && (
                              <span className="text-[10px] font-bold text-brand-700 bg-brand-100/70 border border-brand-200/60 px-1.5 py-0.5 rounded-full">
                                Yangi
                              </span>
                            )}
                          </div>

                          {/* Row 2: Message Body */}
                          <p className="text-xs sm:text-sm text-charcoal-600 leading-relaxed mt-1 font-medium">
                            {notif.message}
                          </p>

                          {/* Row 3: Timestamp & Direct Navigation link */}
                          <div className="flex flex-wrap items-center gap-3 mt-2.5 pt-1 border-t border-warm-100/60 text-xs text-charcoal-400">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-charcoal-400 shrink-0" />
                              <span title={formatDateTime(notif.createdAt)} className="font-medium text-charcoal-500">
                                {formatRelativeTime(notif.createdAt)}
                              </span>
                            </div>

                            {/* Deep link button if applicable */}
                            {dest && (
                              <button
                                type="button"
                                onClick={() => handleNavigateToEntity(notif)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline transition-colors cursor-pointer ml-auto sm:ml-0"
                              >
                                <span>{dest.label}</span>
                                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Block: Actions */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-warm-100/60 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (notif.isRead) {
                              markUnread(notif.id);
                            } else {
                              markRead(notif.id);
                            }
                          }}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-xs font-semibold transition-all cursor-pointer select-none',
                            notif.isRead
                              ? 'bg-warm-100/80 text-charcoal-600 hover:bg-warm-200 hover:text-charcoal-900 border border-warm-200/80'
                              : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-300 shadow-2xs'
                          )}
                          title={notif.isRead ? "O'qilmagan deb belgilash" : "O'qilgan deb belgilash"}
                          aria-label={notif.isRead ? "O'qilmagan deb belgilash" : "O'qilgan deb belgilash"}
                        >
                          {notif.isRead ? (
                            <>
                              <RotateCcw className="w-3.5 h-3.5 text-charcoal-500" />
                              <span className="hidden sm:inline">O‘qilmagan qilish</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                              <span className="font-bold">O‘qildi</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
