// ═══════════════════════════════════════════════════════
//  Sessions Page — Matched 1:1 with Appointments Table Design
// ═══════════════════════════════════════════════════════
import { useState, useMemo } from 'react';
import {
  Activity, CheckCircle2, XCircle, Search, Calendar,
  Clock, Eye, Users, CheckCheck, Phone, UserX, X
} from 'lucide-react';
import { useStore, useAuth } from '@/store';
import {
  formatDate, getSessionStatusColor, getSessionStatusLabel, cn
} from '@/utils';
import { differenceInYears, parseISO } from 'date-fns';
import { DataTable, Column } from '@/components/tables/DataTable';
import { Card, Avatar, Badge, Select, DatePicker, Textarea } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PageHeader, KpiCard } from '@/components/ui/KpiCard';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Session } from '@/types';

const completeSchema = z.object({
  note: z.string().min(5, "Izoh kamida 5 ta belgi"),
  observation: z.string().min(5, "Kuzatuv kamida 5 ta belgi"),
  recommendation: z.string().min(5, "Tavsiya kamida 5 ta belgi"),
});
type CompleteForm = z.infer<typeof completeSchema>;

type StatusTabKey = 'ALL' | 'TODAY' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export function SessionsPage() {
  const { currentUser } = useAuth();
  const allSessions = useStore(s => s.sessions);
  const children = useStore(s => s.children);
  const parents = useStore(s => s.parents);
  const specialists = useStore(s => s.specialists);
  const services = useStore(s => s.services);
  const completeSession = useStore(s => s.completeSession);

  const isParent = currentUser?.role === 'PARENT';
  const isSpecialist = currentUser?.role === 'SPECIALIST';

  const myChildIds = useMemo(() => {
    if (isParent && currentUser) {
      return children.filter(c => c.parentId === currentUser.id).map(c => c.id);
    }
    return [];
  }, [children, isParent, currentUser]);

  const baseSessions = useMemo(() => {
    if (isParent && currentUser) {
      return allSessions.filter(s => myChildIds.includes(s.childId));
    }
    if (isSpecialist && currentUser) {
      return allSessions.filter(s => s.specialistId === currentUser.id);
    }
    return allSessions;
  }, [allSessions, isParent, isSpecialist, currentUser, myChildIds]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filter states
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<StatusTabKey>('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [specialistFilter, setSpecialistFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');

  // Dialog & Modal states
  const [viewingSessionId, setViewingSessionId] = useState<string | null>(null);
  const [completeTarget, setCompleteTarget] = useState<string | null>(null);

  // Active session for modal view
  const viewingSession = useMemo(() => {
    if (!viewingSessionId) return null;
    return allSessions.find(s => s.id === viewingSessionId) ?? null;
  }, [allSessions, viewingSessionId]);

  // Counts for KPI & Tabs
  const counts = useMemo(() => {
    return {
      all: baseSessions.length,
      today: baseSessions.filter(s => s.startTime.startsWith(todayStr)).length,
      inProgress: baseSessions.filter(s => s.status === 'IN_PROGRESS').length,
      completed: baseSessions.filter(s => s.status === 'COMPLETED').length,
      cancelled: baseSessions.filter(s => s.status === 'CANCELLED').length,
    };
  }, [baseSessions, todayStr]);

  // Filtered dataset
  const filtered = useMemo(() => {
    let result = [...baseSessions].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    // Quick status tab
    if (statusTab === 'TODAY') {
      result = result.filter(s => s.startTime.startsWith(todayStr));
    } else if (statusTab === 'IN_PROGRESS') {
      result = result.filter(s => s.status === 'IN_PROGRESS');
    } else if (statusTab === 'COMPLETED') {
      result = result.filter(s => s.status === 'COMPLETED');
    } else if (statusTab === 'CANCELLED') {
      result = result.filter(s => s.status === 'CANCELLED');
    }

    // Date filter
    if (dateFilter) {
      result = result.filter(s => s.startTime.startsWith(dateFilter));
    }

    // Specialist filter
    if (specialistFilter) {
      result = result.filter(s => s.specialistId === specialistFilter);
    }

    // Service filter
    if (serviceFilter) {
      result = result.filter(s => s.serviceId === serviceFilter);
    }

    // Comprehensive search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(s => {
        const child = children.find(c => c.id === s.childId);
        const spec = specialists.find(sp => sp.id === s.specialistId);
        const parent = parents.find(p => (child && p.childrenIds?.includes(child.id)) || p.id === child?.parentId);
        const svc = services.find(sv => sv.id === s.serviceId);

        const matchChild = child?.fullName.toLowerCase().includes(q);
        const matchSpec = spec?.fullName.toLowerCase().includes(q);
        const matchParent = parent?.fullName.toLowerCase().includes(q) || parent?.phone?.toLowerCase().includes(q);
        const matchService = svc?.name.toLowerCase().includes(q);
        return Boolean(matchChild || matchSpec || matchParent || matchService);
      });
    }

    return result;
  }, [baseSessions, statusTab, dateFilter, specialistFilter, serviceFilter, search, todayStr, children, specialists, parents, services]);

  const hasActiveFilters = Boolean(
    search || statusTab !== 'ALL' || dateFilter || specialistFilter || serviceFilter
  );

  const resetAllFilters = () => {
    setSearch('');
    setStatusTab('ALL');
    setDateFilter('');
    setSpecialistFilter('');
    setServiceFilter('');
  };

  const handleKpiClick = (tab: StatusTabKey) => {
    if (statusTab === tab) {
      setStatusTab('ALL');
    } else {
      setStatusTab(tab);
      if (tab === 'TODAY') setDateFilter('');
    }
  };

  const columns: Column<Session>[] = [
    {
      key: 'childId',
      header: 'Bola',
      sortable: true,
      className: 'py-3.5',
      cell: (row) => {
        const child = children.find(c => c.id === row.childId);
        const parent = parents.find(p => (child && p.childrenIds?.includes(child.id)) || p.id === child?.parentId);
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
      key: 'startTime',
      header: 'Sana va vaqt',
      sortable: true,
      className: 'py-3.5',
      cell: (row) => {
        const rowDate = row.startTime.split('T')[0];
        const isCurrentDate = rowDate === todayStr;
        const timeStart = row.startTime.includes('T') ? row.startTime.split('T')[1].substring(0, 5) : '';
        const timeEnd = row.endTime && row.endTime.includes('T') ? row.endTime.split('T')[1].substring(0, 5) : '';

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-charcoal-900">
              <Calendar className="w-3.5 h-3.5 text-brand-600 shrink-0" />
              <span>{formatDate(rowDate)}</span>
              {isCurrentDate && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-[4px] bg-emerald-100 text-emerald-700 border border-emerald-200 shrink-0">
                  Bugun
                </span>
              )}
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-700 bg-warm-100/90 px-2 py-0.5 rounded-[6px] border border-warm-200/80">
              <Clock className="w-3 h-3 text-charcoal-400 shrink-0" />
              <span>{timeStart || '09:00'} {timeEnd ? `– ${timeEnd}` : ''}</span>
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
        <Badge className={cn('shadow-2xs font-semibold text-xs', getSessionStatusColor(row.status))} dot>
          {getSessionStatusLabel(row.status)}
        </Badge>
      ),
    },
    {
      key: 'actions' as any,
      header: 'Amallar',
      headerClassName: 'text-right pr-4',
      width: isParent ? '110px' : '180px',
      className: 'py-3.5 text-right',
      cell: (row) => {
        const canComplete = !isParent && row.status === 'IN_PROGRESS' && (
          currentUser?.role === 'SUPER_ADMIN' ||
          currentUser?.role === 'ADMIN' ||
          row.specialistId === currentUser?.id
        );

        return (
          <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
            {/* Details Eye Button */}
            <button
              type="button"
              onClick={() => setViewingSessionId(row.id)}
              className="p-1.5 rounded-[8px] text-charcoal-500 hover:text-charcoal-900 hover:bg-warm-100 border border-transparent hover:border-warm-200 transition-all cursor-pointer"
              title="Batafsil ko'rish"
              aria-label="Batafsil ko'rish"
            >
              <Eye className="w-4 h-4" />
            </button>

            {canComplete && (
              <button
                type="button"
                onClick={() => setCompleteTarget(row.id)}
                className="p-1.5 rounded-[8px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition-all cursor-pointer shadow-2xs"
                title="Seansni yakunlash"
                aria-label="Seansni yakunlash"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}

            {row.status === 'COMPLETED' && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50/80 px-2 py-1 rounded-[6px] border border-emerald-200/60 select-none">
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Yakunlandi</span>
              </span>
            )}

            {row.status === 'CANCELLED' && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50/80 px-2 py-1 rounded-[6px] border border-rose-200/60 select-none">
                <span>Bekor</span>
              </span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-5">
      <PageHeader
        title={isParent ? "Farzandlarim seanslari" : isSpecialist ? "Mening seanslarim" : "Seanslar ro'yxati"}
        description={
          isParent
            ? `Farzandlaringizning ${baseSessions.length} ta seansi qayd etilgan`
            : isSpecialist
            ? `Sizga biriktirilgan ${baseSessions.length} ta reabilitatsiya seansi`
            : `Jami ${allSessions.length} ta reabilitatsiya seansi`
        }
      />

      {/* KPI Cards Strip (Interactive click-to-filter identical to Appointments) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => handleKpiClick('TODAY')}
          className={cn(
            'cursor-pointer transition-all duration-200 rounded-[14px]',
            statusTab === 'TODAY' ? 'ring-2 ring-brand-500 shadow-sm' : 'hover:scale-[1.01]'
          )}
          title="Bugungi seanslar bo'yicha filtrlash"
        >
          <KpiCard
            label="Bugun"
            value={counts.today}
            description="Bugungi seanslar"
            icon={<Calendar className="w-5 h-5 text-brand-600" />}
            accentColor="brand"
            index={0}
          />
        </div>

        <div
          onClick={() => handleKpiClick('IN_PROGRESS')}
          className={cn(
            'cursor-pointer transition-all duration-200 rounded-[14px]',
            statusTab === 'IN_PROGRESS' ? 'ring-2 ring-amber-500 shadow-sm' : 'hover:scale-[1.01]'
          )}
          title="Ayni vaqtdagi faol seanslar bo'yicha filtrlash"
        >
          <KpiCard
            label="Jarayonda"
            value={counts.inProgress}
            description="Hozir o'tkazilayotgan"
            icon={<Activity className="w-5 h-5 text-amber-600" />}
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
          title="Bekor qilingan seanslar bo'yicha filtrlash"
        >
          <KpiCard
            label="Bekor qilingan"
            value={counts.cancelled}
            description="O'tkazilmagan seanslar"
            icon={<XCircle className="w-5 h-5 text-rose-600" />}
            accentColor="danger"
            index={3}
          />
        </div>
      </div>

      {/* Main Table Card (exact match with Appointments Card) */}
      <Card className="overflow-hidden border border-warm-200/90 shadow-xs">
        {/* Top Status Tabs */}
        <div className="px-4 py-3 bg-warm-50/70 border-b border-warm-200/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            {[
              { key: 'ALL', label: 'Barchasi', count: counts.all },
              { key: 'TODAY', label: 'Bugun', count: counts.today },
              { key: 'IN_PROGRESS', label: 'Jarayonda', count: counts.inProgress },
              { key: 'COMPLETED', label: 'Yakunlangan', count: counts.completed },
              { key: 'CANCELLED', label: 'Bekor qilingan', count: counts.cancelled },
            ].map(tab => {
              const isActive = statusTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusTab(tab.key as StatusTabKey)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap',
                    isActive
                      ? 'bg-charcoal-900 text-white shadow-xs'
                      : 'bg-white text-charcoal-600 hover:text-charcoal-900 hover:bg-warm-100 border border-warm-200/90 shadow-2xs'
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums',
                      isActive ? 'bg-white/20 text-white' : 'bg-warm-100 text-charcoal-700'
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-charcoal-500 bg-white px-2.5 py-1 rounded-[8px] border border-warm-200/80 shadow-2xs">
              Ko‘rsatilmoqda: <strong className="text-charcoal-900 font-bold">{filtered.length}</strong> / {baseSessions.length}
            </span>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="p-3.5 bg-white border-b border-warm-100 flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Bola, ota-ona yoki mutaxassis..."
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

          {/* Specialist Filter (for admin/parent) */}
          {!isSpecialist && (
            <div className="w-44 sm:w-52">
              <Select
                size="sm"
                triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300 font-medium"
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
          <div className="w-40 sm:w-48">
            <Select
              size="sm"
              triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300 font-medium"
              value={serviceFilter}
              onChange={e => setServiceFilter(e.target.value)}
              options={[
                { value: '', label: 'Barcha xizmatlar' },
                ...services.map(s => ({ value: s.id, label: s.name })),
              ]}
              aria-label="Xizmat bo'yicha filter"
            />
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-1.5">
            <div className="w-36 sm:w-40">
              <DatePicker
                size="sm"
                triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300 font-medium"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                placeholder="Sana bo'yicha..."
                aria-label="Sana bo'yicha filter"
              />
            </div>
            {dateFilter !== todayStr && (
              <button
                type="button"
                onClick={() => {
                  setDateFilter(todayStr);
                  setStatusTab('TODAY');
                }}
                className="h-9 px-2.5 rounded-[10px] text-xs font-semibold text-charcoal-700 bg-warm-100 hover:bg-warm-200 border border-warm-200 transition-colors shadow-2xs cursor-pointer shrink-0"
                title="Bugungi sanani tanlash"
              >
                Bugun
              </button>
            )}
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="h-9 inline-flex items-center gap-1.5 px-3 rounded-[10px] text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-colors shadow-2xs cursor-pointer ml-auto sm:ml-0"
              title="Barcha filtrlarni bekor qilish"
            >
              <X className="w-3.5 h-3.5" />
              <span>Filtrlarni tozalash</span>
            </button>
          )}
        </div>

        {/* Data Table */}
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={r => r.id}
          tableClassName="min-w-[880px]"
          onRowClick={row => setViewingSessionId(row.id)}
          emptyTitle="Seanslar topilmadi"
          emptyDescription={
            hasActiveFilters
              ? "Kiritilgan filtr parametrlariga mos keluvchi seanslar topilmadi."
              : "Hozircha hech qanday seans mavjud emas."
          }
          emptyIcon={<Activity className="w-6 h-6 text-charcoal-400" />}
          emptyAction={
            hasActiveFilters ? (
              <Button size="sm" variant="secondary" onClick={resetAllFilters} leftIcon={<X className="w-3.5 h-3.5" />}>
                Filtrlarni tozalash
              </Button>
            ) : undefined
          }
        />

        {/* Table Summary Footer */}
        <div className="px-4 py-3 bg-warm-50/50 border-t border-warm-100 flex flex-wrap items-center justify-between gap-3 text-xs text-charcoal-500">
          <div className="flex items-center gap-4 flex-wrap">
            <span>Jami: <strong className="text-charcoal-800 font-bold">{baseSessions.length}</strong></span>
            <span className="hidden sm:inline-block text-warm-300">•</span>
            <span className="text-emerald-700 font-medium">Yakunlangan: <strong className="font-bold">{counts.completed}</strong></span>
            <span className="hidden sm:inline-block text-warm-300">•</span>
            <span className="text-amber-700 font-medium">Jarayonda: <strong className="font-bold">{counts.inProgress}</strong></span>
            <span className="hidden sm:inline-block text-warm-300">•</span>
            <span className="text-rose-600 font-medium">Bekor qilingan: <strong className="font-bold">{counts.cancelled}</strong></span>
          </div>
          <span className="text-[11px] text-charcoal-400 font-medium">
            Ko'rish uchun qator ustiga bosing
          </span>
        </div>
      </Card>

      {/* Session Details Modal (Identical layout to Appointments) */}
      <Modal
        isOpen={!!viewingSessionId}
        onClose={() => setViewingSessionId(null)}
        title="Seans tafsilotlari va shifokor protokoli"
        size="md"
      >
        {viewingSession && (() => {
          const child = children.find(c => c.id === viewingSession.childId);
          const spec = specialists.find(s => s.id === viewingSession.specialistId);
          const svc = services.find(s => s.id === viewingSession.serviceId);
          const parent = parents.find(p => (child && p.childrenIds?.includes(child.id)) || p.id === child?.parentId);
          const childAge = child?.dateOfBirth ? differenceInYears(new Date(), parseISO(child.dateOfBirth)) : null;

          const rowDate = viewingSession.startTime.split('T')[0];
          const timeStart = viewingSession.startTime.includes('T') ? viewingSession.startTime.split('T')[1].substring(0, 5) : '';
          const timeEnd = viewingSession.endTime && viewingSession.endTime.includes('T') ? viewingSession.endTime.split('T')[1].substring(0, 5) : '';

          const canComplete = !isParent && viewingSession.status === 'IN_PROGRESS' && (
            currentUser?.role === 'SUPER_ADMIN' ||
            currentUser?.role === 'ADMIN' ||
            viewingSession.specialistId === currentUser?.id
          );

          return (
            <div className="space-y-4">
              {/* Header card with status & date */}
              <div className="p-3.5 rounded-[12px] bg-warm-50 border border-warm-200/80 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-[8px] bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-charcoal-900">{formatDate(rowDate)}</p>
                    <p className="text-[11px] text-charcoal-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{timeStart || '09:00'} {timeEnd ? `– ${timeEnd}` : ''}</span>
                    </p>
                  </div>
                </div>
                <Badge className={cn('font-semibold shadow-2xs text-xs', getSessionStatusColor(viewingSession.status))} dot>
                  {getSessionStatusLabel(viewingSession.status)}
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

              {/* Clinical Protocol Details if completed */}
              {viewingSession.status === 'COMPLETED' ? (
                <div className="space-y-2.5">
                  {viewingSession.note && (
                    <div className="p-3 rounded-[10px] bg-warm-50 border border-warm-200 text-xs">
                      <p className="font-bold text-charcoal-900 mb-0.5">Seans borishi va izoh:</p>
                      <p className="text-charcoal-700 leading-relaxed">{viewingSession.note}</p>
                    </div>
                  )}

                  {viewingSession.observation && (
                    <div className="p-3 rounded-[10px] bg-warm-50 border border-warm-200 text-xs">
                      <p className="font-bold text-charcoal-900 mb-0.5">Klinik kuzatuv va muskul reaksiyasi:</p>
                      <p className="text-charcoal-700 leading-relaxed">{viewingSession.observation}</p>
                    </div>
                  )}

                  {viewingSession.recommendation && (
                    <div className="p-3 rounded-[10px] bg-emerald-50/70 border border-emerald-200 text-xs">
                      <p className="font-bold text-emerald-800 mb-0.5">Tavsiya va uy mashqlari:</p>
                      <p className="text-emerald-950 font-medium leading-relaxed">{viewingSession.recommendation}</p>
                    </div>
                  )}
                </div>
              ) : viewingSession.status === 'IN_PROGRESS' ? (
                <div className="p-3.5 rounded-[10px] bg-amber-50/80 border border-amber-200 text-xs text-amber-900">
                  <p className="font-bold flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-amber-600 animate-pulse" />
                    Ushbu reabilitatsiya seansi hozirda faol jarayonda
                  </p>
                  <p className="mt-1 text-amber-700">
                    Seans tugagach, mutaxassis klinik natijalarni qayd etib seansni yakunlaydi.
                  </p>
                </div>
              ) : null}

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-warm-100 flex-wrap">
                {canComplete && (
                  <Button
                    size="sm"
                    className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                    variant="secondary"
                    onClick={() => {
                      setCompleteTarget(viewingSession.id);
                      setViewingSessionId(null);
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    Yakunlash
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setViewingSessionId(null)}
                >
                  Yopish
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Complete session modal */}
      <Modal
        isOpen={!!completeTarget}
        onClose={() => setCompleteTarget(null)}
        title="Seansni yakunlash"
        description="Seans natijalari va professional kuzatuvlarni kiriting"
        size="md"
      >
        {completeTarget && (
          <CompleteSessionForm
            sessionId={completeTarget}
            onSuccess={() => setCompleteTarget(null)}
            onCancel={() => setCompleteTarget(null)}
            onComplete={completeSession}
          />
        )}
      </Modal>
    </div>
  );
}

function CompleteSessionForm({
  sessionId,
  onSuccess,
  onCancel,
  onComplete,
}: {
  sessionId: string;
  onSuccess: () => void;
  onCancel: () => void;
  onComplete: (id: string, note: string, obs: string, rec: string) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompleteForm>({
    resolver: zodResolver(completeSchema),
  });

  const onSubmit = async (data: CompleteForm) => {
    await new Promise(r => setTimeout(r, 300));
    onComplete(sessionId, data.note, data.observation, data.recommendation);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Textarea
        label="Seans izohi"
        required
        placeholder="Seans qanday o'tdi?"
        rows={2}
        error={errors.note?.message}
        {...register('note')}
      />
      <Textarea
        label="Professional kuzatuv"
        required
        placeholder="Bolaning holati, muskul reaksiyasi..."
        rows={3}
        error={errors.observation?.message}
        {...register('observation')}
      />
      <Textarea
        label="Tavsiya va ko'rsatmalar"
        required
        placeholder="Keyingi seans uchun tavsiyalar, uy mashqlari..."
        rows={2}
        error={errors.recommendation?.message}
        {...register('recommendation')}
      />
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-[10px]">
        <p className="text-xs text-amber-800">
          ⚠️ Seansni yakunlagandan so'ng to'lov avtomatik hisoblanadi va tibbiy daftarchaga yoziladi.
        </p>
      </div>
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Bekor qilish
        </Button>
        <Button
          type="submit"
          variant="success"
          loading={isSubmitting}
          leftIcon={<CheckCircle2 className="w-4 h-4" />}
        >
          Yakunlash
        </Button>
      </div>
    </form>
  );
}
