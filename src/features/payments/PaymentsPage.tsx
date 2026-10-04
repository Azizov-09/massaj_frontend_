// ═══════════════════════════════════════════════════════
//  Payments Page — Senior Medical/Wellness CRM Table standard
// ═══════════════════════════════════════════════════════
import { useState, useMemo } from 'react';
import {
  Plus, Search, Wallet, TrendingUp, Receipt, Calendar,
  CreditCard, Banknote, ArrowLeftRight, Clock, X, Eye,
  CheckCircle2, Printer, Baby, User, ArrowRight
} from 'lucide-react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStore, useAuth } from '@/store';
import {
  formatDateTime, formatCurrency, formatCurrencyCompact,
  getPaymentMethodLabel, cn
} from '@/utils';
import { DataTable, Column, getAvatarGradient } from '@/components/tables/DataTable';
import { Card, Badge, Avatar } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PageHeader, KpiCard } from '@/components/ui/KpiCard';
import { Input, Select, Textarea, DatePicker } from '@/components/ui/primitives';
import type { Payment, PaymentMethod } from '@/types';

const paymentSchema = z.object({
  parentId: z.string().min(1, 'Ota-onani tanlang'),
  childId: z.string().optional(),
  amount: z.string().min(1, "Summani kiriting").refine(v => !isNaN(Number(v)) && Number(v) > 0, "To'g'ri summa kiriting"),
  method: z.enum(['CASH', 'CARD', 'TRANSFER']),
  date: z.string().min(1, 'Sanani kiriting'),
  notes: z.string().optional(),
});

type PaymentForm = z.infer<typeof paymentSchema>;

