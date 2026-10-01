// ═══════════════════════════════════════════════════════
//  DatePicker — Custom Accessible Animated Calendar Picker
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
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/utils';

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange' | 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  value?: string; // Format: "YYYY-MM-DD"
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (dateString: string) => void;
  min?: string; // Format: "YYYY-MM-DD"
  max?: string; // Format: "YYYY-MM-DD"
  clearable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  triggerClassName?: string;
  popupClassName?: string;
}

const MONTH_NAMES = [
  'Yanvar',
  'Fevral',
  'Mart',
  'Aprel',
  'May',
  'Iyun',
  'Iyul',
  'Avgust',
  'Sentabr',
  'Oktabr',
  'Noyabr',
  'Dekabr',
];

const WEEKDAY_NAMES = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];

function parseYMD(str?: string): Date | null {
  if (!str) return null;
  const parts = str.split('-');
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m, d);
}

function formatYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplay(dateStr?: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  return `${d}.${m}.${y}`;
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
    icon: 'w-4 h-4',
  },
};

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      label,
      error,
      hint,
      placeholder = 'Sana tanlang...',
      value,
      defaultValue,
      onChange,
      onValueChange,
      min,
      max,
      clearable = true,
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
    const datePickerId = id ?? label?.toLowerCase().replace(/\s+/g, '-') ?? generatedId;
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const hiddenInputRef = useRef<HTMLInputElement>(null);

    // Forward ref to hidden input for form libraries like React Hook Form
    useImperativeHandle(ref, () => hiddenInputRef.current!);

    const isControlled = value !== undefined;
    const [internalVal, setInternalVal] = useState<string>(
      value !== undefined ? value : defaultValue !== undefined ? defaultValue : ''
    );

    const currentVal = isControlled ? (value ?? '') : internalVal;
    const currentDate = useMemo(() => parseYMD(currentVal), [currentVal]);

    const [isOpen, setIsOpen] = useState(false);
    const [openUpward, setOpenUpward] = useState(false);
    const [alignRight, setAlignRight] = useState(false);

    // Sub-pickers for Month and Year
    const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
    const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);

    const monthTriggerRef = useRef<HTMLButtonElement>(null);
    const monthDropdownRef = useRef<HTMLDivElement>(null);
    const yearTriggerRef = useRef<HTMLButtonElement>(null);
    const yearDropdownRef = useRef<HTMLDivElement>(null);
    const selectedYearRef = useRef<HTMLButtonElement>(null);

    // View month and year for calendar navigation
    const today = useMemo(() => new Date(), []);
    const [viewYear, setViewYear] = useState<number>(() => currentDate?.getFullYear() ?? today.getFullYear());
    const [viewMonth, setViewMonth] = useState<number>(() => currentDate?.getMonth() ?? today.getMonth());

    // Close month & year pickers on outside click
    useEffect(() => {
      if (!isMonthPickerOpen && !isYearPickerOpen) return;
      const handleClickOutsidePickers = (e: MouseEvent) => {
        const target = e.target as Node;
        if (
          isMonthPickerOpen &&
          monthDropdownRef.current &&
          !monthDropdownRef.current.contains(target) &&
          monthTriggerRef.current &&
          !monthTriggerRef.current.contains(target)
        ) {
          setIsMonthPickerOpen(false);
        }
        if (
          isYearPickerOpen &&
          yearDropdownRef.current &&
          !yearDropdownRef.current.contains(target) &&
          yearTriggerRef.current &&
          !yearTriggerRef.current.contains(target)
        ) {
          setIsYearPickerOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutsidePickers);
      return () => {
        document.removeEventListener('mousedown', handleClickOutsidePickers);
      };
    }, [isMonthPickerOpen, isYearPickerOpen]);

    // Center active year in year picker scroll view
    useEffect(() => {
      if (isYearPickerOpen && yearDropdownRef.current && selectedYearRef.current) {
        const container = yearDropdownRef.current;
        const target = selectedYearRef.current;
        container.scrollTop = target.offsetTop - container.clientHeight / 2 + target.clientHeight / 2;
      }
    }, [isYearPickerOpen]);

    // Viewport position and view alignment calculation
    const handleToggle = () => {
      if (disabled) return;
      if (isOpen) {
        setIsMonthPickerOpen(false);
        setIsYearPickerOpen(false);
        setIsOpen(false);
      } else {
        if (currentDate) {
          setViewYear(currentDate.getFullYear());
          setViewMonth(currentDate.getMonth());
        }
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const modal = containerRef.current.closest('[role="dialog"]') as HTMLElement | null;
          const modalRect = modal?.getBoundingClientRect();

          const bottomLimit = modalRect ? modalRect.bottom : window.innerHeight;
          const topLimit = modalRect ? modalRect.top : 0;
          const spaceBelow = bottomLimit - rect.bottom;
          const spaceAbove = rect.top - topLimit;
          const estimatedHeight = 320;

          setOpenUpward(spaceBelow < estimatedHeight && spaceAbove > spaceBelow);

          const rightLimit = modalRect ? modalRect.right : window.innerWidth;
          setAlignRight(rect.left + 300 > rightLimit);
        }
        setIsOpen(true);
      }
    };

    // Close on outside click & Escape key
    useEffect(() => {
      if (!isOpen) return;
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsMonthPickerOpen(false);
          setIsYearPickerOpen(false);
          setIsOpen(false);
        }
      };
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (isMonthPickerOpen || isYearPickerOpen) {
            setIsMonthPickerOpen(false);
            setIsYearPickerOpen(false);
            return;
          }
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
    }, [isOpen, isMonthPickerOpen, isYearPickerOpen]);

    // Value update dispatch
    const handleSelectDate = (date: Date) => {
      const ymd = formatYMD(date);
      if (!isControlled) {
        setInternalVal(ymd);
      }
      setIsMonthPickerOpen(false);
      setIsYearPickerOpen(false);
      setIsOpen(false);
      triggerRef.current?.focus();

      // Sync hidden input
      if (hiddenInputRef.current) {
        hiddenInputRef.current.value = ymd;
      }

      if (onValueChange) {
        onValueChange(ymd);
      }

      if (onChange) {
        const syntheticEvent = {
          target: { value: ymd, name: name || '', id: datePickerId },
          currentTarget: { value: ymd, name: name || '', id: datePickerId },
          preventDefault: () => {},
          stopPropagation: () => {},
          persist: () => {},
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    const handleClear = (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (!isControlled) {
        setInternalVal('');
      }
      setIsMonthPickerOpen(false);
      setIsYearPickerOpen(false);
      if (hiddenInputRef.current) {
        hiddenInputRef.current.value = '';
      }
      if (onValueChange) {
        onValueChange('');
      }
      if (onChange) {
        const syntheticEvent = {
          target: { value: '', name: name || '', id: datePickerId },
          currentTarget: { value: '', name: name || '', id: datePickerId },
          preventDefault: () => {},
          stopPropagation: () => {},
          persist: () => {},
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
      setIsOpen(false);
      triggerRef.current?.focus();
    };

    const handleSelectToday = () => {
      handleSelectDate(new Date());
    };

    // Month navigation
    const prevMonth = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsMonthPickerOpen(false);
      setIsYearPickerOpen(false);
      if (viewMonth === 0) {
        setViewMonth(11);
        setViewYear(y => y - 1);
      } else {
        setViewMonth(m => m - 1);
      }
    };

    const nextMonth = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsMonthPickerOpen(false);
      setIsYearPickerOpen(false);
      if (viewMonth === 11) {
        setViewMonth(0);
        setViewYear(y => y + 1);
      } else {
        setViewMonth(m => m + 1);
      }
    };

    // Generate days for 6-week grid (starting from Monday)
    const calendarDays = useMemo(() => {
      const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
      const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);

      // In JS, getDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
      // For Monday start: (day + 6) % 7 gives 0 for Monday, 6 for Sunday
      const startingDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
      const totalDaysInMonth = lastDayOfMonth.getDate();

      const days: {
        date: Date;
        isCurrentMonth: boolean;
        isToday: boolean;
        isSelected: boolean;
        isDisabled: boolean;
        key: string;
      }[] = [];

      // Days from previous month to fill the first row
      const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
      for (let i = startingDayIndex - 1; i >= 0; i--) {
        const d = new Date(viewYear, viewMonth - 1, prevMonthLastDay - i);
        const ymd = formatYMD(d);
        const isDisabled = Boolean((min && ymd < min) || (max && ymd > max));
        days.push({
          date: d,
          isCurrentMonth: false,
          isToday: formatYMD(d) === formatYMD(today),
          isSelected: formatYMD(d) === currentVal,
          isDisabled,
          key: `prev-${prevMonthLastDay - i}`,
        });
      }

      // Current month days
      for (let day = 1; day <= totalDaysInMonth; day++) {
        const d = new Date(viewYear, viewMonth, day);
        const ymd = formatYMD(d);
        const isDisabled = Boolean((min && ymd < min) || (max && ymd > max));
        days.push({
          date: d,
          isCurrentMonth: true,
          isToday: formatYMD(d) === formatYMD(today),
          isSelected: ymd === currentVal,
          isDisabled,
          key: `curr-${day}`,
        });
      }

      // Days from next month to complete standard grid (up to 42 cells or remaining of week)
      const remaining = (7 - (days.length % 7)) % 7;
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(viewYear, viewMonth + 1, i);
        const ymd = formatYMD(d);
        const isDisabled = Boolean((min && ymd < min) || (max && ymd > max));
        days.push({
          date: d,
          isCurrentMonth: false,
          isToday: formatYMD(d) === formatYMD(today),
          isSelected: formatYMD(d) === currentVal,
          isDisabled,
          key: `next-${i}`,
        });
      }

      return days;
    }, [viewYear, viewMonth, currentVal, today, min, max]);

    // Years for quick dropdown select (last 100 years to next 10 years)
    const yearOptions = useMemo(() => {
      const current = today.getFullYear();
      const years: number[] = [];
      for (let y = current - 80; y <= current + 10; y++) {
        years.push(y);
      }
      return years;
    }, [today]);

    const currentSize = sizeStyles[size];

    return (
      <div className={cn('relative w-full', className)} ref={containerRef}>
        {label && (
          <label htmlFor={datePickerId} className="block text-sm font-medium text-charcoal-700 mb-1.5">
            {label}
            {required && <span className="text-danger-main ml-1" aria-hidden>*</span>}
          </label>
        )}

        {/* Custom styled trigger container */}
        <div
          className={cn(
            'w-full bg-white border text-left',
            'flex items-center justify-between gap-1 transition-all duration-150',
            'hover:border-warm-400 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100/80',
            isOpen ? 'border-brand-500 ring-2 ring-brand-100/80 shadow-sm' : 'shadow-none',
            error ? 'border-danger-main focus-within:border-danger-main focus-within:ring-danger-light' : 'border-warm-300',
            disabled && 'opacity-60 cursor-not-allowed bg-warm-50/50 hover:border-warm-300',
            currentSize.trigger,
            triggerClassName
          )}
        >
          <button
            ref={triggerRef}
            id={datePickerId}
            type="button"
            data-testid="datepicker-trigger"
            aria-expanded={isOpen}
            aria-haspopup="dialog"
            aria-invalid={!!error}
            disabled={disabled}
            onClick={handleToggle}
            className="flex items-center gap-2 min-w-0 flex-1 text-left bg-transparent border-0 outline-none cursor-pointer p-0"
          >
            <CalendarIcon
              className={cn(
                'text-charcoal-400 flex-shrink-0',
                currentSize.icon,
                currentVal && 'text-brand-600'
              )}
              aria-hidden
            />
            <span
              className={cn(
                'truncate',
                currentVal ? 'text-charcoal-900 font-medium' : 'text-charcoal-400 font-normal'
              )}
            >
              {currentVal ? formatDisplay(currentVal) : placeholder}
            </span>
          </button>

          {/* Clear button if has value and clearable */}
          {clearable && currentVal && !disabled && (
            <button
              type="button"
              data-testid="datepicker-clear"
              onClick={handleClear}
              title="Tozalash"
              aria-label="Sanani tozalash"
              className="p-1 rounded-full text-charcoal-400 hover:text-charcoal-700 hover:bg-warm-100 transition-colors flex-shrink-0 outline-none cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Calendar Popup */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              role="dialog"
              aria-label="Kalendar"
              initial={{ opacity: 0, y: openUpward ? 4 : -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: openUpward ? 4 : -4, scale: 0.98 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={cn(
                'absolute z-50 bg-white rounded-[16px] w-[280px] sm:w-[300px]',
                'shadow-[0_12px_36px_-6px_rgba(0,0,0,0.14),0_4px_12px_-2px_rgba(0,0,0,0.06)]',
                'border border-warm-200/90 p-3.5 select-none',
                alignRight ? 'right-0' : 'left-0',
                openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
                popupClassName
              )}
            >
              {/* Header: Month/Year navigation */}
              <div className="relative flex items-center justify-between gap-1 pb-3 mb-2 border-b border-warm-100">
                <div className="flex items-center gap-1.5">
                  {/* Custom Month selector button */}
                  <button
                    ref={monthTriggerRef}
                    type="button"
                    data-testid="datepicker-month-trigger"
                    aria-label="Oyni tanlash"
                    aria-expanded={isMonthPickerOpen}
                    onClick={() => {
                      setIsMonthPickerOpen(prev => !prev);
                      setIsYearPickerOpen(false);
                    }}
                    className={cn(
                      'text-xs font-bold rounded-lg py-1 px-2 transition-all flex items-center gap-1 cursor-pointer outline-none border',
                      isMonthPickerOpen
                        ? 'bg-brand-50 border-brand-300 text-brand-700 shadow-xs'
                        : 'bg-warm-50/70 border-warm-200/80 text-charcoal-800 hover:bg-warm-100 hover:border-warm-300'
                    )}
                  >
                    <span>{MONTH_NAMES[viewMonth]}</span>
                    <ChevronDown
                      className={cn(
                        'w-3 h-3 text-charcoal-400 transition-transform duration-150',
                        isMonthPickerOpen && 'rotate-180 text-brand-600'
                      )}
                      aria-hidden
                    />
                  </button>

                  {/* Custom Year selector button */}
                  <button
                    ref={yearTriggerRef}
                    type="button"
                    data-testid="datepicker-year-trigger"
                    aria-label="Yilni tanlash"
                    aria-expanded={isYearPickerOpen}
                    onClick={() => {
                      setIsYearPickerOpen(prev => !prev);
                      setIsMonthPickerOpen(false);
                    }}
                    className={cn(
                      'text-xs font-bold rounded-lg py-1 px-2 transition-all flex items-center gap-1 cursor-pointer outline-none border',
                      isYearPickerOpen
                        ? 'bg-brand-50 border-brand-300 text-brand-700 shadow-xs'
                        : 'bg-warm-50/70 border-warm-200/80 text-charcoal-800 hover:bg-warm-100 hover:border-warm-300'
                    )}
                  >
                    <span>{viewYear}</span>
                    <ChevronDown
                      className={cn(
                        'w-3 h-3 text-charcoal-400 transition-transform duration-150',
                        isYearPickerOpen && 'rotate-180 text-brand-600'
                      )}
                      aria-hidden
                    />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={prevMonth}
                    title="Oldingi oy"
                    aria-label="Oldingi oy"
                    className="p-1.5 rounded-lg text-charcoal-500 hover:text-charcoal-900 hover:bg-warm-100 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextMonth}
                    title="Keyingi oy"
                    aria-label="Keyingi oy"
                    className="p-1.5 rounded-lg text-charcoal-500 hover:text-charcoal-900 hover:bg-warm-100 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Animated Custom Month Dropdown Menu */}
                <AnimatePresence>
                  {isMonthPickerOpen && (
                    <motion.div
                      ref={monthDropdownRef}
                      role="listbox"
                      aria-label="Oylar ro'yxati"
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      transition={{ duration: 0.12 }}
                      className="absolute z-30 left-0 top-full mt-1 w-48 bg-white rounded-[14px] border border-warm-200/90 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.15)] p-1.5 grid grid-cols-2 gap-1"
                    >
                      {MONTH_NAMES.map((name, idx) => {
                        const isSelected = viewMonth === idx;
                        return (
                          <button
                            key={name}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              setViewMonth(idx);
                              setIsMonthPickerOpen(false);
                            }}
                            className={cn(
                              'text-xs font-medium py-1.5 px-2 rounded-lg text-left transition-colors cursor-pointer outline-none',
                              isSelected
                                ? 'bg-brand-500 text-white font-bold shadow-xs hover:bg-brand-600'
                                : 'text-charcoal-700 hover:bg-warm-100 hover:text-charcoal-900'
                            )}
                          >
                            {name}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Animated Custom Year Dropdown Menu */}
                <AnimatePresence>
                  {isYearPickerOpen && (
                    <motion.div
                      ref={yearDropdownRef}
                      role="listbox"
                      aria-label="Yillar ro'yxati"
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      transition={{ duration: 0.12 }}
                      className="absolute z-30 right-0 top-full mt-1 w-52 bg-white rounded-[14px] border border-warm-200/90 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.15)] p-2 max-h-52 overflow-y-auto grid grid-cols-3 gap-1 [scrollbar-width:thin] [scrollbar-color:#d4cfc7_transparent]"
                    >
                      {yearOptions.map(y => {
                        const isSelected = viewYear === y;
                        return (
                          <button
                            key={y}
                            ref={isSelected ? selectedYearRef : undefined}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              setViewYear(y);
                              setIsYearPickerOpen(false);
                            }}
                            className={cn(
                              'text-xs font-medium py-1.5 px-1 rounded-lg text-center transition-colors cursor-pointer outline-none',
                              isSelected
                                ? 'bg-brand-500 text-white font-bold shadow-xs hover:bg-brand-600'
                                : 'text-charcoal-700 hover:bg-warm-100 hover:text-charcoal-900'
                            )}
                          >
                            {y}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Day-of-week headers */}
              <div className="grid grid-cols-7 mb-1.5 text-center">
                {WEEKDAY_NAMES.map((w, idx) => (
                  <div
                    key={w}
                    className={cn(
                      'text-[11px] font-semibold py-1',
                      idx >= 5 ? 'text-charcoal-400' : 'text-charcoal-500'
                    )}
                  >
                    {w}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-y-1 justify-items-center">
                {calendarDays.map(item => (
                  <button
                    key={item.key}
                    type="button"
                    disabled={item.isDisabled}
                    onClick={() => handleSelectDate(item.date)}
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all outline-none',
                      item.isSelected
                        ? 'bg-brand-500 text-white font-bold shadow-xs hover:bg-brand-600'
                        : item.isToday
                          ? 'border border-brand-500 text-brand-700 font-bold hover:bg-brand-50'
                          : item.isCurrentMonth
                            ? 'text-charcoal-800 hover:bg-warm-100 font-medium'
                            : 'text-charcoal-300 hover:bg-warm-50',
                      item.isDisabled && 'opacity-25 cursor-not-allowed pointer-events-none'
                    )}
                  >
                    {item.date.getDate()}
                  </button>
                ))}
              </div>

              {/* Footer actions: Today & Clear */}
              <div className="mt-3 pt-2.5 border-t border-warm-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleSelectToday}
                  className="flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700 px-2 py-1 rounded-lg hover:bg-brand-50 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> Bugun
                </button>
                {clearable && currentVal && (
                  <button
                    type="button"
                    onClick={() => handleClear()}
                    className="font-medium text-danger-main hover:text-danger-dark px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Tozalash
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden native input for forms, react-hook-form, FormData */}
        <input
          ref={hiddenInputRef}
          type="hidden"
          id={datePickerId}
          name={name}
          value={currentVal}
          required={required}
          disabled={disabled}
          {...props}
        />

        {error && <p className="mt-1 text-xs text-danger-main">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-charcoal-400">{hint}</p>}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
