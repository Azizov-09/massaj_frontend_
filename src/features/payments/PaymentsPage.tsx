// ═══════════════════════════════════════════════════════
//  Payments Page — Manual payment recording
// ═══════════════════════════════════════════════════════
import { useState, useMemo } from 'react';
import { Plus, Search, Wallet, TrendingUp } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStore, useAuth } from '@/store';
import {
  formatDateTime, formatCurrencyCompact,
  getPaymentMethodLabel,
} from '@/utils';
import { DataTable, Column } from '@/components/tables/DataTable';
import { Card, Badge } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PageHeader, KpiCard } from '@/components/ui/KpiCard';
import { Input, Select, Textarea } from '@/components/ui/primitives';
import type { Payment } from '@/types';

const paymentSchema = z.object({
  parentId: z.string().min(1, 'Ota-onani tanlang'),
  childId: z.string().optional(),
  amount: z.string().min(1, "Summani kiriting").refine(v => !isNaN(Number(v)) && Number(v) > 0, "To'g'ri summa kiriting"),
  method: z.enum(['CASH', 'CARD', 'TRANSFER']),
  date: z.string().min(1, 'Sanani kiriting'),
  notes: z.string().optional(),
});

type PaymentForm = z.infer<typeof paymentSchema>;

const METHOD_COLORS: Record<string, string> = {
  CASH: 'bg-green-100 text-green-700 border-green-200',
  CARD: 'bg-blue-100 text-blue-700 border-blue-200',
  TRANSFER: 'bg-gold-100 text-gold-700 border-gold-200',
};

