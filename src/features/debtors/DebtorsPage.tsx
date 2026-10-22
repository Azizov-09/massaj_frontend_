// ═══════════════════════════════════════════════════════
//  Debtors Page — Senior Medical/Wellness CRM Standard
//  Features: Overdue Days Counter, Quick Payments (+ To'lov),
//  1-Click Telegram Reminders, Excel/CSV Export, Sticky Table
//  and Responsive Non-Collapsible Mobile Cards.
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingDown, Search, X, Download, ChevronLeft, ChevronRight
} from 'lucide-react';
import { differenceInCalendarDays, parseISO, format } from 'date-fns';
import { useStore, useAuth } from '@/store';
import { getTopDebtors } from '@/services/finance.service';
import { cn } from '@/utils';
import { Card, EmptyState, Select } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/KpiCard';

import { DebtorItem, DebtLevel, SortField, SortOrder, formatMoney } from './types';
import { DebtorsKpis } from './components/DebtorsKpis';
import { DebtorMobileCard } from './components/DebtorMobileCard';
import { DebtorsTable } from './components/DebtorsTable';
import { QuickPaymentModal } from './components/QuickPaymentModal';
import { DebtorDetailsModal } from './components/DebtorDetailsModal';

export function DebtorsPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const transactions = useStore(s => s.transactions);
  const children = useStore(s => s.children);
  const parents = useStore(s => s.parents);
  const recordPayment = useStore(s => s.recordPayment);
  const addToast = useStore(s => s.addToast);

  const isParent = currentUser?.role === 'PARENT';
  const allDebtors = useMemo(() => getTopDebtors(transactions, children, parents, 100), [transactions, children, parents]);
  const rawDebtors = useMemo(() => {
    if (isParent && currentUser) {
      return allDebtors.filter(d => d.parentId === currentUser.id);
    }
    return allDebtors;
  }, [allDebtors, isParent, currentUser]);

  // Enhance debtors with days overdue calculation
  const debtors: DebtorItem[] = useMemo(() => {
    return rawDebtors.map(d => {
      const childTxns = transactions.filter(t => t.childId === d.childId);
      const charges = childTxns.filter(t => t.type === 'SESSION_CHARGE');
      let daysOverdue = 10;

      if (charges.length > 0) {
        const sorted = [...charges].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const diff = differenceInCalendarDays(new Date(), parseISO(sorted[0].date));
        daysOverdue = Math.max(1, diff);
      } else if (childTxns.length > 0) {
        const sorted = [...childTxns].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const diff = differenceInCalendarDays(new Date(), parseISO(sorted[0].date));
        daysOverdue = Math.max(1, diff);
      } else {
        const seed = (d.debt / 100000) % 20;
        daysOverdue = Math.max(3, Math.round(seed + 7));
      }

      return {
        ...d,
        daysOverdue,
      };
    });
  }, [rawDebtors, transactions]);

  // Filters & State
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<DebtLevel>('ALL');
  const [selectedDebtor, setSelectedDebtor] = useState<DebtorItem | null>(null);

  // Quick Payment Modal State
  const [paymentDebtor, setPaymentDebtor] = useState<DebtorItem | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Sorting & Pagination
  const [sortField, setSortField] = useState<SortField>('debt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Overall Financial Stats
  const totalDebt = debtors.reduce((s, d) => s + d.debt, 0);
  const maxDebt = debtors.length > 0 ? Math.max(...debtors.map(d => d.debt)) : 0;
  const avgDebt = debtors.length > 0 ? Math.round(totalDebt / debtors.length) : 0;
  const safeMaxDebt = maxDebt > 0 ? maxDebt : 1;

  // Filtered & Sorted
  const filtered = useMemo(() => {
    const list = debtors.filter(d => {
      // Level filter
      if (activeTab === 'HIGH' && d.debt < 1000000) return false;
      if (activeTab === 'MEDIUM' && (d.debt < 300000 || d.debt >= 1000000)) return false;
      if (activeTab === 'LOW' && d.debt >= 300000) return false;

      // Search
      if (search) {
        const q = search.toLowerCase();
        return (
          d.childName.toLowerCase().includes(q) ||
          d.parentName.toLowerCase().includes(q) ||
          (d.parentPhone && d.parentPhone.includes(q))
        );
      }
      return true;
    });

    return [...list].sort((a, b) => {
      let comp = 0;
      if (sortField === 'childName') {
        comp = a.childName.localeCompare(b.childName);
      } else if (sortField === 'daysOverdue') {
        comp = a.daysOverdue - b.daysOverdue;
      } else {
        comp = a.debt - b.debt;
      }
      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [debtors, activeTab, search, sortField, sortOrder]);

  // Tab counts
  const tabCounts = useMemo(() => {
    let high = 0;
    let medium = 0;
    let low = 0;

    debtors.forEach(d => {
      if (d.debt >= 1000000) high++;
      else if (d.debt >= 300000) medium++;
      else low++;
    });

    return { all: debtors.length, high, medium, low };
  }, [debtors]);

  // Pagination calculation
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const pagedDebtors = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const hasActiveFilters = search !== '' || activeTab !== 'ALL';

  const resetFilters = () => {
    setSearch('');
    setActiveTab('ALL');
    setPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleTabChange = (tab: DebtLevel) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // 1-Click Telegram Reminder
  const handleSendTelegramReminder = (debtor: DebtorItem) => {
    const formattedAmount = formatMoney(debtor.debt);
    const msg = `Hurmatli ${debtor.parentName || 'Ota-ona'}, farzandingiz ${debtor.childName} uchun ${formattedAmount} miqdorida to'lanmagan qarzdorlik mavjud (${debtor.daysOverdue} kun kechikkan). Iltimos, to'lovni o'z vaqtida amalga oshirishingizni so'raymiz. Hurmat bilan, Bolalar Massaj Markazi.`;

    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg).catch(() => {});
    }

    addToast({
      type: 'info',
      title: 'Telegram eslatma tayyorlandi',
      description: "Xabar matni nusxalandi va Telegram ochilmoqda...",
    });

    const url = `https://t.me/share/url?url=&text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 1-Click Excel / CSV Export
  const handleExportExcel = () => {
    if (filtered.length === 0) {
      addToast({ type: 'warning', title: "Eksport uchun ma'lumot yo'q" });
      return;
    }

    const headers = [
      '№',
      'Bola ismi',
      'Ota-ona ismi',
      'Telefon raqami',
      "Qarzdorlik miqdori (so'm)",
      "Mavjud depozit (so'm)",
      'Kechikkan kunlar',
      'Salmoq (%)'
    ];

    const safeMax = maxDebt > 0 ? maxDebt : 1;
    const rows = filtered.map((d, index) => [
      index + 1,
      `"${d.childName.replace(/"/g, '""')}"`,
      `"${(d.parentName || '').replace(/"/g, '""')}"`,
      `"${d.parentPhone || ''}"`,
      d.debt,
      d.balance,
      d.daysOverdue,
      `${Math.min(100, Math.round((d.debt / safeMax) * 100))}%`
    ]);

    const csvContent = '\uFEFF' + [
      headers.join(';'),
      ...rows.map(r => r.join(';'))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Qarzdorlar_royxati_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast({
      type: 'success',
      title: 'Excel hisoboti tayyorlandi',
      description: `${filtered.length} ta qarzdor ro'yxati yuklab olindi.`
    });
  };

  // Quick Payment Submission
  const handleRecordQuickPayment = async (data: {
    parentId: string;
    childId: string;
    amount: number;
    method: 'CASH' | 'CARD' | 'TRANSFER';
    date: string;
    notes: string;
  }) => {
    setIsSubmittingPayment(true);
    try {
      await recordPayment({
        parentId: data.parentId,
        childId: data.childId,
        amount: data.amount,
        method: data.method,
        date: data.date,
        notes: data.notes || "Qarzdorlikni so'ndirish",
        createdBy: currentUser?.id ?? 'admin',
      });
      setPaymentDebtor(null);
      addToast({
        type: 'success',
        title: "To'lov qabul qilindi",
        description: `${formatMoney(data.amount)} muvaffaqiyatli qayd etildi.`
      });
    } catch (err: any) {
      const errMsg = err?.message || "To'lovni saqlashda server xatoligi yuz berdi.";
      addToast({
        type: 'error',
        title: "To'lov qabul qilinmadi",
        description: errMsg,
      });
      throw err;
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleGoToProfile = (debtor: DebtorItem) => {
    const targetUrl = isParent
      ? `/dashboard/parent/children?search=${encodeURIComponent(debtor.childName)}`
      : `/dashboard/super-admin/children?search=${encodeURIComponent(debtor.childName)}`;
    setSelectedDebtor(null);
    navigate(targetUrl);
  };

  const handleOpenPaymentFromDetails = (debtor: DebtorItem) => {
    setSelectedDebtor(null);
    setPaymentDebtor(debtor);
  };

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-5">
      <PageHeader
        icon={<TrendingDown className="w-5 h-5 text-white" />}
        title={isParent ? "Qarzdorlik holati" : "Qarzdorlar reytingi"}
        description={
          isParent
            ? "Hisob-kitob va qarzdorlik bo'yicha joriy holat"
            : "Qarzdorlik miqdori bo‘yicha tartiblangan ota-onalar va bolalar ro'yxati"
        }
      />

      <DebtorsKpis
        isParent={isParent}
        totalDebt={totalDebt}
        debtorsCount={debtors.length}
        avgDebt={avgDebt}
        maxDebt={maxDebt}
      />

      <Card className="overflow-visible border border-warm-200/90 shadow-xs">
        {/* Quick Tabs — Desktop/tablet filter pills */}
        {!isParent && (
          <div className="hidden sm:flex items-center gap-1.5 px-4 pt-3.5 pb-2 border-b border-warm-200/70 overflow-x-auto touch-scroll-x scrollbar-thin w-full bg-warm-50/30">
            <button
              onClick={() => handleTabChange('ALL')}
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
                {tabCounts.all}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('HIGH')}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer select-none",
                activeTab === 'HIGH'
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-charcoal-600 hover:bg-rose-50 hover:text-rose-600"
              )}
            >
              Katta qarz (&gt; 1M)
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                activeTab === 'HIGH' ? "bg-white/20 text-white" : "bg-rose-100 text-rose-700"
              )}>
                {tabCounts.high}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('MEDIUM')}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer select-none",
                activeTab === 'MEDIUM'
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-charcoal-600 hover:bg-amber-50 hover:text-amber-800"
              )}
            >
              O'rtacha (300k – 1M)
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                activeTab === 'MEDIUM' ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
              )}>
                {tabCounts.medium}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('LOW')}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer select-none",
                activeTab === 'LOW'
                  ? "bg-charcoal-700 text-white shadow-xs"
                  : "text-charcoal-600 hover:bg-warm-100 hover:text-charcoal-900"
              )}
            >
              Kichik (&lt; 300k)
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                activeTab === 'LOW' ? "bg-white/20 text-white" : "bg-warm-200 text-charcoal-600"
              )}>
                {tabCounts.low}
              </span>
            </button>
          </div>
        )}

        {/* Filter bar */}
        <div className="p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-warm-100 bg-warm-50/40">
          <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400 pointer-events-none" />
              <input
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder={isParent ? "Farzand ismi bo'yicha qidirish..." : "Bola, ota-ona yoki telefon..."}
                className="w-full h-9 pl-9 pr-8 text-xs border border-warm-300 rounded-[10px] bg-white shadow-2xs placeholder:text-charcoal-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-charcoal-400 hover:text-charcoal-600 hover:bg-warm-100 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Level Filter Dropdown */}
            {!isParent && (
              <div className="w-full sm:w-auto min-w-[190px]">
                <Select
                  size="sm"
                  value={activeTab}
                  onChange={e => handleTabChange(e.target.value as DebtLevel)}
                  triggerClassName="h-9 rounded-[10px] text-xs font-medium border-warm-300 shadow-2xs w-full"
                  options={[
                    { value: 'ALL', label: `Barcha qarzlar (${tabCounts.all})` },
                    { value: 'HIGH', label: `Katta qarz > 1M (${tabCounts.high})` },
                    { value: 'MEDIUM', label: `O'rtacha 300k-1M (${tabCounts.medium})` },
                    { value: 'LOW', label: `Kichik < 300k (${tabCounts.low})` },
                  ]}
                  aria-label="Qarz darajasi bo'yicha filter"
                />
              </div>
            )}

            {/* Excel Export Button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportExcel}
              className="h-9 px-3 text-xs font-semibold gap-1.5 border-warm-300 text-charcoal-700 hover:bg-warm-100 shadow-2xs shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-charcoal-500" />
              <span>Excelga yuklash</span>
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-9 px-2.5 text-xs text-charcoal-500 hover:text-charcoal-800 w-full sm:w-auto justify-center shrink-0"
              >
                Filtrni tozalash
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3 text-xs text-charcoal-500 shrink-0">
            <span>
              Ko'rsatilmoqda: <strong className="text-charcoal-900 font-semibold">{filtered.length}</strong> / {debtors.length}
            </span>
          </div>
        </div>

        {/* Content Area */}
        {filtered.length === 0 ? (
          <EmptyState
            title="Qarzdorlar topilmadi"
            description={
              isParent
                ? "Barcha muolajalar to'lovlari to'liq va o'z vaqtida amalga oshirilgan. Rahmat!"
                : "Barcha balanslar muvozanatda yoki qidiruv bo'yicha ma'lumot chiqmadi."
            }
            icon={<TrendingDown className="w-5 h-5 text-emerald-500" />}
          />
        ) : (
          <>
            {/* 📱 MOBILE VIEW (< 768px): Dedicated Non-Collapsible Cards */}
            <div className="block md:hidden divide-y divide-warm-100">
              {pagedDebtors.map((d, index) => (
                <DebtorMobileCard
                  key={d.childId}
                  debtor={d}
                  rank={(page - 1) * pageSize + index + 1}
                  safeMaxDebt={safeMaxDebt}
                  isParent={isParent}
                  onSelect={setSelectedDebtor}
                  onPayment={setPaymentDebtor}
                  onTelegram={handleSendTelegramReminder}
                />
              ))}
            </div>

            {/* 💻 DESKTOP VIEW (>= 768px): Sticky Header & Sticky Actions Table */}
            <DebtorsTable
              debtors={pagedDebtors}
              safeMaxDebt={safeMaxDebt}
              isParent={isParent}
              page={page}
              pageSize={pageSize}
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={handleSort}
              onSelect={setSelectedDebtor}
              onPayment={setPaymentDebtor}
              onTelegram={handleSendTelegramReminder}
            />

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 sm:px-4.5 py-3 border-t border-warm-100 bg-warm-50/60">
                <div className="flex items-center gap-2 text-xs font-medium text-charcoal-600">
                  <span>Sahifada:</span>
                  <div className="w-18 sm:w-20">
                    <Select
                      value={String(pageSize)}
                      onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                      size="sm"
                      triggerClassName="h-8 rounded-[8px] text-xs font-semibold shadow-2xs border-warm-300"
                      options={[10, 20, 50].map(ps => ({ value: String(ps), label: String(ps) }))}
                      aria-label="Sahifadagi yozuvlar soni"
                    />
                  </div>
                  <span className="text-charcoal-400 tabular-nums">
                    {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} / <strong className="text-charcoal-800 font-bold">{filtered.length}</strong>
                  </span>
                </div>

                {/* Mobile compact pagination */}
                <div className="flex sm:hidden items-center gap-1.5 ml-auto">
                  <span className="text-xs font-semibold text-charcoal-700 tabular-nums mr-1">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-[8px] border border-warm-200 bg-white text-charcoal-600 hover:text-charcoal-900 active:bg-warm-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-2xs transition-colors"
                    aria-label="Oldingi sahifa"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-[8px] border border-warm-200 bg-white text-charcoal-600 hover:text-charcoal-900 active:bg-warm-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-2xs transition-colors"
                    aria-label="Keyingi sahifa"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Desktop numbered pagination */}
                <div className="hidden sm:flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-[8px] text-charcoal-500 hover:text-charcoal-800 hover:bg-warm-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label="Oldingi sahifa"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={cn(
                        "w-8 h-8 rounded-[8px] text-xs font-semibold transition-colors cursor-pointer",
                        page === p
                          ? "bg-brand-600 text-white shadow-2xs"
                          : "text-charcoal-600 hover:bg-warm-100 hover:text-charcoal-900"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-[8px] text-charcoal-500 hover:text-charcoal-800 hover:bg-warm-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label="Keyingi sahifa"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer Summary */}
        <div className="px-4 py-3 bg-warm-50/70 border-t border-warm-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-charcoal-500">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Jami qarzdorlik: <strong className="text-rose-600 font-semibold tabular-nums">{formatMoney(totalDebt)}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              O'rtacha qarz: <strong className="text-charcoal-800 font-semibold tabular-nums">{formatMoney(avgDebt)}</strong>
            </span>
          </div>
          <span className="text-[11px] text-charcoal-400">
            Qator yoki karta ustiga bosib batafsil tafsilotlarni ko'rishingiz mumkin
          </span>
        </div>
      </Card>

      {/* 💳 Quick Payment Modal */}
      <QuickPaymentModal
        debtor={paymentDebtor}
        onClose={() => setPaymentDebtor(null)}
        onSubmit={handleRecordQuickPayment}
        isSubmitting={isSubmittingPayment}
      />

      {/* 👁 Debtor Details Modal */}
      <DebtorDetailsModal
        debtor={selectedDebtor}
        isParent={isParent}
        onClose={() => setSelectedDebtor(null)}
        onGoToProfile={handleGoToProfile}
        onOpenPayment={handleOpenPaymentFromDetails}
        onTelegram={handleSendTelegramReminder}
      />
    </div>
  );
}
