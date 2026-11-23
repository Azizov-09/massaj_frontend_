import { lazy, Suspense, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Baby, Search, Plus, Eye, Pencil, X, Phone,
  AlertCircle, Wallet, RefreshCw, Archive
} from 'lucide-react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Card, Avatar, Badge, Select } from '@/components/ui/primitives';
import { PageHeader } from '@/components/ui/KpiCard';
import { DataTable, Column, getAvatarGradient } from '@/components/tables/DataTable';
import {
  formatAge, formatCurrency, formatCurrencyCompact, formatDate,
  getEntityStatusColor, getEntityStatusLabel, cn, handlePhoneAction,
  normalizeUzbekSearch
} from '@/utils';
import { CreateChildForm } from './CreateChildForm';
import { EditChildModal } from './EditChildModal';
import { ChildServices } from './ChildServices';
import type { Child } from '@/types';

type ChildStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

const Assessments = lazy(() =>
  import('@/features/assessments/AssessmentsPage').then((m) => ({
    default: m.AssessmentsPage,
  }))
);

const Progress = lazy(() =>
  import('@/features/progress/ProgressPage').then((m) => ({
    default: m.ProgressPage,
  }))
);

export function ChildrenPage() {
  const user = useStore((s) => s.currentUser);
  const allChildren = useStore((s) => s.children);
  const parents = useStore((s) => s.parents);
  const accounts = useStore((s) => s.parentAccounts);
  const attendance = useStore((s) => s.attendance);
  const appointments = useStore((s) => s.appointments);
  const services = useStore((s) => s.services);
  const archive = useStore((s) => s.archiveChild);
  const update = useStore((s) => s.updateChild);
  const addToast = useStore((s) => s.addToast);

  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const [activeTab, setActiveTab] = useState<ChildStatusFilter>('ACTIVE');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Child | null>(null);
  const [archiving, setArchiving] = useState<Child | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const children = useMemo(() => {
    return allChildren.filter(
      (c) => user?.role !== 'PARENT' || c.parentId === user.id
    );
  }, [allChildren, user]);

  const child = useMemo(() => {
    const cid = params.get('childId');
    return children.find((c) => c.id === cid);
  }, [children, params]);

  const section = params.get('section') || 'services';

  const choose = (id?: string, nextSection = section) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      if (id) next.set('childId', id);
      else next.delete('childId');
      next.set('section', nextSection);
      return next;
    });

  // Tab counts
  const tabCounts = useMemo(() => {
    let active = 0;
    let inactive = 0;
    let archived = 0;
    for (const c of children) {
      if (c.status === 'ACTIVE') active++;
      else if (c.status === 'ARCHIVED') archived++;
      else inactive++;
    }
    return {
      all: children.length,
      active,
      inactive,
      archived,
    };
  }, [children]);

  // Filtered children
  const filtered = useMemo(() => {
    return children.filter((c) => {
      if (search) {
        const q = search.toLowerCase();
        const matchesName = normalizeUzbekSearch(c.fullName).includes(normalizeUzbekSearch(search));
        const parentObj = parents.find((p) => p.id === c.parentId);
        const matchesParent = parentObj
          ? normalizeUzbekSearch(parentObj.fullName).includes(normalizeUzbekSearch(search)) ||
            (parentObj.phone && parentObj.phone.includes(q))
          : false;
        const matchesDiagnosis = c.diagnosis
          ? normalizeUzbekSearch(c.diagnosis).includes(normalizeUzbekSearch(search))
          : false;
        if (!matchesName && !matchesParent && !matchesDiagnosis) return false;
      }

      if (activeTab === 'ACTIVE' && c.status !== 'ACTIVE') return false;
      if (activeTab === 'INACTIVE' && c.status !== 'INACTIVE') return false;
      if (activeTab === 'ARCHIVED' && c.status !== 'ARCHIVED') return false;

      return true;
    });
  }, [children, search, activeTab, parents]);

  const hasActiveFilters = search !== '' || activeTab !== 'ACTIVE';

  const resetFilters = () => {
    setSearch('');
    setActiveTab('ACTIVE');
  };

  const account = child ? accounts[child.parentId] : undefined;

  const columns: Column<Child>[] = [
    {
      key: 'fullName',
      header: 'Bola',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.fullName} size="md" className="font-semibold" />
          <div className="min-w-0">
            <h3 className="font-semibold text-charcoal-900 text-sm tracking-tight truncate hover:text-brand-700 transition-colors">
              {row.fullName}
            </h3>
            <p className="text-xs text-charcoal-500 mt-0.5">
              {formatAge(row.dateOfBirth)} · {row.gender === 'MALE' ? 'O‘g‘il' : 'Qiz'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'parentId',
      header: 'Ota-onasi',
      cell: (row) => {
        const p = parents.find((item) => item.id === row.parentId);
        if (!p) {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-warm-100 text-charcoal-500">
              Biriktirilmagan
            </span>
          );
        }
        return (
          <div className="min-w-0">
            <Link
              to={`/dashboard/super-admin/parents?search=${encodeURIComponent(p.fullName)}`}
              onClick={(e) => e.stopPropagation()}
              className="font-medium text-xs text-charcoal-900 hover:text-brand-600 transition-colors truncate block"
            >
              {p.fullName}
            </Link>
            {p.phone && (
              <button
                type="button"
                onClick={(e) => handlePhoneAction(e, p.phone, addToast)}
                className="inline-flex items-center gap-1 text-[11px] text-charcoal-400 hover:text-brand-600 transition-colors mt-0.5 cursor-pointer"
              >
                <Phone className="w-2.5 h-2.5 text-charcoal-400" />
                <span>{p.phone}</span>
              </button>
            )}
          </div>
        );
      },
    },
    {
      key: 'diagnosis',
      header: 'Tashxis / Eslatma',
      cell: (row) => (
        <div className="max-w-[220px]">
          <p className="text-xs text-charcoal-800 font-medium truncate" title={row.diagnosis || 'Tashxis yo‘q'}>
            {row.diagnosis || 'Tashxis kiritilmagan'}
          </p>
          {row.allergies && (
            <p className="text-[11px] text-rose-600 truncate mt-0.5" title={`Allergiya: ${row.allergies}`}>
              Allergiya: {row.allergies}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'account',
      header: 'Oila hisobi',
      cell: (row) => {
        const acc = accounts[row.parentId];
        if (!acc) {
          return <span className="text-xs text-charcoal-400">0 so‘m</span>;
        }
        return (
          <div className="space-y-1">
            {acc.debt > 0 ? (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] bg-rose-50 text-rose-600 border border-rose-200 font-semibold text-xs tabular-nums">
                <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                <span>Qarz: {formatCurrencyCompact(acc.debt)}</span>
              </div>
            ) : acc.balance > 0 ? (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-semibold text-xs tabular-nums">
                <Wallet className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>+ {formatCurrencyCompact(acc.balance)}</span>
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
      key: 'actions',
      header: 'Amallar',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              choose(row.id);
            }}
            className="h-8 px-2.5 text-xs text-charcoal-600 hover:text-brand-700 hover:bg-brand-50/60"
            title="Kartani ochish"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            Kartani ochish
          </Button>
          {canManage && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(row);
              }}
              className="h-8 px-2.5 text-xs text-brand-600 border-brand-200 hover:bg-brand-50 hover:border-brand-300"
            >
              <Pencil className="w-3.5 h-3.5 mr-1" />
              Tahrirlash
            </Button>
          )}
          {canManage && (
            row.status === 'ARCHIVED' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={async (e) => {
                  e.stopPropagation();
                  await update(row.id, { status: 'ACTIVE' });
                }}
                className="h-8 px-2.5 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Tiklash
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setArchiving(row);
                  setError('');
                }}
                className="h-8 px-2 text-xs text-rose-600 hover:bg-rose-50"
                title="Arxivlash"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-5">
      <PageHeader
        icon={<Baby className="w-5 h-5 text-white" />}
        title={user?.role === 'PARENT' ? 'Farzandlarim' : 'Bolalar'}
        description={
          user?.role === 'PARENT'
            ? `Jami ${children.length} nafar farzandingiz ro'yxati va xizmatlari`
            : `Jami ${children.length} ta bola ro'yxati, xizmatlari va rivojlanish tarixi`
        }
        actions={
          canManage && (
            <Button
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setShowCreate(true)}
              className="w-full sm:w-auto"
            >
              Bola qo‘shish
            </Button>
          )
        }
      />

      <Card className="overflow-visible border border-warm-200/90 shadow-xs">
        {/* Quick Tabs — Desktop/tablet filter pills */}
        <div className="hidden sm:flex items-center gap-1.5 px-4 py-3 border-b border-warm-200/70 overflow-x-auto touch-scroll-x scrollbar-thin w-full bg-warm-50/30">
          <button
            onClick={() => setActiveTab('ALL')}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer select-none',
              activeTab === 'ALL'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-charcoal-600 hover:bg-warm-100 hover:text-charcoal-900'
            )}
          >
            Barchasi
            <span
              className={cn(
                'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                activeTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-warm-200 text-charcoal-600'
              )}
            >
              {tabCounts.all}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer select-none',
              activeTab === 'ACTIVE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-charcoal-600 hover:bg-emerald-50 hover:text-emerald-800'
            )}
          >
            Faol
            <span
              className={cn(
                'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                activeTab === 'ACTIVE' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
              )}
            >
              {tabCounts.active}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('INACTIVE')}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer select-none',
              activeTab === 'INACTIVE'
                ? 'bg-charcoal-700 text-white shadow-xs'
                : 'text-charcoal-600 hover:bg-warm-100 hover:text-charcoal-900'
            )}
          >
            Nofaol
            <span
              className={cn(
                'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                activeTab === 'INACTIVE' ? 'bg-white/20 text-white' : 'bg-warm-200 text-charcoal-600'
              )}
            >
              {tabCounts.inactive}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ARCHIVED')}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer select-none',
              activeTab === 'ARCHIVED'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-charcoal-600 hover:bg-rose-50 hover:text-rose-700'
            )}
          >
            Arxiv
            <span
              className={cn(
                'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                activeTab === 'ARCHIVED' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'
              )}
            >
              {tabCounts.archived}
            </span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-3 sm:p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-warm-100 bg-warm-50/40">
          <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400 pointer-events-none" />
              <input
                aria-label="Bola ismi bo‘yicha qidirish"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Bola ismi, ota-ona yoki tashxis bo'yicha..."
                className="w-full h-9 pl-9 pr-8 text-xs border border-warm-300 rounded-[10px] bg-white shadow-2xs placeholder:text-charcoal-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all font-medium"
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

            {/* Status filter (Mobile only) */}
            <div className="sm:hidden w-full">
              <Select
                size="sm"
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as ChildStatusFilter)}
                triggerClassName="h-9 rounded-[10px] text-xs font-medium border-warm-300 shadow-2xs w-full"
                options={[
                  { value: 'ALL', label: `Barcha holatlar (${tabCounts.all})` },
                  { value: 'ACTIVE', label: `Faol bolalar (${tabCounts.active})` },
                  { value: 'INACTIVE', label: `Nofaol (${tabCounts.inactive})` },
                  { value: 'ARCHIVED', label: `Arxiv (${tabCounts.archived})` },
                ]}
                aria-label="Holat bo'yicha filter"
              />
            </div>

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
              Ko'rsatilmoqda: <strong className="text-charcoal-900 font-semibold">{filtered.length}</strong> / {children.length}
            </span>
          </div>
        </div>

        {/* Data Table with Expandable Accordion on Mobile (matching Ota-onalar) */}
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={(r) => r.id}
          onRowClick={(row) => choose(row.id)}
          tableClassName="min-w-[850px]"
          emptyTitle="Bola topilmadi"
          emptyDescription={
            canManage
              ? 'Yangi bola qo‘shish tugmasi orqali bolani ro‘yxatdan o‘tkazishingiz mumkin.'
              : 'Qidiruv bo‘yicha hech qanday ma’lumot topilmadi.'
          }
          mobileCardConfig={(row, index) => {
            const p = parents.find((item) => item.id === row.parentId);
            const acc = accounts[row.parentId];
            const initials = row.fullName
              ? row.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
              : 'B';

            return {
              avatarText: initials,
              avatarGradient: getAvatarGradient(index, row.fullName),
              title: (
                <h3 className="font-semibold text-charcoal-900 text-sm truncate leading-tight">
                  {row.fullName}
                </h3>
              ),
              subtitle: `${formatAge(row.dateOfBirth)} · ${
                p ? p.fullName : 'Ota-ona biriktirilmagan'
              }`,
              status: (
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                    row.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                      : 'bg-warm-100 text-charcoal-600 border-warm-200'
                  )}
                >
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full shrink-0',
                      row.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-charcoal-400'
                    )}
                  />
                  {row.status === 'ACTIVE' ? 'Faol' : row.status === 'ARCHIVED' ? 'Arxiv' : 'Nofaol'}
                </span>
              ),
              details: [
                {
                  label: 'Yoshi / T.sana',
                  value: `${formatDate(row.dateOfBirth)} (${formatAge(row.dateOfBirth)})`,
                },
                {
                  label: 'Jinsi',
                  value: row.gender === 'MALE' ? 'O‘g‘il' : 'Qiz',
                },
                {
                  label: 'Ota-onasi',
                  value: p ? (
                    <div className="truncate">
                      <span className="font-medium text-charcoal-900">{p.fullName}</span>
                      {p.phone && (
                        <button
                          type="button"
                          onClick={(e) => handlePhoneAction(e, p.phone, addToast)}
                          className="block text-brand-600 text-[11px] hover:underline cursor-pointer"
                        >
                          {p.phone}
                        </button>
                      )}
                    </div>
                  ) : (
                    'Biriktirilmagan'
                  ),
                },
                {
                  label: 'Tashxis',
                  value: row.diagnosis || 'Kiritilmagan',
                },
                {
                  label: 'Oila hisobi',
                  value: acc ? (
                    acc.balance > 0 ? (
                      <span className="text-emerald-700 font-bold">+{formatCurrencyCompact(acc.balance)}</span>
                    ) : acc.debt > 0 ? (
                      <span className="text-rose-700 font-bold">Qarz: {formatCurrencyCompact(acc.debt)}</span>
                    ) : (
                      "0 so'm"
                    )
                  ) : (
                    "0 so'm"
                  ),
                },
              ],
              actions: (
                <div className="grid grid-cols-2 gap-2 w-full pt-1">
                  <button
                    type="button"
                    onClick={() => choose(row.id)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-warm-200 bg-white text-charcoal-700 text-xs font-medium hover:bg-warm-50 active:bg-warm-100 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-charcoal-500 shrink-0" />
                    <span className="truncate">Kartani ochish</span>
                  </button>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => setEditing(row)}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-brand-200 bg-brand-50 text-brand-700 text-xs font-medium hover:bg-brand-100 active:bg-brand-200 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                      <span className="truncate">Tahrirlash</span>
                    </button>
                  )}
                  {canManage &&
                    (row.status === 'ARCHIVED' ? (
                      <button
                        type="button"
                        onClick={() => void update(row.id, { status: 'ACTIVE' }).catch(() => {})}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 active:bg-emerald-200 shadow-2xs transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">Tiklash</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setArchiving(row);
                          setError('');
                        }}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs font-medium hover:bg-rose-100 active:bg-rose-200 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Archive className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span className="truncate">Arxivlash</span>
                      </button>
                    ))}
                </div>
              ),
            };
          }}
        />
      </Card>

      {/* Child detail modal */}
      <Modal
        isOpen={Boolean(child)}
        onClose={() => choose()}
        title={child?.fullName}
        size="xl"
      >
        {child && (
          <div className="space-y-5">
            <div className="rounded-xl bg-warm-50 p-4 space-y-2 border border-warm-200/60">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-charcoal-900">
                  {formatDate(child.dateOfBirth)} ({formatAge(child.dateOfBirth)}) ·{' '}
                  {child.gender === 'MALE' ? 'O‘g‘il' : 'Qiz'}
                </p>
                <Badge className={getEntityStatusColor(child.status)} dot>
                  {getEntityStatusLabel(child.status)}
                </Badge>
              </div>
              {child.diagnosis && (
                <p className="text-xs text-charcoal-700">
                  <strong className="font-semibold text-charcoal-900">Tashxis:</strong> {child.diagnosis}
                </p>
              )}
              {child.allergies && (
                <p className="text-xs text-rose-600">
                  <strong className="font-semibold">Allergiyalar:</strong> {child.allergies}
                </p>
              )}
              {child.notes && (
                <p className="text-xs text-charcoal-600 italic">
                  {child.notes}
                </p>
              )}
              <div className="pt-1 flex flex-wrap items-center gap-3 text-xs">
                <span className="text-charcoal-600">
                  Oila depoziti:{' '}
                  <strong className="text-emerald-700 font-semibold">
                    {account ? formatCurrency(account.balance) : '0 so‘m'}
                  </strong>
                </span>
                <span className="text-charcoal-400">·</span>
                <span className="text-charcoal-600">
                  Qarz:{' '}
                  <strong className="text-rose-700 font-semibold">
                    {account ? formatCurrency(account.debt) : '0 so‘m'}
                  </strong>
                </span>
              </div>
            </div>

            <div
              className="flex flex-wrap gap-2 border-b border-warm-200 pb-3"
              aria-label="Bola kartasi bo‘limlari"
            >
              {[
                ['services', 'Xizmatlar va seanslar'],
                ['schedule', 'Qabul va davomat'],
                ['assessments', 'Baholashlar'],
                ['progress', 'Rivojlanish'],
              ].map(([id, label]) => (
                <Button
                  key={id}
                  variant={section === id ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => choose(child.id, id)}
                  aria-pressed={section === id}
                >
                  {label}
                </Button>
              ))}
            </div>

            {section === 'services' && (
              <ChildServices
                key={child.id}
                child={child}
                canManage={canManage}
              />
            )}

            {section === 'schedule' && (
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-charcoal-900">Qabullar va davomat tarixi</h3>
                {appointments
                  .filter((a) => a.childId === child.id)
                  .map((a) => (
                    <div key={a.id} className="rounded-lg border border-warm-200 p-3 bg-white text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-charcoal-900">
                          {a.serviceName || services.find((s) => s.id === a.serviceId)?.name || 'Xizmat'}
                        </span>
                        <Badge
                          variant={
                            a.attendanceStatus === 'PRESENT'
                              ? 'success'
                              : a.attendanceStatus === 'ABSENT'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {a.attendanceStatus === 'PRESENT'
                            ? 'Keldi'
                            : a.attendanceStatus === 'ABSENT'
                            ? 'Kelmadi'
                            : 'Rejalashtirilgan'}
                        </Badge>
                      </div>
                      <p className="text-charcoal-500">
                        {formatDate(a.date)} · {a.startTime || 'Vaqt belgilanmagan'}
                      </p>
                    </div>
                  ))}
                {attendance
                  .filter((a) => a.childId === child.id)
                  .map((a) => (
                    <div key={a.id} className="rounded-lg border border-warm-200 p-3 bg-white text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-charcoal-900">Davomat qaydi</span>
                        <Badge variant={['PRESENT', 'LATE'].includes(a.status) ? 'success' : 'danger'}>
                          {['PRESENT', 'LATE'].includes(a.status) ? 'Keldi' : 'Kelmadi'}
                        </Badge>
                      </div>
                      <p className="text-charcoal-500">
                        {formatDate(a.date)}
                        {a.note ? ` · ${a.note}` : ''}
                      </p>
                    </div>
                  ))}
                {!attendance.some((a) => a.childId === child.id) &&
                  !appointments.some((a) => a.childId === child.id) && (
                    <p className="text-xs text-charcoal-500 py-3 text-center bg-warm-50 rounded-lg">
                      Hozircha qabul yoki davomat yozuvi yo‘q.
                    </p>
                  )}
              </div>
            )}

            <Suspense fallback={<p role="status" className="text-xs text-charcoal-500">Tarix yuklanmoqda…</p>}>
              {section === 'assessments' && <Assessments childId={child.id} />}
              {section === 'progress' && <Progress childId={child.id} />}
            </Suspense>
          </div>
        )}
      </Modal>

      {/* Create child modal */}
      {canManage && (
        <Modal
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          title="Bola qo‘shish"
          size="lg"
        >
          <CreateChildForm
            onCancel={() => setShowCreate(false)}
            onSuccess={(created) => {
              setShowCreate(false);
              choose(created.id, 'services');
            }}
          />
        </Modal>
      )}

      {/* Edit child modal */}
      {canManage && editing && (
        <EditChildModal
          child={editing}
          isOpen
          onClose={() => setEditing(null)}
          onSuccess={() => setEditing(null)}
        />
      )}

      {/* Archive child confirmation modal */}
      <Modal
        isOpen={Boolean(archiving)}
        onClose={() => {
          if (!busy) setArchiving(null);
        }}
        title="Bolani arxivlash"
      >
        <p className="text-sm text-charcoal-600">
          Ushbu profil ro‘yxat arxiviga o‘tadi. Xizmatlar va moliyaviy tarix to‘liq saqlanadi.
        </p>
        {error && (
          <p role="alert" className="text-xs text-rose-600 mt-2 font-medium">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => setArchiving(null)}
          >
            Bekor qilish
          </Button>
          <Button
            disabled={busy}
            onClick={async () => {
              if (!archiving || busy) return;
              setBusy(true);
              try {
                await archive(archiving.id);
                setArchiving(null);
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Arxivlanmadi');
              } finally {
                setBusy(false);
              }
            }}
          >
            Arxivlash
          </Button>
        </div>
      </Modal>
    </div>
  );
}
