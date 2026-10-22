// ═══════════════════════════════════════════════════════
//  Children List Page — Full CRUD management & Optimizations
// ═══════════════════════════════════════════════════════
import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus, Search, Baby, X, Calendar, Clock, Eye, Users,
  Edit, Archive, RotateCcw, ShieldCheck, AlertCircle
} from 'lucide-react';
import { useStore, useAuth } from '@/store';
import { calculateChildBalance } from '@/services/finance.service';
import {
  formatAge, formatDate, formatCurrencyCompact,
  getEntityStatusColor, getEntityStatusLabel, normalizeUzbekSearch, cn
} from '@/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { DataTable, Column, getAvatarGradient } from '@/components/tables/DataTable';
import { Card, Avatar, Badge, Select } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/KpiCard';
import { Modal } from '@/components/ui/Modal';
import { CreateChildForm } from './CreateChildForm';
import { EditChildModal } from './EditChildModal';
import type { Child } from '@/types';

export function ChildrenPage() {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const allChildren = useStore(s => s.children);
  const specialists = useStore(s => s.specialists);
  const parents = useStore(s => s.parents);
  const transactions = useStore(s => s.transactions);
  const appointments = useStore(s => s.appointments);
  const updateChild = useStore(s => s.updateChild);
  const archiveChild = useStore(s => s.archiveChild);
  const deleteChild = useStore(s => s.deleteChild);
  const addToast = useStore(s => s.addToast);

  const isParent = currentUser?.role === 'PARENT';
  const baseChildren = useMemo(() => {
    if (isParent && currentUser) {
      return allChildren.filter(c => c.parentId === currentUser.id);
    }
    return allChildren;
  }, [allChildren, isParent, currentUser]);

  const [prevSearchParam, setPrevSearchParam] = useState(() => searchParams.get('search'));
  const [searchInput, setSearchInput] = useState(() => searchParams.get('search') || '');
  const debouncedSearch = useDebounce(searchInput, 350);

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [specialistFilter, setSpecialistFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [visibleRange, setVisibleRange] = useState<{ start: number; end: number; total: number } | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [deletingChild, setDeletingChild] = useState<Child | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleToggleStatus = async (child: Child) => {
    const nextStatus = child.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateChild(child.id, { status: nextStatus });
      addToast({
        type: 'info',
        title: nextStatus === 'ACTIVE' ? "Bola faollashtirildi" : "Bola nofaol qilindi",
        description: `${child.fullName} holati o'zgartirildi`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: "Xatolik yuz berdi",
        description: err?.message || "Bola holatini o'zgartirib bo'lmadi",
      });
    }
  };

  const handleDeleteChild = (child: Child) => {
    setDeleteError(null);
    setDeletingChild(child);
  };

  const confirmDeleteChild = async () => {
    if (!deletingChild) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteChild(deletingChild.id);
      setDeletingChild(null);
    } catch (err: any) {
      setDeleteError(err?.message || "Bolani o'chirishda xatolik yuz berdi");
    } finally {
      setIsDeleting(false);
    }
  };

  // Synchronize URL search param adjustments during render
  const urlSearch = searchParams.get('search');
  if (urlSearch !== prevSearchParam) {
    setPrevSearchParam(urlSearch);
    if (urlSearch !== null) {
      setSearchInput(urlSearch);
    }
  }

  // Filter children based on debounced search, status, and specialist
  const filtered = useMemo(() => {
    let result = baseChildren;
    if (debouncedSearch) {
      const q = normalizeUzbekSearch(debouncedSearch);
      result = result.filter(c =>
        normalizeUzbekSearch(c.fullName).includes(q) ||
        normalizeUzbekSearch(parents.find(p => p.id === c.parentId)?.fullName).includes(q)
      );
    }
    if (statusFilter) result = result.filter(c => c.status === statusFilter);
    if (specialistFilter) result = result.filter(c => c.assignedSpecialistId === specialistFilter);
    return result;
  }, [baseChildren, debouncedSearch, statusFilter, specialistFilter, parents]);

  const activeFilterCount = [statusFilter, specialistFilter].filter(Boolean).length + (debouncedSearch ? 1 : 0);

  const resetFilters = () => {
    setSearchInput('');
    setStatusFilter('');
    setSpecialistFilter('');
    setPage(1);
  };

  // Status counts for cards and tabs (recalculates immediately in real-time)
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

  // Exact visible range string matching the bottom pagination
  const rangeDisplay = useMemo(() => {
    if (!visibleRange || visibleRange.total === 0) {
      return filtered.length === 0 ? '0' : `1–${Math.min(10, filtered.length)}`;
    }
    return `${visibleRange.start}–${visibleRange.end}`;
  }, [visibleRange, filtered.length]);

  const columns: Column<Child>[] = [
    {
      key: 'fullName',
      header: 'Bola',
      sortable: true,
      className: 'py-3.5 max-w-[220px]',
      cell: (row) => {
        const parent = parents.find(p => p.id === row.parentId);
        return (
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={row.fullName} size="sm" className="ring-2 ring-warm-100 shadow-2xs shrink-0 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-semibold text-charcoal-900 text-sm truncate max-w-[180px] sm:max-w-[200px] group-hover:text-brand-600 transition-colors">
                  {row.fullName}
                </p>
                {row.diagnosis && (
                  <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded shrink-0 flex-shrink-0">
                    {row.diagnosis}
                  </span>
                )}
              </div>
              <p className="text-xs text-charcoal-500 truncate flex items-center gap-1 mt-0.5 max-w-[200px]">
                {parent ? (
                  <>
                    <Users className="w-3 h-3 text-charcoal-400 shrink-0 flex-shrink-0" />
                    <span className="truncate">{parent.fullName}</span>
                    {parent.phone && <span className="text-charcoal-400 font-mono text-[11px] shrink-0">• {parent.phone}</span>}
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
      className: 'py-3.5 whitespace-nowrap',
      cell: (row) => (
        <div className="whitespace-nowrap">
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
      className: 'py-3.5 max-w-[180px]',
      cell: (row) => {
        const spec = specialists.find(s => s.id === row.assignedSpecialistId);
        return spec ? (
          <div className="flex items-center gap-2 min-w-0">
            <Avatar name={spec.fullName} size="xs" className="ring-1 ring-warm-200 shrink-0 flex-shrink-0" />
            <div className="min-w-0 flex-1">
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
      header: "Keyingi seans",
      className: 'py-3.5 whitespace-nowrap',
      cell: (row) => {
        const next = nextAppointmentsMap.get(row.id);
        return next ? (
          <div className="whitespace-nowrap">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-charcoal-800">
              <Calendar className="w-3.5 h-3.5 text-brand-600 shrink-0 flex-shrink-0" />
              <span>{formatDate(next.date)}</span>
            </div>
            <div className="inline-flex items-center gap-1 text-[11px] font-medium text-charcoal-600 bg-warm-100/80 px-1.5 py-0.5 rounded mt-0.5">
              <Clock className="w-3 h-3 text-charcoal-400 shrink-0 flex-shrink-0" />
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
      className: 'py-3.5 whitespace-nowrap',
      cell: (row) => {
        const bal = balancesMap.get(row.id) ?? { balance: 0, debt: 0 };
        return (
          <div className="whitespace-nowrap shrink-0 flex-shrink-0">
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
      className: 'py-3.5 whitespace-nowrap',
      cell: (row) => (
        <Badge className={cn('shadow-2xs font-semibold whitespace-nowrap shrink-0 flex-shrink-0', getEntityStatusColor(row.status))} dot>
          {getEntityStatusLabel(row.status)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Amallar',
      headerClassName: 'text-right pr-4',
      className: 'py-3.5 text-right whitespace-nowrap',
      width: '140px',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedChild(row);
            }}
            className="h-8 px-2 text-xs text-charcoal-600 hover:text-brand-700 hover:bg-brand-50/60"
            title="Batafsil ko'rish"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            Ko'rish
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setEditingChild(row);
            }}
            className="h-8 w-8 p-0 text-charcoal-500 hover:text-amber-700 hover:bg-amber-50/60"
            title="Tahrirlash"
          >
            <Edit className="w-3.5 h-3.5" />
          </Button>
          {row.status === 'ARCHIVED' ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                updateChild(row.id, { status: 'ACTIVE' });
              }}
              className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/60"
              title="Arxivdan qaytarish"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                archiveChild(row.id);
              }}
              className="h-8 w-8 p-0 text-charcoal-400 hover:text-amber-600 hover:bg-amber-50/60"
              title="Arxivlash"
            >
              <Archive className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteChild(row);
            }}
            className="h-8 w-8 p-0 text-charcoal-400 hover:text-rose-600 hover:bg-rose-50/60"
            title="O'chirish"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="px-3.5 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-[1600px] mx-auto space-y-4 sm:space-y-5">
      <PageHeader
        icon={<Baby className="w-5 h-5 text-white" />}
        title={isParent ? "Farzandlarim" : "Bolalar"}
        description={isParent ? `Sizning ro'yxatdagi ${baseChildren.length} ta farzandingiz` : `Jami ${statusCounts.all} ta bola, ${statusCounts.active} ta faol`}
        actions={
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)} className="w-full sm:w-auto">
            {isParent ? "Farzand qo'shish" : "Bola qo'shish"}
          </Button>
        }
      />

      {/* Real-time KPI Counter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => { setStatusFilter(''); setPage(1); }}
          className={cn(
            'p-4 rounded-xl border text-left transition-all cursor-pointer shadow-2xs hover:shadow-sm',
            statusFilter === ''
              ? 'bg-charcoal-900 border-charcoal-900 text-white shadow-xs'
              : 'bg-white border-warm-200/90 hover:border-warm-300 text-charcoal-900'
          )}
        >
          <div className="flex items-center justify-between">
            <span className={cn('text-xs font-semibold', statusFilter === '' ? 'text-charcoal-300' : 'text-charcoal-500')}>
              Jami bolalar
            </span>
            <Users className={cn('w-4 h-4', statusFilter === '' ? 'text-warm-300' : 'text-charcoal-400')} />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tabular-nums">{statusCounts.all}</span>
            <span className={cn('text-xs font-medium', statusFilter === '' ? 'text-charcoal-300' : 'text-charcoal-400')}>bola</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('ACTIVE'); setPage(1); }}
          className={cn(
            'p-4 rounded-xl border text-left transition-all cursor-pointer shadow-2xs hover:shadow-sm',
            statusFilter === 'ACTIVE'
              ? 'bg-emerald-700 border-emerald-700 text-white shadow-xs'
              : 'bg-white border-warm-200/90 hover:border-warm-300 text-charcoal-900'
          )}
        >
          <div className="flex items-center justify-between">
            <span className={cn('text-xs font-semibold', statusFilter === 'ACTIVE' ? 'text-emerald-100' : 'text-emerald-700')}>
              Faol
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={cn('text-2xl font-bold tabular-nums', statusFilter === 'ACTIVE' ? 'text-white' : 'text-emerald-600')}>{statusCounts.active}</span>
            <span className={cn('text-xs font-medium', statusFilter === 'ACTIVE' ? 'text-emerald-100' : 'text-charcoal-400')}>faol</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('INACTIVE'); setPage(1); }}
          className={cn(
            'p-4 rounded-xl border text-left transition-all cursor-pointer shadow-2xs hover:shadow-sm',
            statusFilter === 'INACTIVE'
              ? 'bg-amber-700 border-amber-700 text-white shadow-xs'
              : 'bg-white border-warm-200/90 hover:border-warm-300 text-charcoal-900'
          )}
        >
          <div className="flex items-center justify-between">
            <span className={cn('text-xs font-semibold', statusFilter === 'INACTIVE' ? 'text-amber-100' : 'text-amber-700')}>
              Nofaol
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={cn('text-2xl font-bold tabular-nums', statusFilter === 'INACTIVE' ? 'text-white' : 'text-amber-600')}>{statusCounts.inactive}</span>
            <span className={cn('text-xs font-medium', statusFilter === 'INACTIVE' ? 'text-amber-100' : 'text-charcoal-400')}>nofaol</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('ARCHIVED'); setPage(1); }}
          className={cn(
            'p-4 rounded-xl border text-left transition-all cursor-pointer shadow-2xs hover:shadow-sm',
            statusFilter === 'ARCHIVED'
              ? 'bg-charcoal-800 border-charcoal-800 text-white shadow-xs'
              : 'bg-white border-warm-200/90 hover:border-warm-300 text-charcoal-900'
          )}
        >
          <div className="flex items-center justify-between">
            <span className={cn('text-xs font-semibold', statusFilter === 'ARCHIVED' ? 'text-charcoal-300' : 'text-charcoal-500')}>
              Arxivlangan
            </span>
            <Archive className={cn('w-4 h-4', statusFilter === 'ARCHIVED' ? 'text-charcoal-300' : 'text-charcoal-400')} />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={cn('text-2xl font-bold tabular-nums', statusFilter === 'ARCHIVED' ? 'text-white' : 'text-charcoal-600')}>{statusCounts.archived}</span>
            <span className={cn('text-xs font-medium', statusFilter === 'ARCHIVED' ? 'text-charcoal-300' : 'text-charcoal-400')}>arxiv</span>
          </div>
        </button>
      </div>

      {/* Main Table Card */}
      <Card className="w-full max-w-full overflow-hidden border border-warm-200/90 shadow-xs">
        {/* Status Tabs Bar */}
        <div className="hidden sm:flex px-3.5 sm:px-4 py-2.5 sm:py-3 bg-warm-50/70 border-b border-warm-200/80 items-center justify-between gap-2.5 sm:gap-3">
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
                    setPage(1);
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
              Ko‘rsatilmoqda: <strong className="text-charcoal-900 font-bold">{rangeDisplay}</strong> / {baseChildren.length}
            </span>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="p-3 sm:p-3.5 bg-white border-b border-warm-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 relative z-30">
          {/* Search with 350ms Debounce */}
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400 pointer-events-none" />
            <input
              value={searchInput}
              onChange={e => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              placeholder={isParent ? "Farzand ismi bo'yicha qidirish..." : "Bola yoki ota-ona ismi bo'yicha..."}
              className="w-full h-9 pl-9 pr-8 text-xs border border-warm-300 rounded-[10px] bg-white shadow-2xs placeholder:text-charcoal-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100/80 outline-none transition-all font-medium text-charcoal-800"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-700 p-0.5 rounded-full cursor-pointer"
                title="Qidiruvni tozalash"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto">
            {/* Status filter on mobile */}
            <div className="sm:hidden w-full relative z-30">
              <Select
                size="sm"
                triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300 font-medium w-full"
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: '', label: `Barcha holatlar (${statusCounts.all})` },
                  { value: 'ACTIVE', label: `Faol bolalar (${statusCounts.active})` },
                  { value: 'INACTIVE', label: `Nofaol bolalar (${statusCounts.inactive})` },
                  { value: 'ARCHIVED', label: `Arxivlangan (${statusCounts.archived})` },
                ]}
                aria-label="Holat bo'yicha filter"
              />
            </div>

            {/* Specialist filter */}
            <div className="w-full sm:w-56 relative z-30">
              <Select
                size="sm"
                triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300 font-medium w-full"
                value={specialistFilter}
                onChange={e => {
                  setSpecialistFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'Barcha mutaxassislar' },
                  ...specialists
                    .filter(s => s.status === 'ACTIVE')
                    .map(s => ({ value: s.id, label: s.fullName })),
                ]}
                aria-label="Mutaxassis bo'yicha filter"
              />
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-[10px] text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-colors shadow-2xs cursor-pointer w-full sm:w-auto ml-auto sm:ml-0"
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
          page={page}
          onPageChange={setPage}
          onPaginationChange={setVisibleRange}
          tableClassName="min-w-[900px]"
          onRowClick={r => setSelectedChild(r)}
          mobileCardConfig={(row, index) => {
            const parent = parents.find(p => p.id === row.parentId);
            const spec = specialists.find(s => s.id === row.assignedSpecialistId);
            const bal = balancesMap.get(row.id) ?? { balance: 0, debt: 0 };
            const next = nextAppointmentsMap.get(row.id);
            const initials = row.fullName
              ? row.fullName.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
              : 'B';

            return {
              avatarText: initials,
              avatarGradient: getAvatarGradient(index, row.fullName),
              title: row.fullName,
              subtitle: `${formatAge(row.dateOfBirth)} • ${row.diagnosis || 'Massaj'}`,
              status: (
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap shrink-0",
                  getEntityStatusColor(row.status)
                )}>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-current" />
                  {getEntityStatusLabel(row.status)}
                </span>
              ),
              details: [
                {
                  label: 'Ota-ona',
                  value: parent ? (
                    <div>
                      <span className="font-semibold text-charcoal-800">{parent.fullName}</span>
                      {parent.phone && (
                        <a href={`tel:${parent.phone}`} onClick={e => e.stopPropagation()} className="text-brand-600 block text-xs font-mono mt-0.5">
                          {parent.phone}
                        </a>
                      )}
                    </div>
                  ) : 'Biriktirilmagan'
                },
                {
                  label: 'Mutaxassis',
                  value: spec ? (
                    <div>
                      <span className="font-semibold text-charcoal-800">{spec.fullName}</span>
                      <span className="text-charcoal-400 block text-[11px]">{spec.specialization || 'Mutaxassis'}</span>
                    </div>
                  ) : 'Biriktirilmagan'
                },
                {
                  label: 'Balans',
                  value: bal.debt > 0 ? (
                    <span className="text-rose-600 font-bold font-mono">Qarz: {formatCurrencyCompact(bal.debt)}</span>
                  ) : bal.balance > 0 ? (
                    <span className="text-emerald-600 font-bold font-mono">+{formatCurrencyCompact(bal.balance)}</span>
                  ) : (
                    <span className="text-charcoal-500 font-medium">0 so'm</span>
                  )
                },
                {
                  label: 'Navbatdagi seans',
                  value: next ? formatDate(next.date) : 'Rejalanmagan'
                }
              ],
              actions: (
                <div className="grid grid-cols-2 gap-2 w-full pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedChild(row)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-warm-200 bg-white text-charcoal-700 text-xs font-medium hover:bg-warm-50 active:bg-warm-100 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-charcoal-500 shrink-0" />
                    <span className="truncate">Ko'rish</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingChild(row)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-brand-200 bg-brand-50 text-brand-700 text-xs font-medium hover:bg-brand-100 active:bg-brand-200 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                    <span className="truncate">Tahrirlash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(row)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-warm-200 bg-white text-charcoal-700 text-xs font-medium hover:bg-warm-50 active:bg-warm-100 shadow-2xs transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">{row.status === 'ACTIVE' ? 'Nofaol qilish' : 'Faollashtirish'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteChild(row)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 text-xs font-medium hover:bg-rose-100 active:bg-rose-200 shadow-2xs transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">O'chirish</span>
                  </button>
                </div>
              )
            };
          }}
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
            <span className="hidden sm:inline-block text-warm-300">•</span>
            <span className="text-charcoal-500 font-medium">Arxivlangan: <strong className="font-bold">{statusCounts.archived}</strong></span>
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
              <Avatar name={selectedChild.fullName} size="lg" className="text-base font-bold shrink-0 flex-shrink-0" />
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

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-4 border-t border-warm-200">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const current = selectedChild;
                    setSelectedChild(null);
                    setEditingChild(current);
                  }}
                  leftIcon={<Edit className="w-3.5 h-3.5 text-amber-600" />}
                >
                  Tahrirlash
                </Button>
                {selectedChild.status === 'ARCHIVED' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                    onClick={() => {
                      updateChild(selectedChild.id, { status: 'ACTIVE' });
                      setSelectedChild({ ...selectedChild, status: 'ACTIVE' });
                    }}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5 text-emerald-600" />}
                  >
                    Faollashtirish
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-rose-700 border-rose-300 hover:bg-rose-50"
                    onClick={() => {
                      archiveChild(selectedChild.id);
                      setSelectedChild({ ...selectedChild, status: 'ARCHIVED' });
                    }}
                    leftIcon={<Archive className="w-3.5 h-3.5 text-rose-600" />}
                  >
                    Arxivga o'tkazish
                  </Button>
                )}
              </div>
              <Button variant="secondary" size="sm" onClick={() => setSelectedChild(null)}>
                Yopish
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Child Modal */}
      {editingChild && (
        <EditChildModal
          isOpen={!!editingChild}
          child={editingChild}
          onClose={() => setEditingChild(null)}
          onSuccess={() => {
            setEditingChild(null);
          }}
        />
      )}

      {/* In-App Delete Confirmation Modal (no browser native dialog) */}
      {deletingChild && (
        <Modal
          isOpen={!!deletingChild}
          onClose={() => setDeletingChild(null)}
          title="Bolani o'chirish"
          size="sm"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeletingChild(null)}
                disabled={isDeleting}
              >
                Bekor qilish
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={confirmDeleteChild}
                loading={isDeleting}
              >
                Ha, o'chirish
              </Button>
            </div>
          }
        >
          <div className="space-y-3 py-2 text-charcoal-700">
            {deleteError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-danger-surface border border-danger-main/30 text-danger-main text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{deleteError}</p>
              </div>
            )}
            <p className="text-sm">
              Haqiqatan ham <strong className="font-semibold text-charcoal-900">{deletingChild.fullName}</strong> bolaning profilini tizimdan o'chirishni tasdiqlaysizmi?
            </p>
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200/80 rounded-lg p-2.5">
              ⚠️ Ushbu amal bolaga tegishli ma'lumotlarni tizimdan butunlay olib tashlaydi.
            </p>
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
