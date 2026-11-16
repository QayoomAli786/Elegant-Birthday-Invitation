import { useMemo } from "react";

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const SPARKLE_COLORS = ["#ffcf5a", "#ff8cc6", "#4fd8ff", "#ffffff"];

/** Night-sky party backdrop: gradient, drifting color orbs, twinkling stars. */
export function Starfield() {
  const stars = useMemo(
    () =>
      Array.from({ length: 110 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() < 0.82 ? rand(1, 2) : rand(2.2, 3.4),
        delay: -Math.random() * 6,
        duration: rand(2.5, 6.5),
      })),
    [],
  );

  const sparkles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        left: rand(2, 98),
        top: rand(2, 96),
        size: rand(10, 22),
        delay: -Math.random() * 6,
        duration: rand(4, 8),
        color: SPARKLE_COLORS[i % SPARKLE_COLORS.length],
      })),
    [],
  );

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(120% 80% at 50% 0%, var(--bg-1) 0%, var(--bg-2) 40%, var(--bg-3) 80%)" }}
      />
      <div
        className="orb"
        style={{
          width: "60vmax",
          height: "60vmax",
          left: "-22vmax",
          top: "-22vmax",
          background: "radial-gradient(closest-side, var(--orb-1), transparent)",
        }}
      />
      <div
        className="orb"
        style={{
          width: "55vmax",
          height: "55vmax",
          right: "-22vmax",
          top: "25%",
          background: "radial-gradient(closest-side, var(--orb-2), transparent)",
          animationDelay: "-8s",
        }}
      />
      <div
        className="orb"
        style={{
          width: "50vmax",
          height: "50vmax",
          left: "20%",
          bottom: "-28vmax",
          background: "radial-gradient(closest-side, var(--orb-3), transparent)",
          animationDelay: "-16s",
        }}
      />
      {stars.map((s) => (
        <span
          key={s.id}
          className="star"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
      {sparkles.map((s) => (
        <svg
          key={s.id}
          viewBox="0 0 24 24"
          className="sparkle-star"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        >
          <path d="M12 0C13 8 16 11 24 12C16 13 13 16 12 24C11 16 8 13 0 12C8 11 11 8 12 0Z" fill={s.color} />
        </svg>
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(5,2,15,.6)_100%)]" />
    </div>
  );
}
