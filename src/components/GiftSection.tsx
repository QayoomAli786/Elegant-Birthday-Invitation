import { useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { GiftBox } from "@/components/GiftBox";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { Typewriter } from "@/components/Typewriter";
import { useTimers } from "@/hooks/useTimers";
import { sfx } from "@/lib/audio";
import { celebration } from "@/lib/celebration";
import type { BirthdayConfig } from "@/lib/config";
import { cn } from "@/utils/cn";

type Phase = "closed" | "shake" | "open" | "letter";

function Letter({ config, onClose }: { config: BirthdayConfig; onClose: () => void }) {
  const [typed, setTyped] = useState(false);
  const paperRef = useRef<HTMLElement>(null);

  const finish = () => {
    setTyped(true);
    const r = paperRef.current?.getBoundingClientRect();
    if (r) {
      celebration.confetti({
        x: r.left + r.width / 2,
        y: r.bottom - 40,
        count: 40,
        spread: 120,
        velocity: 900,
        shapes: ["heart"],
        colors: ["#ff4fa0", "#ff8cc6", "#ff5a6e", "#ffffff"],
        scalar: 1.3,
      });
    }
    sfx.chime();
  };

  return (
    <div className="letter-in w-full">
      <article
        ref={paperRef}
        className="letter-paper relative rounded-[28px] px-6 pb-10 pt-12 text-[#3a2048] sm:px-12 sm:pb-12 sm:pt-14"
      >
        <span className="tape tape-left" aria-hidden="true" />
        <span className="tape tape-right" aria-hidden="true" />
        <span className="absolute right-6 top-7 text-3xl sm:text-4xl" aria-hidden="true">
          💌
        </span>
        <h3 className="pr-12 font-script text-4xl font-bold text-[#d6246e] sm:text-5xl">Dear {config.name},</h3>
        <Typewriter
          text={config.message}
          onDone={finish}
          className="letter-lines mt-5 min-h-[238px] whitespace-pre-line text-[17px] leading-[34px] sm:text-lg sm:leading-[34px]"
        />
        <div
          className={cn(
            "mt-8 text-right transition-all duration-700",
            typed ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
          )}
        >
          <p className="text-[#7b5a8e]">With all the love in the world,</p>
          <p className="font-script text-3xl font-bold text-[#d6246e] sm:text-4xl">{config.from}</p>
        </div>
      </article>
      <div className="mt-8 flex justify-center">
        <button type="button" className="btn-ghost" onClick={onClose}>
          <RotateCcw size={18} /> Wrap it up again
        </button>
      </div>
    </div>
  );
}

export function GiftSection({ config }: { config: BirthdayConfig }) {
  const [phase, setPhase] = useState<Phase>("closed");
  const boxRef = useRef<HTMLDivElement>(null);
  const { later } = useTimers();

  const open = () => {
    if (phase !== "closed") return;
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
          y: r.top + r.height * 0.3,
          count: 140,
          spread: 120,
          velocity: 1400,
        });
      }
    }, 620);
    later(() => setPhase("letter"), 1700);
  };

  return (
    <section id="gift" className="relative overflow-hidden px-5 py-24 sm:py-32">
      <Reveal>
        <SectionHeading
          eyebrow="Unwrap your gift"
          title={
            <>
              A little something <span className="text-shimmer">for you</span>
            </>
          }
          subtitle="Every great birthday needs a present. Go on — it's yours."
        />
      </Reveal>

      <div className="relative mx-auto mt-14 flex min-h-[440px] max-w-2xl items-center justify-center">
        {phase !== "letter" ? (
          <Reveal className="flex flex-col items-center">
            <div ref={boxRef} className="relative">
              {phase === "open" && <div className="rays" />}
              <GiftBox
                size={160}
                state={phase === "closed" ? "idle" : phase === "shake" ? "shake" : "open"}
                onClick={open}
                label="Unwrap your birthday gift"
              />
            </div>
            <p
              className={cn(
                "mt-10 flex items-center gap-2 text-white/75 transition-opacity duration-300",
                phase !== "closed" && "opacity-0",
              )}
            >
              <span className="hint-bounce inline-block">🎀</span> Tap to unwrap
            </p>
          </Reveal>
        ) : (
          <Letter config={config} onClose={() => setPhase("closed")} />
        )}
      </div>
    </section>
  );
}
