import { useEffect, useRef } from "react";
import { celebration } from "@/lib/celebration";

/** Fixed, click-through canvas on top of everything for confetti & fireworks. */
export function CelebrationCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    celebration.attach(el);
    return () => celebration.detach();
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] h-full w-full" />;
}
