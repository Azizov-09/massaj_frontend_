// ═══════════════════════════════════════════════════════
//  Data Table — Reusable sortable, paginated table
// ═══════════════════════════════════════════════════════
import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, sortBy, paginate } from '@/utils';
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
  stickyHeader?: boolean;
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
  stickyHeader,
}: DataTableProps<T>) {
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
      <div className="space-y-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!loading && data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} action={emptyAction} />;
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[600px]">
          <thead className={cn(stickyHeader && 'sticky top-0 z-10')}>
            <tr className="bg-warm-50 border-b border-warm-200">
              {columns.map(col => (
                <th
                  key={String(col.key)}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold text-charcoal-500 uppercase tracking-wide whitespace-nowrap',
                    col.sortable && 'cursor-pointer select-none hover:text-charcoal-800 transition-colors',
                    col.headerClassName
                  )}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={col.sortable ? () => handleSort(String(col.key)) : undefined}
                  aria-sort={sortKey === String(col.key) ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header || col.title}
                    {col.sortable && (
                      <span className="text-charcoal-300">
                        {sortKey === String(col.key) ? (
                          sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                        ) : <ChevronsUpDown className="w-3.5 h-3.5" />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr
                key={keyExtractor(row)}
                className={cn(
                  'border-b border-warm-100 transition-colors duration-100',
                  onRowClick ? 'hover:bg-warm-50 cursor-pointer' : 'hover:bg-warm-50/50'
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map(col => (
                  <td
                    key={String(col.key)}
                    className={cn('px-4 py-3 text-sm text-charcoal-700', col.className)}
                  >
                    {(col.cell || col.render || ((r: any) => String(r[col.key] ?? '')))(row, i)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-warm-100 bg-warm-50/50">
          <div className="flex items-center gap-2 text-sm text-charcoal-500">
            <span>Sahifada:</span>
            <div className="w-20">
              <Select
                value={String(pageSize)}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                size="sm"
                options={PAGE_SIZES.map(ps => ({ value: String(ps), label: String(ps) }))}
                aria-label="Sahifadagi yozuvlar soni"
              />
            </div>
            <span className="text-charcoal-400">
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} / {sorted.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-[8px] hover:bg-warm-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                      'w-8 h-8 rounded-[8px] text-sm font-medium transition-colors',
                      page === item ? 'bg-brand-500 text-white shadow-sm' : 'hover:bg-warm-200 text-charcoal-600'
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
              className="p-1.5 rounded-[8px] hover:bg-warm-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
