// ═══════════════════════════════════════
//  Sessions Page — With complete workflow
// ═══════════════════════════════════════
import { useState, useMemo } from 'react';
import { Activity, CheckCircle, Search } from 'lucide-react';
import { useStore, useAuth } from '@/store';
import { formatDateTime, formatCurrencyCompact, getSessionStatusColor, getSessionStatusLabel } from '@/utils';
import { DataTable, Column } from '@/components/tables/DataTable';
import { Card, Avatar, Badge } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PageHeader, KpiCard } from '@/components/ui/KpiCard';
import { Textarea } from '@/components/ui/primitives';
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
  const [statusFilter, setStatusFilter] = useState('');
  const [completeTarget, setCompleteTarget] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = [...baseSessions].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s => children.find(c => c.id === s.childId)?.fullName.toLowerCase().includes(q));
    }
    if (statusFilter) result = result.filter(s => s.status === statusFilter);
    return result;
  }, [baseSessions, search, statusFilter, children]);

  const completed = baseSessions.filter(s => s.status === 'COMPLETED').length;
  const inProgress = baseSessions.filter(s => s.status === 'IN_PROGRESS').length;
  const cancelled = baseSessions.filter(s => s.status === 'CANCELLED').length;

  const columns: Column<Session>[] = [
    {
      key: 'childId', header: 'Bola', cell: (row) => {
        const child = children.find(c => c.id === row.childId);
        return child ? (
          <div className="flex items-center gap-2">
            <Avatar name={child.fullName} size="xs" />
            <span className="text-sm font-medium text-charcoal-900">{child.fullName}</span>
          </div>
        ) : <span className="text-charcoal-400">—</span>;
      }
    },
    {
      key: 'specialistId', header: 'Mutaxassis', cell: (row) => {
        const spec = specialists.find(s => s.id === row.specialistId);
        return <span className="text-sm text-charcoal-700">{spec?.fullName ?? '—'}</span>;
      }
    },
    {
      key: 'serviceId', header: 'Xizmat', cell: (row) => {
        const svc = services.find(s => s.id === row.serviceId);
        return (
          <div>
            <p className="text-xs text-charcoal-700">{svc?.name ?? '—'}</p>
            {svc && <p className="text-[10px] text-charcoal-400">{formatCurrencyCompact(svc.price)}</p>}
          </div>
        );
      }
    },
    {
      key: 'startTime', header: 'Boshlanish', sortable: true,
      cell: (row) => <span className="text-sm text-charcoal-600">{formatDateTime(row.startTime)}</span>
    },
    {
      key: 'status', header: 'Holat', cell: (row) => (
        <Badge className={getSessionStatusColor(row.status)} dot>
          {getSessionStatusLabel(row.status)}
        </Badge>
      )
    },
    {
      key: 'actions', header: '', width: isParent ? '0px' : '100px',
      cell: (row) => (!isParent && row.status === 'IN_PROGRESS' && (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN' || row.specialistId === currentUser?.id)) ? (
        <Button
          size="xs"
          onClick={e => { e.stopPropagation(); setCompleteTarget(row.id); }}
          leftIcon={<CheckCircle className="w-3 h-3" />}
        >
          Yakunlash
        </Button>
      ) : null
    },
  ];

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-5">
      <PageHeader
        title={isParent ? "Seanslar tarixi" : isSpecialist ? "Mening seanslarim" : "Seanslar"}
        description={isParent ? `Farzandlaringizning ${baseSessions.length} ta seansi` : isSpecialist ? `Sizning ${baseSessions.length} ta seansingiz` : `Jami ${allSessions.length} ta seans`}
      />

      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Yakunlangan" value={completed} icon={<CheckCircle className="w-4 h-4" />} accentColor="sage" index={0} />
        <KpiCard label="Jarayonda" value={inProgress} icon={<Activity className="w-4 h-4" />} accentColor="brand" index={1} />
        <KpiCard label="Bekor qilingan" value={cancelled} icon={<Activity className="w-4 h-4" />} accentColor="danger" index={2} />
      </div>

      <Card>
        <div className="px-4 py-3 flex gap-3 border-b border-warm-100 flex-wrap items-center">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Bola ismi..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-warm-300 rounded-[10px] bg-white outline-none focus:border-brand-500 placeholder:text-charcoal-400 transition-colors" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-warm-300 rounded-[10px] bg-white outline-none focus:border-brand-500 text-charcoal-700 cursor-pointer">
            <option value="">Barcha holatlar</option>
            <option value="IN_PROGRESS">Jarayonda</option>
            <option value="COMPLETED">Yakunlangan</option>
            <option value="CANCELLED">Bekor qilingan</option>
          </select>
          <span className="ml-auto text-xs text-charcoal-400">{filtered.length} ta</span>
        </div>
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={r => r.id}
          emptyTitle="Seanslar topilmadi"
          emptyIcon={<Activity className="w-5 h-5" />}
        />
      </Card>

      {/* Complete session modal */}
      <Modal isOpen={!!completeTarget} onClose={() => setCompleteTarget(null)} title="Seansni yakunlash" description="Seans natijalarini kiriting" size="md">
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

function CompleteSessionForm({ sessionId, onSuccess, onCancel, onComplete }: {
  sessionId: string; onSuccess: () => void; onCancel: () => void;
  onComplete: (id: string, note: string, obs: string, rec: string) => void;
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CompleteForm>({
    resolver: zodResolver(completeSchema),
  });
  const onSubmit = async (data: CompleteForm) => {
    await new Promise(r => setTimeout(r, 300));
    onComplete(sessionId, data.note, data.observation, data.recommendation);
    onSuccess();
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Textarea label="Seans izohi" required placeholder="Seans qanday o'tdi?" rows={2} error={errors.note?.message} {...register('note')} />
      <Textarea label="Professional kuzatuv" required placeholder="Bolaning holati, muskul reaksiyasi..." rows={3} error={errors.observation?.message} {...register('observation')} />
      <Textarea label="Tavsiya va ko'rsatmalar" required placeholder="Keyingi seans uchun tavsiyalar, uy mashqlari..." rows={2} error={errors.recommendation?.message} {...register('recommendation')} />
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-[10px]">
        <p className="text-xs text-amber-700">⚠️ Seansni yakunlagandan so'ng to'lov avtomatik hisoblanadi.</p>
      </div>
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>Bekor qilish</Button>
        <Button type="submit" loading={isSubmitting} leftIcon={<CheckCircle className="w-4 h-4" />}>Yakunlash</Button>
      </div>
    </form>
  );
}
