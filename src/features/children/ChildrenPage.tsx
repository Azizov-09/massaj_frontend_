// ═══════════════════════════════════════════════════════
//  Children List Page — Full CRUD management
// ═══════════════════════════════════════════════════════
import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Baby, ArrowRight, X, Calendar, Clock, Eye, Users } from 'lucide-react';
import { useStore, useAuth } from '@/store';
import { calculateChildBalance } from '@/services/finance.service';
import {
  formatAge, formatDate, formatCurrencyCompact,
  getEntityStatusColor, getEntityStatusLabel, cn
} from '@/utils';
import { DataTable, Column } from '@/components/tables/DataTable';
import { Card, Avatar, Badge, Select } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/KpiCard';
import { Modal } from '@/components/ui/Modal';
import { CreateChildForm } from './CreateChildForm';
import type { Child } from '@/types';

export function ChildrenPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const allChildren = useStore(s => s.children);
  const specialists = useStore(s => s.specialists);
  const parents = useStore(s => s.parents);
  const transactions = useStore(s => s.transactions);
  const appointments = useStore(s => s.appointments);

  const isParent = currentUser?.role === 'PARENT';
  const baseChildren = useMemo(() => {
    if (isParent && currentUser) {
      return allChildren.filter(c => c.parentId === currentUser.id);
    }
    return allChildren;
  }, [allChildren, isParent, currentUser]);

  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [specialistFilter, setSpecialistFilter] = useState<string>('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  useEffect(() => {
    const q = searchParams.get('search');
    if (q) setSearch(q);
  }, [searchParams]);

  const filtered = useMemo(() => {
    let result = baseChildren;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.fullName.toLowerCase().includes(q) ||
        parents.find(p => p.id === c.parentId)?.fullName.toLowerCase().includes(q)
      );
    }
    if (statusFilter) result = result.filter(c => c.status === statusFilter);
    if (specialistFilter) result = result.filter(c => c.assignedSpecialistId === specialistFilter);
    return result;
  }, [baseChildren, search, statusFilter, specialistFilter, parents]);

  const activeFilterCount = [statusFilter, specialistFilter].filter(Boolean).length + (search ? 1 : 0);

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setSpecialistFilter('');
  };

  // Status counts for tabs
  const statusCounts = useMemo(() => {
    return {
      all: baseChildren.length,
      active: baseChildren.filter(c => c.status === 'ACTIVE').length,
      inactive: baseChildren.filter(c => c.status === 'INACTIVE').length,
      archived: baseChildren.filter(c => c.status === 'ARCHIVED').length,
    };
  }, [baseChildren]);

  // Memoized maps for O(1) cell lookups
  const { balancesMap, nextAppointmentsMap } = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const bMap = new Map<string, ReturnType<typeof calculateChildBalance>>();
    const aMap = new Map<string, (typeof appointments)[0]>();

    for (const c of baseChildren) {
      bMap.set(c.id, calculateChildBalance(c.id, transactions));
    }

    const upcoming = appointments
      .filter(a => a.date >= todayStr && ['SCHEDULED', 'CONFIRMED'].includes(a.status))
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

    for (const apt of upcoming) {
      if (!aMap.has(apt.childId)) {
        aMap.set(apt.childId, apt);
      }
    }

    return { balancesMap: bMap, nextAppointmentsMap: aMap };
  }, [baseChildren, transactions, appointments]);

  const columns: Column<Child>[] = [
    {
      key: 'fullName',
      header: 'Bola',
      sortable: true,
      className: 'py-3.5',
      cell: (row) => {
        const parent = parents.find(p => p.id === row.parentId);
        return (
          <div className="flex items-center gap-3">
            <Avatar name={row.fullName} size="sm" className="ring-2 ring-warm-100 shadow-2xs shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-semibold text-charcoal-900 text-sm truncate group-hover:text-brand-600 transition-colors">
                  {row.fullName}
                </p>
                {row.diagnosis && (
                  <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded shrink-0">
                    {row.diagnosis}
                  </span>
                )}
              </div>
              <p className="text-xs text-charcoal-500 truncate flex items-center gap-1 mt-0.5">
                {parent ? (
                  <>
                    <Users className="w-3 h-3 text-charcoal-400 shrink-0" />
                    <span>{parent.fullName}</span>
                    {parent.phone && <span className="text-charcoal-400 font-mono text-[11px]">• {parent.phone}</span>}
                  </>
                ) : (
                  <span className="text-charcoal-400 italic text-[11px]">Ota-ona biriktirilmagan</span>
                )}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'dateOfBirth',
      header: 'Yoshi',
      sortable: true,
      className: 'py-3.5',
      cell: (row) => (
        <div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] bg-warm-100/90 text-charcoal-800 text-xs font-semibold border border-warm-200/80 shadow-2xs">
            {formatAge(row.dateOfBirth)}
          </span>
          <p className="text-[11px] text-charcoal-400 mt-0.5">{formatDate(row.dateOfBirth)}</p>
        </div>
      ),
    },
    {
      key: 'assignedSpecialistId',
      header: 'Biriktirilgan mutaxassis',
      className: 'py-3.5',
      cell: (row) => {
        const spec = specialists.find(s => s.id === row.assignedSpecialistId);
        return spec ? (
          <div className="flex items-center gap-2">
            <Avatar name={spec.fullName} size="xs" className="ring-1 ring-warm-200 shrink-0" />
            <div className="min-w-0">
              <span className="text-sm font-medium text-charcoal-900 truncate block">{spec.fullName}</span>
              <span className="text-[11px] text-charcoal-400 truncate block">{spec.specialization || 'Mutaxassis'}</span>
            </div>
          </div>
        ) : (
          <span className="text-charcoal-400 text-xs">—</span>
        );
      },
    },
    {
      key: 'nextAppointment',
      header: "Keyingi uchrashuv",
      className: 'py-3.5',
      cell: (row) => {
        const next = nextAppointmentsMap.get(row.id);
        return next ? (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-charcoal-800">
              <Calendar className="w-3.5 h-3.5 text-brand-600 shrink-0" />
              <span>{formatDate(next.date)}</span>
            </div>
            <div className="inline-flex items-center gap-1 text-[11px] font-medium text-charcoal-600 bg-warm-100/80 px-1.5 py-0.5 rounded mt-0.5">
              <Clock className="w-3 h-3 text-charcoal-400 shrink-0" />
              <span>{next.startTime} – {next.endTime}</span>
            </div>
          </div>
        ) : (
          <span className="text-[11px] text-charcoal-400 font-medium">Rejalashtirilmagan</span>
        );
      },
    },
    {
      key: 'balance',
      header: 'Balans',
      className: 'py-3.5',
      cell: (row) => {
        const bal = balancesMap.get(row.id) ?? { balance: 0, debt: 0 };
        return (
          <div>
            {bal.balance > 0 && (
              <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[6px] border border-emerald-200/80 tabular-nums">
                +{formatCurrencyCompact(bal.balance)}
              </span>
            )}
            {bal.debt > 0 && (
              <span className="inline-flex items-center text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-[6px] border border-rose-200/80 tabular-nums">
                Qarz: {formatCurrencyCompact(bal.debt)}
              </span>
            )}
            {bal.balance === 0 && bal.debt === 0 && (
              <span className="text-charcoal-400 text-xs font-semibold">0 so'm</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Holat',
      sortable: true,
      className: 'py-3.5',
      cell: (row) => (
        <Badge className={cn('shadow-2xs font-semibold', getEntityStatusColor(row.status))} dot>
          {getEntityStatusLabel(row.status)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Amallar',
      headerClassName: 'text-right pr-4',
      className: 'py-3.5 text-right',
      width: '100px',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedChild(row);
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
        title={isParent ? "Farzandlarim" : "Bolalar"}
        description={isParent ? `Sizning ro'yxatdagi ${baseChildren.length} ta farzandingiz` : `Jami ${allChildren.length} ta bola, ${allChildren.filter(c => c.status === 'ACTIVE').length} ta faol`}
        actions={
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
            {isParent ? "Farzand qo'shish" : "Bola qo'shish"}
          </Button>
        }
      />

      {/* Main Table Card */}
      <Card className="overflow-hidden border border-warm-200/90 shadow-xs">
        {/* Status Tabs Bar */}
        <div className="px-4 py-3 bg-warm-50/70 border-b border-warm-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto touch-scroll-x scrollbar-thin py-0.5 w-full sm:w-auto -mx-0.5 px-0.5">
            {[
              { key: '', label: 'Barchasi', count: statusCounts.all },
              { key: 'ACTIVE', label: 'Faol', count: statusCounts.active },
              { key: 'INACTIVE', label: 'Nofaol', count: statusCounts.inactive },
              { key: 'ARCHIVED', label: 'Arxivlangan', count: statusCounts.archived },
            ].map(tab => {
              const isActive = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={(e) => {
                    setStatusFilter(tab.key);
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
                  }}
                  className={cn(
                    'shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap select-none',
                    isActive
                      ? 'bg-charcoal-900 text-white shadow-xs'
                      : 'bg-white text-charcoal-600 hover:text-charcoal-900 hover:bg-warm-100 border border-warm-200/90 shadow-2xs'
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums',
                      isActive ? 'bg-white/20 text-white' : 'bg-warm-100 text-charcoal-700'
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <span className="text-xs font-medium text-charcoal-500 bg-white px-2.5 py-1 rounded-[8px] border border-warm-200/80 shadow-2xs">
              Ko‘rsatilmoqda: <strong className="text-charcoal-900 font-bold">{filtered.length}</strong> / {baseChildren.length}
            </span>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="p-3.5 bg-white border-b border-warm-100 flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isParent ? "Farzand ismi bo'yicha qidirish..." : "Bola yoki ota-ona ismi bo'yicha..."}
              className="w-full h-9 pl-9 pr-8 text-xs border border-warm-300 rounded-[10px] bg-white shadow-2xs placeholder:text-charcoal-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100/80 outline-none transition-all font-medium text-charcoal-800"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-700 p-0.5 rounded-full cursor-pointer"
                title="Qidiruvni tozalash"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Specialist filter */}
          <div className="w-48 sm:w-56">
            <Select
              size="sm"
              triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300 font-medium"
              value={specialistFilter}
              onChange={e => setSpecialistFilter(e.target.value)}
              options={[
                { value: '', label: 'Barcha mutaxassislar' },
                ...specialists
                  .filter(s => s.status === 'ACTIVE')
                  .map(s => ({ value: s.id, label: s.fullName })),
              ]}
              aria-label="Mutaxassis bo'yicha filter"
            />
          </div>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="h-9 inline-flex items-center gap-1.5 px-3 rounded-[10px] text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-colors shadow-2xs cursor-pointer ml-auto sm:ml-0"
              title="Barcha filtrlarni bekor qilish"
            >
              <X className="w-3.5 h-3.5" />
              <span>Filtrlarni tozalash</span>
            </button>
          )}
        </div>

        {/* Data Table */}
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={r => r.id}
          tableClassName="min-w-[900px]"
          onRowClick={r => setSelectedChild(r)}
          emptyTitle="Bolalar topilmadi"
          emptyDescription={activeFilterCount > 0 ? "Qidiruv shartlariga mos bola topilmadi. Filtrlarni tozalab ko'ring." : "Hozircha hech qanday bola kiritilmagan."}
          emptyIcon={<Baby className="w-5 h-5 text-charcoal-400" />}
          emptyAction={
            activeFilterCount > 0 ? (
              <Button size="sm" variant="secondary" onClick={resetFilters} leftIcon={<X className="w-3.5 h-3.5" />}>
                Filtrlarni tozalash
              </Button>
            ) : (
              <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowCreate(true)}>
                {isParent ? "Farzand qo'shish" : "Bola qo'shish"}
              </Button>
            )
          }
        />

        {/* Summary Footer */}
        <div className="px-4 py-3 bg-warm-50/50 border-t border-warm-100 flex flex-wrap items-center justify-between gap-3 text-xs text-charcoal-500">
          <div className="flex items-center gap-4 flex-wrap">
            <span>Jami: <strong className="text-charcoal-800 font-bold">{baseChildren.length}</strong></span>
            <span className="hidden sm:inline-block text-warm-300">•</span>
            <span className="text-emerald-700 font-medium">Faol: <strong className="font-bold">{statusCounts.active}</strong></span>
            <span className="hidden sm:inline-block text-warm-300">•</span>
            <span className="text-charcoal-600 font-medium">Nofaol: <strong className="font-bold">{statusCounts.inactive}</strong></span>
          </div>
          <span className="text-[11px] text-charcoal-400 font-medium">
            Profilni ochish uchun qator ustiga bosing
          </span>
        </div>
      </Card>

      {/* Child Details Modal */}
      {selectedChild && (
        <Modal
          isOpen={!!selectedChild}
          onClose={() => setSelectedChild(null)}
          title="Bola ma'lumotlari"
          size="lg"
        >
          <div className="space-y-5">
            {/* Header info */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-warm-50 border border-warm-200/70">
              <Avatar name={selectedChild.fullName} size="lg" className="text-base font-bold" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-charcoal-900 truncate">
                    {selectedChild.fullName}
                  </h3>
                  <Badge className={getEntityStatusColor(selectedChild.status)} dot>
                    {getEntityStatusLabel(selectedChild.status)}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-charcoal-600">
                  <span className="font-medium text-charcoal-800">
                    {formatDate(selectedChild.dateOfBirth)} ({formatAge(selectedChild.dateOfBirth)})
                  </span>
                  <span className="text-warm-300">•</span>
                  <span className="font-medium text-charcoal-700">
                    Jinsi: {selectedChild.gender === 'MALE' ? 'O‘g‘il' : 'Qiz'}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Status Cards */}
            {(() => {
              const bal = balancesMap.get(selectedChild.id) ?? { balance: 0, debt: 0 };
              return (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-warm-200/80 bg-white">
                    <p className="text-xs text-charcoal-400 font-medium">Joriy depozit</p>
                    <p className="text-lg font-bold text-emerald-600 tabular-nums mt-0.5">
                      {formatCurrencyCompact(bal.balance)}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-warm-200/80 bg-white">
                    <p className="text-xs text-charcoal-400 font-medium">Joriy qarzdorlik</p>
                    <p className="text-lg font-bold text-rose-600 tabular-nums mt-0.5">
                      {formatCurrencyCompact(bal.debt)}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Parent & Specialist Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(() => {
                const parent = parents.find(p => p.id === selectedChild.parentId);
                return (
                  <div className="p-3.5 rounded-xl border border-warm-200/80 bg-warm-50/50">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-500 mb-2">
                      Ota-onasi
                    </h4>
                    {parent ? (
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-charcoal-900">{parent.fullName}</p>
                        <a
                          href={`tel:${parent.phone}`}
                          className="text-xs text-brand-600 hover:underline block font-medium"
                        >
                          {parent.phone}
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs text-charcoal-400 italic">Biriktirilmagan</p>
                    )}
                  </div>
                );
              })()}

              {(() => {
                const spec = specialists.find(s => s.id === selectedChild.assignedSpecialistId);
                return (
                  <div className="p-3.5 rounded-xl border border-warm-200/80 bg-warm-50/50">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-500 mb-2">
                      Mas’ul mutaxassis
                    </h4>
                    {spec ? (
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-charcoal-900">{spec.fullName}</p>
                        <p className="text-xs text-charcoal-600">{spec.specialization}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-charcoal-400 italic">Hozircha biriktirilmagan</p>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Notes / Diagnosis */}
            {selectedChild.notes && (
              <div className="p-3.5 rounded-xl border border-warm-200/80 bg-white">
                <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-500 mb-1.5">
                  Tibbiy izoh va tashxis
                </h4>
                <p className="text-xs text-charcoal-700 leading-relaxed whitespace-pre-wrap">
                  {selectedChild.notes}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Create child modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Yangi bola qo'shish"
        description="Bolaning asosiy ma'lumotlarini kiriting"
        size="lg"
      >
        <CreateChildForm onSuccess={() => setShowCreate(false)} onCancel={() => setShowCreate(false)} />
      </Modal>
    </div>
  );
}
