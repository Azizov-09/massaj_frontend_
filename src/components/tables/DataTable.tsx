// ═══════════════════════════════════════════════════════
//  Data Table — Reusable sortable, paginated table
// ═══════════════════════════════════════════════════════
import { useState, useMemo, useEffect } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, sortBy, paginate, useIsMobile } from '@/utils';
import { EmptyState, Skeleton, Select } from '@/components/ui/primitives';

export interface Column<T> {
  key: keyof T | string;
  header?: string;
  title?: string;
  sortable?: boolean;
  width?: string;
  className?: string;
  headerClassName?: string;
  cell?: (row: T, index: number) => React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  hideOnMobile?: boolean;
  fullWidthOnMobile?: boolean;
}

export interface MobileCardDetail {
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
}

export interface MobileCardConfig {
  avatar?: React.ReactNode;
  avatarText?: string;
  avatarGradient?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  status?: React.ReactNode;
  details?: MobileCardDetail[];
  actions?: React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  pageSize?: number;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;
  onRowClick?: (row: T) => void;
  className?: string;
  tableClassName?: string;
  stickyHeader?: boolean;
  /** Optional custom mobile card renderer. (row, index, isExpanded, toggleExpand) */
  renderMobileCard?: (row: T, index: number, isExpanded?: boolean, toggleExpand?: () => void) => React.ReactNode;
  /** Optional declarative mobile card config for automatic accordion rendering */
  mobileCardConfig?: (row: T, index: number) => MobileCardConfig;
  /** Whether to force traditional table on mobile instead of card view */
  forceTableOnMobile?: boolean;
  /** Controlled page number (1-based) */
  page?: number;
  /** Callback fired when current page changes */
  onPageChange?: (page: number) => void;
  /** Callback fired with the current visible range and count */
  onPaginationChange?: (range: { start: number; end: number; total: number; page: number; pageSize: number }) => void;
}

export const AVATAR_GRADIENTS = [
  'from-rose-500 to-red-500',
  'from-indigo-500 to-violet-600',
  'from-emerald-500 to-teal-600',
  'from-blue-500 to-cyan-600',
  'from-amber-500 to-orange-500',
  'from-purple-500 to-pink-500',
  'from-sky-500 to-blue-600',
  'from-teal-500 to-emerald-600',
];

export function getAvatarGradient(index: number, text?: string): string {
  if (text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) hash = text.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
  }
  return AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
}

