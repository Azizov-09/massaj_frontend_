// ═══════════════════════════════════════════════════════
//  Select — Custom Accessible Animated Dropdown
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
import { ChevronDown, Check, Search } from 'lucide-react';
import { cn } from '@/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value' | 'defaultValue' | 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  options?: (SelectOption | { value: string | number; label: string; disabled?: boolean })[];
  placeholder?: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  searchable?: boolean;
  align?: 'left' | 'right' | 'auto';
}

const sizeStyles = {
  sm: {
    trigger: 'h-9 px-3 text-xs rounded-xl',
    option: 'px-3 py-2 text-xs rounded-lg',
    icon: 'w-4 h-4',
    check: 'w-3.5 h-3.5',
  },
  md: {
    trigger: 'h-10 px-3.5 text-xs sm:text-sm rounded-xl',
    option: 'px-3 py-2 text-xs sm:text-sm rounded-xl',
    icon: 'w-4 h-4',
    check: 'w-4 h-4',
  },
  lg: {
    trigger: 'h-11 px-4 text-sm sm:text-base rounded-xl',
    option: 'px-3.5 py-2.5 text-sm rounded-xl',
    icon: 'w-4.5 h-4.5',
    check: 'w-4 h-4',
  },
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      triggerClassName,
      menuClassName,
      label,
      error,
      hint,
      options,
      placeholder,
      id,
      name,
      required,
      disabled,
      value,
      defaultValue,
      onChange,
      onValueChange,
      children,
      size = 'md',
      searchable,
      align = 'auto',
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-') ?? generatedId;
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const hiddenSelectRef = useRef<HTMLSelectElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Forward ref to hidden select for react-hook-form
    useImperativeHandle(ref, () => hiddenSelectRef.current!);

    const [isOpen, setIsOpen] = useState(false);
    const [openUpward, setOpenUpward] = useState(false);
    const [alignRight, setAlignRight] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const isControlled = value !== undefined;
    const [internalVal, setInternalVal] = useState<string>(
      value !== undefined ? String(value) : defaultValue !== undefined ? String(defaultValue) : ''
    );

    const currentVal = isControlled ? String(value) : internalVal;

    // Parse options from either `options` prop or `children` (<option> tags)
    const parsedOptions: SelectOption[] = useMemo(() => {
      if (options && options.length > 0) {
        return options.map(opt => ({
          value: String(opt.value),
          label: opt.label,
          disabled: opt.disabled,
        }));
      }
      if (children) {
        const list: SelectOption[] = [];
        React.Children.forEach(children, child => {
          if (!React.isValidElement(child)) return;
          if (child.type === 'option') {
            const p = child.props as any;
            const val = p.value !== undefined ? String(p.value) : String(p.children ?? '');
            const lbl =
              typeof p.children === 'string'
                ? p.children
                : Array.isArray(p.children)
                  ? p.children.join('')
                  : String(p.children ?? p.value ?? '');
            list.push({
              value: val,
              label: lbl,
              disabled: Boolean(p.disabled),
            });
          }
        });
        return list;
      }
      return [];
    }, [options, children]);

    // Include placeholder if provided and not already in options
    const allOptions = useMemo(() => {
      const list = [...parsedOptions];
      if (placeholder) {
        const hasEmpty = list.some(o => o.value === '');
        if (!hasEmpty) {
          list.unshift({ value: '', label: placeholder });
        }
      }
      return list;
    }, [parsedOptions, placeholder]);

    // Search filter
    const shouldShowSearch = searchable !== undefined ? searchable : allOptions.length >= 10;
    const filteredOptions = useMemo(() => {
      if (!searchQuery.trim()) return allOptions;
      const q = searchQuery.toLowerCase();
      return allOptions.filter(o => o.label.toLowerCase().includes(q));
    }, [allOptions, searchQuery]);

    // Selected option metadata
    const selectedOption = allOptions.find(o => o.value === currentVal);
    let displayLabel = '';
    let isPlaceholderActive = false;

    if (selectedOption) {
      displayLabel = selectedOption.label;
      if (selectedOption.value === '' && placeholder && selectedOption.label === placeholder) {
        isPlaceholderActive = true;
      }
    } else if (placeholder) {
      displayLabel = placeholder;
      isPlaceholderActive = true;
    } else if (allOptions.length > 0 && currentVal === '') {
      displayLabel = allOptions[0].label;
    } else {
      displayLabel = currentVal || '';
    }

    // Toggle dropdown open/close with viewport boundary calculation
    const handleToggle = () => {
      if (disabled) return;
      if (!isOpen && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const modal = containerRef.current.closest('[role="dialog"]') as HTMLElement | null;
        const modalRect = modal?.getBoundingClientRect();

        const bottomLimit = modalRect ? modalRect.bottom : window.innerHeight;
        const topLimit = modalRect ? modalRect.top : 0;
        const spaceBelow = bottomLimit - rect.bottom;
        const spaceAbove = rect.top - topLimit;
        const estimatedHeight = Math.min(allOptions.length * 36 + 40, 260);

        setOpenUpward(spaceBelow < estimatedHeight && spaceAbove > spaceBelow);

        if (align === 'right') {
          setAlignRight(true);
        } else if (align === 'left') {
          setAlignRight(false);
        } else {
          const spaceRight = window.innerWidth - rect.left;
          setAlignRight(spaceRight < 240 && rect.right > 240);
        }
      }
      setIsOpen(prev => {
        const next = !prev;
        if (next) {
          setSearchQuery('');
          const idx = filteredOptions.findIndex(o => o.value === currentVal);
          setHighlightedIndex(idx >= 0 ? idx : 0);
        }
        return next;
      });
    };

    // Auto-focus search input when opened
    useEffect(() => {
      if (isOpen && shouldShowSearch && searchInputRef.current) {
        const timer = setTimeout(() => searchInputRef.current?.focus(), 50);
        return () => clearTimeout(timer);
      }
    }, [isOpen, shouldShowSearch]);

    // Outside click & Escape listener
    useEffect(() => {
      if (!isOpen) return;
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
          setSearchQuery('');
        }
      };
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsOpen(false);
          setSearchQuery('');
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

    // Selection handler
    const handleSelect = (val: string) => {
      if (!isControlled) {
        setInternalVal(val);
      }
      setIsOpen(false);
      setSearchQuery('');
      triggerRef.current?.focus();

        // Sync value to hidden select element
        if (hiddenSelectRef.current) {
          const prototype = window.HTMLSelectElement.prototype;
          const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
          if (descriptor?.set) {
            descriptor.set.call(hiddenSelectRef.current, val);
          } else {
            hiddenSelectRef.current.value = val;
          }
        }

      if (onValueChange) {
        onValueChange(val);
      }

      // Fire onChange callback
      if (onChange) {
        const syntheticEvent = {
          target: { value: val, name: name || '' },
          currentTarget: { value: val, name: name || '' },
          preventDefault: () => {},
          stopPropagation: () => {},
          persist: () => {},
        } as unknown as React.ChangeEvent<HTMLSelectElement>;

        onChange(syntheticEvent);
      }
    };

    // Keyboard navigation
    const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!isOpen) {
          handleToggle();
          return;
        }
        const delta = e.key === 'ArrowDown' ? 1 : -1;
        setHighlightedIndex(prev => {
          const next = prev + delta;
          if (next < 0) return filteredOptions.length - 1;
          if (next >= filteredOptions.length) return 0;
          return next;
        });
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (isOpen) {
          const opt = filteredOptions[highlightedIndex];
          if (opt && !opt.disabled) {
            handleSelect(opt.value);
          }
        } else {
          handleToggle();
        }
      } else if (e.key === 'Tab') {
        if (isOpen) {
          setIsOpen(false);
          setSearchQuery('');
        }
      }
    };

    const currentSize = sizeStyles[size];

    return (
      <div className={cn('relative w-full', className)} ref={containerRef}>
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-charcoal-700 mb-1.5">
            {label}
            {required && <span className="text-danger-main ml-1" aria-hidden>*</span>}
          </label>
        )}

        {/* Custom styled trigger button */}
        <button
          ref={triggerRef}
          id={selectId}
          type="button"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={`${selectId}-listbox`}
          aria-label={props['aria-label'] || label || placeholder || 'Tanlang'}
          aria-invalid={!!error}
          disabled={disabled}
          onClick={handleToggle}
          onKeyDown={handleTriggerKeyDown}
          className={cn(
            'w-full bg-white border text-left',
            'flex items-center justify-between gap-2.5 transition-all duration-150 outline-none cursor-pointer select-none',
            'border-warm-200/90 shadow-2xs hover:border-warm-300 hover:bg-warm-50/30',
            'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15',
            isOpen ? 'border-brand-500 ring-2 ring-brand-500/15 shadow-sm bg-white' : '',
            error ? 'border-danger-main focus:border-danger-main focus:ring-danger-light' : '',
            disabled && 'opacity-60 cursor-not-allowed bg-warm-50/50 hover:border-warm-200',
            currentSize.trigger,
            triggerClassName
          )}
        >
          <span
            className={cn(
              'truncate flex-1',
              isPlaceholderActive ? 'text-charcoal-400 font-normal' : 'text-charcoal-900 font-medium'
            )}
          >
            {displayLabel}
          </span>
          <ChevronDown
            className={cn(
              'text-charcoal-400 flex-shrink-0 transition-transform duration-200',
              currentSize.icon,
              isOpen && 'rotate-180 text-brand-600'
            )}
            aria-hidden
          />
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              id={`${selectId}-listbox`}
              role="listbox"
              initial={{ opacity: 0, y: openUpward ? 4 : -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: openUpward ? 4 : -4, scale: 0.98 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={cn(
                'absolute z-50 min-w-full w-full sm:w-max max-w-[calc(100vw-2rem)] bg-white/98 backdrop-blur-md rounded-2xl',
                'shadow-[0_16px_40px_-6px_rgba(24,24,27,0.14),0_6px_16px_-4px_rgba(24,24,27,0.06)]',
                'border border-warm-200/90 p-1.5 overflow-hidden',
                alignRight ? 'right-0' : 'left-0',
                openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
                menuClassName
              )}
            >
              {/* Optional search input */}
              {shouldShowSearch && (
                <div className="p-1 pb-1.5 mb-1 border-b border-warm-100">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-charcoal-400 pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={e => {
                        setSearchQuery(e.target.value);
                        setHighlightedIndex(0);
                      }}
                      placeholder="Qidirish..."
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-warm-50/70 border border-warm-200/80 rounded-lg outline-none focus:border-brand-500 focus:bg-white focus:ring-1 focus:ring-brand-200 text-charcoal-900 placeholder:text-charcoal-400 transition-all"
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                </div>
              )}

              {/* Options list */}
              <div className="max-h-60 overflow-y-auto overscroll-contain space-y-0.5 scrollbar-thin">
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-charcoal-400 select-none">
                    Hech narsa topilmadi
                  </div>
                ) : (
                  filteredOptions.map((opt, idx) => {
                    const isSelected = opt.value === currentVal;
                    const isHighlighted = idx === highlightedIndex;

                    return (
                      <div
                        key={opt.value + idx}
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={opt.disabled}
                        onClick={() => {
                          if (!opt.disabled) handleSelect(opt.value);
                        }}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={cn(
                          'w-full flex items-center justify-between text-left transition-all duration-100 cursor-pointer select-none',
                          currentSize.option,
                          isSelected
                            ? 'bg-brand-50 text-brand-700 font-semibold shadow-2xs'
                            : isHighlighted
                              ? 'bg-warm-100/70 text-charcoal-900'
                              : 'text-charcoal-700 hover:bg-warm-50/80 hover:text-charcoal-900',
                          opt.disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {opt.icon && <span className="shrink-0 text-charcoal-500">{opt.icon}</span>}
                          <span className="truncate">{opt.label}</span>
                        </div>
                        {isSelected && (
                          <span className="flex items-center justify-center w-4 h-4 rounded-full bg-brand-100 text-brand-600 shrink-0 ml-2">
                            <Check className="w-3 h-3 stroke-[2.5]" aria-hidden />
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden native select for form submit and React Hook Form registration */}
        <select
          ref={hiddenSelectRef}
          id={`${selectId}-native`}
          name={name}
          value={currentVal}
          onChange={e => {
            if (!isControlled) setInternalVal(e.target.value);
          }}
          required={required}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {allOptions.map((opt, i) => (
            <option key={opt.value + i} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>

        {error && <p className="mt-1 text-xs text-danger-main">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-charcoal-400">{hint}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
