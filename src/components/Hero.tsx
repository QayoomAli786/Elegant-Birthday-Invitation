import { Cake, Gift, Sparkles } from "lucide-react";
import { AnimatedTitle } from "@/components/AnimatedTitle";
import { Bunting } from "@/components/Bunting";
import { FloatingBalloons } from "@/components/FloatingBalloons";
import { useCountUp } from "@/hooks/useCountUp";
import type { BirthdayConfig } from "@/lib/config";
import { cn } from "@/utils/cn";

export function Hero({ config }: { config: BirthdayConfig }) {
  const age = useCountUp(config.age ?? 0, { duration: 2000, delay: 1700 });
  const len = config.name.length;
  const nameSize =
    len > 16
      ? "text-[clamp(2.4rem,8vw,5.5rem)]"
      : len > 9
        ? "text-[clamp(3rem,10vw,7rem)]"
        : "text-[clamp(3.6rem,13vw,8.8rem)]";

  return (
    <section
      id="home"
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5 pb-28 pt-32 text-center sm:pt-40"
    >
      <Bunting />
      <FloatingBalloons />

      <div className="relative z-10 flex flex-col items-center">
        <p
          className="fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-party-gold backdrop-blur sm:text-xs"
          style={{ animationDelay: "0.1s" }}
        >
          <Sparkles size={14} /> It&apos;s your special day <Sparkles size={14} />
        </p>

        <AnimatedTitle key={config.headline} text={config.headline} delay={0.25} />

        <h2
          className={cn(
            "name-in text-shimmer mt-1 max-w-[95vw] break-words px-4 pb-3 font-script font-bold leading-[1.15] drop-shadow-[0_0_30px_rgba(255,140,198,.35)]",
            nameSize,
          )}
          style={{ animationDelay: "1.15s" }}
        >
          {config.name}
        </h2>

        {config.age && (
          <div
            className="pop-in mt-3 inline-flex items-center gap-2 rounded-full border border-party-gold/30 bg-party-gold/10 px-5 py-2 text-base font-semibold text-white sm:text-lg"
            style={{ animationDelay: "1.6s" }}
          >
            <span className="text-xl">🎉</span>
            Turning
            <span className="min-w-[2ch] text-2xl font-bold tabular-nums text-party-gold sm:text-3xl">
              {Math.round(age)}
            </span>
            today
          </div>
        )}

        <p
          className="fade-up mt-6 max-w-xl text-lg leading-relaxed text-white/75 sm:text-xl"
          style={{ animationDelay: "1.9s" }}
        >
          Wishing you a day as bright, sweet and magical as you are. Grab a slice of cake — the party starts now!
        </p>

        <div
          className="fade-up mt-9 flex flex-wrap items-center justify-center gap-3 sm:gap-4"
          style={{ animationDelay: "2.2s" }}
        >
          <a href="#wish" className="btn-party">
            <Cake size={20} /> Make a wish
          </a>
          <a href="#gift" className="btn-ghost">
            <Gift size={20} /> Open your gift
          </a>
        </div>
      </div>

      <a
        href="#wish"
        aria-label="Scroll to the next surprise"
        className="fade-up absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs uppercase tracking-[0.25em] text-white/50 transition hover:text-white/80 sm:flex"
        style={{ animationDelay: "3s" }}
      >
        <span className="flex h-9 w-6 justify-center rounded-full border-2 border-white/40 pt-1.5">
          <span className="scroll-dot block h-2 w-1 rounded-full bg-white/80" />
        </span>
        More surprises
      </a>
    </section>
  );
}
