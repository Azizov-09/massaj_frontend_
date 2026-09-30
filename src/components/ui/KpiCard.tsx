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

  const accentMap: Record<string, string> = {
    brand: 'border-l-brand-500 bg-gradient-to-br from-brand-50/60 to-white',
    sage: 'border-l-sage-500 bg-gradient-to-br from-sage-50/60 to-white',
    gold: 'border-l-gold-500 bg-gradient-to-br from-gold-50/60 to-white',
    danger: 'border-l-danger-main bg-gradient-to-br from-red-50/60 to-white',
    success: 'border-l-green-500 bg-gradient-to-br from-green-50/60 to-white',
  };

  const iconBgMap: Record<string, string> = {
    brand: 'bg-brand-100 text-brand-600',
    sage: 'bg-sage-100 text-sage-600',
    gold: 'bg-gold-100 text-gold-700',
    danger: 'bg-red-100 text-danger-main',
    success: 'bg-green-100 text-green-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: 'easeOut' }}
      className={cn(
        'relative bg-white rounded-[14px] border border-warm-200 border-l-[3px] shadow-[0_1px_3px_0_rgb(0_0_0/0.06)] p-4 overflow-hidden',
        accentMap[accentColor] ?? accentMap.brand,
        size === 'sm' ? 'p-3' : size === 'lg' ? 'p-5' : 'p-4',
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-5 bg-current" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className={cn('text-charcoal-500 font-medium leading-none mb-2', size === 'sm' ? 'text-xs' : 'text-xs')}>
            {label}
          </p>
          <motion.p
            key={String(value)}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={cn(
              'font-bold text-charcoal-900 tabular-nums leading-none',
              size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-2xl'
            )}
          >
            {formatValue()}
          </motion.p>
          {description && (
            <p className="text-[11px] text-charcoal-400 mt-1 leading-tight">{description}</p>
          )}
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-2',
              trendPositive ? 'text-green-600' : trendNeutral ? 'text-charcoal-400' : 'text-danger-main'
            )}>
              {trendPositive ? <TrendingUp className="w-3 h-3" /> : trendNeutral ? <Minus className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span className="text-[11px] font-semibold">
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
              {trend.label && <span className="text-[10px] text-charcoal-400">{trend.label}</span>}
            </div>
          )}
          {!trend && change && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-[11px] font-semibold',
              changeType === 'positive' ? 'text-green-600' : changeType === 'negative' ? 'text-danger-main' : 'text-charcoal-500'
            )}>
              <span>{change}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn('w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0', iconBgMap[accentColor] ?? iconBgMap.brand, size === 'lg' && 'w-11 h-11')}>
            {icon}
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
