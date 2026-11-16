import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Mic, MicOff, RotateCcw, Slice, Wind } from "lucide-react";
import { Cake, buildCandles, type CutState } from "@/components/Cake";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { useBlowDetector } from "@/hooks/useBlowDetector";
import { useTimers } from "@/hooks/useTimers";
import { sfx } from "@/lib/audio";
import { celebration } from "@/lib/celebration";
import type { BirthdayConfig } from "@/lib/config";
import { cn } from "@/utils/cn";

export function CakeSection({ config }: { config: BirthdayConfig }) {
  const candles = useMemo(() => buildCandles(config.age), [config.age]);
  const [lit, setLit] = useState<boolean[]>(() => candles.map(() => true));
  const litRef = useRef(lit);
  const [wished, setWished] = useState(false);
  const [cut, setCut] = useState<CutState>("none");
  const cakeRef = useRef<HTMLDivElement>(null);
  const meterRef = useRef<HTMLDivElement>(null);
  const stopMicRef = useRef<() => void>(() => undefined);
  const { later } = useTimers();

  const litCount = lit.filter(Boolean).length;

  const celebrateWish = useCallback(() => {
    stopMicRef.current();
    later(() => {
      setWished(true);
      celebration.cannons();
      sfx.tada();
    }, 450);
    [800, 1200, 1650, 2100].forEach((ms) =>
      later(() => {
        const r = cakeRef.current?.getBoundingClientRect();
        if (!r) return celebration.firework();
        celebration.firework(r.left + r.width * (0.15 + Math.random() * 0.7), Math.max(60, r.top - 20 - Math.random() * 160));
      }, ms),
    );
  }, [later]);

  const blowOut = useCallback(
    (index: number) => {
      if (!litRef.current[index]) return;
      const next = litRef.current.map((v, i) => (i === index ? false : v));
      litRef.current = next;
      setLit(next);
      sfx.blow();
      if (next.every((v) => !v)) celebrateWish();
    },
    [celebrateWish],
  );

  const blowRandom = useCallback(() => {
    const on = litRef.current.flatMap((v, i) => (v ? [i] : []));
    if (on.length) blowOut(on[Math.floor(Math.random() * on.length)]);
  }, [blowOut]);

  const mic = useBlowDetector({ onBlow: blowRandom, meterRef });

  useEffect(() => {
    stopMicRef.current = mic.stop;
  }, [mic.stop]);

  const blowAll = () => {
    sfx.whoosh();
    const on = litRef.current.flatMap((v, i) => (v ? [i] : [])).sort(() => Math.random() - 0.5);
    on.forEach((i, k) => later(() => blowOut(i), 150 + k * 170));
  };

  const cutCake = () => {
    if (cut !== "none") return;
    setCut("cutting");
    sfx.whoosh();
    later(() => sfx.squish(), 560);
    later(() => {
      setCut("cut");
      const r = cakeRef.current?.getBoundingClientRect();
      if (r) celebration.confetti({ x: r.left + r.width / 2, y: r.top + r.height * 0.35, count: 70, spread: 140, velocity: 950 });
      sfx.chime();
    }, 1750);
  };

  const relight = () => {
    const next = candles.map(() => true);
    litRef.current = next;
    setLit(next);
    setWished(false);
    setCut("none");
    sfx.chime();
  };

  return (
    <section id="wish" className="relative px-5 py-24 sm:py-32">
      <Reveal>
        <SectionHeading
          eyebrow="Make a wish"
          title={
            <>
              Close your eyes &amp; <span className="text-shimmer">make a wish</span>
            </>
          }
          subtitle="Then blow out the candles! Tap each flame, press the button — or use your microphone and really blow. 🌬️"
        />
      </Reveal>

      <Reveal delay={150} className="relative mx-auto mt-10 w-full max-w-[440px] sm:mt-14">
        <div className="cake-glow" style={{ opacity: 0.2 + 0.8 * (litCount / Math.max(1, candles.length)) }} />
        <div ref={cakeRef} className="float-slow relative">
          <Cake candles={candles} lit={lit} name={config.name} cut={cut} onBlow={blowOut} />
        </div>
      </Reveal>

      <div className="mx-auto mt-10 flex max-w-xl flex-col items-center gap-5 text-center">
        {!wished ? (
          <>
            <p className="text-white/70">
              <span className="text-lg font-semibold text-party-gold">{litCount}</span> of {candles.length} candles
              still burning
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button type="button" className="btn-party" onClick={blowAll} disabled={litCount === 0}>
                <Wind size={20} /> Blow out the candles
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={mic.listening ? mic.stop : mic.start}
                disabled={mic.requesting || litCount === 0}
              >
                {mic.requesting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> Asking for mic…
                  </>
                ) : mic.listening ? (
                  <>
                    <MicOff size={20} /> Stop listening
                  </>
                ) : (
                  <>
                    <Mic size={20} /> Blow into your mic
                  </>
                )}
              </button>
            </div>
            <div
              className={cn(
                "flex w-full max-w-xs items-center gap-3 text-sm text-white/75 transition-all duration-300",
                mic.listening ? "opacity-100" : "pointer-events-none h-0 opacity-0",
              )}
              aria-live="polite"
            >
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-party-pink opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-party-pink" />
              </span>
              {mic.listening ? "Listening… blow!" : ""}
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  ref={meterRef}
                  className="h-full origin-left rounded-full bg-gradient-to-r from-party-mint via-party-gold to-party-pink"
                  style={{ transform: "scaleX(0)" }}
                />
              </div>
            </div>
            {mic.error && <p className="text-sm text-party-rose">{mic.error}</p>}
          </>
        ) : (
          <div className="pop-in">
            <p className="text-3xl font-bold sm:text-4xl">
              {cut === "cut" ? "🍰 Enjoy your slice!" : "🎉 Yay! Your wish is on its way ✨"}
            </p>
            <p className="mt-3 text-white/70">
              {cut === "cut"
                ? "Calories don't count on birthdays — that's the rule."
                : "We won't tell anyone what it was. Pinky promise. Now… cake time?"}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {cut !== "cut" && (
                <button type="button" className="btn-party" onClick={cutCake} disabled={cut === "cutting"}>
                  <Slice size={20} /> {cut === "cutting" ? "Cutting…" : "Cut the cake"}
                </button>
              )}
              <button type="button" className="btn-ghost" onClick={relight}>
                <RotateCcw size={18} /> {cut === "cut" ? "Bake a fresh one" : "Relight & wish again"}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
