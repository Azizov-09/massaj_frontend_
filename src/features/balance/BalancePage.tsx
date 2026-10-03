// ═══════════════════════════════════════════════════════
//  Balance Page — Senior Medical/Wellness CRM Table standard
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  Wallet, TrendingUp, AlertTriangle, CheckCircle2,
  Search, CreditCard, X, Baby, Phone, ArrowUpRight,
  AlertCircle
} from 'lucide-react';
import { useStore, useAuth } from '@/store';
import { formatCurrency, formatCurrencyCompact, cn } from '@/utils';
import { calculateParentBalance } from '@/services/finance.service';
import { Card, Badge, Avatar, Select } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader, KpiCard } from '@/components/ui/KpiCard';
import { DataTable, Column } from '@/components/tables/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/primitives';

interface ParentBalanceRow {
  parentId: string;
  parentName: string;
  phone: string;
  childrenNames: string[];
  totalBalance: number;
  totalDebt: number;
  netStatus: 'DEBT' | 'DEPOSIT' | 'ZERO';
}

export function BalancePage() {
  const { currentUser } = useAuth();
  const parents = useStore(s => s.parents);
  const children = useStore(s => s.children);
  const transactions = useStore(s => s.transactions);
  const recordPayment = useStore(s => s.recordPayment);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DEBT' | 'DEPOSIT' | 'ZERO'>('ALL');
  const [paymentModalParent, setPaymentModalParent] = useState<ParentBalanceRow | null>(null);

  // Payment form state
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'CASH' | 'CARD' | 'TRANSFER'>('CASH');
  const [payNotes, setPayNotes] = useState('');

  const isParent = currentUser?.role === 'PARENT';
  const effectiveParents = useMemo(() => {
    if (isParent && currentUser) {
      return parents.filter(p => p.id === currentUser.id);
    }
    return parents;
  }, [parents, isParent, currentUser]);

  // Calculate balances for each parent
  const parentRows: ParentBalanceRow[] = useMemo(() => {
    return effectiveParents.map(p => {
      const parentChildren = children.filter(c => c.parentId === p.id);
      const childIds = parentChildren.map(c => c.id);
      const { balance, debt } = calculateParentBalance(p.id, childIds, transactions);

      let netStatus: 'DEBT' | 'DEPOSIT' | 'ZERO' = 'ZERO';
      if (debt > 0) netStatus = 'DEBT';
      else if (balance > 0) netStatus = 'DEPOSIT';

      return {
        parentId: p.id,
        parentName: p.fullName,
        phone: p.phone,
        childrenNames: parentChildren.map(c => c.fullName),
        totalBalance: balance,
        totalDebt: debt,
        netStatus,
      };
    });
  }, [effectiveParents, children, transactions]);

  // Counts for tabs
  const tabCounts = useMemo(() => {
    let debtCount = 0;
    let depositCount = 0;
    let zeroCount = 0;

    parentRows.forEach(r => {
      if (r.netStatus === 'DEBT') debtCount++;
      else if (r.netStatus === 'DEPOSIT') depositCount++;
      else zeroCount++;
    });

    return {
      all: parentRows.length,
      debt: debtCount,
      deposit: depositCount,
      zero: zeroCount,
    };
  }, [parentRows]);

  // Overall KPI metrics
  const kpis = useMemo(() => {
    let totalDeposit = 0;
    let totalDebt = 0;
    let debtClients = 0;

    parentRows.forEach(r => {
      totalDeposit += r.totalBalance;
      totalDebt += r.totalDebt;
      if (r.totalDebt > 0) debtClients++;
    });

    return { totalDeposit, totalDebt, debtClients, totalClients: parentRows.length };
  }, [parentRows]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return parentRows.filter(r => {
      if (statusFilter !== 'ALL' && r.netStatus !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.parentName.toLowerCase().includes(q) ||
          r.phone.includes(q) ||
          r.childrenNames.some(c => c.toLowerCase().includes(q))
        );
      }
      return true;
    }).sort((a, b) => b.totalDebt - a.totalDebt); // Most in debt first
  }, [parentRows, statusFilter, search]);

  const hasActiveFilters = search !== '' || statusFilter !== 'ALL';

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalParent || !payAmount) return;

    recordPayment({
      parentId: paymentModalParent.parentId,
      amount: Number(payAmount),
      method: payMethod,
      date: new Date().toISOString(),
      notes: payNotes || 'Balans orqali to‘lov',
      createdBy: currentUser?.id ?? 'admin-1',
    });

    setPaymentModalParent(null);
    setPayAmount('');
    setPayNotes('');
  };

  const columns: Column<ParentBalanceRow>[] = [
    {
      key: 'parentName',
      header: 'Ota-ona',
      sortable: true,
      cell: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.parentName} size="sm" className="font-semibold" />
          <div className="min-w-0">
            <h5 className="font-semibold text-charcoal-900 text-sm tracking-tight truncate hover:text-brand-700 transition-colors">
              {r.parentName}
            </h5>
            <p className="text-xs text-charcoal-400 mt-0.5 flex items-center gap-1">
              <Phone className="w-3 h-3" />
              <span>{r.phone}</span>
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'childrenNames',
      header: 'Farzandlari',
      cell: (r) => (
        <div className="flex flex-wrap gap-1 max-w-[240px]">
          {r.childrenNames.length === 0 ? (
            <span className="text-xs text-charcoal-300">—</span>
          ) : (
            r.childrenNames.map((name, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-[6px] bg-brand-50/70 border border-brand-200/50 text-brand-800 font-medium"
              >
                <Baby className="w-2.5 h-2.5 text-brand-600" />
                <span className="truncate max-w-[100px]">{name}</span>
              </span>
            ))
          )}
        </div>
      ),
    },
    {
      key: 'totalBalance',
      header: 'Mavjud depozit',
      sortable: true,
      cell: (r) => (
        <div>
          {r.totalBalance > 0 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[6px] bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-bold text-xs tabular-nums">
              <Wallet className="w-3 h-3 text-emerald-600" />
              +{formatCurrency(r.totalBalance)}
            </span>
          ) : (
            <span className="text-xs text-charcoal-400 font-medium">0 so‘m</span>
          )}
        </div>
      ),
    },
    {
      key: 'totalDebt',
      header: 'Qarzdorlik',
      sortable: true,
      cell: (r) => (
        <div>
          {r.totalDebt > 0 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[6px] bg-danger-50 text-danger-main border border-danger-100 font-bold text-xs tabular-nums">
              <AlertCircle className="w-3 h-3 text-danger-500" />
              -{formatCurrency(r.totalDebt)}
            </span>
          ) : (
            <span className="text-xs text-charcoal-400 font-medium">0 so‘m</span>
          )}
        </div>
      ),
    },
    {
      key: 'netStatus',
      header: 'Holat',
      sortable: true,
      cell: (r) => {
        if (r.netStatus === 'DEBT') {
          return (
            <Badge className="bg-rose-50 text-rose-700 border-rose-200/60" dot>
              Qarzdor
            </Badge>
          );
        }
        if (r.netStatus === 'DEPOSIT') {
          return (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200/60" dot>
              Ortiqcha to‘lov
            </Badge>
          );
        }
        return (
          <Badge className="bg-warm-100 text-charcoal-600 border-warm-200" dot>
            Nol balans
          </Badge>
        );
      },
    },
    {
      key: 'parentId',
      header: 'Amal',
      cell: (r) => {
        const canManagePayments = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';
        if (canManagePayments) {
          return (
            <Button
              size="xs"
              variant="secondary"
              leftIcon={<CreditCard className="w-3.5 h-3.5" />}
              onClick={(e) => {
                e.stopPropagation();
                setPaymentModalParent(r);
                setPayAmount(r.totalDebt > 0 ? String(r.totalDebt) : '');
              }}
              className="h-7 text-xs font-semibold"
            >
              To‘lov olish
            </Button>
          );
        }
        if (isParent) {
          return <span className="text-xs text-charcoal-400">Mening hisobim</span>;
        }
        return <span className="text-xs text-charcoal-400">—</span>;
      },
    },
  ];

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-6">
      <PageHeader
        title={isParent ? "Mening hisobim va balansim" : "Mijozlar balansi va qarzdorlik"}
        description={
          isParent
            ? "Sizning depozit qoldig'ingiz va ko'rsatilgan muolajalar hisoboti"
            : "Ota-onalar va bolalar kesimida joriy depozit hamda qarz hisob-kitoblari"
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KpiCard
          label="Jami depozit mablag‘i"
          value={formatCurrencyCompact(kpis.totalDeposit)}
          description="Mijozlar hisobidagi ortiqcha to'lov"
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          accentColor="sage"
          changeType="positive"
          index={0}
        />
        <KpiCard
          label="Jami haqiqiy qarz"
          value={formatCurrencyCompact(kpis.totalDebt)}
          description="Markazga to'lanishi lozim summa"
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          accentColor="danger"
          changeType={kpis.totalDebt > 0 ? 'negative' : 'positive'}
          index={1}
        />
        <KpiCard
          label="Qarzdor mijozlar"
          value={`${kpis.debtClients} ta`}
          description={`${kpis.totalClients} ta mijozdan`}
          icon={<Wallet className="w-5 h-5 text-amber-500" />}
          accentColor="gold"
          index={2}
        />
        <KpiCard
          label="Moliyaviy intizom"
          value={`${Math.round(((kpis.totalClients - kpis.debtClients) / (kpis.totalClients || 1)) * 100)}%`}
          description="To'lov intizomi ko'rsatkichi"
          icon={<CheckCircle2 className="w-5 h-5 text-brand-600" />}
          accentColor="brand"
          index={3}
        />
      </div>

      <Card className="overflow-hidden border border-warm-200/90 shadow-xs">
        {/* Quick Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-warm-200/70 overflow-x-auto touch-scroll-x scrollbar-thin w-full">
          <button
            onClick={(e) => {
              setStatusFilter('ALL');
              e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
            }}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer select-none",
              statusFilter === 'ALL'
                ? "bg-brand-600 text-white shadow-xs"
                : "text-charcoal-600 hover:bg-warm-100 hover:text-charcoal-900"
            )}
          >
            Barchasi
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
              statusFilter === 'ALL' ? "bg-white/20 text-white" : "bg-warm-200 text-charcoal-600"
            )}>
              {tabCounts.all}
            </span>
          </button>

          <button
            onClick={(e) => {
              setStatusFilter('DEBT');
              e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
            }}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer select-none",
              statusFilter === 'DEBT'
                ? "bg-danger-main text-white shadow-xs"
                : "text-charcoal-600 hover:bg-danger-50 hover:text-danger-main"
            )}
          >
            Qarzdorlar
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
              statusFilter === 'DEBT' ? "bg-white/20 text-white" : "bg-danger-100 text-danger-700"
            )}>
              {tabCounts.debt}
            </span>
          </button>

          <button
            onClick={(e) => {
              setStatusFilter('DEPOSIT');
              e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
            }}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer select-none",
              statusFilter === 'DEPOSIT'
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-charcoal-600 hover:bg-emerald-50 hover:text-emerald-800"
            )}
          >
            Depozitdagilar
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
              statusFilter === 'DEPOSIT' ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
            )}>
              {tabCounts.deposit}
            </span>
          </button>

          <button
            onClick={(e) => {
              setStatusFilter('ZERO');
              e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
            }}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer select-none",
              statusFilter === 'ZERO'
                ? "bg-charcoal-700 text-white shadow-xs"
                : "text-charcoal-600 hover:bg-warm-100 hover:text-charcoal-900"
            )}
          >
            Nol balans
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
              statusFilter === 'ZERO' ? "bg-white/20 text-white" : "bg-warm-200 text-charcoal-600"
            )}>
              {tabCounts.zero}
            </span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-warm-100 bg-warm-50/40">
          <div className="flex flex-1 items-center gap-2.5">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Ota-ona yoki bola ismi..."
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
              Ko'rsatilmoqda: <strong className="text-charcoal-900 font-semibold">{filteredRows.length}</strong> / {parentRows.length}
            </span>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          data={filteredRows}
          columns={columns}
          keyExtractor={r => r.parentId}
          tableClassName="min-w-[900px]"
          emptyTitle="Mijozlar balansi topilmadi"
          emptyDescription="Qidiruv shartlarini o‘zgartiring yoki filtrni tozalang."
          emptyIcon={<Wallet className="w-5 h-5" />}
        />

        {/* Footer Summary */}
        <div className="px-4 py-3 bg-warm-50/70 border-t border-warm-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-charcoal-500">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-500" />
              Mijozlar: <strong className="text-charcoal-800 font-semibold">{parentRows.length} nafar</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Jami depozit: <strong className="text-emerald-700 font-semibold tabular-nums">{formatCurrency(kpis.totalDeposit)}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-danger-500" />
              Jami qarz: <strong className="text-danger-main font-semibold tabular-nums">{formatCurrency(kpis.totalDebt)}</strong>
            </span>
          </div>
          <span className="text-[11px] text-charcoal-400">
            "To'lov olish" tugmasi orqali tezkor to'lov qayd etish mumkin
          </span>
        </div>
      </Card>

      {/* ─── Quick Payment Modal ─── */}
      <Modal
        isOpen={!!paymentModalParent}
        onClose={() => setPaymentModalParent(null)}
        title="To‘lov qabul qilish"
        size="md"
      >
        {paymentModalParent && (
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="p-3.5 rounded-[14px] bg-warm-50/80 border border-warm-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-charcoal-900">{paymentModalParent.parentName}</h4>
                <p className="text-xs text-charcoal-500">{paymentModalParent.phone}</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-charcoal-400 block">Joriy qarz</span>
                <span className="text-sm font-extrabold text-danger-main">
                  {formatCurrency(paymentModalParent.totalDebt)}
                </span>
              </div>
            </div>

            <Input
              label="To‘lov miqdori (UZS)"
              required
              type="number"
              placeholder="100000"
              value={payAmount}
              onChange={e => setPayAmount(e.target.value)}
            />

            <Select
              label="To‘lov usuli"
              value={payMethod}
              onChange={e => setPayMethod(e.target.value as 'CASH' | 'CARD' | 'TRANSFER')}
            >
              <option value="CASH">Naqd pul</option>
              <option value="CARD">Bank kartasi (Uzcard / Humo)</option>
              <option value="TRANSFER">Bank o‘tkazmasi (Hisob raqam)</option>
            </Select>

            <Textarea
              label="Izoh (ixtiyoriy)"
              rows={2}
              placeholder="Kvitansiya raqami yoki eslatma..."
              value={payNotes}
              onChange={e => setPayNotes(e.target.value)}
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-warm-100">
              <Button variant="secondary" type="button" onClick={() => setPaymentModalParent(null)}>
                Bekor qilish
              </Button>
              <Button type="submit">
                To‘lovni tasdiqlash
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
