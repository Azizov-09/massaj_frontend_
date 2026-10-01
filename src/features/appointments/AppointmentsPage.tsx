// ═══════════════════════════════════════════════════════
//  Appointments Page — Full CRUD with status workflow
// ═══════════════════════════════════════════════════════
import { useState, useMemo } from 'react';
import { Plus, Search, Calendar, CheckCircle2, XCircle, Play, UserX, X, Clock } from 'lucide-react';
import { useStore, useAuth } from '@/store';
import {
  formatDate, getAppointmentStatusColor, getAppointmentStatusLabel,
} from '@/utils';
import { DataTable, Column } from '@/components/tables/DataTable';
import { Card, Avatar, Badge, Select, DatePicker } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PageHeader, KpiCard } from '@/components/ui/KpiCard';
import { ConfirmDialog } from '@/components/ui/Modal';
import { CreateAppointmentForm } from './CreateAppointmentForm';
import type { Appointment } from '@/types';

export function AppointmentsPage() {
  const appointments = useStore(s => s.appointments);
  const children = useStore(s => s.children);
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

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [actionTarget, setActionTarget] = useState<{ id: string; action: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const filtered = useMemo(() => {
    let result = [...baseAppointments].sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`));
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(a => {
        const child = children.find(c => c.id === a.childId);
        const spec = specialists.find(s => s.id === a.specialistId);
        return child?.fullName.toLowerCase().includes(q) || spec?.fullName.toLowerCase().includes(q);
      });
    }
    if (statusFilter) result = result.filter(a => a.status === statusFilter);
    if (dateFilter) result = result.filter(a => a.date === dateFilter);
    return result;
  }, [baseAppointments, search, statusFilter, dateFilter, children, specialists]);

  // KPIs
  const todayStr = new Date().toISOString().split('T')[0];
  const todayApts = baseAppointments.filter(a => a.date === todayStr);
  const pending = baseAppointments.filter(a => ['SCHEDULED', 'CONFIRMED'].includes(a.status)).length;
  const completed = baseAppointments.filter(a => a.status === 'COMPLETED').length;
  const cancelled = baseAppointments.filter(a => a.status === 'CANCELLED').length;

  const handleAction = async () => {
    if (!actionTarget) return;
    setActionLoading(true);
    await new Promise(r => setTimeout(r, 300));
    if (actionTarget.action === 'confirm') confirmAppointment(actionTarget.id);
    if (actionTarget.action === 'cancel') cancelAppointment(actionTarget.id);
    if (actionTarget.action === 'noshow') markNoShow(actionTarget.id);
    if (actionTarget.action === 'start') startSession(actionTarget.id);
    setActionLoading(false);
    setActionTarget(null);
  };

  const columns: Column<Appointment>[] = [
    {
      key: 'childId',
      header: 'Bola',
      sortable: true,
      cell: (row) => {
        const child = children.find(c => c.id === row.childId);
        return child ? (
          <div className="flex items-center gap-2">
            <Avatar name={child.fullName} size="xs" />
            <span className="text-sm font-medium text-charcoal-900">{child.fullName}</span>
          </div>
        ) : <span className="text-charcoal-400">—</span>;
      },
    },
    {
      key: 'specialistId',
      header: 'Mutaxassis',
      cell: (row) => {
        const spec = specialists.find(s => s.id === row.specialistId);
        return <span className="text-sm text-charcoal-700">{spec?.fullName ?? '—'}</span>;
      },
    },
    {
      key: 'serviceId',
      header: 'Xizmat',
      cell: (row) => {
        const svc = services.find(s => s.id === row.serviceId);
        return <span className="text-xs text-charcoal-600">{svc?.name ?? '—'}</span>;
      },
    },
    {
      key: 'date',
      header: 'Sana',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="text-sm font-medium text-charcoal-900">{formatDate(row.date)}</p>
          <p className="text-xs text-charcoal-400">{row.startTime} – {row.endTime}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Holat',
      cell: (row) => (
        <Badge className={getAppointmentStatusColor(row.status)} dot>
          {getAppointmentStatusLabel(row.status)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: isParent ? '90px' : '160px',
      cell: (row) => (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          {!isParent && row.status === 'SCHEDULED' && (
            <button
              onClick={() => setActionTarget({ id: row.id, action: 'confirm' })}
              className="p-1.5 rounded-[6px] text-sage-600 hover:bg-sage-50 transition-colors"
              title="Tasdiqlash"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          )}
          {!isParent && ['SCHEDULED', 'CONFIRMED'].includes(row.status) && (
            <button
              onClick={() => setActionTarget({ id: row.id, action: 'start' })}
              className="p-1.5 rounded-[6px] text-brand-600 hover:bg-brand-50 transition-colors"
              title="Seans boshlash"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}
          {['SCHEDULED', 'CONFIRMED'].includes(row.status) && (
            <button
              onClick={() => setActionTarget({ id: row.id, action: 'cancel' })}
              className="p-1.5 rounded-[6px] text-danger-main hover:bg-red-50 transition-colors"
              title="Bekor qilish"
            >
              <XCircle className="w-3.5 h-3.5" />
            </button>
          )}
          {!isParent && ['SCHEDULED', 'CONFIRMED'].includes(row.status) && (
            <button
              onClick={() => setActionTarget({ id: row.id, action: 'noshow' })}
              className="p-1.5 rounded-[6px] text-charcoal-400 hover:bg-warm-100 transition-colors"
              title="Kelmagan"
            >
              <UserX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-5">
      <PageHeader
        title={isParent ? "Farzandlarim qabullari" : isSpecialist ? "Mening qabullarim" : "Uchrashuvlar"}
        description={
          isParent
            ? `Jami ${baseAppointments.length} ta uchrashuv qayd etilgan`
            : isSpecialist
            ? `Sizga biriktirilgan ${baseAppointments.length} ta uchrashuv`
            : `Jami ${appointments.length} ta uchrashuv`
        }
        actions={
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
            {isParent ? "Qabulga yozilish" : "Uchrashuv qo'shish"}
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <KpiCard
          label="Bugun"
          value={todayApts.length}
          description="Bugungi uchrashuvlar"
          icon={<Calendar className="w-5 h-5 text-brand-600" />}
          accentColor="brand"
          index={0}
        />
        <KpiCard
          label="Kutilmoqda"
          value={pending}
          description="Rejadagi qabullar"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          accentColor="gold"
          index={1}
        />
        <KpiCard
          label="Yakunlangan"
          value={completed}
          description="Muvaffaqiyatli seanslar"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          accentColor="sage"
          index={2}
        />
        <KpiCard
          label="Bekor qilingan"
          value={cancelled}
          description="Bekor qilingan qabullar"
          icon={<XCircle className="w-5 h-5 text-rose-600" />}
          accentColor="danger"
          index={3}
        />
      </div>

      {/* Table */}
      <Card>
        <div className="px-4 py-3 flex flex-wrap items-center gap-3 border-b border-warm-100">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Bola yoki mutaxassis..."
              className="w-full h-9 pl-9 pr-3 text-xs border border-warm-300 rounded-[10px] bg-white shadow-2xs placeholder:text-charcoal-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100/80 outline-none transition-all"
            />
          </div>
          <div className="w-52">
            <Select
              size="sm"
              triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'Barcha holatlar' },
                { value: 'SCHEDULED', label: 'Rejalashtirilgan' },
                { value: 'CONFIRMED', label: 'Tasdiqlangan' },
                { value: 'IN_PROGRESS', label: 'Jarayonda' },
                { value: 'COMPLETED', label: 'Yakunlangan' },
                { value: 'CANCELLED', label: 'Bekor qilingan' },
                { value: 'NO_SHOW', label: 'Kelmagan' },
              ]}
              aria-label="Holat bo'yicha filter"
            />
          </div>
          <div className="w-44">
            <DatePicker
              size="sm"
              triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              placeholder="Sana bo'yicha..."
              aria-label="Sana bo'yicha filter"
            />
          </div>
          {(statusFilter || dateFilter) && (
            <button
              onClick={() => { setStatusFilter(''); setDateFilter(''); }}
              className="flex items-center gap-1 text-xs text-danger-main hover:text-danger-dark font-medium"
            >
              <X className="w-3 h-3" /> Tozalash
            </button>
          )}
          <span className="ml-auto text-xs text-charcoal-400 font-medium">{filtered.length} ta uchrashuv</span>
        </div>
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={r => r.id}
          emptyTitle="Uchrashuvlar topilmadi"
          emptyIcon={<Calendar className="w-5 h-5" />}
          emptyAction={
            <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowCreate(true)}>
              Uchrashuv qo'shish
            </Button>
          }
        />
      </Card>

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