export function PaymentsPage() {
  const { currentUser } = useAuth();
  const allPayments = useStore(s => s.payments);
  const parents = useStore(s => s.parents);
  const children = useStore(s => s.children);

  const isParent = currentUser?.role === 'PARENT';
  const canManagePayments = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';
  const basePayments = useMemo(() => {
    if (isParent && currentUser) {
      return allPayments.filter(p => p.parentId === currentUser.id);
    }
    return allPayments;
  }, [allPayments, isParent, currentUser]);

  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const filtered = useMemo(() => {
    let result = [...basePayments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => {
        const parent = parents.find(pa => pa.id === p.parentId);
        const child = children.find(c => c.id === p.childId);
        return parent?.fullName.toLowerCase().includes(q) || child?.fullName.toLowerCase().includes(q);
      });
    }
    if (methodFilter) result = result.filter(p => p.method === methodFilter);
    return result;
  }, [basePayments, search, methodFilter, parents, children]);

  // KPI metrics
  const totalPayments = basePayments.reduce((sum, p) => sum + p.amount, 0);
  const todayPayments = basePayments.filter(p => p.date.startsWith(new Date().toISOString().split('T')[0])).reduce((sum, p) => sum + p.amount, 0);
  const thisMonthPayments = basePayments.filter(p => {
    const m = new Date().toISOString().slice(0, 7);
    return p.date.startsWith(m);
  }).reduce((sum, p) => sum + p.amount, 0);

  const columns: Column<Payment>[] = [
    {
      key: 'parentId',
      header: 'Ota-ona',
      sortable: true,
      cell: (row) => {
        const parent = parents.find(p => p.id === row.parentId);
        return <span className="text-sm font-medium text-charcoal-900">{parent?.fullName ?? '—'}</span>;
      },
    },
    {
      key: 'childId',
      header: 'Bola',
      cell: (row) => {
        const child = children.find(c => c.id === row.childId);
        return <span className="text-sm text-charcoal-700">{child?.fullName ?? '—'}</span>;
      },
    },
    {
      key: 'amount',
      header: 'Summa',
      sortable: true,
      cell: (row) => (
        <span className="text-sm font-bold text-green-600 tabular-nums">{formatCurrencyCompact(row.amount)}</span>
      ),
    },
    {
      key: 'method',
      header: 'Usul',
      cell: (row) => (
        <Badge className={METHOD_COLORS[row.method] ?? ''}>
          {getPaymentMethodLabel(row.method)}
        </Badge>
      ),
    },
    {
      key: 'date',
      header: 'Sana',
      sortable: true,
      cell: (row) => <span className="text-sm text-charcoal-600">{formatDateTime(row.date)}</span>,
    },
    {
      key: 'notes',
      header: 'Izoh',
      cell: (row) => <span className="text-xs text-charcoal-400">{row.notes ?? '—'}</span>,
    },
  ];

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-5">
      <PageHeader
        title={isParent ? "To'lovlarim tarixi" : "To'lovlar"}
        description={isParent ? `Siz tomondan amalga oshirilgan jami to'lovlar` : "Barcha manual to'lovlarni boshqarish"}
        actions={
          canManagePayments ? (
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
              To'lov qabul qilish
            </Button>
          ) : undefined
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Jami to'lovlar" value={totalPayments} format="currency" icon={<Wallet className="w-4 h-4" />} accentColor="brand" index={0} />
        <KpiCard label="Bu oy" value={thisMonthPayments} format="currency" icon={<TrendingUp className="w-4 h-4" />} accentColor="sage" index={1} />
        <KpiCard label="Bugun" value={todayPayments} format="currency" icon={<TrendingUp className="w-4 h-4" />} accentColor="gold" index={2} />
      </div>

      {/* Table */}
      <Card>
        <div className="px-4 py-3 flex flex-wrap items-center gap-3 border-b border-warm-100">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Ota-ona yoki bola bo'yicha..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-warm-300 rounded-[10px] bg-white outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 placeholder:text-charcoal-400 transition-colors"
            />
          </div>
          <div className="w-48">
            <Select
              value={methodFilter}
              onChange={e => setMethodFilter(e.target.value)}
              options={[
                { value: '', label: 'Barcha usullar' },
                { value: 'CASH', label: 'Naqd' },
                { value: 'CARD', label: 'Karta' },
                { value: 'TRANSFER', label: "Bank o'tkazma" },
              ]}
              aria-label="To'lov usuli bo'yicha filter"
            />
          </div>
          <span className="ml-auto text-xs text-charcoal-400">{filtered.length} ta to'lov</span>
        </div>
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={r => r.id}
          emptyTitle="To'lovlar topilmadi"
          emptyIcon={<Wallet className="w-5 h-5" />}
        />
      </Card>

      {/* Create payment modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="To'lov qabul qilish"
        description="Ota-onadan to'lov qabul qilish"
        size="md"
      >
        <CreatePaymentForm
          onSuccess={() => setShowCreate(false)}
          onCancel={() => setShowCreate(false)}
          createdBy={currentUser?.id ?? 'admin-1'}
        />
      </Modal>
    </div>
  );
}

// ─── Create Payment Form ──────────────────────────────────

function CreatePaymentForm({ onSuccess, onCancel, createdBy }: { onSuccess: () => void; onCancel: () => void; createdBy: string }) {
  const parents = useStore(s => s.parents);
  const children = useStore(s => s.children);
  const recordPayment = useStore(s => s.recordPayment);

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { method: 'CASH', date: new Date().toISOString().split('T')[0] },
  });

  const selectedParentId = useWatch({ control, name: 'parentId' });
  const parentChildren = children.filter(c => c.parentId === selectedParentId);

  const onSubmit = async (data: PaymentForm) => {
    await new Promise(r => setTimeout(r, 300));
    recordPayment({
      parentId: data.parentId,
      childId: data.childId || undefined,
      amount: Number(data.amount),
      method: data.method,
      date: new Date(`${data.date}T12:00:00+05:00`).toISOString(),
      notes: data.notes,
      createdBy,
    });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Select
        label="Ota-ona"
        required
        placeholder="Ota-onani tanlang"
        options={parents.map(p => ({ value: p.id, label: `${p.fullName} (${p.phone})` }))}
        error={errors.parentId?.message}
        {...register('parentId')}
      />
      {selectedParentId && parentChildren.length > 0 && (
        <Select
          label="Bola (ixtiyoriy)"
          placeholder="Bolani tanlang"
          options={parentChildren.map(c => ({ value: c.id, label: c.fullName }))}
          {...register('childId')}
        />
      )}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Summa (so'm)"
          required
          type="number"
          placeholder="1000000"
          min="1000"
          error={errors.amount?.message}
          hint="UZS da kiriting"
          {...register('amount')}
        />
        <Select
          label="To'lov usuli"
          required
          options={[
            { value: 'CASH', label: 'Naqd pul' },
            { value: 'CARD', label: 'Karta' },
            { value: 'TRANSFER', label: "Bank o'tkazma" },
          ]}
          error={errors.method?.message}
          {...register('method')}
        />
      </div>
      <Input
        type="date"
        label="To'lov sanasi"
        required
        error={errors.date?.message}
        {...register('date')}
      />
      <Textarea
        label="Izoh (ixtiyoriy)"
        placeholder="Qo'shimcha ma'lumot..."
        rows={2}
        {...register('notes')}
      />
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>Bekor qilish</Button>
        <Button type="submit" loading={isSubmitting}>To'lovni saqlash</Button>
      </div>
    </form>
  );
}
