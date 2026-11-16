import { useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { BalloonSvg } from "@/components/BalloonSvg";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { useTimers } from "@/hooks/useTimers";
import { sfx } from "@/lib/audio";
import { celebration } from "@/lib/celebration";
import { BALLOON_COLORS, WISHES } from "@/lib/config";
import { cn } from "@/utils/cn";

/** Pop each balloon to reveal a wish for the year ahead. */
export function BalloonWishes() {
  const [popped, setPopped] = useState<boolean[]>(() => WISHES.map(() => false));
  const poppedRef = useRef(popped);
  const [popping, setPopping] = useState<Set<number>>(() => new Set());
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const { later } = useTimers();

  const found = popped.filter(Boolean).length;
  const allFound = found === WISHES.length;

  const pop = (i: number) => {
    if (poppedRef.current[i] || popping.has(i)) return;
    const color = BALLOON_COLORS[i % BALLOON_COLORS.length];
    const el = buttons.current[i]?.querySelector("svg");
    if (el) {
      const r = el.getBoundingClientRect();
      celebration.confetti({
        x: r.left + r.width / 2,
        y: r.top + r.height * 0.32,
        count: 44,
        spread: 360,
        velocity: 700,
        colors: [color.base, color.light, "#ffffff"],
        scalar: 0.85,
      });
    }
    sfx.pop();
    setPopping((s) => new Set(s).add(i));

    later(() => {
      const next = poppedRef.current.map((v, k) => (k === i ? true : v));
      poppedRef.current = next;
      setPopped(next);
      setPopping((s) => {
        const copy = new Set(s);
        copy.delete(i);
        return copy;
      });
      if (next.every(Boolean)) {
        later(() => {
          celebration.rain(3200);
          sfx.tada();
        }, 500);
      }
    }, 230);
  };

  const refill = () => {
    const fresh = WISHES.map(() => false);
    poppedRef.current = fresh;
    setPopped(fresh);
    sfx.chime();
  };

  return (
    <section id="balloons" className="relative px-5 py-24 sm:py-32">
      <Reveal>
        <SectionHeading
          eyebrow="Pop & discover"
          title={
            <>
              Pop a balloon, <span className="text-shimmer">find a wish</span>
            </>
          }
          subtitle="Eight balloons, eight wishes for the year ahead. Can you pop them all?"
        />
      </Reveal>

      <Reveal delay={100} className="mx-auto mt-9 flex max-w-sm items-center gap-4">
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-party-pink via-party-gold to-party-mint transition-all duration-500"
            style={{ width: `${(found / WISHES.length) * 100}%` }}
          />
        </div>
        <span className="text-sm font-semibold tabular-nums text-white/80">
          {found}/{WISHES.length} wishes
        </span>
      </Reveal>

      <div className="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
        {WISHES.map((wish, i) => {
          const color = BALLOON_COLORS[i % BALLOON_COLORS.length];
          return (
            <Reveal key={i} delay={i * 70} className="relative h-56 sm:h-64">
              {popped[i] ? (
                <div
                  className="wish-reveal glass flex h-full flex-col items-center justify-center rounded-3xl p-4 text-center"
                  style={{ boxShadow: `0 0 0 1px ${color.base}40, 0 24px 50px -24px ${color.base}` }}
                >
                  <span className="text-4xl sm:text-5xl">{wish.emoji}</span>
                  <p className="mt-3 text-sm font-medium leading-snug text-white/90 sm:text-base">{wish.text}</p>
                </div>
              ) : (
                <button
                  type="button"
                  ref={(el) => {
                    buttons.current[i] = el;
                  }}
                  onClick={() => pop(i)}
                  aria-label={`Pop balloon ${i + 1} to reveal a wish`}
                  className={cn(
                    "group flex h-full w-full flex-col items-center justify-start rounded-3xl pt-2 outline-none focus-visible:ring-2 focus-visible:ring-party-gold/70",
                    popping.has(i) && "balloon-popping",
                  )}
                >
                  <span
                    className="bob block w-[92px] sm:w-[112px]"
                    style={{ animationDelay: `${-i * 0.45}s`, animationDuration: `${3.2 + (i % 3) * 0.5}s` }}
                  >
                    <BalloonSvg
                      color={color}
                      className="w-full drop-shadow-[0_14px_22px_rgba(0,0,0,.4)] transition-transform duration-300 group-hover:scale-110 group-active:scale-95"
                    />
                  </span>
                  <span className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35 transition group-hover:text-white/70">
                    Pop me
                  </span>
                </button>
              )}
            </Reveal>
          );
        })}
      </div>

      {allFound && (
        <div className="pop-in mt-12 text-center">
          <p className="text-2xl font-bold sm:text-3xl">💖 All eight wishes unlocked — they&apos;re all yours!</p>
          <button type="button" onClick={refill} className="btn-ghost mt-6">
            <RotateCcw size={18} /> Refill the balloons
          </button>
        </div>
      )}
    </section>
  );
}
