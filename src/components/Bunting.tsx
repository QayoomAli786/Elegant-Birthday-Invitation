import { cn } from "@/utils/cn";

const FLAGS = [
  ["#ff4fa0", "#c81d6f"],
  ["#ffcf5a", "#e09a12"],
  ["#4fd8ff", "#1696c9"],
  ["#5ef2c0", "#18a87a"],
  ["#b28cff", "#6f45d9"],
  ["#ff9f45", "#d4650f"],
];

interface Props {
  count?: number;
  /** how far the string sags in the middle (percent of container height) */
  sag?: number;
  className?: string;
}

/** A swaying garland of party flags hanging from a curved string. */
export function Bunting({ count = 17, sag = 46, className }: Props) {
  const flags = Array.from({ length: count }, (_, i) => {
    const t = (i + 0.5) / count;
    return {
      i,
      x: -2 + 104 * t,
      y: 6 + 4 * sag * t * (1 - t),
      colors: FLAGS[i % FLAGS.length],
      dotted: i % 3 === 1,
      delay: -(i * 0.37) % 3,
      duration: 2.6 + (i % 4) * 0.35,
    };
  });

  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-x-0 top-0 z-20 h-24 sm:h-32", className)}>
      <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path
          d={`M -2 6 Q 50 ${6 + 2 * sag} 102 6`}
          fill="none"
          stroke="rgba(255,255,255,.55)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {flags.map((f) => (
        <span
          key={f.i}
          className={cn("flag", f.i % 2 === 1 && "hidden sm:block")}
          style={{
            left: `${f.x}%`,
            top: `${f.y}%`,
            animationDelay: `${f.delay}s`,
            animationDuration: `${f.duration}s`,
          }}
        >
          <span
            className="flag-shape"
            style={{
              background: f.dotted
                ? `radial-gradient(circle, rgba(255,255,255,.55) 0 2px, transparent 2.5px) 0 0 / 9px 9px, linear-gradient(180deg, ${f.colors[0]}, ${f.colors[1]})`
                : `linear-gradient(180deg, ${f.colors[0]} 0%, ${f.colors[0]} 45%, ${f.colors[1]} 100%)`,
            }}
          />
        </span>
      ))}
    </div>
  );
}
