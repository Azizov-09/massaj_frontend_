// ═══════════════════════════════════════════════════════
//  DebtorDetailsModal — Modal Showing Comprehensive Debtor Data
// ═══════════════════════════════════════════════════════
import { Phone, Send, ArrowRight, Plus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/primitives';
import { DebtorItem, formatMoney } from '../types';

interface DebtorDetailsModalProps {
  debtor: DebtorItem | null;
  isParent: boolean;
  onClose: () => void;
  onGoToProfile: (debtor: DebtorItem) => void;
  onOpenPayment: (debtor: DebtorItem) => void;
  onTelegram: (debtor: DebtorItem) => void;
}

export function DebtorDetailsModal({
  debtor,
  isParent,
  onClose,
  onGoToProfile,
  onOpenPayment,
  onTelegram,
}: DebtorDetailsModalProps) {
  return (
    <Modal
      isOpen={!!debtor}
      onClose={onClose}
      title="Qarzdorlik tafsilotlari"
      size="md"
      className="sm:max-w-xl"
    >
      {debtor && (
        <div className="space-y-5">
          {/* Header info */}
          <div className="flex items-center gap-3.5 pb-4 border-b border-warm-200">
            <Avatar name={debtor.childName} size="lg" />
            <div className="min-w-0">
              <h4 className="text-base font-bold text-charcoal-900">{debtor.childName}</h4>
              <p className="text-xs text-charcoal-500 mt-0.5">
                Ota-ona: <span className="font-semibold text-charcoal-800">{debtor.parentName || '—'}</span>
              </p>
              {debtor.parentPhone && (
                <a
                  href={`tel:${debtor.parentPhone}`}
                  className="inline-flex items-center gap-1.5 text-xs text-brand-700 hover:underline font-medium mt-1 font-mono"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {debtor.parentPhone}
                </a>
              )}
            </div>
          </div>

          {/* Financial Status */}
          <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
                Mavjud qarzdorlik
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                {debtor.daysOverdue} kun kechikdi
              </span>
            </div>
            <p className="text-2xl font-black text-rose-700 tabular-nums mt-1.5">
              -{formatMoney(debtor.debt)}
            </p>
            {debtor.balance > 0 && (
              <p className="text-xs text-emerald-700 font-medium mt-1">
                Mavjud depozit qoldig'i: +{formatMoney(debtor.balance)}
              </p>
            )}
          </div>

          {/* Quick action buttons inside modal */}
          <div className="grid grid-cols-2 gap-2">
            {debtor.parentPhone && (
              <a
                href={`tel:${debtor.parentPhone}`}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                Qo'ng'iroq qilish
              </a>
            )}
            <button
              type="button"
              onClick={() => onTelegram(debtor)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 text-xs font-semibold hover:bg-sky-100 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-sky-600" />
              Telegram eslatma
            </button>
          </div>

          {/* Footer Navigation */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-warm-200">
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full sm:w-auto text-xs text-charcoal-600 hover:text-charcoal-900"
            >
              Yopish
            </Button>
            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
              <Button
                variant="secondary"
                onClick={() => onGoToProfile(debtor)}
                className="w-full sm:w-auto text-xs whitespace-nowrap"
              >
                Bola profiliga o'tish
                <ArrowRight className="w-3.5 h-3.5 ml-1.5 text-charcoal-500" />
              </Button>
              {!isParent && (
                <Button
                  variant="primary"
                  onClick={() => onOpenPayment(debtor)}
                  className="w-full sm:w-auto text-xs whitespace-nowrap shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  To'lov qabul qilish
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
