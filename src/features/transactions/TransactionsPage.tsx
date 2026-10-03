// ═══════════════════════════════════════════════════════
//  Transactions Page — Senior Medical/Wellness CRM Table standard
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  CreditCard, ArrowDownLeft, ArrowUpRight, Search,
  Download, RefreshCw, Calendar, Clock, X, Eye, Baby,
  Wallet, FileText, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useStore } from '@/store';
import {
  formatCurrency, formatCurrencyCompact, formatDate,
  formatDateTime, cn
} from '@/utils';
import { Card, Badge, Avatar, Select, DatePicker } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader, KpiCard } from '@/components/ui/KpiCard';
import { DataTable, Column } from '@/components/tables/DataTable';
import { Modal } from '@/components/ui/Modal';
import type { Transaction, TransactionType } from '@/types';

type DirectionTab = 'ALL' | 'IN' | 'OUT' | 'EXPENSE';

export function TransactionsPage() {
  const transactions = useStore(s => s.transactions);
  const children = useStore(s => s.children);
  const parents = useStore(s => s.parents);

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<DirectionTab>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Financial summary
  const summary = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
      if (t.direction === 'IN') totalIn += t.amount;
      if (t.direction === 'OUT') totalOut += t.amount;
      if (t.type === 'EXPENSE') totalExpense += t.amount;
    });

    return {
      totalIn,
      totalOut,
      totalExpense,
      net: totalIn - totalOut,
      count: transactions.length,
    };
  }, [transactions]);

  // Tab counts
  const inCount = useMemo(() => transactions.filter(t => t.direction === 'IN').length, [transactions]);
  const outCount = useMemo(() => transactions.filter(t => t.direction === 'OUT' && t.type !== 'EXPENSE').length, [transactions]);
  const expenseCount = useMemo(() => transactions.filter(t => t.type === 'EXPENSE').length, [transactions]);

  // Filtered transactions
  const filtered = useMemo(() => {
    return transactions.filter(t => {
      // Tab filter
      if (activeTab === 'IN' && t.direction !== 'IN') return false;
      if (activeTab === 'OUT' && (t.direction !== 'OUT' || t.type === 'EXPENSE')) return false;
      if (activeTab === 'EXPENSE' && t.type !== 'EXPENSE') return false;

      // Type dropdown filter
      if (typeFilter && t.type !== typeFilter) return false;

      // Date range
      const tDate = (t.date || '').split('T')[0];
      if (dateFrom && tDate && tDate < dateFrom) return false;
      if (dateTo && tDate && tDate > dateTo) return false;

      // Search
      if (search) {
        const q = search.toLowerCase();
        const parent = parents.find(p => p.id === t.parentId);
        const child = children.find(c => c.id === t.childId);
        return (
          t.id.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          parent?.fullName?.toLowerCase().includes(q) ||
          child?.fullName?.toLowerCase().includes(q)
        );
      }
      return true;
    }).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }, [transactions, activeTab, typeFilter, dateFrom, dateTo, search, parents, children]);

  const hasActiveFilters = search !== '' || activeTab !== 'ALL' || typeFilter !== '' || dateFrom !== '' || dateTo !== '';

  const resetFilters = () => {
    setSearch('');
    setActiveTab('ALL');
    setTypeFilter('');
    setDateFrom('');
    setDateTo('');
  };

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

  const getTypeBadge = (type: TransactionType) => {
    const typeMap: Record<TransactionType, { label: string; className: string }> = {
      PAYMENT: { label: 'To‘lov', className: 'bg-emerald-50 text-emerald-700 border-emerald-200/60' },
      SESSION_CHARGE: { label: 'Seans haqi', className: 'bg-brand-50 text-brand-800 border-brand-200/60' },
      REFUND: { label: 'Qaytarish', className: 'bg-blue-50 text-blue-700 border-blue-200/60' },
      ADJUSTMENT: { label: 'Tuzatish', className: 'bg-warm-100 text-charcoal-700 border-warm-200' },
      EXPENSE: { label: 'Xarajat', className: 'bg-rose-50 text-rose-700 border-rose-200/60' },
    };
    const item = typeMap[type] || { label: type, className: 'bg-warm-100 text-charcoal-700 border-warm-200' };
    return (
      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-[6px] text-xs font-semibold border", item.className)}>
        {item.label}
      </span>
    );
  };

  const columns: Column<Transaction>[] = [
    {
      key: 'id',
      header: 'Tranzaksiya',
      sortable: true,
      cell: (t: Transaction) => (
        <div className="space-y-0.5">
          <span className="font-mono text-xs font-bold text-charcoal-800 tracking-tight">
            {t.id}
          </span>
          <div className="flex items-center gap-1.5 text-[11px] text-charcoal-400">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(t.date)}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'direction',
      header: 'Yo‘nalish',
      sortable: true,
      cell: (t: Transaction) => (
        <span
          className={cn(
            'inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-[6px] border',
            t.direction === 'IN'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
              : 'bg-brand-50 text-brand-800 border-brand-200/60'
          )}
        >
          {t.direction === 'IN' ? (
            <>
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" /> Kirim
            </>
          ) : (
            <>
              <ArrowUpRight className="w-3.5 h-3.5 text-brand-600" /> Chiqim
            </>
          )}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Operatsiya turi',
      sortable: true,
      cell: (t: Transaction) => getTypeBadge(t.type),
    },
    {
      key: 'amount',
      header: 'Summa',
      sortable: true,
      cell: (t: Transaction) => (
        <span
          className={cn(
            'font-bold text-sm tabular-nums inline-flex items-center px-2 py-0.5 rounded-[6px]',
            t.direction === 'IN'
              ? 'text-emerald-700 bg-emerald-50/70 border border-emerald-200/50'
              : 'text-charcoal-900 bg-warm-100/80 border border-warm-200/60'
          )}
        >
          {t.direction === 'IN' ? '+' : '-'}{formatCurrency(t.amount)}
        </span>
      ),
    },
    {
      key: 'parent' as any,
      header: 'Mijoz (Ota-ona / Bola)',
      cell: (t: Transaction) => {
        const parent = parents.find(p => p.id === t.parentId);
        const child = children.find(c => c.id === t.childId);
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Avatar name={parent?.fullName || 'Mijoz'} size="xs" />
              <span className="font-semibold text-xs text-charcoal-900 truncate max-w-[150px]">
                {parent?.fullName ?? 'Markaz hisobiga'}
              </span>
            </div>
            {child && (
              <div className="inline-flex items-center gap-1 text-[11px] text-charcoal-500 bg-warm-100 px-1.5 py-0.5 rounded">
                <Baby className="w-2.5 h-2.5 text-charcoal-400" />
                <span className="truncate max-w-[120px]">{child.fullName}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'description',
      header: 'Tavsif',
      cell: (t: Transaction) => (
        <span className="text-xs text-charcoal-500 max-w-xs block truncate" title={t.description}>
          {t.description || '—'}
        </span>
      ),
    },
    {
      key: 'actions' as any,
      header: 'Amallar',
      cell: (t: Transaction) => (
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTx(t);
            }}
            className="h-8 px-2 text-xs text-charcoal-600 hover:text-brand-700 hover:bg-brand-50/60"
            title="Batafsil ma'lumot"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            Ko'rish
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-6">
      <PageHeader
        title="Tranzaksiyalar kitobi"
        description="Barcha pul aylanmalari, to‘lovlar va xizmat hisoblari yagona tibbiy registrda"
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KpiCard
          label="Jami tushum (Kirim)"
          value={formatCurrencyCompact(summary.totalIn)}
          description="Barcha kirim to'lovlar"
          icon={<ArrowDownLeft className="w-5 h-5 text-emerald-600" />}
          accentColor="sage"
          index={0}
        />
        <KpiCard
          label="Hisoblangan (Chiqim)"
          value={formatCurrencyCompact(summary.totalOut)}
          description="Xizmatlar uchun yechilgan"
          icon={<ArrowUpRight className="w-5 h-5 text-brand-600" />}
          accentColor="brand"
          index={1}
        />
        <KpiCard
          label="Sof saldo"
          value={formatCurrencyCompact(summary.net)}
          description="Umumiy aylanma balansi"
          icon={<CreditCard className="w-5 h-5 text-amber-500" />}
          accentColor="gold"
          index={2}
        />
        <KpiCard
          label="Jami operatsiyalar"
          value={summary.count}
          description="Bajarilgan tranzaksiyalar"
          icon={<RefreshCw className="w-5 h-5 text-blue-500" />}
          accentColor="blue"
          index={3}
        />
      </div>

      <Card className="overflow-hidden border border-warm-200/90 shadow-xs">
        {/* Quick Direction Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-warm-200/70 overflow-x-auto touch-scroll-x scrollbar-thin w-full">
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
              {transactions.length}
            </span>
          </button>

          <button
            onClick={(e) => {
              setActiveTab('IN');
              e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
            }}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer select-none",
              activeTab === 'IN'
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-charcoal-600 hover:bg-emerald-50 hover:text-emerald-800"
            )}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            Kirim (To'lovlar)
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
              activeTab === 'IN' ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
            )}>
              {inCount}
            </span>
          </button>

          <button
            onClick={(e) => {
              setActiveTab('OUT');
              e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
            }}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer select-none",
              activeTab === 'OUT'
                ? "bg-brand-600 text-white shadow-xs"
                : "text-charcoal-600 hover:bg-brand-50 hover:text-brand-800"
            )}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Chiqim (Seanslar)
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
              activeTab === 'OUT' ? "bg-white/20 text-white" : "bg-brand-100 text-brand-800"
            )}>
              {outCount}
            </span>
          </button>

          <button
            onClick={(e) => {
              setActiveTab('EXPENSE');
              e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
            }}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer select-none",
              activeTab === 'EXPENSE'
                ? "bg-rose-600 text-white shadow-xs"
                : "text-charcoal-600 hover:bg-rose-50 hover:text-rose-800"
            )}
          >
            Xarajatlar
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
              activeTab === 'EXPENSE' ? "bg-white/20 text-white" : "bg-rose-100 text-rose-700"
            )}>
              {expenseCount}
            </span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-warm-100 bg-warm-50/40">
          <div className="flex flex-1 flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ID, tavsif yoki ism..."
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

            {/* Type selector */}
            <div className="w-44">
              <Select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                size="sm"
                triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300"
              >
                <option value="">Barcha operatsiyalar</option>
                <option value="PAYMENT">To‘lov (Payment)</option>
                <option value="SESSION_CHARGE">Seans haqi</option>
                <option value="REFUND">Qaytarish</option>
                <option value="ADJUSTMENT">Tuzatish</option>
                <option value="EXPENSE">Xarajat</option>
              </Select>
            </div>

            {/* Date from & to */}
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-32">
                <DatePicker
                  size="sm"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  placeholder="Dan"
                  aria-label="Boshlanish sanasi"
                  triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300"
                />
              </div>
              <span className="text-charcoal-400">—</span>
              <div className="w-32">
                <DatePicker
                  size="sm"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  placeholder="Gacha"
                  aria-label="Tugash sanasi"
                  triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300"
                />
              </div>
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
              Ko'rsatilmoqda: <strong className="text-charcoal-900 font-semibold">{filtered.length}</strong> / {transactions.length}
            </span>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={r => r.id}
          onRowClick={(tx) => setSelectedTx(tx)}
          tableClassName="min-w-[950px]"
          emptyTitle="Tranzaksiyalar topilmadi"
          emptyDescription="Qidiruv yoki filtr parametrlarini o'zgartirib ko'ring."
          emptyIcon={<CreditCard className="w-5 h-5" />}
        />

        {/* Footer Summary */}
        <div className="px-4 py-3 bg-warm-50/70 border-t border-warm-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-charcoal-500">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Jami kirim: <strong className="text-emerald-700 font-semibold tabular-nums">{formatCurrency(summary.totalIn)}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-500" />
              Jami chiqim: <strong className="text-charcoal-800 font-semibold tabular-nums">{formatCurrency(summary.totalOut)}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Sof saldo: <strong className="text-amber-800 font-semibold tabular-nums">{formatCurrency(summary.net)}</strong>
            </span>
          </div>
          <span className="text-[11px] text-charcoal-400">
            Qator ustiga bosib tranzaksiyaning to'liq ma'lumotlarini ko'rishingiz mumkin
          </span>
        </div>
      </Card>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <Modal
          isOpen={!!selectedTx}
          onClose={() => setSelectedTx(null)}
          title="Tranzaksiya ma'lumotlari"
          size="md"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-warm-50 border border-warm-200/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-charcoal-900">{selectedTx.id}</span>
                {getTypeBadge(selectedTx.type)}
              </div>
              <p className="text-xs text-charcoal-500">
                Sana: <strong className="text-charcoal-800">{formatDateTime(selectedTx.date)}</strong>
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-warm-200/80 bg-white flex items-center justify-between">
              <span className="text-xs text-charcoal-500 font-medium">Miqdor va yo'nalish:</span>
              <span className={cn(
                "text-lg font-bold tabular-nums",
                selectedTx.direction === 'IN' ? 'text-emerald-600' : 'text-charcoal-900'
              )}>
                {selectedTx.direction === 'IN' ? '+' : '-'}{formatCurrency(selectedTx.amount)}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-warm-100">
                <span className="text-charcoal-500">Ota-ona:</span>
                <span className="font-semibold text-charcoal-900">
                  {parents.find(p => p.id === selectedTx.parentId)?.fullName || 'Markaz / Tizim'}
                </span>
              </div>
              {selectedTx.childId && (
                <div className="flex justify-between py-1.5 border-b border-warm-100">
                  <span className="text-charcoal-500">Bola:</span>
                  <span className="font-semibold text-charcoal-900">
                    {children.find(c => c.id === selectedTx.childId)?.fullName || '—'}
                  </span>
                </div>
              )}
              {selectedTx.description && (
                <div className="flex justify-between py-1.5 border-b border-warm-100">
                  <span className="text-charcoal-500">Tavsif:</span>
                  <span className="text-charcoal-700 italic max-w-[240px] text-right">
                    {selectedTx.description}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-warm-100">
              <Button variant="secondary" onClick={() => setSelectedTx(null)}>
                Yopish
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
