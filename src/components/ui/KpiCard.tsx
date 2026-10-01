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

  const topAccentMap: Record<string, string> = {
    brand: 'bg-brand-500',
    sage: 'bg-emerald-500',
    gold: 'bg-amber-500',
    danger: 'bg-rose-500',
    success: 'bg-emerald-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
  };

  const iconBgMap: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600 border border-brand-100/80',
    sage: 'bg-emerald-50 text-emerald-600 border border-emerald-100/80',
    gold: 'bg-amber-50 text-amber-600 border border-amber-100/80',
    danger: 'bg-rose-50 text-rose-600 border border-rose-100/80',
    success: 'bg-emerald-50 text-emerald-600 border border-emerald-100/80',
    blue: 'bg-blue-50 text-blue-600 border border-blue-100/80',
    purple: 'bg-purple-50 text-purple-600 border border-purple-100/80',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05, ease: 'easeOut' }}
      className={cn(
        'relative bg-white rounded-xl border border-warm-200/90 shadow-2xs hover:shadow-xs hover:border-warm-300 transition-all duration-200 p-4 sm:p-5 overflow-hidden group flex flex-col justify-between',
        size === 'sm' ? 'p-3' : size === 'lg' ? 'p-6' : 'p-4 sm:p-5',
        className
      )}
    >
      {/* Top Accent Strip */}
      <div className={cn('absolute top-0 left-0 right-0 h-[2.5px]', topAccentMap[accentColor] ?? topAccentMap.brand)} />

      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider truncate">
          {label}
        </span>
        {icon && (
          <div className={cn(
            'w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-2xs',
            iconBgMap[accentColor] ?? iconBgMap.brand,
            size === 'lg' && 'w-11 h-11'
          )}>
            {icon}
          </div>
        )}
      </div>

      <div>
        <motion.p
          key={String(value)}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'font-extrabold text-charcoal-900 tabular-nums tracking-tight leading-none',
            size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-3xl' : 'text-2xl sm:text-[28px]'
          )}
        >
          {formatValue()}
        </motion.p>

        {description && (
          <p className="text-[11px] text-charcoal-400 mt-2 font-medium leading-tight truncate">{description}</p>
        )}

        {trend && (
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className={cn(
              'inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-[5px]',
              trendPositive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/80' :
              trendNeutral ? 'bg-warm-100 text-charcoal-600 border border-warm-200/80' :
              'bg-rose-50 text-rose-700 border border-rose-100/80'
            )}>
              {trendPositive ? <TrendingUp className="w-3 h-3" /> : trendNeutral ? <Minus className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </span>
            {trend.label && <span className="text-[11px] text-charcoal-400 truncate">{trend.label}</span>}
          </div>
        )}

        {!trend && change && (
          <div className="flex items-center gap-1 mt-2 text-[11px] font-semibold">
            <span className={changeType === 'positive' ? 'text-emerald-600' : changeType === 'negative' ? 'text-rose-600' : 'text-charcoal-500'}>
              {change}
            </span>
          </div>
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
    <div className={cn('flex items-center gap-3 bg-white rounded-[14px] border border-warm-200 p-3.5', className)}>
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
