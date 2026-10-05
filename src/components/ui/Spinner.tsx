// ═══════════════════════════════════════════════════════
//  Spinner — Senior Grade Lightweight Accessible Loader
// ═══════════════════════════════════════════════════════
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils';

interface SpinnerProps {
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
}

const sizeMap = {
  xs: 14,
  sm: 18,
  md: 24,
  lg: 32,
  xl: 40,
};

export function Spinner({
  size = 'md',
  className,
  label = 'Yuklanmoqda...',
}: SpinnerProps) {
  const pixelSize = typeof size === 'number' ? size : sizeMap[size] || 24;

  return (
    <div
      role="status"
      aria-label={label}
      className="inline-flex items-center justify-center shrink-0"
    >
      <Loader2
        style={{ width: pixelSize, height: pixelSize }}
        className={cn('animate-spin text-brand-600', className)}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

// Backward-compatible Orb drop-in replacement that avoids canvas physics
export function Orb({
  size = 24,
  className,
  label,
}: {
  state?: string;
  size?: number;
  className?: string;
  label?: string;
}) {
  return <Spinner size={size} className={className} label={label} />;
}
