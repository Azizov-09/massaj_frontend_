import { useState } from 'react';
import { DollarSign, CreditCard, Wallet, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/utils';
import { useStore } from '@/store';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/primitives';
import { DebtorItem, formatMoney } from '../types';

interface QuickPaymentModalProps {
  debtor: DebtorItem | null;
  onClose: () => void;
  onSubmit: (data: {
    parentId: string;
    childId: string;
    amount: number;
    method: 'CASH' | 'CARD' | 'TRANSFER';
    date: string;
    notes: string;
  }) => Promise<void> | void;
  isSubmitting?: boolean;
}

export function QuickPaymentModal({
  debtor,
  onClose,
  onSubmit,
  isSubmitting = false,
}: QuickPaymentModalProps) {
  const parents = useStore(s => s.parents);
  const children = useStore(s => s.children);

  const matchedChild = debtor ? children.find(c => c.id === debtor.childId) : undefined;
  const initialParentId = debtor?.parentId || matchedChild?.parentId || '';

  const [prevDebtorId, setPrevDebtorId] = useState<string | undefined>(() => debtor?.childId);
  const [selectedParentId, setSelectedParentId] = useState<string>(initialParentId);
  const [paymentAmount, setPaymentAmount] = useState<string>(() => (debtor ? String(debtor.debt) : ''));
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER'>('CASH');
  const [paymentDate, setPaymentDate] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));
  const [paymentNotes, setPaymentNotes] = useState<string>(() =>
    debtor ? `Qarzdorlikni so'ndirish (${debtor.childName})` : ''
  );
  const [inlineError, setInlineError] = useState<string | null>(null);

  // Synchronize state when debtor prop changes during render
  if (debtor && debtor.childId !== prevDebtorId) {
    const freshChild = children.find(c => c.id === debtor.childId);
    const freshParentId = debtor.parentId || freshChild?.parentId || '';
    setPrevDebtorId(debtor.childId);
    setSelectedParentId(freshParentId);
    setPaymentAmount(String(debtor.debt));
    setPaymentMethod('CASH');
    setPaymentDate(format(new Date(), 'yyyy-MM-dd'));
    setPaymentNotes(`Qarzdorlikni so'ndirish (${debtor.childName})`);
    setInlineError(null);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtor) return;
    setInlineError(null);

    const targetParentId = selectedParentId || debtor.parentId || matchedChild?.parentId;
    if (!targetParentId) {
      setInlineError("Ota-ona aniqlanmagan. Iltimos, quyidagi ro'yxatdan ota-onani tanlang.");
      return;
    }

    const amt = Number(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      setInlineError("To'lov summasi 0 dan katta bo'lishi kerak.");
      return;
    }
    if (amt > 2_000_000_000) {
      setInlineError("To'lov summasi 2,000,000,000 so'mdan oshmasligi kerak.");
      return;
    }

    try {
      await onSubmit({
        parentId: targetParentId,
        childId: debtor.childId,
        amount: amt,
        method: paymentMethod,
        date: paymentDate ? `${paymentDate}T12:00:00.000Z` : new Date().toISOString(),
        notes: paymentNotes || "Qarzdorlikni so'ndirish",
      });
    } catch (err: any) {
      const raw = err?.message || "To'lovni amalga oshirishda xatolik yuz berdi.";
      let userFriendly = raw;
      if (raw.toLowerCase().includes('parent must be related to the child')) {
        userFriendly = "Tanlangan ota-ona ushbu bolaga biriktirilmagan (Parent must be related to the child). Iltimos, to'g'ri ota-onani tanlang.";
      }
      setInlineError(userFriendly);
    }
  };

  const currentParent = parents.find(p => p.id === (selectedParentId || debtor?.parentId));

  return (
    <Modal
      isOpen={!!debtor}
      onClose={onClose}
      title="Tezkor to'lov qabul qilish"
      size="md"
    >
      {debtor && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Inline Error Alert */}
          {inlineError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-semibold">{inlineError}</div>
            </div>
          )}

          {/* Debtor Profile Bar */}
          <div className="p-3.5 rounded-xl bg-warm-50/90 border border-warm-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar name={debtor.childName} size="md" className="shrink-0 font-bold" />
              <div className="min-w-0">
                <h5 className="font-bold text-sm text-charcoal-900 truncate">
                  {debtor.childName}
                </h5>
                <p className="text-xs text-charcoal-500 truncate mt-0.5">
                  Ota-ona: <span className="font-semibold text-charcoal-800">{currentParent?.fullName || debtor.parentName || '—'}</span>
                </p>
                {(currentParent?.phone || debtor.parentPhone) && (
                  <span className="text-xs text-charcoal-500 font-mono">
                    {currentParent?.phone || debtor.parentPhone}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider block">
                Joriy qarz
              </span>
              <span className="text-base font-black text-rose-700 tabular-nums">
                {formatMoney(debtor.debt)}
              </span>
            </div>
          </div>

          {/* Parent Selection if not resolved or needs correction */}
          {(!debtor.parentId || inlineError?.includes('Parent must be related')) && (
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Bog'langan ota-ona <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedParentId}
                onChange={e => {
                  setSelectedParentId(e.target.value);
                  setInlineError(null);
                }}
                className="w-full h-9 px-3 text-xs border border-warm-300 rounded-[10px] bg-white shadow-2xs focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
              >
                <option value="">Ota-onani tanlang...</option>
                {parents.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.phone})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Payment Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              To'lov summasi (so'm) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={1000}
                step={1000}
                required
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
                className="w-full h-10 px-3 pr-14 text-sm font-bold border border-warm-300 rounded-[10px] bg-white shadow-2xs focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none tabular-nums"
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-charcoal-400 pointer-events-none">
                SO'M
              </span>
            </div>

            {/* Suggestions */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <button
                type="button"
                onClick={() => setPaymentAmount(String(debtor.debt))}
                className="px-2.5 py-1 rounded-[6px] bg-warm-100 hover:bg-warm-200 text-charcoal-700 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                To'liq qarz ({formatMoney(debtor.debt)})
              </button>
              {debtor.debt >= 200000 && (
                <button
                  type="button"
                  onClick={() => setPaymentAmount(String(Math.round(debtor.debt / 2)))}
                  className="px-2.5 py-1 rounded-[6px] bg-warm-100 hover:bg-warm-200 text-charcoal-700 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  50% ({formatMoney(Math.round(debtor.debt / 2))})
                </button>
              )}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              To'lov usuli <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'CASH', label: 'Naqd pul', icon: DollarSign },
                { id: 'CARD', label: 'Plastik karta', icon: CreditCard },
                { id: 'TRANSFER', label: "O'tkazma", icon: Wallet },
              ].map(m => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={cn(
                      "flex flex-col items-center justify-center p-2.5 rounded-[10px] border text-center transition-all cursor-pointer",
                      isSelected
                        ? "border-brand-600 bg-brand-50/70 text-brand-900 ring-1 ring-brand-500"
                        : "border-warm-200 hover:border-warm-300 hover:bg-warm-50 text-charcoal-700"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 mb-1", isSelected ? "text-brand-600" : "text-charcoal-400")} />
                    <span className="text-[11px] font-semibold leading-tight">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Input */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              To'lov sanasi <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={e => setPaymentDate(e.target.value)}
              className="w-full h-9 px-3 text-xs border border-warm-300 rounded-[10px] bg-white shadow-2xs focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              Izoh (ixtiyoriy)
            </label>
            <input
              type="text"
              value={paymentNotes}
              onChange={e => setPaymentNotes(e.target.value)}
              placeholder="To'lov bo'yicha qo'shimcha ma'lumot..."
              className="w-full h-9 px-3 text-xs border border-warm-300 rounded-[10px] bg-white shadow-2xs focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
            />
          </div>

          {/* Modal Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-warm-200">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="w-full sm:w-auto text-xs"
            >
              Bekor qilish
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full sm:w-auto text-xs px-4"
            >
              {isSubmitting ? "Saqlanmoqda..." : "To'lovni tasdiqlash"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
