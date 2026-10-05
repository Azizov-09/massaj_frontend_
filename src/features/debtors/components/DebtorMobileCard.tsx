// ═══════════════════════════════════════════════════════
//  DebtorMobileCard — Responsive Mobile Card for Debtors
// ═══════════════════════════════════════════════════════
import { Phone, Send, Plus, Eye, AlertCircle } from 'lucide-react';
import { cn } from '@/utils';
import { Avatar, ProgressBar } from '@/components/ui/primitives';
import { DebtorItem, formatMoney } from '../types';

interface DebtorMobileCardProps {
  debtor: DebtorItem;
  rank: number;
  safeMaxDebt: number;
  isParent: boolean;
  onSelect: (debtor: DebtorItem) => void;
  onPayment: (debtor: DebtorItem) => void;
  onTelegram: (debtor: DebtorItem) => void;
}

export function DebtorMobileCard({
  debtor: d,
  rank,
  safeMaxDebt,
  isParent,
  onSelect,
  onPayment,
  onTelegram,
}: DebtorMobileCardProps) {
  const ratio = Math.min(100, Math.round((d.debt / safeMaxDebt) * 100));

  return (
    <div className="p-4 space-y-3 bg-white hover:bg-warm-50/40 transition-colors">
      {/* Header: Avatar + Child Name + Overdue Badge + Debt Amount Badge */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar name={d.childName} size="md" className="shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="font-bold text-sm text-charcoal-900 truncate">
                {d.childName}
              </h4>
              <span className="text-[11px] font-bold text-charcoal-400 tabular-nums">
                #{rank}
              </span>
            </div>
            <p className="text-xs text-charcoal-500 truncate mt-0.5">
              Ota-ona: <span className="font-semibold text-charcoal-800">{d.parentName || '—'}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] bg-rose-50 text-rose-700 border border-rose-200 font-extrabold text-xs tabular-nums">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            -{formatMoney(d.debt)}
          </span>
          <span className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full border tabular-nums",
            d.daysOverdue > 15
              ? "bg-rose-50 text-rose-700 border-rose-200"
              : d.daysOverdue >= 7
              ? "bg-amber-50 text-amber-800 border-amber-200"
              : "bg-blue-50 text-blue-700 border-blue-200"
          )}>
            {d.daysOverdue} kun kechikdi
          </span>
        </div>
      </div>

      {/* Phone & Overdue details */}
      <div className="flex items-center justify-between text-xs pt-1 border-t border-warm-100 text-charcoal-600">
        <div className="flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-charcoal-400" />
          {d.parentPhone ? (
            <a
              href={`tel:${d.parentPhone}`}
              className="font-mono text-xs font-semibold text-brand-700 hover:underline"
            >
              {d.parentPhone}
            </a>
          ) : (
            <span className="text-charcoal-400 italic">Telefon kiritilmagan</span>
          )}
        </div>

        {d.balance > 0 && (
          <span className="text-[11px] text-emerald-700 font-semibold tabular-nums">
            Depozit: +{formatMoney(d.balance)}
          </span>
        )}
      </div>

      {/* Debt Ratio Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-charcoal-500 font-medium">
          <span>Salmoq darajasi</span>
          <span className="font-bold text-charcoal-700">{ratio}%</span>
        </div>
        <ProgressBar value={ratio} fillClassName="bg-rose-500" />
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        {/* Call Action */}
        {d.parentPhone ? (
          <a
            href={`tel:${d.parentPhone}`}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 active:bg-emerald-200 transition-colors shadow-2xs"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-600" />
            Qo'ng'iroq
          </a>
        ) : (
          <button
            disabled
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-warm-100 text-charcoal-400 border border-warm-200 text-xs font-semibold cursor-not-allowed opacity-60"
          >
            <Phone className="w-3.5 h-3.5" />
            Qo'ng'iroq
          </button>
        )}

        {/* Telegram Action */}
        <button
          type="button"
          onClick={() => onTelegram(d)}
          className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 text-xs font-semibold hover:bg-sky-100 active:bg-sky-200 transition-colors shadow-2xs cursor-pointer"
        >
          <Send className="w-3.5 h-3.5 text-sky-600" />
          Telegram
        </button>

        {/* To'lov Action (Admin only) */}
        {!isParent && (
          <button
            type="button"
            onClick={() => onPayment(d)}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 active:bg-brand-800 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            To'lov
          </button>
        )}

        {/* Details Action */}
        <button
          type="button"
          onClick={() => onSelect(d)}
          className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-warm-100/80 text-charcoal-700 border border-warm-200 text-xs font-semibold hover:bg-warm-100 active:bg-warm-200 transition-colors shadow-2xs cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 text-charcoal-500" />
          Tafsilotlar
        </button>
      </div>
    </div>
  );
}
