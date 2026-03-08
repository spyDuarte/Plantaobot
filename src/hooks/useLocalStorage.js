import { useState, useCallback } from 'react';

export function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      return s !== null ? JSON.parse(s) : initial;
    } catch {
      return initial;
    }
  });

  const set = useCallback(
    (v) => {
      setVal((prev) => {
        const next = typeof v === 'function' ? v(prev) : v;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // Ignore storage write errors to keep the app responsive.
        }
        return next;
      });
    },
    [key],
  );

  return [val, set];
}
