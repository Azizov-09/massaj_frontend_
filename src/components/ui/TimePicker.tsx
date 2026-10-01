// ═══════════════════════════════════════════════════════
//  TimePicker — Senior Clean Modern 24-Hour Time Picker
//  Matches Massaj CRM Warm Design System
// ═══════════════════════════════════════════════════════

import React, {
  forwardRef,
  useState,
  useRef,
  useEffect,
  useMemo,
  useImperativeHandle,
  useId,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/utils';

export interface TimePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange' | 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  value?: string; // Format: "HH:mm" (24-hour)
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (timeString: string) => void;
  min?: string; // "HH:mm"
  max?: string; // "HH:mm"
  stepMinutes?: 5 | 10 | 15 | 30;
  clearable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  triggerClassName?: string;
  popupClassName?: string;
}

const sizeStyles = {
  sm: {
    trigger: 'px-2.5 py-1.5 text-xs rounded-[8px]',
    icon: 'w-3.5 h-3.5',
  },
  md: {
    trigger: 'px-3 py-2 text-sm rounded-[10px]',
    icon: 'w-4 h-4',
  },
  lg: {
    trigger: 'px-3.5 py-2.5 text-base rounded-[12px]',
    icon: 'w-4.5 h-4.5',
  },
};

// Preset popular times for clinic workflows
const DEFAULT_PRESETS = [
  '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30',
  '20:00'
];

