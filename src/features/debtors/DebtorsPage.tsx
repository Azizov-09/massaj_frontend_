// ═══════════════════════════════════════════════════════
//  Debtors Page — Senior Medical/Wellness CRM Table standard
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingDown, Phone, Users, DollarSign, AlertCircle,
  Search, X, Baby, CreditCard, ArrowRight, Wallet
} from 'lucide-react';
import { useStore, useAuth } from '@/store';
import { getTopDebtors } from '@/services/finance.service';
import { formatCurrency, formatCurrencyCompact, cn } from '@/utils';
import { Card, Avatar, EmptyState, ProgressBar, Badge, Select } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader, KpiCard } from '@/components/ui/KpiCard';
import { DataTable, Column, getAvatarGradient } from '@/components/tables/DataTable';
import { Modal } from '@/components/ui/Modal';

type DebtLevel = 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW';

export function DebtorsPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const transactions = useStore(s => s.transactions);
  const children = useStore(s => s.children);
  const parents = useStore(s => s.parents);

  const isParent = currentUser?.role === 'PARENT';
  const allDebtors = useMemo(() => getTopDebtors(transactions, children, parents, 100), [transactions, children, parents]);
  const debtors = useMemo(() => {
    if (isParent && currentUser) {
      return allDebtors.filter(d => d.parentId === currentUser.id);
    }
    return allDebtors;
  }, [allDebtors, isParent, currentUser]);

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<DebtLevel>('ALL');
  const [selectedDebtor, setSelectedDebtor] = useState<typeof debtors[0] | null>(null);

  const totalDebt = debtors.reduce((s, d) => s + d.debt, 0);
  const maxDebt = debtors.length > 0 ? Math.max(...debtors.map(d => d.debt)) : 0;
  const avgDebt = debtors.length > 0 ? Math.round(totalDebt / debtors.length) : 0;

  // Filtered
  const filtered = useMemo(() => {
    return debtors.filter(d => {
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
          d.parentPhone.includes(q)
        );
      }
      return true;
    });
  }, [debtors, activeTab, search]);

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

  const hasActiveFilters = search !== '' || activeTab !== 'ALL';

  const resetFilters = () => {
    setSearch('');
    setActiveTab('ALL');
  };

  const columns: Column<typeof debtors[0]>[] = [
    {
      key: 'rank',
      header: '№',
      width: '48px',
      cell: (_, index) => (
        <span className="font-bold text-xs text-charcoal-400 tabular-nums">
          #{index + 1}
        </span>
      ),
    },
    {
      key: 'childName',
      header: 'Bola va Ota-ona',
      sortable: true,
      cell: (d) => (
        <div className="flex items-center gap-3">
          <Avatar name={d.childName} size="sm" className="font-semibold" />
          <div className="min-w-0">
            <h5 className="font-semibold text-charcoal-900 text-sm tracking-tight truncate hover:text-brand-700 transition-colors">
              {d.childName}
            </h5>
            <p className="text-xs text-charcoal-500 mt-0.5">
              Ota-ona: <span className="text-charcoal-800 font-medium">{d.parentName}</span>
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'debtRatio',
      header: 'Qarz salmog‘i',
      cell: (d) => {
        const safeMaxDebt = maxDebt > 0 ? maxDebt : 1;
        const ratio = Math.min(100, Math.round((d.debt / safeMaxDebt) * 100));
        return (
          <div className="w-36 space-y-1">
            <div className="flex justify-between text-[10px] text-charcoal-500 font-medium">
              <span>Daraja</span>
              <span>{ratio}%</span>
            </div>
            <ProgressBar value={ratio} fillClassName="bg-rose-500" />
          </div>
        );
      },
    },
    {
      key: 'parentPhone',
      header: 'Telefon',
      cell: (d) => (
        <a
          href={`tel:${d.parentPhone}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 text-xs text-charcoal-700 hover:text-brand-600 transition-colors font-medium"
        >
          <Phone className="w-3.5 h-3.5 text-charcoal-400" />
          <span>{d.parentPhone}</span>
        </a>
      ),
    },
    {
      key: 'debt',
      header: 'Qarzdorlik miqdori',
      sortable: true,
      cell: (d) => (
        <div className="space-y-0.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[6px] bg-rose-50 text-rose-600 border border-rose-200 font-bold text-xs tabular-nums">
            <AlertCircle className="w-3 h-3 text-rose-500" />
            -{formatCurrency(d.debt)}
          </span>
          {d.balance > 0 && (
            <p className="text-[11px] text-emerald-600 font-medium tabular-nums">
              Depozit: +{formatCurrencyCompact(d.balance)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Amallar',
      cell: (d) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="xs"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedDebtor(d);
            }}
            className="h-7 text-xs text-charcoal-600 hover:text-brand-700 hover:bg-brand-50/60"
          >
            Tafsilotlar
            <ArrowRight className="w-3 h-3 ml-1 text-charcoal-400" />
          </Button>
        </div>
      ),
    },
  ];

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

      {isParent ? (
        <div className="hidden md:grid md:grid-cols-3 gap-3.5">
          <KpiCard
            label="Sizning qarzingiz"
            value={totalDebt}
            format="currency"
            description="To'lanishi lozim bo'lgan mablag'"
            icon={<TrendingDown className="w-4 h-4 text-rose-600" />}
            accentColor="danger"
            index={0}
          />
          <KpiCard
            label="Qarz bo'lgan bolalar"
            value={debtors.length}
            description="Farzandlar soni"
            icon={<Users className="w-4 h-4 text-amber-600" />}
            accentColor="gold"
            index={1}
          />
          <KpiCard
            label="Status"
            value={totalDebt > 0 ? "Qarzdorlik mavjud" : "Qarz yo'q"}
            format="text"
            description="Joriy to'lov holati"
            icon={<AlertCircle className="w-4 h-4 text-brand-600" />}
            accentColor="brand"
            index={2}
          />
        </div>
      ) : (
        <div className="hidden md:grid md:grid-cols-4 gap-3.5">
          <KpiCard
            label="Jami qarz"
            value={totalDebt}
            format="currency"
            description="Umumiy qarz summasi"
            icon={<TrendingDown className="w-4 h-4 text-rose-600" />}
            accentColor="danger"
            index={0}
          />
          <KpiCard
            label="Qarzdorlar soni"
            value={debtors.length}
            description="Qarzdor mijozlar"
            icon={<Users className="w-4 h-4 text-amber-600" />}
            accentColor="gold"
            index={1}
          />
          <KpiCard
            label="O'rtacha qarz"
            value={avgDebt}
            format="currency"
            description="Har bir mijozga to'g'ri keluvchi"
            icon={<DollarSign className="w-4 h-4 text-blue-600" />}
            accentColor="blue"
            index={2}
          />
          <KpiCard
            label="Maksimal qarz"
            value={maxDebt}
            format="currency"
            description="Eng katta qarzdorlik"
            icon={<AlertCircle className="w-4 h-4 text-brand-600" />}
            accentColor="brand"
            index={3}
          />
        </div>
      )}

      <Card className="overflow-visible border border-warm-200/90 shadow-xs">
        {/* Quick Tabs — Desktop/tablet filter pills */}
        {!isParent && (
          <div className="hidden sm:flex items-center gap-1.5 px-4 pt-3.5 pb-2 border-b border-warm-200/70 overflow-x-auto touch-scroll-x scrollbar-thin w-full bg-warm-50/30">
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
                {tabCounts.all}
              </span>
            </button>

            <button
              onClick={(e) => {
                setActiveTab('HIGH');
                e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
              }}
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
              onClick={(e) => {
                setActiveTab('MEDIUM');
                e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
              }}
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
              onClick={(e) => {
                setActiveTab('LOW');
                e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
              }}
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
            <div className="relative flex-1 w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={isParent ? "Farzand ismi bo'yicha qidirish..." : "Bola, ota-ona yoki telefon..."}
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

            {!isParent && (
              <div className="w-full sm:w-auto min-w-[200px]">
                <Select
                  size="sm"
                  value={activeTab}
                  onChange={e => setActiveTab(e.target.value as DebtLevel)}
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
              Ko'rsatilmoqda: <strong className="text-charcoal-900 font-semibold">{filtered.length}</strong> / {debtors.length}
            </span>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={r => r.childId}
          onRowClick={(d) => setSelectedDebtor(d)}
          tableClassName="min-w-[850px]"
          mobileCardConfig={(d, index) => {
            const safeMaxDebt = maxDebt > 0 ? maxDebt : 1;
            const ratio = Math.min(100, Math.round((d.debt / safeMaxDebt) * 100));
            const initials = d.childName
              ? d.childName.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
              : 'Q';

            return {
              avatarText: initials,
              avatarGradient: getAvatarGradient(index, d.childName),
              title: d.childName,
              subtitle: `Ota-ona: ${d.parentName || '—'}`,
              status: (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 font-extrabold text-xs tabular-nums">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  -{formatCurrencyCompact(d.debt)}
                </span>
              ),
              details: [
                {
                  label: 'Ota-ona',
                  value: d.parentName || '—'
                },
                {
                  label: 'Qarzdorlik',
                  value: <span className="font-mono font-bold text-rose-600">{formatCurrency(d.debt)}</span>
                },
                {
                  label: 'Telefon',
                  value: d.parentPhone ? (
                    <a href={`tel:${d.parentPhone}`} onClick={e => e.stopPropagation()} className="text-brand-600 font-mono text-xs">
                      {d.parentPhone}
                    </a>
                  ) : 'Kiritilmagan'
                },
                {
                  label: 'Salmoq darajasi',
                  value: `${ratio}%`
                }
              ],
              actions: (
                <div className="flex flex-wrap items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => setSelectedDebtor(d)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-warm-200 bg-white text-charcoal-700 text-xs font-medium hover:bg-warm-50 active:bg-warm-100 shadow-2xs cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-charcoal-500" />
                    Tafsilotlar
                  </button>
                  {d.parentPhone && (
                    <a
                      href={`tel:${d.parentPhone}`}
                      onClick={e => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-warm-200 bg-white text-charcoal-700 text-xs font-medium hover:bg-warm-50 active:bg-warm-100 shadow-2xs cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5 text-brand-600" />
                      Qo'ng'iroq
                    </a>
                  )}
                </div>
              )
            };
          }}
          emptyTitle="Qarzdorlar topilmadi"
          emptyDescription={
            isParent
              ? "Barcha muolajalar to'lovlari to'liq va o'z vaqtida amalga oshirilgan. Rahmat!"
              : "Barcha balanslar muvozanatda yoki qidiruv bo'yicha ma'lumot chiqmadi."
          }
          emptyIcon={<TrendingDown className="w-5 h-5 text-emerald-500" />}
        />

        {/* Footer Summary */}
        <div className="px-4 py-3 bg-warm-50/70 border-t border-warm-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-charcoal-500">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Jami qarzdorlik: <strong className="text-rose-600 font-semibold tabular-nums">{formatCurrency(totalDebt)}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              O'rtacha qarz: <strong className="text-charcoal-800 font-semibold tabular-nums">{formatCurrency(avgDebt)}</strong>
            </span>
          </div>
          <span className="text-[11px] text-charcoal-400">
            Qator ustiga bosib qarzdorlik tafsilotlarini ko'rishingiz mumkin
          </span>
        </div>
      </Card>

      {/* Debtor Details Modal */}
      <Modal
        isOpen={!!selectedDebtor}
        onClose={() => setSelectedDebtor(null)}
        title="Qarzdorlik tafsilotlari"
        size="md"
      >
        {selectedDebtor && (
          <div className="space-y-5">
            {/* Header info */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-warm-200">
              <Avatar name={selectedDebtor.childName} size="lg" />
              <div>
                <h4 className="text-base font-bold text-charcoal-900">{selectedDebtor.childName}</h4>
                <p className="text-xs text-charcoal-500 mt-0.5">
                  Ota-ona: <span className="font-semibold text-charcoal-800">{selectedDebtor.parentName || '—'}</span>
                </p>
                {selectedDebtor.parentPhone && (
                  <a
                    href={`tel:${selectedDebtor.parentPhone}`}
                    className="inline-flex items-center gap-1.5 text-xs text-brand-700 hover:underline font-medium mt-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {selectedDebtor.parentPhone}
                  </a>
                )}
              </div>
            </div>

            {/* Financial Status */}
            <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
                  Mavjud qarzdorlik
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                  To'lanmagan
                </span>
              </div>
              <p className="text-2xl font-black text-rose-700 tabular-nums mt-1.5">
                -{formatCurrency(selectedDebtor.debt)}
              </p>
              {selectedDebtor.balance > 0 && (
                <p className="text-xs text-emerald-700 font-medium mt-1">
                  Mavjud depozit qoldig'i: +{formatCurrency(selectedDebtor.balance)}
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-warm-200">
              <Button
                variant="ghost"
                onClick={() => setSelectedDebtor(null)}
                className="w-full sm:w-auto"
              >
                Yopish
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const targetUrl = isParent
                    ? `/dashboard/parent/children?search=${encodeURIComponent(selectedDebtor.childName)}`
                    : `/dashboard/super-admin/children?search=${encodeURIComponent(selectedDebtor.childName)}`;
                  setSelectedDebtor(null);
                  navigate(targetUrl);
                }}
                className="w-full sm:w-auto"
              >
                Bola profiliga o'tish
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
              {!isParent && (
                <Button
                  variant="primary"
                  onClick={() => {
                    setSelectedDebtor(null);
                    navigate('/dashboard/super-admin/payments');
                  }}
                  className="w-full sm:w-auto"
                >
                  To'lov qabul qilish
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
