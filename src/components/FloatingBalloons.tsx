import { useState, type CSSProperties } from "react";
import { BalloonSvg } from "@/components/BalloonSvg";
import { useTimers } from "@/hooks/useTimers";
import { sfx } from "@/lib/audio";
import { celebration } from "@/lib/celebration";
import { BALLOON_COLORS, type BalloonColor } from "@/lib/config";
import { cn } from "@/utils/cn";

interface FloatingBalloon {
  key: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  sway: number;
  color: BalloonColor;
  popping: boolean;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
let uid = 0;

function makeBalloon(initialIndex?: number): FloatingBalloon {
  return {
    key: uid++,
    left: rand(-2, 94),
    size: rand(54, 92),
    duration: rand(11, 19),
    delay: initialIndex !== undefined ? initialIndex * 0.9 + rand(0, 0.8) : rand(0.3, 2.5),
    drift: rand(-90, 90),
    sway: rand(2.8, 4.6),
    color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
    popping: false,
  };
}

/** Balloons that keep rising through the hero — tap one to pop it! */
export function FloatingBalloons({ count = 11 }: { count?: number }) {
  const [items, setItems] = useState<FloatingBalloon[]>(() => Array.from({ length: count }, (_, i) => makeBalloon(i)));
  const { later } = useTimers();

  const pop = (balloon: FloatingBalloon, el: HTMLElement) => {
    if (balloon.popping) return;
    const r = el.getBoundingClientRect();
    celebration.confetti({
      x: r.left + r.width / 2,
      y: r.top + r.height * 0.32,
      count: 36,
      spread: 360,
      velocity: 620,
      colors: [balloon.color.base, balloon.color.light, "#ffffff"],
      scalar: 0.8,
    });
    sfx.pop();
    setItems((list) => list.map((b) => (b.key === balloon.key ? { ...b, popping: true } : b)));
    later(() => setItems((list) => list.map((b) => (b.key === balloon.key ? makeBalloon() : b))), 260);
  };

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {items.map((b) => (
        <div
          key={b.key}
          className="rise"
          style={
            {
              left: `${b.left}%`,
              width: b.size,
              animationDuration: `${b.duration}s`,
              animationDelay: `${b.delay}s`,
              "--drift": `${b.drift}px`,
            } as CSSProperties
          }
        >
          <div className="sway" style={{ animationDuration: `${b.sway}s` }}>
            <div
              className={cn("pointer-events-auto cursor-pointer opacity-90", b.popping && "balloon-popping")}
              onPointerDown={(e) => pop(b, e.currentTarget)}
            >
              <BalloonSvg color={b.color} className="w-full drop-shadow-[0_10px_18px_rgba(0,0,0,.35)]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
