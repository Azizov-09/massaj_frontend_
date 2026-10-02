// ═══════════════════════════════════════════════════════
//  KPI Cards — Various premium stat card designs
// ═══════════════════════════════════════════════════════
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn, formatCurrencyCompact, formatAmount } from '@/utils';
import { Skeleton } from '@/components/ui/primitives';

interface KpiCardProps {
  label: string;
  value: number | string;
  format?: 'currency' | 'number' | 'text';
  trend?: { value: number; label?: string }; // positive = up, negative = down
  change?: string;
  changeType?: string;
  icon?: React.ReactNode;
  accentColor?: string; // Tailwind border/accent color
  description?: string;
  loading?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  index?: number; // for stagger animation
}

export function KpiCard({
  label,
  value,
  format = 'number',
  trend,
  change,
  changeType,
  icon,
  accentColor = 'brand',
  description,
  loading,
  className,
  size = 'md',
  index = 0,
}: KpiCardProps) {
  if (loading) {
    return <Skeleton className={cn('rounded-[14px]', size === 'sm' ? 'h-20' : size === 'md' ? 'h-28' : 'h-36', className)} />;
  }

  const formatValue = () => {
    if (typeof value === 'string') return value;
    if (format === 'currency') return formatCurrencyCompact(value);
    if (format === 'number') return formatAmount(value);
    return String(value);
  };

  const trendPositive = trend && trend.value > 0;
  const trendNeutral = trend && trend.value === 0;

  const iconBgMap: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600 border border-brand-100/70',
    sage: 'bg-emerald-50 text-emerald-600 border border-emerald-100/70',
    gold: 'bg-amber-50 text-amber-600 border border-amber-100/70',
    danger: 'bg-rose-50 text-rose-600 border border-rose-100/70',
    success: 'bg-emerald-50 text-emerald-600 border border-emerald-100/70',
    blue: 'bg-blue-50 text-blue-600 border border-blue-100/70',
    purple: 'bg-purple-50 text-purple-600 border border-purple-100/70',
    warm: 'bg-warm-100 text-charcoal-600 border border-warm-200/70',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.04, ease: 'easeOut' }}
      className={cn(
        'relative h-full min-h-[96px] bg-white rounded-[14px] border border-warm-200/90 shadow-[0_1px_3px_0_rgb(0_0_0/0.06)] hover:border-warm-300 hover:shadow-xs transition-all duration-200 p-3.5 sm:p-4 flex flex-col justify-between group overflow-hidden',
        size === 'sm' && 'p-2.5 sm:p-3 rounded-[12px] min-h-[80px]',
        size === 'lg' && 'p-4 sm:p-5 rounded-[16px] min-h-[110px]',
        className
      )}
    >
      {/* Top Row: Label & Icon */}
      <div className="flex items-start justify-between gap-2 w-full">
        <p className="text-xs font-medium text-charcoal-500 line-clamp-1 flex-1 min-w-0" title={label}>
          {label}
        </p>

        {icon && (
          <div
            className={cn(
              'w-8 h-8 sm:w-9 sm:h-9 rounded-[8px] flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-2xs [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-4.5 sm:[&>svg]:h-4.5',
              iconBgMap[accentColor] ?? iconBgMap.brand,
              size === 'sm' && 'w-7 h-7 rounded-[6px] [&>svg]:w-3.5 [&>svg]:h-3.5',
              size === 'lg' && 'w-9 h-9 sm:w-11 sm:h-11 rounded-[10px] [&>svg]:w-4.5 [&>svg]:h-4.5 sm:[&>svg]:w-5.5 sm:[&>svg]:h-5.5'
            )}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Bottom Area: Full-width Metric Value + Trend/Change */}
      <div className="mt-2 w-full min-w-0">
        <div className="flex items-center gap-x-2 gap-y-1 flex-wrap">
          <motion.span
            key={String(value)}
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'font-extrabold text-charcoal-900 tabular-nums tracking-tight leading-none shrink-0 block',
              size === 'sm' ? 'text-sm sm:text-lg' : size === 'lg' ? 'text-xl sm:text-3xl' : 'text-[16px] xs:text-[18px] sm:text-2xl'
            )}
            title={typeof value === 'number' && format === 'currency' ? `${value.toLocaleString('uz-UZ')} so'm` : String(value)}
          >
            {formatValue()}
          </motion.span>

          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-[5px] shrink-0',
                trendPositive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/80'
                  : trendNeutral
                  ? 'bg-warm-100 text-charcoal-600 border border-warm-200/80'
                  : 'bg-rose-50 text-rose-700 border border-rose-100/80'
              )}
            >
              {trendPositive ? <TrendingUp className="w-3 h-3" /> : trendNeutral ? <Minus className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </span>
          )}

          {!trend && change && (
            <span
              className={cn(
                'text-[10px] sm:text-[11px] font-semibold truncate max-w-full',
                changeType === 'positive' ? 'text-emerald-600' : changeType === 'negative' ? 'text-rose-600' : 'text-charcoal-500'
              )}
              title={typeof change === 'string' ? change : undefined}
            >
              {change}
            </span>
          )}
        </div>

        {(description || trend?.label) && (
          <p
            className="text-[10px] sm:text-[11px] text-charcoal-400 mt-1 font-normal leading-tight truncate"
            title={typeof (description ?? trend?.label) === 'string' ? (description ?? trend?.label) : undefined}
          >
            {description ?? trend?.label}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Stat Card (simpler, no trend) ────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({ label, value, icon, className }: StatCardProps) {
  return (
    <div className={cn('flex items-center gap-3 bg-white rounded-[14px] border border-warm-200 p-3.5 h-full', className)}>
      {icon && (
        <div className="w-9 h-9 rounded-[10px] bg-warm-100 flex items-center justify-center text-charcoal-500 flex-shrink-0">
          {icon}
        </div>
      )}
      <div>
        <p className="text-xs text-charcoal-400 font-medium">{label}</p>
        <p className="text-base font-bold text-charcoal-900 tabular-nums">{value}</p>
      </div>
    </div>
  );
}

// ─── Date Filter Tabs ──────────────────────────────────────

type FilterPreset = { value: string; label: string };

interface DateFilterTabsProps {
  value: string;
  onChange: (v: string) => void;
  options?: FilterPreset[];
  className?: string;
}

const DEFAULT_PRESETS: FilterPreset[] = [
  { value: 'today', label: 'Bugun' },
  { value: 'yesterday', label: 'Kecha' },
  { value: 'last7days', label: '7 kun' },
  { value: 'thisMonth', label: 'Bu oy' },
  { value: 'lastMonth', label: 'O\'tgan oy' },
  { value: 'thisYear', label: 'Bu yil' },
];

export function DateFilterTabs({ value, onChange, options = DEFAULT_PRESETS, className }: DateFilterTabsProps) {
  return (
    <div className={cn('flex items-center gap-1 p-1 bg-warm-100 rounded-[12px] overflow-x-auto scrollbar-hide', className)}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-[8px] whitespace-nowrap transition-all duration-150',
            value === opt.value
              ? 'bg-white text-charcoal-900 shadow-sm'
              : 'text-charcoal-500 hover:text-charcoal-700'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Page Header ──────────────────────────────────────────

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4', className)}>
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-bold text-charcoal-900">{title}</h1>
        {description && <p className="text-sm text-charcoal-400 mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
