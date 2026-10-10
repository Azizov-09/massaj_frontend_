import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce fast-changing state values (e.g. search input).
 * Ensures API/filtering triggers only after user pauses typing.
 *
 * @param value The value to debounce
 * @param delay Milliseconds to delay before updating (default 350ms, meets 300-500ms criteria)
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay = 350): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
