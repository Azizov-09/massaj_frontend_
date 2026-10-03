// ═══════════════════════════════════════════════════════
//  Modal Dialog — Accessible, animated modal
// ═══════════════════════════════════════════════════════
import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils';
import { Orb } from '@/components/ui/thinking-orbs';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  hideClose?: boolean;
  scrollable?: boolean;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw]',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
  className,
  bodyClassName,
  hideClose,
  scrollable = false,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;
        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || document.activeElement === dialogRef.current) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[70] overflow-y-auto p-2.5 sm:p-4 flex min-h-full items-center justify-center safe-top safe-bottom"
          role="dialog"
          aria-modal
          aria-label={title}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-charcoal-900/30 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          {/* Panel */}
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            tabIndex={-1}
            className={cn(
              'relative z-10 w-full bg-white rounded-[16px] border border-warm-200/90 shadow-[0_20px_60px_-10px_rgb(0_0_0/0.18)] flex flex-col my-auto max-h-[94vh]',
              sizeClasses[size],
              className
            )}
          >
            {/* Header */}
            {(title || !hideClose) && (
              <div className="flex items-start justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-warm-100 rounded-t-[16px]">
                <div>
                  {title && <h2 className="text-base font-semibold text-charcoal-900">{title}</h2>}
                  {description && <p className="text-xs sm:text-sm text-charcoal-400 mt-0.5">{description}</p>}
                </div>
                {!hideClose && (
                  <button
                    onClick={onClose}
                    className="ml-4 text-charcoal-400 hover:text-charcoal-700 rounded-full p-1 hover:bg-warm-100 transition-colors flex-shrink-0 cursor-pointer"
                    aria-label="Yopish"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
            {/* Body */}
            <div className={cn('flex-1 px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto max-h-[calc(92vh-130px)]', bodyClassName)}>
              {children}
            </div>
            {/* Footer */}
            {footer && (
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-warm-100 bg-warm-50/50 rounded-b-[16px] flex flex-wrap items-center justify-end gap-2">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Confirm Dialog ────────────────────────────────────────

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'success' | 'default';
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  confirmText,
  cancelLabel,
  cancelText,
  variant = 'default',
  loading,
}: ConfirmDialogProps) {
  const finalConfirmLabel = confirmLabel || confirmText || 'Tasdiqlash';
  const finalCancelLabel = cancelLabel || cancelText || 'Bekor qilish';
  const confirmColor =
    variant === 'danger'
      ? 'bg-danger-main hover:bg-danger-dark text-white shadow-sm'
      : variant === 'warning'
      ? 'bg-warning-main hover:bg-warning-dark text-white shadow-sm'
      : variant === 'success'
      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
      : 'bg-brand-500 hover:bg-brand-600 text-white shadow-sm';
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" hideClose>
      <p className="text-sm text-charcoal-600">{message}</p>
      <div className="flex flex-col-reverse sm:flex-row gap-2 mt-5">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="w-full sm:flex-1 px-4 py-2.5 text-sm font-medium rounded-[10px] border border-warm-300 text-charcoal-700 hover:bg-warm-100 transition-colors cursor-pointer"
        >
          {finalCancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={cn('w-full sm:flex-1 px-4 py-2.5 text-sm font-medium rounded-[10px] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer', confirmColor)}
        >
          {loading && <Orb state="working" size={16} className="text-white shrink-0" />}
          <span>{loading ? 'Yuklanmoqda...' : finalConfirmLabel}</span>
        </button>
      </div>
    </Modal>
  );
}
