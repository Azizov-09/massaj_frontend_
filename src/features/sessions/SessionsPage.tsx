// ═══════════════════════════════════════════════════════
//  Sessions Page — Senior Medical/Wellness CRM Table Standard
// ═══════════════════════════════════════════════════════
import { useState, useMemo } from 'react';
import {
  Activity, CheckCircle2, XCircle, Search, Calendar, Clock,
  Eye, FileText, X, AlertCircle, Sparkles, Filter, ChevronRight,
  User, Check, DollarSign
} from 'lucide-react';
import { useStore, useAuth } from '@/store';
import {
  formatDateTime, formatCurrency, formatCurrencyCompact,
  getSessionStatusColor, getSessionStatusLabel, cn
} from '@/utils';
import { DataTable, Column } from '@/components/tables/DataTable';
import { Card, Avatar, Badge, Select, Textarea } from '@/components/ui/primitives';
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

type StatusFilter = 'ALL' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export function SessionsPage() {
  const { currentUser } = useAuth();
  const allSessions = useStore(s => s.sessions);
  const children = useStore(s => s.children);
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

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<StatusFilter>('ALL');
  const [specialistFilter, setSpecialistFilter] = useState('');
  const [completeTarget, setCompleteTarget] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const completed = useMemo(() => baseSessions.filter(s => s.status === 'COMPLETED').length, [baseSessions]);
  const inProgress = useMemo(() => baseSessions.filter(s => s.status === 'IN_PROGRESS').length, [baseSessions]);
  const cancelled = useMemo(() => baseSessions.filter(s => s.status === 'CANCELLED').length, [baseSessions]);

  // Total revenue calculated from completed sessions
  const completedRevenue = useMemo(() => {
    return baseSessions
      .filter(s => s.status === 'COMPLETED')
      .reduce((sum, s) => {
        const svc = services.find(sv => sv.id === s.serviceId);
        return sum + (svc?.price || 0);
      }, 0);
  }, [baseSessions, services]);

  const filtered = useMemo(() => {
    let result = [...baseSessions].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    
    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s => {
        const child = children.find(c => c.id === s.childId);
        const spec = specialists.find(sp => sp.id === s.specialistId);
        const svc = services.find(sv => sv.id === s.serviceId);
        return (
          child?.fullName.toLowerCase().includes(q) ||
          spec?.fullName.toLowerCase().includes(q) ||
          svc?.name.toLowerCase().includes(q)
        );
      });
    }

    // Tab filter
    if (activeTab !== 'ALL') {
      result = result.filter(s => s.status === activeTab);
    }

    // Specialist filter
    if (specialistFilter) {
      result = result.filter(s => s.specialistId === specialistFilter);
    }

    return result;
  }, [baseSessions, search, activeTab, specialistFilter, children, specialists, services]);

  const hasActiveFilters = search !== '' || activeTab !== 'ALL' || specialistFilter !== '';

  const resetFilters = () => {
    setSearch('');
    setActiveTab('ALL');
    setSpecialistFilter('');
  };

  const columns: Column<Session>[] = [
    {
      key: 'childId',
      header: 'Bola',
      sortable: true,
      cell: (row) => {
        const child = children.find(c => c.id === row.childId);
        return child ? (
          <div className="flex items-center gap-2.5">
            <Avatar name={child.fullName} size="sm" className="font-semibold" />
            <div className="min-w-0">
              <p className="font-semibold text-charcoal-900 text-sm tracking-tight truncate hover:text-brand-700 transition-colors">
                {child.fullName}
              </p>
              {child.diagnosis && (
                <p className="text-[11px] text-charcoal-400 truncate max-w-[150px]">
                  {child.diagnosis}
                </p>
              )}
            </div>
          </div>
        ) : (
          <span className="text-charcoal-400 text-sm">—</span>
        );
      },
    },
    {
      key: 'specialistId',
      header: 'Mutaxassis',
      sortable: true,
      cell: (row) => {
        const spec = specialists.find(s => s.id === row.specialistId);
        return spec ? (
          <div className="flex items-center gap-2">
            <Avatar name={spec.fullName} src={spec.avatar} size="xs" />
            <div>
              <p className="text-xs font-semibold text-charcoal-800">{spec.fullName}</p>
              <p className="text-[10px] text-charcoal-400">{spec.specialization}</p>
            </div>
          </div>
        ) : (
          <span className="text-charcoal-400 text-xs">—</span>
        );
      },
    },
    {
      key: 'serviceId',
      header: 'Xizmat va Narxi',
      cell: (row) => {
        const svc = services.find(s => s.id === row.serviceId);
        return svc ? (
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-charcoal-800">{svc.name}</p>
            <div className="flex items-center gap-2 text-[11px] text-charcoal-400">
              <span>{svc.durationMinutes} daq</span>
              <span>•</span>
              <span className="font-semibold text-charcoal-700 tabular-nums">
                {formatCurrencyCompact(svc.price)}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-charcoal-400 text-xs">—</span>
        );
      },
    },
    {
      key: 'startTime',
      header: 'Vaqti',
      sortable: true,
      cell: (row) => (
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-1.5 text-xs text-charcoal-800 font-medium">
            <Calendar className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span>{formatDateTime(row.startTime).split(' ')[0]}</span>
          </div>
          <p className="text-[11px] text-charcoal-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatDateTime(row.startTime).split(' ')[1] || ''}</span>
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Holat',
      sortable: true,
      cell: (row) => (
        <Badge className={getSessionStatusColor(row.status)} dot>
          {getSessionStatusLabel(row.status)}
        </Badge>
      ),
    },
    {
      key: 'actions' as any,
      header: 'Amallar',
      cell: (row) => {
        const canComplete = !isParent && row.status === 'IN_PROGRESS' && (
          currentUser?.role === 'SUPER_ADMIN' ||
          currentUser?.role === 'ADMIN' ||
          row.specialistId === currentUser?.id
        );

        return (
          <div className="flex items-center justify-end gap-1.5">
            {canComplete && (
              <Button
                size="xs"
                variant="success"
                onClick={e => {
                  e.stopPropagation();
                  setCompleteTarget(row.id);
                }}
                leftIcon={<CheckCircle2 className="w-3 h-3" />}
                className="h-7 text-xs font-semibold"
              >
                Yakunlash
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={e => {
                e.stopPropagation();
                setSelectedSession(row);
              }}
              className="h-7 px-2 text-xs text-charcoal-500 hover:text-brand-700 hover:bg-brand-50/60"
              title="Protokolni ko'rish"
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              Ko'rish
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-5">
      <PageHeader
        title={isParent ? "Seanslar tarixi" : isSpecialist ? "Mening seanslarim" : "Seanslar ro'yxati"}
        description={
          isParent
            ? `Farzandlaringizning ${baseSessions.length} ta seansi qaydnomasi`
            : isSpecialist
            ? `Siz o'tkazgan va rejalashtirilgan ${baseSessions.length} ta seans`
            : `Tizimdagi jami ${allSessions.length} ta reabilitatsiya seansi`
        }
      />

      {/* 4 Balanced KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KpiCard
          label="Jami seanslar"
          value={baseSessions.length}
          description="Barcha qaydlar"
          icon={<Calendar className="w-4 h-4 text-blue-500" />}
          accentColor="blue"
          index={0}
        />
        <KpiCard
          label="Yakunlangan"
          value={completed}
          description={`${formatCurrencyCompact(completedRevenue)} qiymatida`}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          accentColor="sage"
          index={1}
        />
        <KpiCard
          label="Jarayonda"
          value={inProgress}
          description="Hozir o'tkazilmoqda"
          icon={<Activity className="w-4 h-4 text-brand-600" />}
          accentColor="brand"
          index={2}
        />
        <KpiCard
          label="Bekor qilingan"
          value={cancelled}
          description="O‘tkazilmagan seanslar"
          icon={<XCircle className="w-4 h-4 text-rose-500" />}
          accentColor="danger"
          index={3}
        />
      </div>

      <Card className="overflow-hidden border border-warm-200/90 shadow-xs">
        {/* Quick Tabs */}
        <div className="flex items-center gap-1.5 px-4 pt-3.5 pb-2 border-b border-warm-200/70 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('ALL')}
            className={cn(
              "px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5",
              activeTab === 'ALL'
                ? "bg-brand-600 text-white shadow-xs"
                : "text-charcoal-600 hover:bg-warm-100 hover:text-charcoal-900"
            )}
          >
            Barchasi
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
              activeTab === 'ALL' ? "bg-white/20 text-white" : "bg-warm-200 text-charcoal-600"
            )}>
              {baseSessions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('IN_PROGRESS')}
            className={cn(
              "px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5",
              activeTab === 'IN_PROGRESS'
                ? "bg-brand-600 text-white shadow-xs"
                : "text-charcoal-600 hover:bg-brand-50 hover:text-brand-800"
            )}
          >
            Jarayonda
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
              activeTab === 'IN_PROGRESS' ? "bg-white/20 text-white" : "bg-brand-100 text-brand-800"
            )}>
              {inProgress}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('COMPLETED')}
            className={cn(
              "px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5",
              activeTab === 'COMPLETED'
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-charcoal-600 hover:bg-emerald-50 hover:text-emerald-800"
            )}
          >
            Yakunlangan
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
              activeTab === 'COMPLETED' ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
            )}>
              {completed}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('CANCELLED')}
            className={cn(
              "px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5",
              activeTab === 'CANCELLED'
                ? "bg-rose-600 text-white shadow-xs"
                : "text-charcoal-600 hover:bg-rose-50 hover:text-rose-700"
            )}
          >
            Bekor qilingan
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
              activeTab === 'CANCELLED' ? "bg-white/20 text-white" : "bg-rose-100 text-rose-700"
            )}>
              {cancelled}
            </span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-warm-100 bg-warm-50/40">
          <div className="flex flex-1 flex-wrap items-center gap-2.5">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Bola, mutaxassis yoki xizmat nomi..."
                className="w-full h-9 pl-9 pr-8 text-xs border border-warm-300 rounded-[10px] bg-white shadow-2xs placeholder:text-charcoal-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-charcoal-400 hover:text-charcoal-600 hover:bg-warm-100 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {!isSpecialist && specialists.length > 0 && (
              <div className="w-48">
                <Select
                  size="sm"
                  triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300"
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

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-9 px-2.5 text-xs text-charcoal-500 hover:text-charcoal-800"
              >
                Filtrni tozalash
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3 text-xs text-charcoal-500">
            <span>
              Ko'rsatilmoqda: <strong className="text-charcoal-900 font-semibold">{filtered.length}</strong> / {baseSessions.length}
            </span>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={r => r.id}
          onRowClick={(session) => setSelectedSession(session)}
          tableClassName="min-w-[900px]"
          emptyTitle="Seanslar topilmadi"
          emptyDescription={
            hasActiveFilters
              ? "Qidiruv parametrlariga mos keluvchi seans topilmadi. Filtrni tozalab ko'ring."
              : "Hozircha tizimda o'tkazilgan yoki faol seanslar mavjud emas."
          }
          emptyIcon={<Activity className="w-5 h-5" />}
        />

        {/* Footer Summary */}
        <div className="px-4 py-3 bg-warm-50/70 border-t border-warm-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-charcoal-500">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-500" />
              Jami: <strong className="text-charcoal-800 font-semibold">{baseSessions.length} ta seans</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Yakunlangan qiymati: <strong className="text-emerald-700 font-semibold tabular-nums">{formatCurrency(completedRevenue)}</strong>
            </span>
          </div>
          <span className="text-[11px] text-charcoal-400">
            Qator ustiga bosib seans protokoli va shifokor xulosasini ko'rishingiz mumkin
          </span>
        </div>
      </Card>

      {/* Session Details Modal */}
      {selectedSession && (
        <Modal
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          title="Seans tafsilotlari va shifokor protokoli"
          size="lg"
        >
          <div className="space-y-4">
            {/* Header info */}
            <div className="flex items-start justify-between gap-3 p-4 rounded-xl bg-warm-50 border border-warm-200/70">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-charcoal-900">
                    {children.find(c => c.id === selectedSession.childId)?.fullName || 'Bola'}
                  </h3>
                  <Badge className={getSessionStatusColor(selectedSession.status)} dot>
                    {getSessionStatusLabel(selectedSession.status)}
                  </Badge>
                </div>
                <p className="text-xs text-charcoal-500 flex items-center gap-2">
                  <span>Mutaxassis: <strong>{specialists.find(s => s.id === selectedSession.specialistId)?.fullName || '—'}</strong></span>
                  <span>•</span>
                  <span>Xizmat: <strong>{services.find(s => s.id === selectedSession.serviceId)?.name || '—'}</strong></span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-charcoal-800">{formatDateTime(selectedSession.startTime)}</p>
                {selectedSession.endTime && (
                  <p className="text-[11px] text-charcoal-400">Tugash: {formatDateTime(selectedSession.endTime)}</p>
                )}
              </div>
            </div>

            {/* Protocol details if completed */}
            {selectedSession.status === 'COMPLETED' ? (
              <div className="space-y-3">
                {selectedSession.note && (
                  <div className="p-3.5 rounded-xl border border-warm-200/80 bg-white">
                    <p className="text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-1">
                      Seans borishi va izoh
                    </p>
                    <p className="text-xs text-charcoal-800 leading-relaxed">
                      {selectedSession.note}
                    </p>
                  </div>
                )}

                {selectedSession.observation && (
                  <div className="p-3.5 rounded-xl border border-warm-200/80 bg-white">
                    <p className="text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-1">
                      Klinik kuzatuv va muskul holati
                    </p>
                    <p className="text-xs text-charcoal-800 leading-relaxed">
                      {selectedSession.observation}
                    </p>
                  </div>
                )}

                {selectedSession.recommendation && (
                  <div className="p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/50">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
                      Shifokor tavsiyalari va uy vazifalari
                    </p>
                    <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                      {selectedSession.recommendation}
                    </p>
                  </div>
                )}
              </div>
            ) : selectedSession.status === 'IN_PROGRESS' ? (
              <div className="p-4 rounded-xl bg-brand-50/60 border border-brand-200 text-xs text-brand-900 space-y-2">
                <p className="font-semibold flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-brand-600 animate-pulse" />
                  Ushbu seans hozir o'tkazilmoqda
                </p>
                <p className="text-brand-700">
                  Seans tugagach, mutaxassis shifokor protokoli, kuzatuvlari va tavsiyalarini kiritib yakunlaydi.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-warm-100 text-xs text-charcoal-600">
                Ushbu seans bekor qilingan.
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-warm-100">
              <Button variant="secondary" onClick={() => setSelectedSession(null)}>
                Yopish
              </Button>
            </div>
          </div>
        </Modal>
      )}

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