type MethodFilter = 'ALL' | 'CASH' | 'CARD' | 'TRANSFER';

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
  const [activeTab, setActiveTab] = useState<MethodFilter>('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Tab counts
  const cashCount = useMemo(() => basePayments.filter(p => p.method === 'CASH').length, [basePayments]);
  const cardCount = useMemo(() => basePayments.filter(p => p.method === 'CARD').length, [basePayments]);
  const transferCount = useMemo(() => basePayments.filter(p => p.method === 'TRANSFER').length, [basePayments]);

  const filtered = useMemo(() => {
    let result = [...basePayments].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => {
        const parent = parents.find(pa => pa.id === p.parentId);
        const child = children.find(c => c.id === p.childId);
        return (
          parent?.fullName?.toLowerCase().includes(q) ||
          child?.fullName?.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.notes?.toLowerCase().includes(q)
        );
      });
    }
    if (activeTab !== 'ALL') {
      result = result.filter(p => p.method === activeTab);
    }
    return result;
  }, [basePayments, search, activeTab, parents, children]);

  // KPI metrics
  const todayPrefix = useMemo(() => new Date().toISOString().split('T')[0], []);
  const monthPrefix = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const totalPayments = basePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const todayPayments = basePayments
    .filter(p => (p.date || '').startsWith(todayPrefix))
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const thisMonthPayments = basePayments
    .filter(p => (p.date || '').startsWith(monthPrefix))
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const filteredSum = useMemo(() => filtered.reduce((s, p) => s + p.amount, 0), [filtered]);

  const hasActiveFilters = search !== '' || activeTab !== 'ALL';

  const resetFilters = () => {
    setSearch('');
    setActiveTab('ALL');
  };

  const getMethodBadge = (method: PaymentMethod) => {
    switch (method) {
      case 'CASH':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <Banknote className="w-3 h-3 text-emerald-600 shrink-0" />
            Naqd pul
          </span>
        );
      case 'CARD':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
            <CreditCard className="w-3 h-3 text-blue-600 shrink-0" />
            Plastik karta
          </span>
        );
      case 'TRANSFER':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
            <ArrowLeftRight className="w-3 h-3 text-amber-600 shrink-0" />
            Bank o'tkazma
          </span>
        );
      default:
        return <Badge>{getPaymentMethodLabel(method)}</Badge>;
    }
  };

  const columns: Column<Payment>[] = [
    {
      key: 'parentId',
      header: 'To\'lovchi (Ota-ona)',
      sortable: true,
      cell: (row) => {
        const parent = parents.find(p => p.id === row.parentId);
        return (
          <div className="flex items-center gap-2.5">
            <Avatar name={parent?.fullName || 'Ota-ona'} size="sm" className="font-semibold" />
            <div className="min-w-0">
              <p className="font-semibold text-charcoal-900 text-sm tracking-tight truncate hover:text-brand-700 transition-colors">
                {parent?.fullName ?? 'Noma\'lum ota-ona'}
              </p>
              {parent?.phone && (
                <p className="text-xs text-charcoal-400">{parent.phone}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'childId',
      header: 'Bola',
      cell: (row) => {
        const child = children.find(c => c.id === row.childId);
        return child ? (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] bg-brand-50/70 border border-brand-200/50 text-xs font-medium text-brand-800">
            <Baby className="w-3 h-3 text-brand-600 shrink-0" />
            <span className="truncate max-w-[130px]">{child.fullName}</span>
          </div>
        ) : (
          <span className="text-xs text-charcoal-400 font-medium">Umumiy hisobga</span>
        );
      },
    },
    {
      key: 'amount',
      header: 'To\'langan summa',
      sortable: true,
      cell: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 tabular-nums">
          + {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: 'method',
      header: 'To\'lov usuli',
      sortable: true,
      cell: (row) => getMethodBadge(row.method),
    },
    {
      key: 'date',
      header: 'Sana va Vaqt',
      sortable: true,
      cell: (row) => (
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-1.5 text-xs text-charcoal-800 font-medium">
            <Calendar className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span>{formatDateTime(row.date).split(' ')[0]}</span>
          </div>
          <p className="text-[11px] text-charcoal-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatDateTime(row.date).split(' ')[1] || ''}</span>
          </p>
        </div>
      ),
    },
    {
      key: 'notes',
      header: 'Izoh',
      cell: (row) => (
        <span className="text-xs text-charcoal-500 max-w-[150px] truncate block" title={row.notes}>
          {row.notes || '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Kvitansiya',
      cell: (row) => (
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPayment(row);
            }}
            className="h-8 px-2.5 text-xs text-charcoal-600 hover:text-brand-700 hover:bg-brand-50/60"
            title="Kvitansiyani ko'rish"
          >
            <Receipt className="w-3.5 h-3.5 mr-1 text-brand-600" />
            Chek
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-5">
      <PageHeader
        icon={<CreditCard className="w-5 h-5 text-white" />}
        title={isParent ? "To'lovlarim tarixi" : "To'lovlar"}
        description={
          isParent
            ? "Farzandlaringiz uchun amalga oshirilgan to'lovlar va kvitansiyalar"
            : `Tizimdagi barcha to'lovlar ro'yxati va kvitansiyalar`
        }
        actions={
          canManagePayments ? (
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)} className="w-full sm:w-auto">
              To'lov qabul qilish
            </Button>
          ) : undefined
        }
      />

      {/* 4 Balanced KPI Cards (hidden on mobile for clean list view) */}
      <div className="hidden md:grid md:grid-cols-4 gap-3.5">
        <KpiCard
          label="Jami tushum"
          value={totalPayments}
          format="currency"
          description="Barcha to'lovlar summasi"
          icon={<Wallet className="w-4 h-4 text-brand-600" />}
          accentColor="brand"
          index={0}
        />
        <KpiCard
          label="Bu oy tushumi"
          value={thisMonthPayments}
          format="currency"
          description="Joriy oydagi to'lovlar"
          icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
          accentColor="sage"
          index={1}
        />
        <KpiCard
          label="Bugungi to'lovlar"
          value={todayPayments}
          format="currency"
          description="Bugungi tushum"
          icon={<Calendar className="w-4 h-4 text-amber-500" />}
          accentColor="gold"
          index={2}
        />
        <KpiCard
          label="To'lovlar soni"
          value={basePayments.length}
          format="number"
          description="Tranzaksiyalar soni"
          icon={<Receipt className="w-4 h-4 text-blue-500" />}
          accentColor="blue"
          index={3}
        />
      </div>

      <Card className="overflow-visible border border-warm-200/90 shadow-xs">
        {/* Quick Tabs — Desktop/tablet filter pills */}
        <div className="hidden sm:flex items-center gap-1.5 px-4 py-3 border-b border-warm-200/70 overflow-x-auto touch-scroll-x scrollbar-thin w-full bg-warm-50/30">
          <button
            onClick={(e) => {
              setActiveTab('ALL');
              e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
            }}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer select-none",
              activeTab === 'ALL'
                ? "bg-brand-600 text-white shadow-xs"
                : "text-charcoal-600 hover:bg-warm-100 hover:text-charcoal-900"
            )}
          >
            Barchasi
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
              activeTab === 'ALL' ? "bg-white/20 text-white" : "bg-warm-200 text-charcoal-600"
            )}>
              {basePayments.length}
            </span>
          </button>

          <button
            onClick={(e) => {
              setActiveTab('CASH');
              e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
            }}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer select-none",
              activeTab === 'CASH'
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-charcoal-600 hover:bg-emerald-50 hover:text-emerald-800"
            )}
          >
            Naqd pul
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
              activeTab === 'CASH' ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
            )}>
              {cashCount}
            </span>
          </button>

          <button
            onClick={(e) => {
              setActiveTab('CARD');
              e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
            }}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer select-none",
              activeTab === 'CARD'
                ? "bg-blue-600 text-white shadow-xs"
                : "text-charcoal-600 hover:bg-blue-50 hover:text-blue-800"
            )}
          >
            Plastik karta
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
              activeTab === 'CARD' ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800"
            )}>
              {cardCount}
            </span>
          </button>

          <button
            onClick={(e) => {
              setActiveTab('TRANSFER');
              e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
            }}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer select-none",
              activeTab === 'TRANSFER'
                ? "bg-amber-600 text-white shadow-xs"
                : "text-charcoal-600 hover:bg-amber-50 hover:text-amber-800"
            )}
          >
            Bank o'tkazma
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
              activeTab === 'TRANSFER' ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
            )}>
              {transferCount}
            </span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-3 sm:p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-warm-100 bg-warm-50/40">
          <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1 w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Ota-ona, bola yoki to'lov izohi..."
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

            <div className="w-full sm:w-auto min-w-[200px]">
              <Select
                size="sm"
                value={activeTab}
                onChange={e => setActiveTab(e.target.value as MethodFilter)}
                triggerClassName="h-9 rounded-[10px] text-xs font-medium border-warm-300 shadow-2xs w-full"
                options={[
                  { value: 'ALL', label: `Barcha to'lovlar (${basePayments.length})` },
                  { value: 'CASH', label: `Naqd pul (${cashCount})` },
                  { value: 'CARD', label: `Plastik karta (${cardCount})` },
                  { value: 'TRANSFER', label: `Bank o'tkazma (${transferCount})` },
                ]}
                aria-label="To'lov usuli bo'yicha filter"
              />
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-9 px-2.5 text-xs text-charcoal-500 hover:text-charcoal-800 w-full sm:w-auto justify-center"
              >
                Filtrni tozalash
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3 text-xs text-charcoal-500">
            <span>
              Ko'rsatilmoqda: <strong className="text-charcoal-900 font-semibold">{filtered.length}</strong> / {basePayments.length}
            </span>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={r => r.id}
          onRowClick={(p) => setSelectedPayment(p)}
          tableClassName="min-w-[900px]"
          mobileCardConfig={(row, index) => {
            const parent = parents.find(p => p.id === row.parentId);
            const child = children.find(c => c.id === row.childId);
            const initials = parent?.fullName
              ? parent.fullName.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
              : 'T';

            return {
              avatarText: initials,
              avatarGradient: getAvatarGradient(index, parent?.fullName),
              title: parent?.fullName ?? "Noma'lum ota-ona",
              subtitle: child ? `${child.fullName} uchun • ${formatDateTime(row.date)}` : formatDateTime(row.date),
              status: (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 tabular-nums">
                  +{formatCurrencyCompact(row.amount)}
                </span>
              ),
              details: [
                {
                  label: 'To‘lov usuli',
                  value: getPaymentMethodLabel(row.method)
                },
                {
                  label: 'To‘liq summa',
                  value: <span className="font-mono font-bold text-emerald-700">{formatCurrency(row.amount)}</span>
                },
                {
                  label: 'Telefon',
                  value: parent?.phone ? (
                    <a href={`tel:${parent.phone}`} onClick={e => e.stopPropagation()} className="text-brand-600 font-mono text-xs">
                      {parent.phone}
                    </a>
                  ) : 'Mavjud emas'
                },
                {
                  label: 'Izoh',
                  value: row.notes || '—'
                }
              ],
              actions: (
                <div className="flex flex-wrap items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => setSelectedPayment(row)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-warm-200 bg-white text-charcoal-700 text-xs font-medium hover:bg-warm-50 active:bg-warm-100 shadow-2xs cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5 text-brand-600" />
                    Chek / Kvitansiya
                  </button>
                </div>
              )
            };
          }}
          emptyTitle="To'lovlar topilmadi"
          emptyDescription={
            hasActiveFilters
              ? "Qidiruv parametrlariga mos keluvchi to'lov topilmadi. Filtrni tozalab ko'ring."
              : "Hozircha tizimda to'lovlar qayd etilmagan."
          }
          emptyIcon={<Wallet className="w-5 h-5" />}
          emptyAction={
            hasActiveFilters ? (
              <Button size="sm" variant="secondary" onClick={resetFilters} leftIcon={<X className="w-3.5 h-3.5" />}>
                Filtrlarni tozalash
              </Button>
            ) : canManagePayments ? (
              <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowCreate(true)}>
                To'lov qabul qilish
              </Button>
            ) : undefined
          }
        />

        {/* Footer Summary */}
        <div className="px-4 py-3 bg-warm-50/70 border-t border-warm-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-charcoal-500">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Ko'rsatilgan to'lovlar summasi: <strong className="text-emerald-700 font-semibold tabular-nums">{formatCurrency(filteredSum)}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-500" />
              O'rtacha to'lov: <strong className="text-charcoal-800 font-semibold tabular-nums">
                {filtered.length > 0 ? formatCurrencyCompact(Math.round(filteredSum / filtered.length)) : '0'}
              </strong>
            </span>
          </div>
          <span className="text-[11px] text-charcoal-400">
            Qator ustiga bosib kvitansiya (chek) tafsilotlarini ko'rishingiz mumkin
          </span>
        </div>
      </Card>

      {/* Payment Receipt Modal */}
      {selectedPayment && (
        <Modal
          isOpen={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          title="To'lov kvitansiyasi (Kassa cheki)"
          size="md"
        >
          <div className="space-y-4">
            {/* Printable Receipt Paper */}
            <div className="p-5 rounded-2xl bg-white border border-warm-200/80 shadow-xs space-y-4">
              <div className="text-center pb-3 border-b border-dashed border-warm-200">
                <p className="text-xs uppercase tracking-widest text-charcoal-400 font-bold">
                  MASSAJ BOLALAR REABILITATSIYA MARKAZI
                </p>
                <h3 className="text-lg font-bold text-charcoal-900 mt-1">
                  KIRIM TO'LOV KVITANSIYASI
                </h3>
                <p className="text-[11px] font-mono text-charcoal-500 mt-0.5">
                  Chek № {selectedPayment.id}
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-warm-100">
                  <span className="text-charcoal-500">Ota-ona:</span>
                  <span className="font-semibold text-charcoal-900">
                    {parents.find(p => p.id === selectedPayment.parentId)?.fullName || 'Noma\'lum'}
                  </span>
                </div>
                {selectedPayment.childId && (
                  <div className="flex justify-between py-1 border-b border-warm-100">
                    <span className="text-charcoal-500">Bola:</span>
                    <span className="font-semibold text-charcoal-900">
                      {children.find(c => c.id === selectedPayment.childId)?.fullName || '—'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-warm-100">
                  <span className="text-charcoal-500">To'lov sanasi:</span>
                  <span className="font-semibold text-charcoal-900">
                    {formatDateTime(selectedPayment.date)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-warm-100">
                  <span className="text-charcoal-500">To'lov usuli:</span>
                  <span className="font-semibold text-charcoal-900">
                    {getPaymentMethodLabel(selectedPayment.method)}
                  </span>
                </div>
                {selectedPayment.notes && (
                  <div className="flex justify-between py-1 border-b border-warm-100">
                    <span className="text-charcoal-500">Izoh:</span>
                    <span className="text-charcoal-700 italic max-w-[200px] text-right">
                      {selectedPayment.notes}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800">Qabul qilingan summa:</span>
                <span className="text-lg font-bold text-emerald-700 tabular-nums">
                  {formatCurrency(selectedPayment.amount)}
                </span>
              </div>

              <div className="text-center pt-2 text-[10px] text-charcoal-400">
                To'lov rasmiylashtirildi • Tizimda tasdiqlangan
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Printer className="w-3.5 h-3.5" />}
                onClick={() => window.print()}
              >
                Chop etish
              </Button>
              <Button variant="secondary" onClick={() => setSelectedPayment(null)}>
                Yopish
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create payment modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="To'lov qabul qilish"
        description="Ota-onadan to'lov qabul qilish va kvitansiya shakllantirish"
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

function CreatePaymentForm({
  onSuccess,
  onCancel,
  createdBy,
}: {
  onSuccess: () => void;
  onCancel: () => void;
  createdBy: string;
}) {
  const parents = useStore(s => s.parents);
  const children = useStore(s => s.children);
  const recordPayment = useStore(s => s.recordPayment);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { method: 'CASH', date: new Date().toISOString().split('T')[0] },
  });

  const selectedParentId = useWatch({ control, name: 'parentId' });
  const parentChildren = children.filter(c => c.parentId === selectedParentId);

  const onSubmit = async (data: PaymentForm) => {
    try {
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
    } catch (err: unknown) {
      console.error('Payment record error:', err);
    }
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
          placeholder="Masalan: 150000"
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
      <Controller
        control={control}
        name="date"
        render={({ field }) => (
          <DatePicker
            label="To'lov sanasi"
            required
            error={errors.date?.message}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
      <Textarea
        label="Izoh (ixtiyoriy)"
        placeholder="Qo'shimcha ma'lumot..."
        rows={2}
        {...register('notes')}
      />
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Bekor qilish
        </Button>
        <Button type="submit" loading={isSubmitting}>
          To'lovni saqlash
        </Button>
      </div>
    </form>
  );
}