const PAGE_SIZES = [10, 20, 50];

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  pageSize: defaultPageSize = 10,
  loading,
  emptyTitle = 'Ma\'lumot topilmadi',
  emptyDescription,
  emptyIcon,
  emptyAction,
  onRowClick,
  className,
  tableClassName,
  stickyHeader,
  renderMobileCard,
  mobileCardConfig,
  forceTableOnMobile = false,
  page: controlledPage,
  onPageChange,
  onPaginationChange,
}: DataTableProps<T>) {
  const isMobile = useIsMobile();
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [internalPage, setInternalPage] = useState(1);
  const [prevData, setPrevData] = useState(data);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());

  // Synchronize internal page during render when data prop changes
  if (data !== prevData) {
    setPrevData(data);
    if (controlledPage === undefined) {
      setInternalPage(1);
    }
  }

  const isControlledPage = controlledPage !== undefined;
  const rawPage = isControlledPage ? controlledPage : internalPage;

  const toggleRowExpand = (id: string | number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return sortBy(data, sortKey as keyof T, sortOrder);
  }, [data, sortKey, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const page = Math.min(Math.max(1, rawPage), totalPages);

  const setPage = (updater: number | ((prev: number) => number)) => {
    const nextPage = typeof updater === 'function' ? updater(page) : updater;
    if (!isControlledPage) {
      setInternalPage(nextPage);
    }
    onPageChange?.(nextPage);
  };

  const paged = useMemo(() => paginate(sorted, page, pageSize), [sorted, page, pageSize]);

  // Notify parent of visible range
  useEffect(() => {
    const start = sorted.length === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, sorted.length);
    onPaginationChange?.({ start, end, total: sorted.length, page, pageSize });
  }, [page, pageSize, sorted.length, onPaginationChange]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
    setPage(1);
  };

  if (loading) {
    return (
      <div className="p-3 sm:p-4 space-y-3">
        {!forceTableOnMobile && isMobile ? (
          /* Mobile skeleton cards */
          <div className="space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3.5 rounded-[12px] bg-white border border-warm-200/80 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-28 rounded-[4px]" />
                      <Skeleton className="h-3 w-20 rounded-[4px]" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-16 rounded-[6px]" />
                </div>
                <div className="pt-2 border-t border-warm-100 flex items-center justify-between">
                  <Skeleton className="h-3 w-24 rounded-[4px]" />
                  <Skeleton className="h-3 w-16 rounded-[4px]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Desktop skeleton table */
          <div className="overflow-x-auto touch-scroll-x scrollbar-thin space-y-3">
            <div className="flex items-center gap-4 py-2 border-b border-warm-200">
              {columns.map((col, i) => (
                <Skeleton key={i} className="h-4 rounded-[6px]" style={{ width: col.width || '120px' }} />
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-warm-100">
                {columns.map((col, j) => (
                  <Skeleton key={j} className="h-4 rounded-[6px]" style={{ width: col.width || '100px' }} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!loading && data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} action={emptyAction} />;
  }

  // Identify special columns for default mobile view
  const primaryCol = columns[0];
  const statusCol = columns.find(c => String(c.key).toLowerCase() === 'status');
  const actionCol = columns.find(c => String(c.key).toLowerCase() === 'actions');
  const middleCols = columns.filter(c => c !== primaryCol && c !== statusCol && c !== actionCol && !c.hideOnMobile);

  return (
    <div className={cn('flex flex-col', className)}>
      {/* ─── Mobile Accordion View (< md) or Desktop Table View (>= md) ─── */}
      {!forceTableOnMobile && isMobile ? (
        <div className="divide-y divide-warm-100 bg-white">
          {paged.map((row, i) => {
            const rowId = keyExtractor(row);
            const isExpanded = expandedRows.has(rowId);

            if (renderMobileCard) {
              return (
                <div
                  key={rowId}
                  className="transition-colors"
                >
                  {renderMobileCard(row, (page - 1) * pageSize + i, isExpanded, () => toggleRowExpand(rowId))}
                </div>
              );
            }

            // Mobile Card Config or Default Smart Accordion Row
            const config = mobileCardConfig ? mobileCardConfig(row, (page - 1) * pageSize + i) : null;

            const title = config?.title ?? (primaryCol && (primaryCol.cell || primaryCol.render || ((r: any) => String(r[primaryCol.key] ?? '')))(row, i));
            const subtitle = config?.subtitle;
            const status = config?.status ?? (statusCol && (statusCol.cell || statusCol.render || ((r: any) => String(r[statusCol.key] ?? '')))(row, i));

            const avatarNode = config?.avatar ?? (
              <div
                className={cn(
                  'w-10 h-10 rounded-xl bg-gradient-to-tr text-white font-bold select-none shadow-xs text-sm flex items-center justify-center flex-shrink-0',
                  config?.avatarGradient || getAvatarGradient(i, typeof title === 'string' ? title : undefined)
                )}
              >
                {config?.avatarText || (typeof title === 'string' ? title.slice(0, 2).toUpperCase() : String(i + 1))}
              </div>
            );

            const details: MobileCardDetail[] = config?.details ?? middleCols.map(col => ({
              label: col.header || col.title || String(col.key),
              value: (col.cell || col.render || ((r: any) => String(r[col.key] ?? '')))(row, i),
              fullWidth: col.fullWidthOnMobile,
            }));

            const actions = config?.actions ?? (actionCol && (actionCol.cell || actionCol.render || ((r: any) => String(r[actionCol.key] ?? '')))(row, i));

            return (
              <div
                key={rowId}
                className={cn(
                  'p-3.5 sm:p-4 transition-colors',
                  isExpanded ? 'bg-warm-50/40' : 'hover:bg-warm-50/50'
                )}
              >
                {/* Collapsed Header */}
                <div
                  className="flex items-center gap-3 cursor-pointer select-none"
                  onClick={() => {
                    if (onRowClick) onRowClick(row);
                    else toggleRowExpand(rowId);
                  }}
                >
                  {avatarNode}
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-charcoal-900 text-sm truncate leading-tight">
                      {title}
                    </div>
                    {subtitle && (
                      <div className="text-xs text-charcoal-400 truncate mt-0.5">
                        {subtitle}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {status && <div className="shrink-0">{status}</div>}
                    <button
                      type="button"
                      onClick={() => toggleRowExpand(rowId)}
                      aria-label={isExpanded ? "Yig'ish" : "Batafsil ko'rsatish"}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-warm-200/90 bg-white text-charcoal-500 hover:text-charcoal-800 hover:bg-warm-50 shadow-2xs transition-colors cursor-pointer"
                    >
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 transition-transform duration-200',
                          isExpanded && 'rotate-180'
                        )}
                      />
                    </button>
                  </div>
                </div>

                {/* Expanded Details & Actions */}
                {isExpanded && (
                  <div className="mt-3 space-y-3 pt-2.5 border-t border-warm-100 animate-fadeIn">
                    {details.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {details.map((item, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              'rounded-xl bg-warm-50/80 px-3 py-2 border border-warm-100/80',
                              item.fullWidth && 'col-span-2'
                            )}
                          >
                            <p className="text-[10px] uppercase font-bold text-charcoal-400 mb-0.5 tracking-wider truncate">
                              {item.label}
                            </p>
                            <div className="font-medium text-charcoal-700 text-xs break-words">
                              {item.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {actions && (
                      <div className="flex flex-wrap items-center gap-2 pt-1" onClick={e => e.stopPropagation()}>
                        {actions}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Desktop Table View */
        <div className="w-full max-w-full overflow-x-auto touch-scroll-x scrollbar-thin">
          <table className={cn('w-full border-collapse min-w-[600px]', tableClassName)}>
            <thead className={cn(stickyHeader && 'sticky top-0 z-10')}>
              <tr className="bg-warm-50/80 border-b border-warm-200/90">
                {columns.map(col => {
                  const isSorted = sortKey === String(col.key);
                  return (
                    <th
                      key={String(col.key)}
                      className={cn(
                        'px-4.5 py-3 text-left text-[11px] font-bold text-charcoal-500 uppercase tracking-wider whitespace-nowrap',
                        col.sortable && 'cursor-pointer select-none hover:text-charcoal-900 hover:bg-warm-100/60 transition-colors',
                        isSorted && 'text-brand-800 bg-brand-50/40',
                        col.headerClassName
                      )}
                      style={col.width ? { width: col.width } : undefined}
                      onClick={col.sortable ? () => handleSort(String(col.key)) : undefined}
                      aria-sort={isSorted ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.header || col.title}</span>
                        {col.sortable && (
                          <span className={cn('transition-colors', isSorted ? 'text-brand-600' : 'text-charcoal-300')}>
                            {isSorted ? (
                              sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronsUpDown className="w-3.5 h-3.5" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {paged.map((row, i) => (
                <tr
                  key={keyExtractor(row)}
                  className={cn(
                    'border-b border-warm-100/80 transition-colors duration-150',
                    onRowClick
                      ? 'hover:bg-brand-50/20 active:bg-brand-50/40 cursor-pointer'
                      : 'hover:bg-warm-50/60'
                  )}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map(col => (
                    <td
                      key={String(col.key)}
                      className={cn('px-4.5 py-3.5 text-sm text-charcoal-700', col.className)}
                    >
                      {(col.cell || col.render || ((r: any) => String(r[col.key] ?? '')))(row, i)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {sorted.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 sm:px-4.5 py-3 border-t border-warm-100 bg-warm-50/60 relative z-20">
          <div className="flex items-center gap-2 text-xs font-medium text-charcoal-600">
            <span>Sahifada:</span>
            <div className="w-18 sm:w-20 relative z-30">
              <Select
                value={String(pageSize)}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                size="sm"
                triggerClassName="h-8 rounded-[8px] text-xs font-semibold shadow-2xs border-warm-300"
                options={PAGE_SIZES.map(ps => ({ value: String(ps), label: String(ps) }))}
                aria-label="Sahifadagi yozuvlar soni"
              />
            </div>
            <span className="text-charcoal-400 tabular-nums">
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} / <strong className="text-charcoal-800 font-bold">{sorted.length}</strong>
            </span>
          </div>

          {totalPages > 1 && (
            <>
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

              {/* Desktop/tablet numbered pagination */}
              <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-[8px] text-charcoal-500 hover:text-charcoal-800 hover:bg-warm-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Oldingi sahifa"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {(() => {
              const getPageItems = (current: number, total: number): (number | string)[] => {
                if (total <= 7) return Array.from({ length: total }, (_, idx) => idx + 1);
                if (current <= 4) return [1, 2, 3, 4, 5, 'ellipsis-end', total];
                if (current >= total - 3) return [1, 'ellipsis-start', total - 4, total - 3, total - 2, total - 1, total];
                return [1, 'ellipsis-start', current - 1, current, current + 1, 'ellipsis-end', total];
              };

              return getPageItems(page, totalPages).map((item) => {
                if (typeof item === 'string') {
                  return (
                    <span key={item} className="px-1.5 text-xs text-charcoal-400 select-none">
                      •••
                    </span>
                  );
                }
                return (
                  <button
                    key={item}
                    onClick={() => setPage(item)}
                    className={cn(
                      'w-8 h-8 rounded-[8px] text-xs font-bold transition-all cursor-pointer',
                      page === item
                        ? 'bg-brand-500 text-white shadow-xs'
                        : 'hover:bg-warm-100 text-charcoal-600 hover:text-charcoal-900'
                    )}
                    aria-current={page === item ? 'page' : undefined}
                  >
                    {item}
                  </button>
                );
              });
            })()}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-[8px] text-charcoal-500 hover:text-charcoal-800 hover:bg-warm-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Keyingi sahifa"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  )}
    </div>
  );
}
