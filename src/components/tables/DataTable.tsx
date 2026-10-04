// ═══════════════════════════════════════════════════════
//  Data Table — Reusable sortable, paginated table
// ═══════════════════════════════════════════════════════
import { useState, useMemo } from 'react';
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
  /** Optional custom mobile card renderer. If provided, renders on < md screens */
  renderMobileCard?: (row: T, index: number) => React.ReactNode;
  /** Whether to force traditional table on mobile instead of card view */
  forceTableOnMobile?: boolean;
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
  forceTableOnMobile = false,
}: DataTableProps<T>) {
  const isMobile = useIsMobile();
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return sortBy(data, sortKey as keyof T, sortOrder);
  }, [data, sortKey, sortOrder]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = useMemo(() => paginate(sorted, page, pageSize), [sorted, page, pageSize]);

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
                    <Skeleton className="w-9 h-9 rounded-full shrink-0" />
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
  const middleCols = columns.filter(c => c !== primaryCol && c !== statusCol && c !== actionCol);

  return (
    <div className={cn('flex flex-col', className)}>
      {/* ─── Mobile Card View (< md) or Desktop Table View (>= md) ─── */}
      {!forceTableOnMobile && isMobile ? (
        <div className="divide-y divide-warm-100 bg-white">
          {paged.map((row, i) => {
            if (renderMobileCard) {
              return (
                <div
                  key={keyExtractor(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'transition-colors',
                    onRowClick && 'cursor-pointer active:bg-warm-50/80'
                  )}
                >
                  {renderMobileCard(row, i)}
                </div>
              );
            }

            // Default smart mobile card
            return (
              <div
                key={keyExtractor(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'p-3.5 transition-colors relative',
                  onRowClick && 'cursor-pointer active:bg-warm-50/80 hover:bg-warm-50/40'
                )}
              >
                {/* Header row: Primary info + Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {primaryCol && (primaryCol.cell || primaryCol.render || ((r: any) => String(r[primaryCol.key] ?? '')))(row, i)}
                  </div>
                  {statusCol && (
                    <div className="shrink-0">
                      {(statusCol.cell || statusCol.render || ((r: any) => String(r[statusCol.key] ?? '')))(row, i)}
                    </div>
                  )}
                </div>

                {/* Body fields: 2-column grid */}
                {middleCols.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-warm-100/80">
                    {middleCols.map(col => (
                      <div key={String(col.key)} className="min-w-0">
                        <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider block truncate">
                          {col.header || col.title}
                        </span>
                        <div className="text-xs font-medium text-charcoal-800 mt-0.5 truncate">
                          {(col.cell || col.render || ((r: any) => String(r[col.key] ?? '')))(row, i)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions row */}
                {actionCol && (
                  <div className="mt-3 pt-2 border-t border-warm-100/70 flex items-center justify-end" onClick={e => e.stopPropagation()}>
                    {(actionCol.cell || actionCol.render || ((r: any) => String(r[actionCol.key] ?? '')))(row, i)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Desktop Table View */
        <div className="overflow-x-auto touch-scroll-x scrollbar-thin">
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

      {/* Pagination */}
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
                options={PAGE_SIZES.map(ps => ({ value: String(ps), label: String(ps) }))}
                aria-label="Sahifadagi yozuvlar soni"
              />
            </div>
            <span className="text-charcoal-400 tabular-nums">
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} / <strong className="text-charcoal-800 font-bold">{sorted.length}</strong>
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
        </div>
      )}
    </div>
  );
}
