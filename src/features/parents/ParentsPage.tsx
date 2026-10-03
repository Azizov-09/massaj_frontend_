// Parents Page — Senior Medical/Wellness CRM Table standard
import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Search, Users, Phone, Mail, MapPin, Eye,
  X, Baby, ArrowRight, AlertCircle, Wallet, ArrowUpRight
} from 'lucide-react';
import { useStore } from '@/store';
import { calculateParentBalance } from '@/services/finance.service';
import { formatCurrency, formatCurrencyCompact, formatDate, getEntityStatusColor, getEntityStatusLabel, cn } from '@/utils';
import { DataTable, Column } from '@/components/tables/DataTable';
import { Card, Avatar, Badge, Select } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/KpiCard';
import { Modal } from '@/components/ui/Modal';
import { CreateParentForm } from './CreateParentForm';
import type { Parent } from '@/types';

type BalanceFilter = 'ALL' | 'ACTIVE' | 'DEBTORS' | 'DEPOSIT' | 'INACTIVE';

export function ParentsPage() {
  const navigate = useNavigate();
  const parents = useStore(s => s.parents);
  const children = useStore(s => s.children);
  const transactions = useStore(s => s.transactions);
  
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<BalanceFilter>('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);

  // Pre-calculate balances
  const parentBalancesMap = useMemo(() => {
    const map = new Map<string, { balance: number; debt: number }>();
    for (const p of parents) {
      map.set(p.id, calculateParentBalance(p.id, p.childrenIds, transactions));
    }
    return map;
  }, [parents, transactions]);

  // Tab counts
  const tabCounts = useMemo(() => {
    let active = 0;
    let debtors = 0;
    let deposit = 0;
    let inactive = 0;

    for (const p of parents) {
      if (p.status === 'ACTIVE') active++;
      if (p.status === 'INACTIVE') inactive++;
      const bal = parentBalancesMap.get(p.id);
      if (bal && bal.debt > 0) debtors++;
      if (bal && bal.balance > 0) deposit++;
    }

    return {
      all: parents.length,
      active,
      debtors,
      deposit,
      inactive,
    };
  }, [parents, parentBalancesMap]);

  // Filtered list
  const filtered = useMemo(() => {
    return parents.filter(p => {
      // Search
      if (search) {
        const q = search.toLowerCase();
        const matchesName = p.fullName?.toLowerCase().includes(q);
        const matchesPhone = p.phone?.toLowerCase().includes(q);
        const matchesChild = children.some(c => (p.childrenIds || []).includes(c.id) && c.fullName?.toLowerCase().includes(q));
        if (!matchesName && !matchesPhone && !matchesChild) return false;
      }

      // Tab filter
      const bal = parentBalancesMap.get(p.id) ?? { balance: 0, debt: 0 };
      if (activeTab === 'ACTIVE' && p.status !== 'ACTIVE') return false;
      if (activeTab === 'INACTIVE' && p.status !== 'INACTIVE') return false;
      if (activeTab === 'DEBTORS' && bal.debt <= 0) return false;
      if (activeTab === 'DEPOSIT' && bal.balance <= 0) return false;

      return true;
    });
  }, [parents, search, activeTab, parentBalancesMap, children]);

  // Summary statistics
  const summaryStats = useMemo(() => {
    let totalDebt = 0;
    let totalDeposit = 0;
    for (const p of parents) {
      const bal = parentBalancesMap.get(p.id);
      if (bal) {
        totalDebt += bal.debt;
        totalDeposit += bal.balance;
      }
    }
    return { totalDebt, totalDeposit };
  }, [parents, parentBalancesMap]);

  // Active filters count
  const hasActiveFilters = search !== '' || activeTab !== 'ALL';

  const resetFilters = () => {
    setSearch('');
    setActiveTab('ALL');
  };

  const columns: Column<Parent>[] = [
    {
      key: 'fullName',
      header: 'Ota-ona',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.fullName} size="md" className="font-semibold" />
          <div className="min-w-0">
            <p className="font-semibold text-charcoal-900 text-sm tracking-tight truncate hover:text-brand-700 transition-colors">
              {row.fullName}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <a
                href={`tel:${row.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs text-charcoal-500 hover:text-brand-600 transition-colors"
              >
                <Phone className="w-3 h-3 text-charcoal-400" />
                <span>{row.phone}</span>
              </a>
              {row.address && (
                <span className="hidden xl:inline-flex items-center gap-1 text-[11px] text-charcoal-400 max-w-[130px] truncate">
                  <MapPin className="w-2.5 h-2.5" />
                  {row.address}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'childrenIds',
      header: 'Farzandlari',
      cell: (row) => {
        const childList = children.filter(c => row.childrenIds.includes(c.id));
        if (childList.length === 0) {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-warm-100 text-charcoal-500">
              <Baby className="w-3 h-3" />
              Biriktirilmagan
            </span>
          );
        }

        return (
          <div className="flex flex-wrap items-center gap-1.5 max-w-[260px]">
            {childList.map(c => (
              <Link
                key={c.id}
                to={`/dashboard/super-admin/children?search=${encodeURIComponent(c.fullName)}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-xs font-medium bg-brand-50/70 hover:bg-brand-100/80 text-brand-800 border border-brand-200/60 transition-colors"
                title={`${c.fullName} profilini ochish`}
              >
                <Baby className="w-3 h-3 text-brand-600 shrink-0" />
                <span className="truncate max-w-[110px]">{(c.fullName || '').split(' ')[0]}</span>
                <ArrowRight className="w-2.5 h-2.5 text-brand-400 opacity-60" />
              </Link>
            ))}
            {childList.length > 2 && (
              <span className="text-[11px] text-charcoal-400 font-medium">
                ({childList.length} nafar)
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'balance',
      header: 'Balans / Hisob-kitob',
      sortable: true,
      cell: (row) => {
        const bal = parentBalancesMap.get(row.id) ?? { balance: 0, debt: 0 };
        return (
          <div className="space-y-1">
            {bal.debt > 0 ? (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] bg-rose-50 text-rose-600 border border-rose-200 font-semibold text-xs tabular-nums">
                <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                <span>Qarz: {formatCurrencyCompact(bal.debt)}</span>
              </div>
            ) : bal.balance > 0 ? (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-semibold text-xs tabular-nums">
                <Wallet className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>+ {formatCurrencyCompact(bal.balance)}</span>
              </div>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] bg-warm-100 text-charcoal-500 text-xs font-medium">
                0 so'm
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Holat',
      sortable: true,
      cell: (row) => (
        <Badge className={getEntityStatusColor(row.status)} dot>
          {getEntityStatusLabel(row.status)}
        </Badge>
      ),
    },
    {
      key: 'actions' as any,
      header: 'Amallar',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedParent(row);
            }}
            className="h-8 px-2.5 text-xs text-charcoal-600 hover:text-brand-700 hover:bg-brand-50/60"
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
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-5">
      <PageHeader
        title="Ota-onalar"
        description={`Jami ${parents.length} ta ota-ona ro'yxati va ularning bolalari`}
        actions={
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
            Ota-ona qo'shish
          </Button>
        }
      />

      <Card className="overflow-hidden border border-warm-200/90 shadow-xs">
        {/* Quick Tabs */}
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
              {tabCounts.all}
            </span>
          </button>

          <button
            onClick={(e) => {
              setActiveTab('ACTIVE');
              e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
            }}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer select-none",
              activeTab === 'ACTIVE'
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-charcoal-600 hover:bg-emerald-50 hover:text-emerald-800"
            )}
          >
            Faol
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
              activeTab === 'ACTIVE' ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
            )}>
              {tabCounts.active}
            </span>
          </button>

          <button
            onClick={(e) => {
              setActiveTab('DEBTORS');
              e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
            }}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer select-none",
              activeTab === 'DEBTORS'
                ? "bg-rose-600 text-white shadow-xs"
                : "text-charcoal-600 hover:bg-rose-50 hover:text-rose-700"
            )}
          >
            Qarzdorlar
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
              activeTab === 'DEBTORS' ? "bg-white/20 text-white" : "bg-rose-100 text-rose-800"
            )}>
              {tabCounts.debtors}
            </span>
          </button>

          <button
            onClick={(e) => {
              setActiveTab('DEPOSIT');
              e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
            }}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer select-none",
              activeTab === 'DEPOSIT'
                ? "bg-brand-600 text-white shadow-xs"
                : "text-charcoal-600 hover:bg-brand-50 hover:text-brand-800"
            )}
          >
            Depozitdagilar
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
              activeTab === 'DEPOSIT' ? "bg-white/20 text-white" : "bg-brand-100 text-brand-800"
            )}>
              {tabCounts.deposit}
            </span>
          </button>

          <button
            onClick={(e) => {
              setActiveTab('INACTIVE');
              e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
            }}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer select-none",
              activeTab === 'INACTIVE'
                ? "bg-charcoal-700 text-white shadow-xs"
                : "text-charcoal-600 hover:bg-warm-100 hover:text-charcoal-900"
            )}
          >
            Nofaol
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
              activeTab === 'INACTIVE' ? "bg-white/20 text-white" : "bg-warm-200 text-charcoal-600"
            )}>
              {tabCounts.inactive}
            </span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-warm-100 bg-warm-50/40">
          <div className="flex flex-1 items-center gap-2.5">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Ota-ona ismi, telefon yoki bola ismi..."
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
              Ko'rsatilmoqda: <strong className="text-charcoal-900 font-semibold">{filtered.length}</strong> / {parents.length}
            </span>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={r => r.id}
          onRowClick={(parent) => setSelectedParent(parent)}
          tableClassName="min-w-[850px]"
          emptyTitle="Ota-onalar topilmadi"
          emptyDescription={
            hasActiveFilters
              ? "Qidiruv parametrlariga mos keluvchi ota-ona topilmadi. Filtrni tozalab ko'ring."
              : "Tizimda hozircha ota-onalar mavjud emas."
          }
          emptyIcon={<Users className="w-5 h-5" />}
        />

        {/* Footer Summary */}
        <div className="px-4 py-3 bg-warm-50/70 border-t border-warm-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-charcoal-500">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-500" />
              Jami ota-onalar: <strong className="text-charcoal-800 font-semibold">{parents.length}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Umumiy qarz: <strong className="text-rose-600 font-semibold tabular-nums">{formatCurrency(summaryStats.totalDebt)}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Umumiy depozit: <strong className="text-emerald-700 font-semibold tabular-nums">{formatCurrency(summaryStats.totalDeposit)}</strong>
            </span>
          </div>
          <span className="text-[11px] text-charcoal-400">
            Qator ustiga bosib batafsil profilni ko'rishingiz mumkin
          </span>
        </div>
      </Card>

      {/* Parent Details Modal */}
      {selectedParent && (
        <Modal
          isOpen={!!selectedParent}
          onClose={() => setSelectedParent(null)}
          title="Ota-ona ma'lumotlari"
          size="lg"
        >
          <div className="space-y-5">
            {/* Header info */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-warm-50 border border-warm-200/70">
              <Avatar name={selectedParent.fullName} size="lg" className="text-base font-bold" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-charcoal-900 truncate">
                    {selectedParent.fullName}
                  </h3>
                  <Badge className={getEntityStatusColor(selectedParent.status)} dot>
                    {getEntityStatusLabel(selectedParent.status)}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-charcoal-600">
                  <a
                    href={`tel:${selectedParent.phone}`}
                    className="inline-flex items-center gap-1 hover:text-brand-600 font-medium text-charcoal-800"
                  >
                    <Phone className="w-3.5 h-3.5 text-charcoal-400" />
                    {selectedParent.phone}
                  </a>
                  {selectedParent.email && (
                    <span className="inline-flex items-center gap-1 text-charcoal-500">
                      <Mail className="w-3.5 h-3.5 text-charcoal-400" />
                      {selectedParent.email}
                    </span>
                  )}
                  {selectedParent.address && (
                    <span className="inline-flex items-center gap-1 text-charcoal-500">
                      <MapPin className="w-3.5 h-3.5 text-charcoal-400" />
                      {selectedParent.address}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Status Cards */}
            {(() => {
              const bal = parentBalancesMap.get(selectedParent.id) ?? { balance: 0, debt: 0 };
              return (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-warm-200/80 bg-white">
                    <p className="text-xs text-charcoal-400 font-medium">Joriy depozit</p>
                    <p className="text-lg font-bold text-emerald-600 tabular-nums mt-0.5">
                      {formatCurrency(bal.balance)}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-warm-200/80 bg-white">
                    <p className="text-xs text-charcoal-400 font-medium">Joriy qarzdorlik</p>
                    <p className="text-lg font-bold text-rose-600 tabular-nums mt-0.5">
                      {formatCurrency(bal.debt)}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Connected Children */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-2.5">
                Farzandlari ro'yxati
              </h4>
              {(() => {
                const childList = children.filter(c => selectedParent.childrenIds.includes(c.id));
                if (childList.length === 0) {
                  return (
                    <p className="text-xs text-charcoal-400 italic py-2">
                      Ushbu ota-onaga hali hech qanday bola biriktirilmagan.
                    </p>
                  );
                }

                return (
                  <div className="space-y-2">
                    {childList.map(c => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-warm-200/70 hover:border-brand-300 bg-white transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar name={c.fullName} size="sm" />
                          <div>
                            <p className="text-sm font-semibold text-charcoal-900">{c.fullName}</p>
                            <p className="text-xs text-charcoal-400">
                              Tug'ilgan: {formatDate(c.dateOfBirth)} {c.diagnosis && `• ${c.diagnosis}`}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedParent(null);
                            navigate(`/dashboard/super-admin/children?search=${encodeURIComponent(c.fullName)}`);
                          }}
                          className="h-8 text-xs"
                        >
                          Bolani ochish
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Notes if any */}
            {selectedParent.notes && (
              <div className="p-3 rounded-xl bg-warm-50 border border-warm-200/60 text-xs text-charcoal-600">
                <span className="font-semibold text-charcoal-800">Qo'shimcha izoh: </span>
                {selectedParent.notes}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-warm-100">
              <Button variant="secondary" onClick={() => setSelectedParent(null)}>
                Yopish
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Parent Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Yangi ota-ona qo'shish" size="md">
        <CreateParentForm onSuccess={() => setShowCreate(false)} onCancel={() => setShowCreate(false)} />
      </Modal>
    </div>
  );
}
