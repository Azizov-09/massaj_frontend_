// ═══════════════════════════════════════════════════════
//  Children List Page — Full CRUD management
// ═══════════════════════════════════════════════════════
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Baby, ArrowRight, X } from 'lucide-react';
import { useStore, useAuth } from '@/store';
import { calculateChildBalance } from '@/services/finance.service';
import {
  formatAge, formatDate, formatCurrencyCompact,
  getEntityStatusColor, getEntityStatusLabel,
} from '@/utils';
import { DataTable, Column } from '@/components/tables/DataTable';
import { Card, Avatar, Badge } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/KpiCard';
import { Modal } from '@/components/ui/Modal';
import { CreateChildForm } from './CreateChildForm';
import type { Child } from '@/types';

export function ChildrenPage() {
  const { currentUser } = useAuth();
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

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [specialistFilter, setSpecialistFilter] = useState<string>('');
  const [showCreate, setShowCreate] = useState(false);

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

  const activeFilterCount = [statusFilter, specialistFilter].filter(Boolean).length;

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
      cell: (row) => {
        const parent = parents.find(p => p.id === row.parentId);
        return (
          <div className="flex items-center gap-2.5">
            <Avatar name={row.fullName} size="sm" />
            <div>
              <p className="font-medium text-charcoal-900 text-sm">{row.fullName}</p>
              <p className="text-xs text-charcoal-400">{parent?.fullName ?? '—'}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'dateOfBirth',
      header: 'Yosh',
      sortable: true,
      cell: (row) => (
        <span className="text-sm text-charcoal-700">{formatAge(row.dateOfBirth)}</span>
      ),
    },
    {
      key: 'assignedSpecialistId',
      header: 'Mutaxassis',
      cell: (row) => {
        const spec = specialists.find(s => s.id === row.assignedSpecialistId);
        return spec ? (
          <div className="flex items-center gap-1.5">
            <Avatar name={spec.fullName} size="xs" />
            <span className="text-sm text-charcoal-700">{spec.fullName}</span>
          </div>
        ) : <span className="text-charcoal-400 text-sm">—</span>;
      },
    },
    {
      key: 'nextAppointment',
      header: "Keyingi uchrashuv",
      cell: (row) => {
        const next = nextAppointmentsMap.get(row.id);
        return next ? (
          <div>
            <p className="text-sm text-charcoal-700">{formatDate(next.date)}</p>
            <p className="text-xs text-charcoal-400">{next.startTime}</p>
          </div>
        ) : <span className="text-charcoal-400 text-sm">—</span>;
      },
    },
    {
      key: 'balance',
      header: 'Balans',
      cell: (row) => {
        const bal = balancesMap.get(row.id) ?? { balance: 0, debt: 0 };
        return (
          <div>
            {bal.balance > 0 && (
              <p className="text-sm font-semibold text-green-600 tabular-nums">{formatCurrencyCompact(bal.balance)}</p>
            )}
            {bal.debt > 0 && (
              <p className="text-xs text-danger-main tabular-nums">Qarz: {formatCurrencyCompact(bal.debt)}</p>
            )}
            {bal.balance === 0 && bal.debt === 0 && (
              <span className="text-charcoal-400 text-sm">0</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Holat',
      cell: (row) => (
        <Badge className={getEntityStatusColor(row.status)} dot>
          {getEntityStatusLabel(row.status)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      cell: (row) => (
        <Link
          to={`./children/${row.id}`}
          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
          onClick={e => e.stopPropagation()}
        >
          Ko'rish <ArrowRight className="w-3 h-3" />
        </Link>
      ),
    },
  ];

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-5">
      <PageHeader
        title={isParent ? "Farzandlarim" : "Bolalar"}
        description={isParent ? `Sizning ro'yxatdagi ${baseChildren.length} ta farzandingiz` : `Jami ${allChildren.length} ta bola, ${allChildren.filter(c => c.status === 'ACTIVE').length} ta faol`}
        actions={
          !isParent ? (
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
              Bola qo'shish
            </Button>
          ) : undefined
        }
      />

      {/* Filters */}
      <Card>
        <div className="px-4 py-3 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Ism yoki ota-ona bo'yicha qidirish..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-warm-300 rounded-[10px] bg-white outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-colors placeholder:text-charcoal-400"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-700">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-warm-300 rounded-[10px] bg-white outline-none focus:border-brand-500 text-charcoal-700 cursor-pointer"
            aria-label="Holat bo'yicha filter"
          >
            <option value="">Barcha holatlar</option>
            <option value="ACTIVE">Faol</option>
            <option value="INACTIVE">Nofaol</option>
            <option value="ARCHIVED">Arxivlangan</option>
          </select>

          {/* Specialist filter */}
          <select
            value={specialistFilter}
            onChange={e => setSpecialistFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-warm-300 rounded-[10px] bg-white outline-none focus:border-brand-500 text-charcoal-700 cursor-pointer max-w-[200px]"
            aria-label="Mutaxassis bo'yicha filter"
          >
            <option value="">Barcha mutaxassislar</option>
            {specialists.filter(s => s.status === 'ACTIVE').map(s => (
              <option key={s.id} value={s.id}>{s.fullName}</option>
            ))}
          </select>

          {activeFilterCount > 0 && (
            <button
              onClick={() => { setStatusFilter(''); setSpecialistFilter(''); }}
              className="flex items-center gap-1 text-xs text-danger-main hover:text-danger-dark font-medium"
            >
              <X className="w-3 h-3" /> Filterlarni tozalash ({activeFilterCount})
            </button>
          )}

          <span className="ml-auto text-xs text-charcoal-400">{filtered.length} ta natija</span>
        </div>

        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={r => r.id}
          emptyTitle="Bolalar topilmadi"
          emptyDescription="Qidiruv shartlarini o'zgartiring yoki yangi bola qo'shing"
          emptyIcon={<Baby className="w-5 h-5" />}
          emptyAction={
            <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowCreate(true)}>
              Bola qo'shish
            </Button>
          }
        />
      </Card>

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
