import React, { useId, useMemo } from 'react';
import { cn } from '@/utils';
import { Target, TrendingUp, CheckCircle2, Minus, Plus } from 'lucide-react';

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  hint?: string;
  unit?: string;
  showPresets?: boolean;
  presets?: number[];
  showSteppers?: boolean;
  showValueBadge?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 5,
  label,
  hint,
  unit = '%',
  showPresets = true,
  presets = [0, 25, 50, 75, 100],
  showSteppers = true,
  showValueBadge = true,
  disabled = false,
  className,
  id,
}: SliderProps) {
  const generatedId = useId();
  const inputId = id || generatedId;

  // Clamp value between min and max
  const clampedValue = Math.min(max, Math.max(min, value));
  const range = max - min;
  const percentage = range > 0 ? Math.round(((clampedValue - min) / range) * 100) : 0;

  // Color scheme based on progress percentage
  const theme = useMemo(() => {
    if (clampedValue >= 100) {
      return {
        barGradient: 'bg-gradient-to-r from-emerald-500 to-teal-500',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        thumbBorder: 'border-emerald-500',
        thumbDot: 'bg-emerald-500',
        accentColor: '#10b981',
        statusLabel: 'To‘liq bajarildi',
        presetActive: 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30 ring-2 ring-emerald-500/20',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
      };
    }
    if (clampedValue >= 50) {
      return {
        barGradient: 'bg-gradient-to-r from-brand-500 to-brand-600',
        badgeBg: 'bg-brand-50 text-brand-700 border-brand-200/80',
        thumbBorder: 'border-brand-500',
        thumbDot: 'bg-brand-500',
        accentColor: '#f97316',
        statusLabel: 'Faol jarayon',
        presetActive: 'bg-brand-500 text-white shadow-xs shadow-brand-500/30 ring-2 ring-brand-500/20',
        icon: <TrendingUp className="w-3.5 h-3.5 text-brand-500" />,
      };
    }
    if (clampedValue > 0) {
      return {
        barGradient: 'bg-gradient-to-r from-amber-400 to-amber-500',
        badgeBg: 'bg-amber-50 text-amber-800 border-amber-200/80',
        thumbBorder: 'border-amber-500',
        thumbDot: 'bg-amber-500',
        accentColor: '#f59e0b',
        statusLabel: 'Boshlang‘ich bosqich',
        presetActive: 'bg-amber-500 text-white shadow-xs shadow-amber-500/30 ring-2 ring-amber-500/20',
        icon: <Target className="w-3.5 h-3.5 text-amber-500" />,
      };
    }
    return {
      barGradient: 'bg-warm-300',
      badgeBg: 'bg-warm-100 text-charcoal-600 border-warm-200',
      thumbBorder: 'border-warm-400',
      thumbDot: 'bg-warm-400',
      accentColor: '#938c83',
      statusLabel: 'Boshlanmagan',
      presetActive: 'bg-warm-700 text-white shadow-xs shadow-warm-700/20',
      icon: <Target className="w-3.5 h-3.5 text-charcoal-400" />,
    };
  }, [clampedValue]);

  const handleStepperChange = (delta: number) => {
    if (disabled) return;
    const nextVal = Math.min(max, Math.max(min, clampedValue + delta));
    onChange(nextVal);
  };

  return (
    <div
      className={cn(
        'p-3.5 sm:p-4 rounded-[14px] bg-warm-50/70 border border-warm-200/90 shadow-2xs space-y-3 transition-colors duration-150',
        'focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-500/10',
        disabled && 'opacity-60 pointer-events-none',
        className
      )}
    >
      {/* ─── Header: Label & Value Badge ─── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {label && (
            <label
              htmlFor={inputId}
              className="text-xs sm:text-sm font-bold text-charcoal-800 flex items-center gap-1.5 cursor-pointer"
            >
              {theme.icon}
              <span>{label}</span>
            </label>
          )}
          {hint && <span className="text-[11px] text-charcoal-400 font-normal">({hint})</span>}
        </div>

        {showValueBadge && (
          <div
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-xs font-bold border transition-colors duration-200',
              theme.badgeBg
            )}
          >
            <span>{clampedValue}{unit}</span>
            <span className="hidden sm:inline opacity-75 font-medium text-[11px]">
              · {theme.statusLabel}
            </span>
          </div>
        )}
      </div>

      {/* ─── Interactive Slider Bar & Thumb ─── */}
      <div className="relative pt-1 pb-1 flex items-center group">
        {/* Track Container */}
        <div className="relative w-full h-3 rounded-full bg-warm-200/90 overflow-hidden shadow-inner">
          {/* Active Fill Track */}
          <div
            className={cn('h-full rounded-full transition-all duration-150 ease-out', theme.barGradient)}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Floating Custom Thumb (Positioned precisely without overflowing track) */}
        <div
          className={cn(
            'absolute top-1/2 w-6 h-6 rounded-full bg-white shadow-md border-[2.5px] pointer-events-none transition-transform duration-100 flex items-center justify-center',
            'group-hover:scale-110 group-hover:shadow-lg',
            theme.thumbBorder
          )}
          style={{
            left: `${percentage}%`,
            transform: `translate(-${percentage}%, -50%)`,
          }}
          aria-hidden="true"
        >
          <div className={cn('w-2 h-2 rounded-full transition-colors', theme.thumbDot)} />
        </div>

        {/* Native Range Input (Accessible, overlayed for 100% native touch/keyboard/mouse support) */}
        <input
          type="range"
          id={inputId}
          min={min}
          max={max}
          step={step}
          value={clampedValue}
          disabled={disabled}
          onChange={e => onChange(Number(e.target.value))}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={clampedValue}
          aria-valuetext={`${clampedValue}${unit}`}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
      </div>

      {/* ─── Quick Presets & Steppers ─── */}
      {(showPresets || showSteppers) && (
        <div className="flex items-center justify-between gap-2 pt-0.5">
          {/* Steppers (- / +) */}
          {showSteppers && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleStepperChange(-step)}
                disabled={disabled || clampedValue <= min}
                className={cn(
                  'h-7 px-2 flex items-center gap-1 rounded-[8px] text-xs font-semibold text-charcoal-700 bg-white border border-warm-200/90 shadow-2xs',
                  'hover:bg-warm-100 hover:text-charcoal-900 active:scale-95 transition-all',
                  'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100'
                )}
                title={`${step}${unit} kamaytirish`}
                aria-label={`${step}${unit} kamaytirish`}
              >
                <Minus className="w-3 h-3" />
                <span className="text-[11px]">{step}</span>
              </button>

              <button
                type="button"
                onClick={() => handleStepperChange(step)}
                disabled={disabled || clampedValue >= max}
                className={cn(
                  'h-7 px-2 flex items-center gap-1 rounded-[8px] text-xs font-semibold text-charcoal-700 bg-white border border-warm-200/90 shadow-2xs',
                  'hover:bg-warm-100 hover:text-charcoal-900 active:scale-95 transition-all',
                  'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100'
                )}
                title={`${step}${unit} oshirish`}
                aria-label={`${step}${unit} oshirish`}
              >
                <Plus className="w-3 h-3" />
                <span className="text-[11px]">{step}</span>
              </button>
            </div>
          )}

          {/* Preset Buttons */}
          {showPresets && presets && presets.length > 0 && (
            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-end">
              {presets.map(preset => {
                const isActive = clampedValue === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(preset)}
                    className={cn(
                      'h-7 px-2 sm:px-2.5 rounded-[8px] text-xs font-semibold transition-all active:scale-95',
                      isActive
                        ? theme.presetActive
                        : 'bg-white hover:bg-warm-100/90 text-charcoal-700 hover:text-charcoal-900 border border-warm-200/90 shadow-2xs'
                    )}
                  >
                    {preset}{unit}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
