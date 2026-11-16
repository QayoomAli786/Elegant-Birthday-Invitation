import { useCallback, useEffect, useMemo, useRef } from "react";

/** setTimeout helper that automatically clears pending timers on unmount. */
export function useTimers() {
  const ids = useRef<number[]>([]);

  useEffect(() => {
    const list = ids;
    return () => {
      list.current.forEach((id) => clearTimeout(id));
      list.current = [];
    };
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    ids.current.push(id);
    return id;
  }, []);

  const clearAll = useCallback(() => {
    ids.current.forEach((id) => clearTimeout(id));
    ids.current = [];
  }, []);

  return useMemo(() => ({ later, clearAll }), [later, clearAll]);
}
