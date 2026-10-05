// ═══════════════════════════════════════════════════════
//  Appointments Page — Full CRUD with status workflow
// ═══════════════════════════════════════════════════════
import { useState, useMemo } from 'react';
import {
  Plus, Search, Calendar, CheckCircle2, XCircle, Play, UserX, X,
  Clock, Eye, Users, CheckCheck, Phone, ArrowRight, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useStore, useAuth } from '@/store';
import {
  formatDate, getAppointmentStatusColor, getAppointmentStatusLabel, cn
} from '@/utils';
import { differenceInYears, parseISO, format, addDays, subDays } from 'date-fns';
import { DataTable, Column, getAvatarGradient } from '@/components/tables/DataTable';
import { Card, Avatar, Badge, Select, DatePicker } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { PageHeader, KpiCard } from '@/components/ui/KpiCard';
import { CreateAppointmentForm } from './CreateAppointmentForm';
import type { Appointment, AppointmentStatus } from '@/types';

type StatusTabKey = 'ALL' | 'TODAY' | 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export function AppointmentsPage() {
  const appointments = useStore(s => s.appointments);
  const children = useStore(s => s.children);
  const parents = useStore(s => s.parents);
  const specialists = useStore(s => s.specialists);
  const services = useStore(s => s.services);
  const confirmAppointment = useStore(s => s.confirmAppointment);
  const cancelAppointment = useStore(s => s.cancelAppointment);
  const markNoShow = useStore(s => s.markNoShow);
  const startSession = useStore(s => s.startSession);
  const { currentUser } = useAuth();

  const isParent = currentUser?.role === 'PARENT';
  const isSpecialist = currentUser?.role === 'SPECIALIST';

  const myChildIds = useMemo(() => {
    if (isParent && currentUser) {
      return children.filter(c => c.parentId === currentUser.id).map(c => c.id);
    }
    return [];
  }, [children, isParent, currentUser]);

  const baseAppointments = useMemo(() => {
    if (isParent && currentUser) {
      return appointments.filter(a => a.parentId === currentUser.id || myChildIds.includes(a.childId));
    }
    if (isSpecialist && currentUser) {
      return appointments.filter(a => a.specialistId === currentUser.id);
    }
    return appointments;
  }, [appointments, isParent, isSpecialist, currentUser, myChildIds]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filter states
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<StatusTabKey>('ALL');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [specialistFilter, setSpecialistFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');

  // Dialog & Modal states
  const [showCreate, setShowCreate] = useState(false);
  const [viewingAppointmentId, setViewingAppointmentId] = useState<string | null>(null);
  const [actionTarget, setActionTarget] = useState<{ id: string; action: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Active appointment for modal view
  const viewingAppointment = useMemo(() => {
    if (!viewingAppointmentId) return null;
    return appointments.find(a => a.id === viewingAppointmentId) ?? null;
  }, [appointments, viewingAppointmentId]);

  // Counts for KPI & Tabs
  const counts = useMemo(() => {
    return {
      all: baseAppointments.length,
      today: baseAppointments.filter(a => a.date === todayStr).length,
      pending: baseAppointments.filter(a => ['SCHEDULED', 'CONFIRMED'].includes(a.status)).length,
      completed: baseAppointments.filter(a => a.status === 'COMPLETED').length,
      cancelled: baseAppointments.filter(a => a.status === 'CANCELLED').length,
      noShow: baseAppointments.filter(a => a.status === 'NO_SHOW').length,
    };
  }, [baseAppointments, todayStr]);

  // Filtered dataset
  const filtered = useMemo(() => {
    let result = [...baseAppointments].sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`));

    // Quick status tab
    if (statusTab === 'TODAY') {
      result = result.filter(a => a.date === todayStr);
    } else if (statusTab === 'PENDING') {
      result = result.filter(a => ['SCHEDULED', 'CONFIRMED'].includes(a.status));
    } else if (statusTab === 'COMPLETED') {
      result = result.filter(a => a.status === 'COMPLETED');
    } else if (statusTab === 'CANCELLED') {
      result = result.filter(a => a.status === 'CANCELLED');
    } else if (statusTab === 'NO_SHOW') {
      result = result.filter(a => a.status === 'NO_SHOW');
    }

    // Specific status dropdown
    if (statusFilter) {
      result = result.filter(a => a.status === statusFilter);
    }

    // Date filter
    if (dateFilter) {
      result = result.filter(a => a.date === dateFilter);
    }

    // Specialist filter
    if (specialistFilter) {
      result = result.filter(a => a.specialistId === specialistFilter);
    }

    // Service filter
    if (serviceFilter) {
      result = result.filter(a => a.serviceId === serviceFilter);
    }

    // Comprehensive text search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(a => {
        const child = children.find(c => c.id === a.childId);
        const spec = specialists.find(s => s.id === a.specialistId);
        const parent = parents.find(p => p.id === a.parentId || (child && p.childrenIds?.includes(child.id)));
        const svc = services.find(s => s.id === a.serviceId);

        const matchChild = child?.fullName?.toLowerCase().includes(q);
        const matchSpec = spec?.fullName?.toLowerCase().includes(q);
        const matchParent = parent?.fullName?.toLowerCase().includes(q) || parent?.phone?.toLowerCase().includes(q);
        const matchService = svc?.name?.toLowerCase().includes(q);
        return Boolean(matchChild || matchSpec || matchParent || matchService);
      });
    }

    return result;
  }, [baseAppointments, statusTab, statusFilter, dateFilter, specialistFilter, serviceFilter, search, todayStr, children, specialists, parents, services]);

  const hasActiveFilters = Boolean(
    search || statusTab !== 'ALL' || statusFilter || dateFilter || specialistFilter || serviceFilter
  );

  const resetAllFilters = () => {
    setSearch('');
    setStatusTab('ALL');
    setStatusFilter('');
    setDateFilter('');
    setSpecialistFilter('');
    setServiceFilter('');
  };

  const handlePrevDay = () => {
    const current = dateFilter ? parseISO(dateFilter) : new Date();
    const prev = format(subDays(current, 1), 'yyyy-MM-dd');
    setDateFilter(prev);
    if (statusTab === 'TODAY' && prev !== todayStr) setStatusTab('ALL');
  };

  const handleNextDay = () => {
    const current = dateFilter ? parseISO(dateFilter) : new Date();
    const next = format(addDays(current, 1), 'yyyy-MM-dd');
    setDateFilter(next);
    if (statusTab === 'TODAY' && next !== todayStr) setStatusTab('ALL');
  };

  const handleToday = () => {
    setDateFilter(todayStr);
    setStatusTab('TODAY');
  };

  const handleKpiClick = (tab: StatusTabKey) => {
    if (statusTab === tab) {
      setStatusTab('ALL');
    } else {
      setStatusTab(tab);
      if (tab === 'TODAY') setDateFilter('');
      else if (dateFilter === todayStr) setDateFilter('');
    }
  };

  const handleAction = async () => {
    if (!actionTarget) return;
    setActionLoading(true);
    try {
      if (actionTarget.action === 'confirm') confirmAppointment(actionTarget.id);
      if (actionTarget.action === 'cancel') cancelAppointment(actionTarget.id);
      if (actionTarget.action === 'noshow') markNoShow(actionTarget.id);
      if (actionTarget.action === 'start') startSession(actionTarget.id);
    } catch (err: unknown) {
      console.error('Appointment action error:', err);
    } finally {
      setActionLoading(false);
      setActionTarget(null);
    }
  };

  const columns: Column<Appointment>[] = [
    {
      key: 'childId',
      header: 'Bola',
      sortable: true,
      className: 'py-3.5',
      cell: (row) => {
        const child = children.find(c => c.id === row.childId);
        const parent = parents.find(p => p.id === row.parentId || (child && p.childrenIds?.includes(child.id)));
        const childAge = child?.dateOfBirth ? differenceInYears(new Date(), parseISO(child.dateOfBirth)) : null;

        return child ? (
          <div className="flex items-center gap-3">
            <Avatar name={child.fullName} size="sm" className="ring-2 ring-warm-100 shadow-2xs shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-semibold text-charcoal-900 truncate">
                  {child.fullName}
                </span>
                {childAge !== null && (
                  <span className="text-[10px] font-semibold text-charcoal-600 bg-warm-100/90 border border-warm-200/80 px-1.5 py-0.5 rounded-[4px] shrink-0">
                    {childAge} yosh
                  </span>
                )}
              </div>
              <p className="text-xs text-charcoal-500 truncate flex items-center gap-1 mt-0.5">
                {parent ? (
                  <>
                    <span className="truncate">{parent.fullName}</span>
                    {parent.phone && <span className="text-charcoal-400 font-mono text-[11px] shrink-0">• {parent.phone}</span>}
                  </>
                ) : (
                  <span className="text-charcoal-400 italic text-[11px]">Ota-ona biriktirilmagan</span>
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-charcoal-400 text-xs">
            <UserX className="w-4 h-4" />
            <span>Bola topilmadi</span>
          </div>
        );
      },
    },
    {
      key: 'specialistId',
      header: 'Mutaxassis',
      sortable: true,
      className: 'py-3.5',
      cell: (row) => {
        const spec = specialists.find(s => s.id === row.specialistId);
        return spec ? (
          <div className="flex items-center gap-2.5">
            <Avatar name={spec.fullName} size="xs" className="ring-1 ring-warm-200 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-charcoal-900 truncate">{spec.fullName}</p>
              <p className="text-[11px] text-charcoal-500 truncate font-medium">{spec.specialization || 'Mutaxassis'}</p>
            </div>
          </div>
        ) : (
          <span className="text-charcoal-400 text-xs">—</span>
        );
      },
    },
    {
      key: 'serviceId',
      header: 'Xizmat turi',
      sortable: true,
      className: 'py-3.5',
      cell: (row) => {
        const svc = services.find(s => s.id === row.serviceId);
        return svc ? (
          <div>
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-[6px] bg-brand-50 text-brand-800 border border-brand-200/80 text-xs font-semibold shadow-2xs">
              <span className="truncate max-w-[190px]">{svc.name}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-charcoal-500 font-medium mt-1">
              <span>{svc.durationMinutes} daq</span>
              {svc.price > 0 && <span>• <strong className="text-charcoal-700 font-semibold">{svc.price.toLocaleString()} so'm</strong></span>}
            </div>
          </div>
        ) : (
          <span className="text-charcoal-400 text-xs">—</span>
        );
      },
    },
    {
      key: 'date',
      header: 'Sana va vaqt',
      sortable: true,
      className: 'py-3.5',
      cell: (row) => {
        const isCurrentDate = row.date === todayStr;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-charcoal-900">
              <Calendar className="w-3.5 h-3.5 text-brand-600 shrink-0" />
              <span>{formatDate(row.date)}</span>
              {isCurrentDate && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] bg-emerald-100 text-emerald-700 border border-emerald-200 shrink-0">
                  Bugun
                </span>
              )}
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-700 bg-warm-100/90 px-2 py-0.5 rounded-[6px] border border-warm-200/80">
              <Clock className="w-3 h-3 text-charcoal-400 shrink-0" />
              <span>{row.startTime} – {row.endTime}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Holat',
      sortable: true,
      className: 'py-3.5',
      cell: (row) => (
        <Badge className={cn('shadow-2xs font-semibold text-xs', getAppointmentStatusColor(row.status))} dot>
          {getAppointmentStatusLabel(row.status)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Amallar',
      headerClassName: 'text-right pr-4',
      width: isParent ? '110px' : '180px',
      className: 'py-3.5 text-right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          {/* Details Eye Button */}
          <button
            type="button"
            onClick={() => setViewingAppointmentId(row.id)}
            className="p-1.5 rounded-[8px] text-charcoal-500 hover:text-charcoal-900 hover:bg-warm-100 border border-transparent hover:border-warm-200 transition-all cursor-pointer"
            title="Batafsil ko'rish"
            aria-label="Batafsil ko'rish"
          >
            <Eye className="w-4 h-4" />
          </button>

          {!isParent && row.status === 'SCHEDULED' && (
            <button
              type="button"
              onClick={() => setActionTarget({ id: row.id, action: 'confirm' })}
              className="p-1.5 rounded-[8px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition-all cursor-pointer shadow-2xs"
              title="Tasdiqlash"
              aria-label="Tasdiqlash"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}

          {!isParent && ['SCHEDULED', 'CONFIRMED'].includes(row.status) && (
            <button
              type="button"
              onClick={() => setActionTarget({ id: row.id, action: 'start' })}
              className="p-1.5 rounded-[8px] text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200/80 transition-all cursor-pointer shadow-2xs"
              title="Seans boshlash"
              aria-label="Seans boshlash"
            >
              <Play className="w-4 h-4" />
            </button>
          )}

          {['SCHEDULED', 'CONFIRMED'].includes(row.status) && (
            <button
              type="button"
              onClick={() => setActionTarget({ id: row.id, action: 'cancel' })}
              className="p-1.5 rounded-[8px] text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-all cursor-pointer shadow-2xs"
              title="Bekor qilish"
              aria-label="Bekor qilish"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}

          {!isParent && ['SCHEDULED', 'CONFIRMED'].includes(row.status) && (
            <button
              type="button"
              onClick={() => setActionTarget({ id: row.id, action: 'noshow' })}
              className="p-1.5 rounded-[8px] text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 transition-all cursor-pointer shadow-2xs"
              title="Kelmagan deb belgilash"
              aria-label="Kelmagan deb belgilash"
            >
              <UserX className="w-4 h-4" />
            </button>
          )}

          {row.status === 'COMPLETED' && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50/80 px-2 py-1 rounded-[6px] border border-emerald-200/60 select-none">
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Bajarildi</span>
            </span>
          )}

          {row.status === 'CANCELLED' && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50/80 px-2 py-1 rounded-[6px] border border-rose-200/60 select-none">
              <span>Bekor</span>
            </span>
          )}

          {row.status === 'NO_SHOW' && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-charcoal-500 bg-warm-100/80 px-2 py-1 rounded-[6px] border border-warm-200/80 select-none">
              <span>Kelmagan</span>
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-5">
      <PageHeader
        icon={<Calendar className="w-5 h-5 text-white" />}
        title={isParent ? "Farzandlarim qabullari" : isSpecialist ? "Mening qabullarim" : "Uchrashuvlar"}
        description={
          isParent
            ? `Jami ${baseAppointments.length} ta uchrashuv qayd etilgan`
            : isSpecialist
            ? `Sizga biriktirilgan ${baseAppointments.length} ta uchrashuv`
            : `Jami ${appointments.length} ta uchrashuv`
        }
        actions={
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)} className="w-full sm:w-auto">
            {isParent ? "Qabulga yozilish" : "Uchrashuv qo'shish"}
          </Button>
        }
      />

      {/* KPI Cards Strip (Interactive click-to-filter, hidden on mobile for clean list view) */}
      <div className="hidden md:grid md:grid-cols-4 gap-3.5">
        <div
          onClick={() => handleKpiClick('TODAY')}
          className={cn(
            'cursor-pointer transition-all duration-200 rounded-[14px]',
            statusTab === 'TODAY' ? 'ring-2 ring-brand-500 shadow-sm' : 'hover:scale-[1.01]'
          )}
          title="Bugungi uchrashuvlar bo'yicha filtrlash"
        >
          <KpiCard
            label="Bugun"
            value={counts.today}
            description="Bugungi uchrashuvlar"
            icon={<Calendar className="w-5 h-5 text-brand-600" />}
            accentColor="brand"
            index={0}
          />
        </div>
        <div
          onClick={() => handleKpiClick('PENDING')}
          className={cn(
            'cursor-pointer transition-all duration-200 rounded-[14px]',
            statusTab === 'PENDING' ? 'ring-2 ring-amber-500 shadow-sm' : 'hover:scale-[1.01]'
          )}
          title="Kutilayotgan qabullar bo'yicha filtrlash"
        >
          <KpiCard
            label="Kutilmoqda"
            value={counts.pending}
            description="Rejadagi qabullar"
            icon={<Clock className="w-5 h-5 text-amber-600" />}
            accentColor="gold"
            index={1}
          />
        </div>
        <div
          onClick={() => handleKpiClick('COMPLETED')}
          className={cn(
            'cursor-pointer transition-all duration-200 rounded-[14px]',
            statusTab === 'COMPLETED' ? 'ring-2 ring-emerald-500 shadow-sm' : 'hover:scale-[1.01]'
          )}
          title="Yakunlangan seanslar bo'yicha filtrlash"
        >
          <KpiCard
            label="Yakunlangan"
            value={counts.completed}
            description="Muvaffaqiyatli seanslar"
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            accentColor="sage"
            index={2}
          />
        </div>
        <div
          onClick={() => handleKpiClick('CANCELLED')}
          className={cn(
            'cursor-pointer transition-all duration-200 rounded-[14px]',
            statusTab === 'CANCELLED' ? 'ring-2 ring-rose-500 shadow-sm' : 'hover:scale-[1.01]'
          )}
          title="Bekor qilingan qabullar bo'yicha filtrlash"
        >
          <KpiCard
            label="Bekor qilingan"
            value={counts.cancelled}
            description="Bekor qilingan qabullar"
            icon={<XCircle className="w-5 h-5 text-rose-600" />}
            accentColor="danger"
            index={3}
          />
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="overflow-visible border border-warm-200/90 shadow-xs">
        {/* Top Status Tabs — Desktop/tablet filter pills */}
        <div className="hidden sm:flex px-4 py-3 bg-warm-50/70 border-b border-warm-200/80 items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto touch-scroll-x scrollbar-thin py-0.5 w-full sm:w-auto -mx-0.5 px-0.5">
            {[
              { key: 'ALL', label: 'Barchasi', count: counts.all },
              { key: 'TODAY', label: 'Bugun', count: counts.today },
              { key: 'PENDING', label: 'Kutilmoqda', count: counts.pending },
              { key: 'COMPLETED', label: 'Yakunlangan', count: counts.completed },
              { key: 'CANCELLED', label: 'Bekor qilingan', count: counts.cancelled },
              { key: 'NO_SHOW', label: 'Kelmagan', count: counts.noShow },
            ].map(tab => {
              const isActive = statusTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={(e) => {
                    setStatusTab(tab.key as StatusTabKey);
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
                  }}
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

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <span className="text-xs font-medium text-charcoal-500 bg-white px-2.5 py-1 rounded-[8px] border border-warm-200/80 shadow-2xs">
              Ko‘rsatilmoqda: <strong className="text-charcoal-900 font-bold">{filtered.length}</strong> / {baseAppointments.length}
            </span>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="p-3 sm:p-3.5 bg-white border-b border-warm-100 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5">
          {/* 1. Date Controls (Eng tepada xuddi davomatlardagi kabi) */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleToday}
              className="h-9 px-3 rounded-[10px] text-xs font-semibold text-charcoal-700 bg-white border border-warm-300 hover:bg-warm-50 shadow-2xs shrink-0 cursor-pointer"
            >
              Bugun
            </Button>
            <div className="flex items-center bg-white border border-warm-300 rounded-[10px] shadow-2xs hover:border-warm-400 transition-colors h-9 flex-1 sm:flex-initial">
              <button
                type="button"
                onClick={handlePrevDay}
                className="h-full px-2.5 flex items-center justify-center text-charcoal-500 hover:text-charcoal-800 hover:bg-warm-100 rounded-l-[9px] transition-colors cursor-pointer shrink-0"
                title="Oldingi kun"
                aria-label="Oldingi kun"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="w-full sm:w-36 border-x border-warm-200 flex-1 sm:flex-initial">
                <DatePicker
                  size="sm"
                  value={dateFilter}
                  onChange={e => {
                    const val = e.target.value;
                    setDateFilter(val);
                    if (val === todayStr) setStatusTab('TODAY');
                    else if (statusTab === 'TODAY' && val !== todayStr) setStatusTab('ALL');
                  }}
                  clearable={true}
                  placeholder="Sana bo'yicha..."
                  aria-label="Sana bo'yicha filter"
                  triggerClassName="border-0 shadow-none rounded-none py-1.5 focus:ring-0 bg-transparent text-center font-semibold text-xs text-charcoal-800 w-full"
                />
              </div>
              <button
                type="button"
                onClick={handleNextDay}
                className="h-full px-2.5 flex items-center justify-center text-charcoal-500 hover:text-charcoal-800 hover:bg-warm-100 rounded-r-[9px] transition-colors cursor-pointer shrink-0"
                title="Keyingi kun"
                aria-label="Keyingi kun"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {dateFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDateFilter('');
                  if (statusTab === 'TODAY') setStatusTab('ALL');
                }}
                className="h-9 px-2 rounded-[10px] text-xs font-semibold text-charcoal-500 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                title="Barcha sanalarni ko'rsatish"
              >
                Barchasi
              </Button>
            )}
          </div>

          {/* 2. Search Input */}
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isParent ? "Farzand yoki mutaxassis..." : isSpecialist ? "Bola yoki ota-ona..." : "Bola, ota-ona yoki mutaxassis..."}
              className="w-full h-9 pl-9 pr-8 text-xs border border-warm-300 rounded-[10px] bg-white shadow-2xs placeholder:text-charcoal-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100/80 outline-none transition-all font-medium text-charcoal-800"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-700 p-0.5 rounded-full cursor-pointer"
                title="Qidiruvni tozalash"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5 w-full sm:w-auto">
            {/* Status Filter (Mobile only: on desktop, pills tab bar handles status) */}
            <div className="sm:hidden w-full">
              <Select
                size="sm"
                triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300 font-medium w-full"
                value={statusTab}
                onChange={e => setStatusTab(e.target.value as StatusTabKey)}
                options={[
                  { value: 'ALL', label: `Barcha qabullar (${counts.all})` },
                  { value: 'TODAY', label: `Bugun (${counts.today})` },
                  { value: 'PENDING', label: `Kutilmoqda (${counts.pending})` },
                  { value: 'COMPLETED', label: `Yakunlangan (${counts.completed})` },
                  { value: 'CANCELLED', label: `Bekor qilingan (${counts.cancelled})` },
                  { value: 'NO_SHOW', label: `Kelmagan (${counts.noShow})` },
                ]}
                aria-label="Holat bo'yicha filter"
              />
            </div>

            {/* Specialist & Service Filters — 2-column grid on mobile to save vertical space */}
            <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto">
              {/* Specialist Filter (for admin/parent) */}
              {!isSpecialist && (
                <div className="w-full sm:w-52">
                  <Select
                    size="sm"
                    triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300 font-medium w-full"
                    value={specialistFilter}
                    onChange={e => setSpecialistFilter(e.target.value)}
                    options={[
                      { value: '', label: 'Barcha mutaxassislar' },
                      ...specialists.map(s => ({ value: s.id, label: s.fullName })),
                    ]}
                    aria-label="Mutaxassis bo'yicha filter"
                  />
                </div>
              )}

              {/* Service Filter */}
              <div className={cn("w-full sm:w-48", isSpecialist && "col-span-2 sm:col-span-1")}>
                <Select
                  size="sm"
                  triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300 font-medium w-full"
                  value={serviceFilter}
                  onChange={e => setServiceFilter(e.target.value)}
                  options={[
                    { value: '', label: 'Barcha xizmatlar' },
                    ...services.map(s => ({ value: s.id, label: s.name })),
                  ]}
                  aria-label="Xizmat bo'yicha filter"
                />
              </div>
            </div>

            {/* Reset Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-[10px] text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-colors shadow-2xs cursor-pointer w-full sm:w-auto ml-auto sm:ml-0"
                title="Barcha filtrlarni bekor qilish"
              >
                <X className="w-3.5 h-3.5" />
                <span>Tozalash</span>
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={r => r.id}
          tableClassName="min-w-[880px]"
          onRowClick={row => setViewingAppointmentId(row.id)}
          mobileCardConfig={(row, index) => {
            const child = children.find(c => c.id === row.childId);
            const spec = specialists.find(s => s.id === row.specialistId);
            const parent = child ? parents.find(p => p.id === child.parentId) : null;
            const svc = services.find(s => s.id === row.serviceId);
            const initials = child?.fullName
              ? child.fullName.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
              : 'U';

            return {
              avatarText: initials,
              avatarGradient: getAvatarGradient(index, child?.fullName),
              title: child?.fullName || "Noma'lum bola",
              subtitle: `${row.startTime} – ${row.endTime} • ${formatDate(row.date)}`,
              status: (
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                  getAppointmentStatusColor(row.status)
                )}>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-current" />
                  {getAppointmentStatusLabel(row.status)}
                </span>
              ),
              details: [
                {
                  label: 'Mutaxassis',
                  value: spec ? `${spec.fullName} (${spec.specialization || 'Mutaxassis'})` : 'Biriktirilmagan'
                },
                {
                  label: 'Xizmat',
                  value: svc ? `${svc.name} (${svc.durationMinutes} daq)` : 'Xizmat'
                },
                {
                  label: 'Ota-ona',
                  value: parent ? `${parent.fullName} ${parent.phone ? `(${parent.phone})` : ''}` : 'Biriktirilmagan'
                },
                {
                  label: 'Narxi',
                  value: svc?.price ? `${svc.price.toLocaleString()} so'm` : '0 so\'m'
                }
              ],
              actions: (
                <div className="flex flex-wrap items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => setViewingAppointmentId(row.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-warm-200 bg-white text-charcoal-700 text-xs font-medium hover:bg-warm-50 active:bg-warm-100 shadow-2xs cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-charcoal-500" />
                    Batafsil
                  </button>
                  {!isParent && row.status === 'SCHEDULED' && (
                    <button
                      type="button"
                      onClick={() => setActionTarget({ id: row.id, action: 'confirm' })}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 shadow-2xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Tasdiqlash
                    </button>
                  )}
                  {!isParent && ['SCHEDULED', 'CONFIRMED'].includes(row.status) && (
                    <button
                      type="button"
                      onClick={() => setActionTarget({ id: row.id, action: 'start' })}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-brand-200 bg-brand-50 text-brand-700 text-xs font-medium hover:bg-brand-100 shadow-2xs cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Boshlash
                    </button>
                  )}
                  {['SCHEDULED', 'CONFIRMED'].includes(row.status) && (
                    <button
                      type="button"
                      onClick={() => setActionTarget({ id: row.id, action: 'cancel' })}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs font-medium hover:bg-rose-100 shadow-2xs cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Bekor qilish
                    </button>
                  )}
                </div>
              )
            };
          }}
          emptyTitle="Uchrashuvlar topilmadi"
          emptyDescription={hasActiveFilters ? "Kiritilgan filtr parametrlariga mos keluvchi uchrashuvlar topilmadi." : "Hozircha hech qanday uchrashuv mavjud emas."}
          emptyIcon={<Calendar className="w-6 h-6 text-charcoal-400" />}
          emptyAction={
            hasActiveFilters ? (
              <Button size="sm" variant="secondary" onClick={resetAllFilters} leftIcon={<X className="w-3.5 h-3.5" />}>
                Filtrlarni tozalash
              </Button>
            ) : (
              <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowCreate(true)}>
                Uchrashuv qo'shish
              </Button>
            )
          }
        />

        {/* Table Summary Footer */}
        <div className="px-4 py-3 bg-warm-50/50 border-t border-warm-100 flex flex-wrap items-center justify-between gap-3 text-xs text-charcoal-500">
          <div className="flex items-center gap-4 flex-wrap">
            <span>Jami: <strong className="text-charcoal-800 font-bold">{baseAppointments.length}</strong></span>
            <span className="hidden sm:inline-block text-warm-300">•</span>
            <span className="text-emerald-700 font-medium">Yakunlangan: <strong className="font-bold">{counts.completed}</strong></span>
            <span className="hidden sm:inline-block text-warm-300">•</span>
            <span className="text-amber-700 font-medium">Kutilmoqda: <strong className="font-bold">{counts.pending}</strong></span>
            <span className="hidden sm:inline-block text-warm-300">•</span>
            <span className="text-rose-600 font-medium">Bekor qilingan: <strong className="font-bold">{counts.cancelled}</strong></span>
          </div>
          <span className="text-[11px] text-charcoal-400 font-medium">
            Ko'rish uchun qator ustiga bosing
          </span>
        </div>
      </Card>

      {/* Appointment Details Modal */}
      <Modal
        isOpen={!!viewingAppointmentId}
        onClose={() => setViewingAppointmentId(null)}
        title="Uchrashuv tafsilotlari"
        size="md"
      >
        {viewingAppointment && (() => {
          const child = children.find(c => c.id === viewingAppointment.childId);
          const spec = specialists.find(s => s.id === viewingAppointment.specialistId);
          const svc = services.find(s => s.id === viewingAppointment.serviceId);
          const parent = parents.find(p => p.id === viewingAppointment.parentId || (child && p.childrenIds?.includes(child.id)));
          const childAge = child?.dateOfBirth ? differenceInYears(new Date(), parseISO(child.dateOfBirth)) : null;

          return (
            <div className="space-y-4">
              {/* Header card with status & date */}
              <div className="p-3.5 rounded-[12px] bg-warm-50 border border-warm-200/80 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-[8px] bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-charcoal-900">{formatDate(viewingAppointment.date)}</p>
                    <p className="text-[11px] text-charcoal-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{viewingAppointment.startTime} – {viewingAppointment.endTime}</span>
                    </p>
                  </div>
                </div>
                <Badge className={cn('font-semibold shadow-2xs text-xs', getAppointmentStatusColor(viewingAppointment.status))} dot>
                  {getAppointmentStatusLabel(viewingAppointment.status)}
                </Badge>
              </div>

              {/* Child Info Card */}
              <div className="p-3.5 rounded-[12px] border border-warm-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider">Bola ma'lumotlari</span>
                  {childAge !== null && (
                    <span className="text-xs font-semibold text-charcoal-600 bg-warm-100 px-2 py-0.5 rounded-[6px]">
                      {childAge} yosh
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Avatar name={child?.fullName || "Bola"} size="md" className="ring-2 ring-warm-100" />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-charcoal-900">{child?.fullName || "Noma'lum bola"}</h4>
                    {child?.diagnosis && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200/70 inline-block px-1.5 py-0.5 rounded mt-0.5 font-medium">
                        Tashxis: {child.diagnosis}
                      </p>
                    )}
                  </div>
                </div>

                {parent && (
                  <div className="pt-2 border-t border-warm-100 flex items-center justify-between text-xs text-charcoal-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Users className="w-3.5 h-3.5 text-charcoal-400" />
                      {parent.fullName}
                    </span>
                    {parent.phone && (
                      <a
                        href={`tel:${parent.phone}`}
                        className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 font-semibold"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{parent.phone}</span>
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Specialist & Service Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-[12px] border border-warm-200 space-y-1.5">
                  <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider">Mutaxassis</span>
                  <div className="flex items-center gap-2">
                    <Avatar name={spec?.fullName || "Mutaxassis"} size="xs" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-charcoal-900 truncate">{spec?.fullName || "Noma'lum"}</p>
                      <p className="text-[11px] text-charcoal-500 truncate">{spec?.specialization || "Mutaxassis"}</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-[12px] border border-warm-200 space-y-1.5">
                  <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider">Xizmat</span>
                  <p className="text-xs font-bold text-brand-800 truncate">{svc?.name || "Noma'lum xizmat"}</p>
                  <p className="text-[11px] text-charcoal-500">
                    {svc?.durationMinutes} daqiqa {svc?.price ? `• ${svc.price.toLocaleString()} so'm` : ''}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {viewingAppointment.notes && (
                <div className="p-3 rounded-[10px] bg-warm-50 border border-warm-200 text-xs">
                  <p className="font-bold text-charcoal-900 mb-0.5">Izoh:</p>
                  <p className="text-charcoal-600 leading-relaxed">{viewingAppointment.notes}</p>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-warm-100 flex-wrap">
                {!isParent && viewingAppointment.status === 'SCHEDULED' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                    onClick={() => {
                      setActionTarget({ id: viewingAppointment.id, action: 'confirm' });
                      setViewingAppointmentId(null);
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    Tasdiqlash
                  </Button>
                )}
                {!isParent && ['SCHEDULED', 'CONFIRMED'].includes(viewingAppointment.status) && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setActionTarget({ id: viewingAppointment.id, action: 'start' });
                      setViewingAppointmentId(null);
                    }}
                  >
                    <Play className="w-4 h-4 mr-1.5" />
                    Seans boshlash
                  </Button>
                )}
                {['SCHEDULED', 'CONFIRMED'].includes(viewingAppointment.status) && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      setActionTarget({ id: viewingAppointment.id, action: 'cancel' });
                      setViewingAppointmentId(null);
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-1.5" />
                    Bekor qilish
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setViewingAppointmentId(null)}
                >
                  Yopish
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Create appointment modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Yangi uchrashuv" size="lg">
        <CreateAppointmentForm onSuccess={() => setShowCreate(false)} onCancel={() => setShowCreate(false)} />
      </Modal>

      {/* Action confirmation */}
      <ConfirmDialog
        isOpen={!!actionTarget}
        onClose={() => setActionTarget(null)}
        onConfirm={handleAction}
        loading={actionLoading}
        title={
          actionTarget?.action === 'cancel' ? 'Bekor qilishni tasdiqlaysizmi?' :
          actionTarget?.action === 'noshow' ? 'Kelmagan deb belgilaysizmi?' :
          actionTarget?.action === 'confirm' ? 'Uchrashuvni tasdiqlaysizmi?' :
          'Seansni boshlaysizmi?'
        }
        message={
          actionTarget?.action === 'cancel' ? 'Uchrashuv bekor qilinadi. Bu amalni qaytarib bo\'lmaydi.' :
          actionTarget?.action === 'noshow' ? 'Bola kelmagan deb belgilanadi.' :
          actionTarget?.action === 'confirm' ? 'Uchrashuv tasdiqlangan holatiga o\'tkaziladi.' :
          'Seans boshlanadi va holat "Jarayonda" ga o\'zgaradi.'
        }
        variant={actionTarget?.action === 'cancel' ? 'danger' : actionTarget?.action === 'confirm' ? 'success' : actionTarget?.action === 'noshow' ? 'warning' : 'default'}
        confirmLabel={
          actionTarget?.action === 'cancel' ? 'Ha, bekor qilish' :
          actionTarget?.action === 'noshow' ? 'Ha, kelmagan' :
          actionTarget?.action === 'confirm' ? 'Tasdiqlash' : 'Seans boshlash'
        }
      />
    </div>
  );
}
