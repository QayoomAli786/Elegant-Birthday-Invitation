import { useId } from "react";
import type { BalloonColor } from "@/lib/config";

interface Props {
  color: BalloonColor;
  className?: string;
}

/** A glossy SVG balloon with a knot and a curly string. */
export function BalloonSvg({ color, className }: Props) {
  const id = `b${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg viewBox="0 0 100 165" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={id} cx="34%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="16%" stopColor={color.light} />
          <stop offset="58%" stopColor={color.base} />
          <stop offset="100%" stopColor={color.dark} />
        </radialGradient>
      </defs>
      <path
        d="M50 121 C 44 130, 57 136, 50 145 S 44 156, 52 165"
        stroke="rgba(255,255,255,.55)"
        strokeWidth="1.3"
        fill="none"
      />
      <path
        d="M50 4 C 22 4, 6 28, 6 55 C 6 85, 30 109, 50 115 C 70 109, 94 85, 94 55 C 94 28, 78 4, 50 4 Z"
        fill={`url(#${id})`}
      />
      <path d="M43.5 122 L56.5 122 L52.5 114 L47.5 114 Z" fill={color.dark} />
      <ellipse cx="31" cy="33" rx="7.5" ry="14" fill="#ffffff" opacity="0.38" transform="rotate(-24 31 33)" />
      <ellipse cx="40" cy="58" rx="2.4" ry="4" fill="#ffffff" opacity="0.25" transform="rotate(-20 40 58)" />
    </svg>
  );
}
