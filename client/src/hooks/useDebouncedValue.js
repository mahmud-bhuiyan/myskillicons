import { useState, useEffect } from 'react';

/**
 * Debounces a changing value. Default delay matches Gallery/Playground search (400ms).
 */
export const useDebouncedValue = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};
