// ═══════════════════════════════════════════════════════
//  DebtorsTable — Desktop Table for Debtors with Sticky Controls
// ═══════════════════════════════════════════════════════
import { Clock, Phone, Send, Plus, Eye, AlertCircle } from 'lucide-react';
import { cn } from '@/utils';
import { Avatar, ProgressBar } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { DebtorItem, SortField, SortOrder, formatMoney } from '../types';

interface DebtorsTableProps {
  debtors: DebtorItem[];
  safeMaxDebt: number;
  isParent: boolean;
  page: number;
  pageSize: number;
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  onSelect: (debtor: DebtorItem) => void;
  onPayment: (debtor: DebtorItem) => void;
  onTelegram: (debtor: DebtorItem) => void;
}

export function DebtorsTable({
  debtors,
  safeMaxDebt,
  isParent,
  page,
  pageSize,
  sortField,
  sortOrder,
  onSort,
  onSelect,
  onPayment,
  onTelegram,
}: DebtorsTableProps) {
  return (
    <div className="hidden md:block overflow-x-auto touch-scroll-x scrollbar-thin">
      <table className="w-full border-collapse min-w-[920px]">
        <thead className="sticky top-0 z-20 bg-warm-50/95 backdrop-blur shadow-xs">
          <tr className="border-b border-warm-200/90 text-[11px] font-bold text-charcoal-500 uppercase tracking-wider">
            <th className="px-4 py-3 text-left w-12">№</th>
            <th
              className="px-4 py-3 text-left cursor-pointer select-none hover:text-charcoal-900 transition-colors"
              onClick={() => onSort('childName')}
            >
              Bola va Ota-ona {sortField === 'childName' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-4 py-3 text-left">Telefon</th>
            <th
              className="px-4 py-3 text-left cursor-pointer select-none hover:text-charcoal-900 transition-colors"
              onClick={() => onSort('daysOverdue')}
            >
              Kechikkan kunlar {sortField === 'daysOverdue' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-4 py-3 text-left">Qarz salmog'i</th>
            <th
              className="px-4 py-3 text-left cursor-pointer select-none hover:text-charcoal-900 transition-colors"
              onClick={() => onSort('debt')}
            >
              Qarzdorlik miqdori {sortField === 'debt' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th className="sticky right-0 bg-warm-50/95 backdrop-blur px-4 py-3 text-right z-20 shadow-[-4px_0_12px_rgba(0,0,0,0.04)] w-60">
              Amallar
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-warm-100">
          {debtors.map((d, index) => {
            const ratio = Math.min(100, Math.round((d.debt / safeMaxDebt) * 100));
            const rank = (page - 1) * pageSize + index + 1;

            return (
              <tr
                key={d.childId}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(d)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(d);
                  }
                }}
                className="group hover:bg-brand-50/20 transition-colors cursor-pointer focus:outline-hidden focus:bg-brand-50/30"
              >
                <td className="px-4 py-3 text-xs font-bold text-charcoal-400 tabular-nums">
                  #{rank}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={d.childName} size="sm" className="font-semibold shrink-0" />
                    <div className="min-w-0">
                      <h5 className="font-semibold text-charcoal-900 text-sm tracking-tight truncate group-hover:text-brand-700 transition-colors">
                        {d.childName}
                      </h5>
                      <p className="text-xs text-charcoal-500 mt-0.5 truncate">
                        Ota-ona: <span className="text-charcoal-800 font-medium">{d.parentName || '—'}</span>
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {d.parentPhone ? (
                    <a
                      href={`tel:${d.parentPhone}`}
                      onClick={e => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 text-xs text-charcoal-700 hover:text-brand-600 transition-colors font-medium font-mono"
                    >
                      <Phone className="w-3.5 h-3.5 text-charcoal-400" />
                      <span>{d.parentPhone}</span>
                    </a>
                  ) : (
                    <span className="text-xs text-charcoal-400 italic">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border tabular-nums",
                    d.daysOverdue > 15
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : d.daysOverdue >= 7
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  )}>
                    <Clock className="w-3 h-3" />
                    {d.daysOverdue} kun kechikdi
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="w-32 space-y-1">
                    <div className="flex justify-between text-[10px] text-charcoal-500 font-medium">
                      <span>Daraja</span>
                      <span>{ratio}%</span>
                    </div>
                    <ProgressBar value={ratio} fillClassName="bg-rose-500" />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-0.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[6px] bg-rose-50 text-rose-600 border border-rose-200 font-bold text-xs tabular-nums">
                      <AlertCircle className="w-3 h-3 text-rose-500" />
                      -{formatMoney(d.debt)}
                    </span>
                    {d.balance > 0 && (
                      <p className="text-[11px] text-emerald-600 font-medium tabular-nums">
                        Depozit: +{formatMoney(d.balance)}
                      </p>
                    )}
                  </div>
                </td>
                <td
                  className="sticky right-0 bg-white group-hover:bg-[#fbf7f4] px-4 py-3 text-right z-10 shadow-[-4px_0_12px_rgba(0,0,0,0.04)]"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Call */}
                    {d.parentPhone && (
                      <a
                        href={`tel:${d.parentPhone}`}
                        title="Qo'ng'iroq qilish"
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-2xs"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      </a>
                    )}

                    {/* Telegram */}
                    <button
                      type="button"
                      title="Telegram orqali eslatma"
                      aria-label="Telegram"
                      onClick={() => onTelegram(d)}
                      className="p-1.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 text-sky-600" />
                    </button>

                    {/* To'lov (Admin only) */}
                    {!isParent && (
                      <Button
                        size="xs"
                        variant="primary"
                        onClick={() => onPayment(d)}
                        className="h-7 px-2.5 text-xs font-semibold shadow-2xs whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        To'lov
                      </Button>
                    )}

                    {/* Tafsilotlar */}
                    <button
                      type="button"
                      title="Tafsilotlar"
                      aria-label="Tafsilotlar"
                      onClick={() => onSelect(d)}
                      className="p-1.5 rounded-lg text-charcoal-600 hover:text-brand-700 hover:bg-warm-100 border border-warm-200/80 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
