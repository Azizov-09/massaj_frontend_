// ═══════════════════════════════════════════════════════
//  Thinking Orbs — Lightweight Accessible Shim
//  Optimized for medical CRM performance without canvas drain
// ═══════════════════════════════════════════════════════
import { Spinner } from '@/components/ui/Spinner';

export const VARIANTS = {
  base: ['default'],
  working: ['default', 'gyro'],
  reasoning: ['default', 'twins'],
  searching: ['default', 'lighthouse'],
  background: ['default', 'spiral'],
  retrying: ['default', 'surge'],
  compacting: ['default', 'squeeze', 'fuse'],
  waiting: ['default'],
} as const;

export type OrbState = keyof typeof VARIANTS;
export type OrbVariant<S extends OrbState = OrbState> = (typeof VARIANTS)[S][number];
export type OrbLook = { state?: undefined; variant?: undefined } | { [S in OrbState]: { state: S; variant?: OrbVariant<S> } }[OrbState];

export interface OrbProps {
  state?: OrbState;
  variant?: string;
  size?: number;
  className?: string;
  label?: string;
}

export function Orb({
  size = 24,
  className,
  label = 'Yuklanmoqda...',
}: OrbProps) {
  return <Spinner size={size} className={className} label={label} />;
}
