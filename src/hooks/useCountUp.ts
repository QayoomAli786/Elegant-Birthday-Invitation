import { useEffect, useState } from "react";

interface Options {
  duration?: number;
  start?: boolean;
  delay?: number;
}

/** Animates a number from 0 to `target` with an ease-out curve. */
export function useCountUp(target: number, { duration = 1800, start = true, delay = 0 }: Options = {}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;
    let raf = 0;
    let t0 = 0;
    const timeout = window.setTimeout(() => {
      const tick = (now: number) => {
        if (!t0) t0 = now;
        const p = Math.min(1, (now - t0) / duration);
        setValue(target * (1 - Math.pow(1 - p, 4)));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [target, duration, start, delay]);

  return value;
}
