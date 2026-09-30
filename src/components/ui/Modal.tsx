// ═══════════════════════════════════════════════════════
//  Modal Dialog — Accessible, animated modal
// ═══════════════════════════════════════════════════════
import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  hideClose?: boolean;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw]',
};

export function Modal({ isOpen, onClose, title, description, size = 'md', children, footer, className, hideClose }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal aria-label={title}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-charcoal-900/30 backdrop-blur-sm"
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
              'relative z-10 w-full bg-white rounded-[20px] shadow-[0_20px_60px_-10px_rgb(0_0_0/0.18)] flex flex-col max-h-[90vh]',
              sizeClasses[size],
              className
            )}
          >
            {/* Header */}
            {(title || !hideClose) && (
              <div className="flex items-start justify-between px-6 py-5 border-b border-warm-100">
                <div>
                  {title && <h2 className="text-base font-semibold text-charcoal-900">{title}</h2>}
                  {description && <p className="text-sm text-charcoal-400 mt-0.5">{description}</p>}
                </div>
                {!hideClose && (
                  <button
                    onClick={onClose}
                    className="ml-4 text-charcoal-400 hover:text-charcoal-700 rounded-full p-1 hover:bg-warm-100 transition-colors flex-shrink-0"
                    aria-label="Yopish"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 border-t border-warm-100 bg-warm-50/50 rounded-b-[20px] flex items-center justify-end gap-2">
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
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  loading?: boolean;
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Tasdiqlash', cancelLabel = 'Bekor qilish', variant = 'default', loading }: ConfirmDialogProps) {
  const confirmColor = variant === 'danger' ? 'bg-danger-main hover:bg-danger-dark text-white' : variant === 'warning' ? 'bg-warning-main hover:bg-warning-dark text-white' : 'bg-brand-500 hover:bg-brand-600 text-white';
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" hideClose>
      <p className="text-sm text-charcoal-600">{message}</p>
      <div className="flex gap-2 mt-5">
        <button
          onClick={onClose}
          disabled={loading}
          className="flex-1 px-4 py-2 text-sm font-medium rounded-[10px] border border-warm-300 text-charcoal-700 hover:bg-warm-100 transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={cn('flex-1 px-4 py-2 text-sm font-medium rounded-[10px] transition-colors', confirmColor)}
        >
          {loading ? 'Yuklanmoqda...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