export const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(
  (
    {
      label,
      error,
      hint,
      placeholder = 'Vaqtni tanlang...',
      value,
      defaultValue,
      onChange,
      onValueChange,
      min = '07:00',
      max = '21:00',
      stepMinutes = 15,
      clearable = false,
      size = 'md',
      className,
      triggerClassName,
      popupClassName,
      id,
      name,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const pickerId = id ?? label?.toLowerCase().replace(/\s+/g, '-') ?? generatedId;
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const hiddenInputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => hiddenInputRef.current!);

    const isControlled = value !== undefined;
    const [internalVal, setInternalVal] = useState<string>(
      value !== undefined ? value : defaultValue !== undefined ? defaultValue : ''
    );

    const currentVal = isControlled ? (value ?? '') : internalVal;

    // Parse current hour and minute
    const [selectedHour, selectedMinute] = useMemo(() => {
      if (!currentVal || !currentVal.includes(':')) return [null, null];
      const [h, m] = currentVal.split(':');
      return [h.padStart(2, '0'), m.padStart(2, '0')];
    }, [currentVal]);

    const [tempHour, setTempHour] = useState<string>(selectedHour || '09');
    const [tempMinute, setTempMinute] = useState<string>(selectedMinute || '00');
    const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');

    const [isOpen, setIsOpen] = useState(false);
    const [openUpward, setOpenUpward] = useState(false);
    const [alignRight, setAlignRight] = useState(false);

    // Generate hours array (07 to 21 or 00 to 23 based on min/max)
    const hours = useMemo(() => {
      const minH = parseInt(min.split(':')[0], 10) || 7;
      const maxH = parseInt(max.split(':')[0], 10) || 21;
      const list: string[] = [];
      for (let h = minH; h <= maxH; h++) {
        list.push(String(h).padStart(2, '0'));
      }
      return list;
    }, [min, max]);

    // Generate minutes array based on step
    const minutes = useMemo(() => {
      const list: string[] = [];
      for (let m = 0; m < 60; m += stepMinutes) {
        list.push(String(m).padStart(2, '0'));
      }
      return list;
    }, [stepMinutes]);

    const handleToggle = () => {
      if (disabled) return;
      if (isOpen) {
        setIsOpen(false);
      } else {
        if (selectedHour) setTempHour(selectedHour);
        if (selectedMinute) setTempMinute(selectedMinute);

        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const modal = containerRef.current.closest('[role="dialog"]') as HTMLElement | null;
          const modalRect = modal?.getBoundingClientRect();

          const bottomLimit = modalRect ? modalRect.bottom : window.innerHeight;
          const topLimit = modalRect ? modalRect.top : 0;
          const spaceBelow = bottomLimit - rect.bottom;
          const spaceAbove = rect.top - topLimit;
          const estimatedHeight = 260;

          // Open upward if constrained below and more space is available above
          setOpenUpward(spaceBelow < estimatedHeight && spaceAbove > spaceBelow);

          // Align to right edge if opening towards right exceeds container
          const rightLimit = modalRect ? modalRect.right : window.innerWidth;
          setAlignRight(rect.left + 310 > rightLimit);
        }
        setIsOpen(true);
      }
    };

    // Close on click outside & Escape
    useEffect(() => {
      if (!isOpen) return;
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsOpen(false);
          triggerRef.current?.focus();
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [isOpen]);

    // Dispatch update
    const commitTime = (timeStr: string) => {
      if (!isControlled) {
        setInternalVal(timeStr);
      }
      if (hiddenInputRef.current) {
        hiddenInputRef.current.value = timeStr;
      }
      if (onValueChange) {
        onValueChange(timeStr);
      }
      if (onChange) {
        const syntheticEvent = {
          target: { value: timeStr, name: name || '', id: pickerId },
          currentTarget: { value: timeStr, name: name || '', id: pickerId },
          preventDefault: () => {},
          stopPropagation: () => {},
          persist: () => {},
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    const handleSelectPreset = (time: string) => {
      commitTime(time);
      setIsOpen(false);
      triggerRef.current?.focus();
    };

    const handleApply = () => {
      const finalTime = `${tempHour}:${tempMinute}`;
      commitTime(finalTime);
      setIsOpen(false);
      triggerRef.current?.focus();
    };

    const handleClear = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      commitTime('');
      setIsOpen(false);
      triggerRef.current?.focus();
    };

    const handleSetNow = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const rawM = now.getMinutes();
      const roundedM = Math.round(rawM / stepMinutes) * stepMinutes;
      const finalM = String(roundedM >= 60 ? 0 : roundedM).padStart(2, '0');
      const timeStr = `${h}:${finalM}`;
      setTempHour(h);
      setTempMinute(finalM);
      commitTime(timeStr);
      setIsOpen(false);
      triggerRef.current?.focus();
    };

    const currentSize = sizeStyles[size] || sizeStyles.md;

    return (
      <div ref={containerRef} className={cn('relative w-full', className)}>
        {/* Hidden Input for Form Compatibility */}
        <input
          type="hidden"
          ref={hiddenInputRef}
          id={pickerId}
          name={name}
          value={currentVal}
          required={required}
          disabled={disabled}
          {...props}
        />

        {/* Accessible Label */}
        {label && (
          <label htmlFor={pickerId} className="block text-sm font-medium text-charcoal-700 mb-1.5">
            {label}
            {required && <span className="text-danger-main ml-1" aria-hidden>*</span>}
          </label>
        )}

        {/* Trigger Button */}
        <button
          ref={triggerRef}
          type="button"
          id={`${pickerId}-trigger`}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          onClick={handleToggle}
          className={cn(
            'w-full flex items-center justify-between text-left border transition-all duration-150 outline-none select-none',
            'bg-white text-charcoal-900 shadow-2xs hover:border-warm-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
            currentSize.trigger,
            error
              ? 'border-danger-main focus:border-danger-main focus:ring-danger-light'
              : isOpen
              ? 'border-brand-500 ring-2 ring-brand-100'
              : 'border-warm-300',
            disabled && 'bg-warm-100/70 border-warm-200 text-charcoal-400 cursor-not-allowed hover:border-warm-200',
            triggerClassName
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Clock
              className={cn(
                currentSize.icon,
                'flex-shrink-0 transition-colors',
                isOpen ? 'text-brand-500' : 'text-charcoal-400'
              )}
            />
            {currentVal ? (
              <span className="font-semibold text-charcoal-900 tracking-wide text-sm font-mono">
                {currentVal}
              </span>
            ) : (
              <span className="text-charcoal-400 truncate text-sm">{placeholder}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
            {clearable && currentVal && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                className="p-1 text-charcoal-400 hover:text-charcoal-600 rounded-full hover:bg-warm-100 transition-colors"
                title="Tozalash"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
            <ChevronDown
              className={cn(
                'w-4 h-4 text-charcoal-400 transition-transform duration-200',
                isOpen && 'rotate-180 text-brand-500'
              )}
            />
          </div>
        </button>

        {/* Error / Hint Messages */}
        {error && <p id={`${pickerId}-error`} className="mt-1 text-xs text-danger-main">{error}</p>}
        {hint && !error && <p id={`${pickerId}-hint`} className="mt-1 text-xs text-charcoal-400">{hint}</p>}

        {/* Dropdown Popover */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: openUpward ? 4 : -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: openUpward ? 4 : -4, scale: 0.98 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={cn(
                'absolute z-50 w-[290px] sm:w-[310px] bg-white rounded-[14px] border border-warm-200/90 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.14),0_4px_12px_-2px_rgba(0,0,0,0.06)] overflow-hidden',
                alignRight ? 'right-0' : 'left-0',
                openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
                popupClassName
              )}
            >
              {/* Header: Title, Segmented Tabs & Now Button */}
              <div className="p-2.5 pb-2 border-b border-warm-100 bg-warm-50/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-charcoal-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand-500" />
                    Vaqtni tanlang
                  </span>
                  <button
                    type="button"
                    onClick={handleSetNow}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200/80 rounded-[6px] transition-colors"
                  >
                    <Clock className="w-3 h-3 text-brand-500" />
                    Hozirgi vaqt
                  </button>
                </div>

                {/* Segmented Control */}
                <div className="grid grid-cols-2 p-0.5 bg-warm-200/60 rounded-[8px] text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveTab('presets')}
                    className={cn(
                      'py-1 rounded-[6px] transition-all text-center',
                      activeTab === 'presets'
                        ? 'bg-white text-charcoal-900 shadow-xs'
                        : 'text-charcoal-600 hover:text-charcoal-900'
                    )}
                  >
                    Mashhur vaqtlar
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('custom')}
                    className={cn(
                      'py-1 rounded-[6px] transition-all text-center',
                      activeTab === 'custom'
                        ? 'bg-white text-charcoal-900 shadow-xs'
                        : 'text-charcoal-600 hover:text-charcoal-900'
                    )}
                  >
                    Aniq soat
                  </button>
                </div>
              </div>

              {/* Tab 1: Presets Slot Grid */}
              {activeTab === 'presets' && (
                <div className="p-2.5">
                  <span className="sr-only">Mashhur vaqtlar:</span>
                  <div className="grid grid-cols-4 gap-1.5 max-h-[190px] overflow-y-auto pr-0.5 [scrollbar-width:thin] [scrollbar-color:#d4cfc7_transparent]">
                    {DEFAULT_PRESETS.map(preset => {
                      const isMatch = currentVal === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          aria-label={`Vaqt ${preset}`}
                          onClick={() => handleSelectPreset(preset)}
                          className={cn(
                            'py-1.5 px-1 text-xs font-semibold rounded-[8px] border transition-all text-center font-mono',
                            isMatch
                              ? 'bg-brand-500 border-brand-500 text-white font-bold shadow-xs'
                              : 'bg-white border-warm-200 text-charcoal-700 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/40'
                          )}
                        >
                          {preset}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 2: Custom Hour and Minute Pickers */}
              {activeTab === 'custom' && (
                <div className="p-2.5">
                  {/* Digital Preview */}
                  <div className="text-center py-1.5 mb-2 bg-warm-100/60 rounded-[8px] border border-warm-200/70">
                    <span className="text-lg font-bold font-mono text-charcoal-900 tracking-wider">
                      {tempHour}:{tempMinute}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-[11px] font-semibold text-charcoal-500 mb-1">
                    <span>Soat</span>
                    <span>Daqiqa</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 h-32 border border-warm-200/90 rounded-[8px] p-1 bg-warm-50/40">
                    {/* Hours */}
                    <div className="overflow-y-auto space-y-0.5 pr-0.5 [scrollbar-width:thin] [scrollbar-color:#d4cfc7_transparent]">
                      {hours.map(h => {
                        const isSelected = tempHour === h;
                        return (
                          <button
                            key={h}
                            type="button"
                            aria-label={`Soat ${h}`}
                            onClick={() => setTempHour(h)}
                            className={cn(
                              'w-full py-1 text-xs font-semibold rounded-[6px] transition-colors font-mono',
                              isSelected
                                ? 'bg-brand-500 text-white shadow-xs'
                                : 'text-charcoal-700 hover:bg-warm-100 hover:text-charcoal-900'
                            )}
                          >
                            {h}:00
                          </button>
                        );
                      })}
                    </div>

                    {/* Minutes */}
                    <div className="overflow-y-auto space-y-0.5 pr-0.5 [scrollbar-width:thin] [scrollbar-color:#d4cfc7_transparent]">
                      {minutes.map(m => {
                        const isSelected = tempMinute === m;
                        return (
                          <button
                            key={m}
                            type="button"
                            aria-label={`${m} daqiqa`}
                            onClick={() => setTempMinute(m)}
                            className={cn(
                              'w-full py-1 text-xs font-semibold rounded-[6px] transition-colors font-mono',
                              isSelected
                                ? 'bg-brand-500 text-white shadow-xs'
                                : 'text-charcoal-700 hover:bg-warm-100 hover:text-charcoal-900'
                            )}
                          >
                            :{m}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Apply Button for Custom Tab */}
                  <button
                    type="button"
                    onClick={handleApply}
                    className="w-full mt-2 inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-[8px] transition-colors shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Tanlash
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

TimePicker.displayName = 'TimePicker';
