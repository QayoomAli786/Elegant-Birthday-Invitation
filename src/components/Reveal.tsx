import type { CSSProperties, ReactNode } from "react";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/utils/cn";

interface Props {
  children: ReactNode;
  className?: string;
  /** stagger delay in ms */
  delay?: number;
  style?: CSSProperties;
}

/** Fades & slides its children in when they scroll into view. */
export function Reveal({ children, className, delay = 0, style }: Props) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.15 });
  return (
    <div
      ref={ref}
      className={cn("reveal", inView && "is-visible", className)}
      style={{ transitionDelay: `${delay}ms`, ...style }}
    >
      {children}
    </div>
  );
}
