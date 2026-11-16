import { useEffect, useRef, useState } from "react";
import { GiftBox, type GiftState } from "@/components/GiftBox";
import { useTimers } from "@/hooks/useTimers";
import { getAudio, music, sfx } from "@/lib/audio";
import { celebration } from "@/lib/celebration";
import { cn } from "@/utils/cn";

type Phase = "idle" | "shake" | "open" | "leave";

interface Props {
  name: string;
  onReveal: () => void;
  onDone: () => void;
  onCustomize: () => void;
}

/** Full-screen "you've got a surprise" gift that kicks off the party. */
export function Intro({ name, onReveal, onDone, onCustomize }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const boxRef = useRef<HTMLDivElement>(null);
  const { later } = useTimers();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const open = () => {
    if (phase !== "idle") return;
    getAudio(); // unlock audio inside the user gesture
    music.start(0.95);
    sfx.whoosh();
    setPhase("shake");

    later(() => {
      setPhase("open");
      sfx.pop();
      sfx.tada();
      const r = boxRef.current?.getBoundingClientRect();
      if (r) {
        celebration.confetti({
          x: r.left + r.width / 2,
          y: r.top + r.height * 0.35,
          count: 150,
          spread: 110,
          velocity: 1500,
        });
      }
      celebration.cannons();
    }, 650);

    later(() => {
      setPhase("leave");
      onReveal();
    }, 2050);

    later(onDone, 2950);
  };

  const giftState: GiftState = phase === "idle" ? "idle" : phase === "shake" ? "shake" : "open";

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-6 text-center",
        phase === "leave" && "intro-leave pointer-events-none",
      )}
    >
      <div className="absolute inset-0 bg-night-950/35" />

      <div className="relative flex flex-col items-center">
        <p className="fade-up text-xs font-semibold uppercase tracking-[0.35em] text-party-gold sm:text-sm">
          Psst… a surprise awaits
        </p>
        <h1
          className="fade-up text-shimmer mt-3 px-4 pb-3 font-script text-6xl font-bold leading-[1.15] sm:text-7xl md:text-8xl"
          style={{ animationDelay: "0.15s" }}
        >
          for {name}
        </h1>

        <div ref={boxRef} className="fade-up relative mt-8 sm:mt-12" style={{ animationDelay: "0.35s" }}>
          {phase === "idle" && (
            <>
              <span className="ring-pulse pointer-events-none absolute inset-[-14%] rounded-full border-2 border-party-pink/40" />
              <span
                className="ring-pulse pointer-events-none absolute inset-[-14%] rounded-full border-2 border-party-gold/30"
                style={{ animationDelay: "1.2s" }}
              />
            </>
          )}
          {(phase === "open" || phase === "leave") && <div className="rays" />}
          <GiftBox size={170} state={giftState} onClick={open} label={`Open ${name}'s birthday surprise`} />
        </div>

        <p
          className={cn(
            "fade-up mt-10 flex items-center gap-2 text-lg text-white/80 transition-opacity duration-300",
            phase !== "idle" && "opacity-0",
          )}
          style={{ animationDelay: "0.6s" }}
        >
          <span className="hint-bounce inline-block">👆</span> Tap the gift to open it
        </p>
      </div>

      {phase === "idle" && (
        <button
          type="button"
          onClick={onCustomize}
          className="fade-up absolute bottom-6 text-sm text-white/45 transition hover:text-white/85"
          style={{ animationDelay: "1s" }}
        >
          Making this for someone? <span className="underline underline-offset-4">Personalize it ✏️</span>
        </button>
      )}
    </div>
  );
}
