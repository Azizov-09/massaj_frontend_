// ═══════════════════════════════════════
//  UI Primitives — Button
// ═══════════════════════════════════════
import { forwardRef } from 'react';
import { cn } from '@/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'ghost' | 'danger' | 'outline' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-[10px] transition-all duration-150 focus-visible:outline-2 focus-visible:outline-brand-500 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

const variants = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 active:scale-[0.98] shadow-sm',
  secondary: 'bg-warm-100 text-charcoal-800 hover:bg-warm-200 active:scale-[0.98] border border-warm-300',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] shadow-sm',
  ghost: 'text-charcoal-700 hover:bg-warm-100 active:scale-[0.98]',
  danger: 'bg-danger-main text-white hover:bg-danger-dark active:scale-[0.98] shadow-sm',
  outline: 'border border-brand-500 text-brand-600 hover:bg-brand-50 active:scale-[0.98]',
  link: 'text-brand-600 hover:text-brand-700 underline-offset-4 hover:underline p-0 h-auto',
};

const sizes = {
  xs: 'px-2.5 py-1 text-xs h-7',
  sm: 'px-3 py-1.5 text-sm h-8',
  md: 'px-4 py-2 text-sm h-9',
  lg: 'px-5 py-2.5 text-base h-11',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], variant !== 'link' && sizes[size], className)}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <svg
            className={cn(
              'animate-spin shrink-0 text-current',
              size === 'xs' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'
            )}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);
Button.displayName = 'Button';
