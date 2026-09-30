// ═══════════════════════════════════════════════════════
//  Toast Notification System
// ═══════════════════════════════════════════════════════
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToasts } from '@/store';
import { cn } from '@/utils';

const icons = {
  success: <CheckCircle className="w-5 h-5 text-success-main flex-shrink-0" aria-hidden />,
  error: <XCircle className="w-5 h-5 text-danger-main flex-shrink-0" aria-hidden />,
  warning: <AlertTriangle className="w-5 h-5 text-warning-main flex-shrink-0" aria-hidden />,
  info: <Info className="w-5 h-5 text-info-main flex-shrink-0" aria-hidden />,
};

const toastColors = {
  success: 'border-green-200 bg-green-50',
  error: 'border-red-200 bg-red-50',
  warning: 'border-gold-200 bg-gold-50',
  info: 'border-warm-300 bg-warm-50',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToasts();
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-[80] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)] pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            role="alert"
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-3.5 rounded-[14px] border shadow-[0_4px_16px_-4px_rgb(0_0_0/0.1)] bg-white',
              toastColors[toast.type]
            )}
          >
            {icons[toast.type]}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-charcoal-900">{toast.title}</p>
              {toast.description && (
                <p className="text-xs text-charcoal-500 mt-0.5">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-charcoal-400 hover:text-charcoal-700 transition-colors flex-shrink-0 -mt-0.5"
              aria-label="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
