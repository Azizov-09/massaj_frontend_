// ═══════════════════════════════════════════════════════
//  Switch — Custom Accessible Animated Toggle Switch
//  Matches Massaj CRM Warm Design System
// ═══════════════════════════════════════════════════════

import React from 'react';
import { cn } from '@/utils';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  id?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  'aria-label'?: string;
}

const sizeConfig = {
  sm: {
    track: 'w-8 h-4.5',
    thumb: 'w-3.5 h-3.5',
    translate: 'translate-x-3.5',
    offset: 'translate-x-0.5',
  },
  md: {
    track: 'w-11 h-6',
    thumb: 'w-5 h-5',
    translate: 'translate-x-5',
    offset: 'translate-x-0.5',
  },
  lg: {
    track: 'w-14 h-7.5',
    thumb: 'w-6.5 h-6.5',
    translate: 'translate-x-6.5',
    offset: 'translate-x-0.5',
  },
};

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  description,
  id,
  name,
  size = 'md',
  className,
  'aria-label': ariaLabel,
}) => {
  const cfg = sizeConfig[size] || sizeConfig.md;

  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggle();
    }
  };

  const switchButton = (
    <button
      type="button"
      role="switch"
      id={id}
      name={name}
      aria-checked={checked}
      aria-label={ariaLabel || label}
      disabled={disabled}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative inline-flex items-center flex-shrink-0 rounded-full transition-colors duration-200 ease-in-out cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2',
        cfg.track,
        checked ? 'bg-brand-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]' : 'bg-warm-300 hover:bg-warm-400',
        disabled && 'opacity-50 cursor-not-allowed',
        !label && className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none inline-block rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out',
          cfg.thumb,
          checked ? cfg.translate : cfg.offset
        )}
      />
    </button>
  );

  if (!label && !description) {
    return switchButton;
  }

  return (
    <div
      onClick={handleToggle}
      className={cn(
        'flex items-center justify-between gap-4 cursor-pointer select-none',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div className="flex flex-col">
        {label && <span className="text-xs sm:text-sm font-bold text-charcoal-900">{label}</span>}
        {description && <span className="text-xs text-charcoal-500 mt-0.5">{description}</span>}
      </div>
      {switchButton}
    </div>
  );
};
