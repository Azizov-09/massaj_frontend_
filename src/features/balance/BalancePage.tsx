// ═══════════════════════════════════════════════════════
//  Balance Page — Client Balance & Debt Analysis
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  Wallet, TrendingUp, AlertTriangle, CheckCircle2,
  Search, CreditCard
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
      title: 'Ota-ona',
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.parentName} size="sm" />
          <div>
            <h5 className="font-semibold text-charcoal-900 text-xs sm:text-sm">{r.parentName}</h5>
            <p className="text-[11px] text-charcoal-400">{r.phone}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'childrenNames',
      title: 'Farzandlari',
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.childrenNames.length === 0 ? (
            <span className="text-xs text-charcoal-300">—</span>
          ) : (
            r.childrenNames.map((name, i) => (
              <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-warm-100 text-charcoal-700 font-medium">
                {name}
              </span>
            ))
          )}
        </div>
      ),
    },
    {
      key: 'totalBalance',
      title: 'Mavjud depozit (Balans)',
      render: (r) => (
        <span className={cn('text-xs sm:text-sm font-bold tabular-nums', r.totalBalance > 0 ? 'text-sage-600' : 'text-charcoal-400')}>
          {r.totalBalance > 0 ? `+${formatCurrency(r.totalBalance)}` : '0 so‘m'}
        </span>
      ),
    },
    {
      key: 'totalDebt',
      title: 'Qarzdorlik',
      render: (r) => (
        <span className={cn('text-xs sm:text-sm font-bold tabular-nums', r.totalDebt > 0 ? 'text-danger-main' : 'text-charcoal-400')}>
          {r.totalDebt > 0 ? `-${formatCurrency(r.totalDebt)}` : '0 so‘m'}
        </span>
      ),
    },
    {
      key: 'netStatus',
      title: 'Holat',
      render: (r) => {
        if (r.netStatus === 'DEBT') {
          return <Badge variant="danger">Qarzdor</Badge>;
        }
        if (r.netStatus === 'DEPOSIT') {
          return <Badge variant="success">Ortiqcha to‘lov</Badge>;
        }
        return <Badge variant="neutral">Nol balans</Badge>;
      },
    },
    {
      key: 'parentId',
      title: 'Amal',
      render: (r) => {
        const canManagePayments = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';
        if (canManagePayments) {
          return (
            <Button
              size="xs"
              variant="secondary"
              leftIcon={<CreditCard className="w-3.5 h-3.5" />}
              onClick={() => {
                setPaymentModalParent(r);
                setPayAmount(r.totalDebt > 0 ? String(r.totalDebt) : '');
              }}
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
        description={isParent ? "Sizning depozit qoldig'ingiz va ko'rsatilgan xizmatlar hisobi" : "Ota-onalar va bolalar kesimida joriy depozit hamda qarz hisob-kitoblari"}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Jami depozit mablag‘i"
          value={formatCurrencyCompact(kpis.totalDeposit)}
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          changeType="positive"
        />
        <KpiCard
          label="Jami haqiqiy qarz"
          value={formatCurrencyCompact(kpis.totalDebt)}
          icon={<AlertTriangle className="w-5 h-5 text-danger-main" />}
          changeType={kpis.totalDebt > 0 ? 'negative' : 'positive'}
        />
        <KpiCard
          label="Qarzdor mijozlar"
          value={`${kpis.debtClients} ta`}
          change={`${kpis.totalClients} tadan`}
          icon={<Wallet className="w-5 h-5 text-amber-500" />}
        />
        <KpiCard
          label="Moliyaviy barqarorlik"
          value={`${Math.round(((kpis.totalClients - kpis.debtClients) / (kpis.totalClients || 1)) * 100)}%`}
          icon={<CheckCircle2 className="w-5 h-5 text-brand-500" />}
        />
      </div>

      {/* Controls & Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Ota-ona yoki bola ismi..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs border border-warm-300 rounded-[10px] bg-white outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100/80 shadow-2xs placeholder:text-charcoal-400 transition-colors"
              />
            </div>

            {/* Status pills */}
            <div className="flex items-center h-9 p-1 rounded-[10px] bg-warm-100/90 border border-warm-200/80 shadow-2xs gap-1">
              {(['ALL', 'DEBT', 'DEPOSIT', 'ZERO'] as const).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={cn(
                    'h-7 px-3 text-xs font-semibold rounded-[7px] transition-all cursor-pointer',
                    statusFilter === st
                      ? 'bg-white shadow-xs text-charcoal-900'
                      : 'text-charcoal-500 hover:text-charcoal-900'
                  )}
                >
                  {st === 'ALL' ? 'Barchasi' : st === 'DEBT' ? 'Qarzdorlar' : st === 'DEPOSIT' ? 'Depozit' : 'Nol'}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs text-charcoal-400 font-medium">
            {filteredRows.length} ta ota-ona
          </span>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <DataTable
          data={filteredRows}
          columns={columns}
          keyExtractor={r => r.parentId}
          emptyTitle="Mijozlar balansi topilmadi"
          emptyDescription="Qidiruv shartlarini o‘zgartiring"
          emptyIcon={<Wallet className="w-5 h-5" />}
        />
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
            <div className="p-3.5 rounded-2xl bg-warm-50 border border-warm-100 flex items-center justify-between">
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
