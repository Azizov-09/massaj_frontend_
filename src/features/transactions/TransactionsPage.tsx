// ═══════════════════════════════════════════════════════
//  Transactions Page — General Financial Ledger
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  CreditCard, ArrowDownLeft, ArrowUpRight, Search,
  Calendar, Download, Filter, RefreshCw
} from 'lucide-react';
import { useStore } from '@/store';
import { formatCurrency, formatCurrencyCompact, formatDate, cn } from '@/utils';
import { Card, Badge, Select, EmptyState } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader, KpiCard } from '@/components/ui/KpiCard';
import { DataTable, Column } from '@/components/tables/DataTable';
import type { Transaction, TransactionType, TransactionDirection } from '@/types';

export function TransactionsPage() {
  const transactions = useStore(s => s.transactions);
  const children = useStore(s => s.children);
  const parents = useStore(s => s.parents);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [directionFilter, setDirectionFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Financial summary
  const summary = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;

    transactions.forEach(t => {
      if (t.direction === 'IN') totalIn += t.amount;
      if (t.direction === 'OUT') totalOut += t.amount;
    });

    return {
      totalIn,
      totalOut,
      net: totalIn - totalOut,
      count: transactions.length,
    };
  }, [transactions]);

  // Filtered transactions
  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (typeFilter && t.type !== typeFilter) return false;
      if (directionFilter && t.direction !== directionFilter) return false;
      if (dateFrom && t.date.split('T')[0] < dateFrom) return false;
      if (dateTo && t.date.split('T')[0] > dateTo) return false;

      if (search) {
        const q = search.toLowerCase();
        const parent = parents.find(p => p.id === t.parentId);
        const child = children.find(c => c.id === t.childId);
        return (
          t.id.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          parent?.fullName.toLowerCase().includes(q) ||
          child?.fullName.toLowerCase().includes(q)
        );
      }
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, typeFilter, directionFilter, dateFrom, dateTo, search, parents, children]);

  const handleExportCSV = () => {
    const headers = ['ID', 'Sana', 'Turi', 'Yo‘nalish', 'Miqdor', 'Ota-ona', 'Bola', 'Tavsif'];
    const rows = filtered.map(t => {
      const p = parents.find(pa => pa.id === t.parentId)?.fullName ?? '';
      const c = children.find(ch => ch.id === t.childId)?.fullName ?? '';
      const desc = t.description || '';
      return [
        t.id,
        t.date,
        t.type,
        t.direction,
        t.amount,
        `"${p.replace(/"/g, '""')}"`,
        `"${c.replace(/"/g, '""')}"`,
        `"${desc.replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tranzaksiyalar_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const columns: Column<Transaction>[] = [
    {
      key: 'id',
      header: 'Tranzaksiya',
      cell: (t: Transaction) => (
        <div>
          <span className="font-mono text-xs font-bold text-charcoal-800">{t.id}</span>
          <p className="text-[11px] text-charcoal-400">{formatDate(t.date)}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Turi',
      cell: (t: Transaction) => {
        const typeMap: Record<TransactionType, { label: string; variant: 'success' | 'warning' | 'info' | 'neutral' | 'danger' }> = {
          PAYMENT: { label: 'To‘lov', variant: 'success' },
          SESSION_CHARGE: { label: 'Seans haqi', variant: 'warning' },
          REFUND: { label: 'Qaytarish', variant: 'info' },
          ADJUSTMENT: { label: 'Tuzatish', variant: 'neutral' },
          EXPENSE: { label: 'Xarajat', variant: 'danger' },
        };
        const item = typeMap[t.type as TransactionType] || { label: t.type, variant: 'neutral' as const };
        return <Badge variant={item.variant}>{item.label}</Badge>;
      },
    },
    {
      key: 'direction',
      header: 'Yo‘nalish',
      cell: (t: Transaction) => (
        <span
          className={cn(
            'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md',
            t.direction === 'IN' ? 'bg-sage-50 text-sage-700' : 'bg-brand-50 text-brand-700'
          )}
        >
          {t.direction === 'IN' ? (
            <>
              <ArrowDownLeft className="w-3.5 h-3.5" /> Kirim
            </>
          ) : (
            <>
              <ArrowUpRight className="w-3.5 h-3.5" /> Chiqim
            </>
          )}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Miqdor',
      cell: (t: Transaction) => (
        <span
          className={cn(
            'font-bold text-sm tabular-nums',
            t.direction === 'IN' ? 'text-sage-600' : 'text-charcoal-900'
          )}
        >
          {t.direction === 'IN' ? '+' : '-'}{formatCurrency(t.amount)}
        </span>
      ),
    },
    {
      key: 'parent',
      header: 'Mijoz (Ota-ona / Bola)',
      cell: (t: Transaction) => {
        const parent = parents.find(p => p.id === t.parentId);
        const child = children.find(c => c.id === t.childId);
        return (
          <div className="text-xs">
            <p className="font-semibold text-charcoal-900">{parent?.fullName ?? '—'}</p>
            {child && <p className="text-charcoal-400">Bola: {child.fullName}</p>}
          </div>
        );
      },
    },
    {
      key: 'description',
      header: 'Tavsif',
      cell: (t: Transaction) => (
        <span className="text-xs text-charcoal-600 max-w-xs block truncate">
          {t.description || '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-6">
      <PageHeader
        title="Tranzaksiyalar kitobi"
        description="Barcha pul aylanmalari, to‘lovlar va xizmat hisoblari yagona registrda"
        actions={
          <Button
            variant="secondary"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportCSV}
          >
            CSV Eksport
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Jami tushum (Kirim)"
          value={formatCurrencyCompact(summary.totalIn)}
          icon={<ArrowDownLeft className="w-5 h-5 text-sage-600" />}
          accentColor="sage"
        />
        <KpiCard
          label="Hisoblangan (Chiqim)"
          value={formatCurrencyCompact(summary.totalOut)}
          icon={<ArrowUpRight className="w-5 h-5 text-brand-500" />}
          accentColor="brand"
        />
        <KpiCard
          label="Sof saldo"
          value={formatCurrencyCompact(summary.net)}
          icon={<CreditCard className="w-5 h-5 text-gold-500" />}
          accentColor="gold"
        />
        <KpiCard
          label="Jami operatsiyalar"
          value={summary.count}
          icon={<RefreshCw className="w-5 h-5 text-blue-500" />}
          accentColor="sage"
        />
      </div>

      {/* Controls & Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
              <input
                type="text"
                placeholder="ID, tavsif yoki ism..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 border border-warm-300 rounded-xl bg-white outline-none focus:border-brand-500"
              />
            </div>

            {/* Type Filter */}
            <div className="w-44">
              <Select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="py-1.5 text-xs"
              >
                <option value="">Barcha turlar</option>
                <option value="PAYMENT">To‘lov (Payment)</option>
                <option value="SESSION_CHARGE">Seans haqi</option>
                <option value="REFUND">Qaytarish</option>
                <option value="ADJUSTMENT">Tuzatish</option>
                <option value="EXPENSE">Xarajat</option>
              </Select>
            </div>

            {/* Direction Filter */}
            <div className="w-36">
              <Select
                value={directionFilter}
                onChange={e => setDirectionFilter(e.target.value)}
                className="py-1.5 text-xs"
              >
                <option value="">Kirim / Chiqim</option>
                <option value="IN">Faqat Kirim</option>
                <option value="OUT">Faqat Chiqim</option>
              </Select>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-1.5 text-xs">
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="border border-warm-300 rounded-xl px-2.5 py-1.5 bg-white text-charcoal-700 outline-none"
              />
              <span className="text-charcoal-400">—</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="border border-warm-300 rounded-xl px-2.5 py-1.5 bg-white text-charcoal-700 outline-none"
              />
            </div>
          </div>

          <span className="text-xs text-charcoal-400">
            {filtered.length} ta yozuv
          </span>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card className="overflow-hidden">
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={r => r.id}
          emptyTitle="Tranzaksiyalar topilmadi"
          emptyDescription="Qidiruv shartlarini o‘zgartiring"
          emptyIcon={<CreditCard className="w-5 h-5" />}
        />
      </Card>
    </div>
  );
}
