// Badge, StatusPill, Avatar, Card, Input, Select, Textarea components
import { cn, getInitials, getAvatarColor } from '@/utils';
import { forwardRef } from 'react';

// ─── Badge ────────────────────────────────────────────────

interface BadgeProps {
  className?: string;
  children: React.ReactNode;
  dot?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | string;
}

const badgeVariants: Record<string, string> = {
  primary: 'bg-brand-50 text-brand-700 border-brand-200',
  secondary: 'bg-warm-100 text-charcoal-700 border-warm-200',
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-gold-50 text-gold-700 border-gold-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  neutral: 'bg-warm-100 text-charcoal-600 border-warm-200',
};

export function Badge({ className, children, dot, variant }: BadgeProps) {
  const variantClass = variant ? (badgeVariants[variant] || 'bg-warm-100 text-charcoal-700 border-warm-200') : '';
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border', variantClass, className)}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" aria-hidden />}
      {children}
    </span>
  );
}

// ─── Avatar ──────────────────────────────────────────────

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const avatarSizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const colorClass = getAvatarColor(name);
  return (
    <div className={cn('rounded-full overflow-hidden flex items-center justify-center font-semibold flex-shrink-0', avatarSizes[size], !src && colorClass, className)}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────

interface CardProps {
  className?: string;
  children: React.ReactNode;
  hoverable?: boolean;
  onClick?: () => void;
}

export function Card({ className, children, hoverable, onClick }: CardProps) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      className={cn(
        'bg-white rounded-[14px] border border-warm-200 shadow-[0_1px_3px_0_rgb(0_0_0/0.06)]',
        hoverable && 'card-lift cursor-pointer',
        onClick && 'w-full text-left',
        className
      )}
      onClick={onClick}
    >
      {children}
    </Comp>
  );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('px-5 py-4 border-b border-warm-100', className)}>{children}</div>;
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>;
}

export function CardFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('px-5 py-3 border-t border-warm-100 bg-warm-50/50 rounded-b-[14px]', className)}>{children}</div>;
}

// ─── Input ────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftAddon, rightAddon, id, required, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-charcoal-700 mb-1.5">
            {label}{required && <span className="text-danger-main ml-1" aria-hidden>*</span>}
          </label>
        )}
        <div className="relative">
          {leftAddon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400 pointer-events-none">
              {leftAddon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            required={required}
            className={cn(
              'w-full bg-white border rounded-[10px] px-3 py-2 text-sm text-charcoal-900 placeholder:text-charcoal-400',
              'transition-colors duration-150 outline-none',
              'hover:border-warm-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
              error ? 'border-danger-main focus:border-danger-main focus:ring-danger-light' : 'border-warm-300',
              leftAddon && 'pl-9',
              rightAddon && 'pr-9',
              className
            )}
            {...props}
          />
          {rightAddon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400">
              {rightAddon}
            </div>
          )}
        </div>
        {error && <p id={`${inputId}-error`} className="mt-1 text-xs text-danger-main">{error}</p>}
        {hint && !error && <p id={`${inputId}-hint`} className="mt-1 text-xs text-charcoal-400">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ─── Select ───────────────────────────────────────────────

export { Select, type SelectProps, type SelectOption } from './Select';
export { DatePicker, type DatePickerProps } from './DatePicker';

// ─── Textarea ─────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, required, ...props }, ref) => {
    const taId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={taId} className="block text-sm font-medium text-charcoal-700 mb-1.5">
            {label}{required && <span className="text-danger-main ml-1" aria-hidden>*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={taId}
          aria-invalid={!!error}
          required={required}
          className={cn(
            'w-full bg-white border rounded-[10px] px-3 py-2 text-sm text-charcoal-900 placeholder:text-charcoal-400 resize-y min-h-[80px]',
            'transition-colors duration-150 outline-none',
            'hover:border-warm-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
            error ? 'border-danger-main' : 'border-warm-300',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-danger-main">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-charcoal-400">{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

// ─── Skeleton ────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded-[10px]', className)} aria-hidden />;
}

// ─── Divider ─────────────────────────────────────────────

export function Divider({ className, label }: { className?: string; label?: string }) {
  if (label) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="flex-1 h-px bg-warm-200" />
        <span className="text-xs text-charcoal-400 font-medium">{label}</span>
        <div className="flex-1 h-px bg-warm-200" />
      </div>
    );
  }
  return <div className={cn('h-px bg-warm-200', className)} />;
}

// ─── Empty State ──────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      {icon && (
        <div className="w-14 h-14 rounded-full bg-warm-100 flex items-center justify-center text-charcoal-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-charcoal-800 mb-1">{title}</h3>
      {description && <p className="text-sm text-charcoal-400 max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  trackClassName?: string;
  fillClassName?: string;
  showLabel?: boolean;
}

export function ProgressBar({ value, className, trackClassName, fillClassName, showLabel }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 h-2 rounded-full bg-warm-200 overflow-hidden', trackClassName)}>
        <div
          className={cn('h-full rounded-full bg-brand-500 transition-all duration-500', fillClassName)}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && <span className="text-xs font-medium text-charcoal-600 w-8 text-right">{clamped}%</span>}
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn('animate-spin', className)} viewBox="0 0 24 24" fill="none" aria-label="Yuklanmoqda">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
