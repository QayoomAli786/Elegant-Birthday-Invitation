import { useState } from "react";
import { Heart, PartyPopper, Sparkles } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { useTimers } from "@/hooks/useTimers";
import { celebration } from "@/lib/celebration";
import type { BirthdayConfig } from "@/lib/config";
import { shareOrCopy } from "@/lib/share";

interface Props {
  config: BirthdayConfig;
  onCustomize: () => void;
  onReplay: () => void;
}

export function Finale({ config, onCustomize, onReplay }: Props) {
  const [showing, setShowing] = useState(false);
  const { later } = useTimers();

  const [shareNote, setShareNote] = useState<string | null>(null);

  const launch = () => {
    if (showing) return;
    setShowing(true);
    celebration.fireworksShow(7000);
    later(() => setShowing(false), 7600);
  };

  const share = async () => {
    const result = await shareOrCopy({
      title: `Happy Birthday, ${config.name}!`,
      text: `🎉 A birthday surprise for ${config.name}!`,
      url: window.location.href,
    });
    if (result === "copied") {
      setShareNote("Link copied!");
      later(() => setShareNote(null), 2200);
    }
  };

  return (
    <section id="celebrate" className="relative px-5 pb-10 pt-24 text-center sm:pt-32">
      <Reveal>
        <p className="eyebrow">The grand finale</p>
        <h2 className="mt-4 text-5xl font-bold leading-tight tracking-tight sm:text-7xl">
          Let&apos;s light up <span className="text-shimmer px-2 font-script">the sky</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-white/70">
          One last surprise — a fireworks show in honor of {config.name}. Turn the sound up! 🔊
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <button type="button" onClick={launch} disabled={showing} className="btn-party btn-lg">
            <Sparkles size={22} /> {showing ? "Enjoy the show…" : "Launch the fireworks"}
          </button>
          <button type="button" onClick={() => celebration.cannons()} className="btn-ghost btn-lg">
            <PartyPopper size={22} /> Confetti cannons
          </button>
        </div>
        <p className="mt-7 text-sm text-white/45">Psst… click anywhere on the page for a little extra sparkle ✨</p>
      </Reveal>

      <footer className="mx-auto mt-28 max-w-3xl border-t border-white/10 pt-10 text-white/60">
        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-lg">
          Made with <Heart size={18} className="heartbeat fill-party-pink text-party-pink" /> for
          <span className="font-script text-2xl font-bold text-white">{config.name}</span>
          by {config.from}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-x-7 gap-y-2 text-sm">
          <button type="button" onClick={onReplay} className="link">
            ↺ Replay the surprise
          </button>
          <button type="button" onClick={onCustomize} className="link">
            ✏️ Personalize this page
          </button>
          <button type="button" onClick={share} className="link">
            📤 {shareNote ?? "Share this surprise"}
          </button>
          <a href="#home" className="link">
            ↑ Back to the top
          </a>
        </div>
      </footer>
    </section>
  );
}
