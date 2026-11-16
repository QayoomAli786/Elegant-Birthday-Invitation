import { useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { Send } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { useInView } from "@/hooks/useInView";
import { useTimers } from "@/hooks/useTimers";
import { sfx } from "@/lib/audio";
import { celebration } from "@/lib/celebration";
import { loadJSON, saveJSON } from "@/lib/storage";
import { cn } from "@/utils/cn";

interface LanternItem {
  id: string;
  text: string;
  mine: boolean;
  size: number;
  left: number;
  duration: number;
  delay: number;
  drift: number;
  sway: number;
}

const STORE_KEY = "bday-lanterns-v1";
const SEED_WISHES = [
  "May all your dreams take flight ✨",
  "More laughter, less worry",
  "Health, love & happiness — always",
  "Best. Year. Ever.",
  "Adventures are waiting for you 🌍",
  "Stay exactly as wonderful as you are",
  "Cake for breakfast, every day 🍰",
  "So proud of you 💖",
  "Wishing you peace & sunshine ☀️",
];

const rand = (a: number, b: number) => a + Math.random() * (b - a);
let uid = 0;

function makeLantern(text: string, mine: boolean, fresh = false): LanternItem {
  const size = mine ? rand(52, 64) : rand(24, 50);
  return {
    id: `lantern-${uid++}`,
    text,
    mine,
    size,
    left: fresh ? rand(42, 54) : rand(2, 92),
    duration: 20 + (64 - size) * 0.32 + rand(-2, 2),
    delay: fresh ? 0 : -rand(0, 32),
    drift: rand(-70, 70),
    sway: rand(4, 7),
  };
}

function LanternSvg({ opacity }: { opacity: number }) {
  return (
    <svg viewBox="0 0 60 84" className="block w-full overflow-visible" style={{ opacity }} aria-hidden="true">
      <ellipse className="lantern-glow" cx="30" cy="46" rx="46" ry="52" fill="url(#lantern-halo)" />
      <path d="M7 8 Q30 1 53 8 L46 70 Q30 75 14 70 Z" fill="url(#lantern-body)" />
      <path d="M21 5 L18.5 72 M39 5 L41.5 72" stroke="#b5481a" strokeOpacity="0.28" strokeWidth="1" fill="none" />
      <path d="M7 8 Q30 1 53 8 Q30 13 7 8 Z" fill="#ffe2a0" opacity="0.55" />
      <path d="M14 70 Q30 75 46 70 L45 74 Q30 79 15 74 Z" fill="#6b2410" opacity="0.9" />
      <ellipse className="lantern-glow" cx="30" cy="72" rx="4.5" ry="2.6" fill="#fff4b8" />
    </svg>
  );
}

function Lantern({ item, active, onTap }: { item: LanternItem; active: boolean; onTap: () => void }) {
  const opacity = item.mine ? 1 : 0.5 + ((item.size - 24) / 26) * 0.45;
  return (
    <div
      className="lantern"
      style={
        {
          left: `${item.left}%`,
          width: item.size,
          zIndex: Math.round(item.size),
          animationDuration: `${item.duration}s`,
          animationDelay: `${item.delay}s`,
          "--drift": `${item.drift}px`,
        } as CSSProperties
      }
    >
      <div className="lantern-sway" style={{ animationDuration: `${item.sway}s`, animationDelay: `${item.delay / 3}s` }}>
        <button
          type="button"
          onClick={onTap}
          aria-label={`Wish: ${item.text}`}
          className={cn("lantern-btn relative block w-full outline-none", active && "show")}
        >
          <LanternSvg opacity={opacity} />
          <span className="lantern-tip">
            {item.mine && <strong className="mr-1 text-party-gold">Your wish:</strong>}
            {item.text}
          </span>
        </button>
      </div>
    </div>
  );
}

/** A night sky full of floating paper lanterns — release your own wish. */
export function WishLanterns({ name }: { name: string }) {
  const seeded = useMemo(() => SEED_WISHES.map((t) => makeLantern(t, false)), []);
  const stars = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 65,
        size: rand(1, 2.4),
        delay: -Math.random() * 5,
      })),
    [],
  );
  const [mine, setMine] = useState<LanternItem[]>(() => {
    const saved = loadJSON<unknown>(STORE_KEY, []);
    const list = Array.isArray(saved) ? saved.filter((v): v is string => typeof v === "string") : [];
    return list.slice(-8).map((t) => makeLantern(t, true));
  });
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [skyRef, inView] = useInView<HTMLDivElement>({ threshold: 0, once: false, rootMargin: "120px 0px" });
  const sendRef = useRef<HTMLButtonElement>(null);
  const { later } = useTimers();

  const release = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const wish = text.trim();
    if (!wish) return;
    const next = [...mine.slice(-7), makeLantern(wish, true, true)];
    setMine(next);
    saveJSON(
      STORE_KEY,
      next.map((l) => l.text),
    );
    setText("");
    setSent(true);
    later(() => setSent(false), 4000);
    const r = sendRef.current?.getBoundingClientRect();
    if (r) celebration.sparkle(r.left + r.width / 2, r.top + r.height / 2);
    sfx.chime();
  };

  const lanterns = [...seeded, ...mine];

  return (
    <section id="lanterns" className="relative px-5 py-24 sm:py-32">
      <Reveal>
        <SectionHeading
          eyebrow="Wish lanterns"
          title={
            <>
              Send a wish <span className="text-shimmer">to the sky</span>
            </>
          }
          subtitle={`Write a wish for ${name}, release your lantern and watch it float up to join the others. Tap any lantern to read its wish.`}
        />
      </Reveal>

      <Reveal delay={120}>
        <div
          ref={skyRef}
          data-paused={inView ? "false" : "true"}
          className="sky relative mx-auto mt-12 max-w-6xl overflow-hidden rounded-[36px] border border-white/10 shadow-[0_40px_100px_-40px_rgba(0,0,0,.9)]"
        >
          <svg className="absolute h-0 w-0" aria-hidden="true">
            <defs>
              <radialGradient id="lantern-body" cx="50%" cy="88%" r="90%">
                <stop offset="0%" stopColor="#fff7c8" />
                <stop offset="30%" stopColor="#ffc857" />
                <stop offset="70%" stopColor="#ff7b2c" />
                <stop offset="100%" stopColor="#c43d18" />
              </radialGradient>
              <radialGradient id="lantern-halo">
                <stop offset="0%" stopColor="#ffb547" stopOpacity="0.55" />
                <stop offset="60%" stopColor="#ff8a2a" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#ff7a00" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>

          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,2,18,.75)_0%,rgba(28,10,66,.5)_55%,rgba(255,138,92,.2)_100%)]" />
          {stars.map((st) => (
            <span
              key={st.id}
              className="star"
              style={{ left: `${st.left}%`, top: `${st.top}%`, width: st.size, height: st.size, animationDelay: `${st.delay}s` }}
            />
          ))}
          <div className="moon absolute right-[9%] top-[9%]" aria-hidden="true" />

          <div className="absolute inset-0 z-0">
            {lanterns.map((l) => (
              <Lantern key={l.id} item={l} active={active === l.id} onTap={() => setActive((a) => (a === l.id ? null : l.id))} />
            ))}
          </div>

          <svg
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-28 w-full sm:h-36"
            viewBox="0 0 1200 200"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M0 118 C 150 58, 300 70, 430 108 S 700 150, 830 94 S 1080 58, 1200 102 L1200 200 L0 200 Z" fill="#1d0e40" />
            <path d="M0 158 C 200 118, 380 150, 560 140 S 900 108, 1200 148 L1200 200 L0 200 Z" fill="#0d061f" />
          </svg>

          <p className="absolute left-4 top-4 z-20 rounded-full border border-white/10 bg-night-950/55 px-3 py-1 text-xs text-white/75 backdrop-blur sm:left-6 sm:top-6">
            🏮 {lanterns.length} wishes floating
          </p>

          {sent && (
            <p className="pop-in absolute inset-x-0 bottom-24 z-20 text-center text-sm font-semibold text-party-gold sm:bottom-28">
              ✨ Your lantern is on its way up! ✨
            </p>
          )}

          <form
            onSubmit={release}
            className="absolute inset-x-3 bottom-4 z-20 mx-auto flex max-w-xl items-center gap-2 rounded-full border border-white/15 bg-night-950/75 p-1.5 pl-4 backdrop-blur-md sm:inset-x-6 sm:bottom-7 sm:pl-5"
          >
            <span aria-hidden="true" className="text-lg">
              🏮
            </span>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={80}
              placeholder={`Write a wish for ${name}…`}
              aria-label="Your wish"
              className="min-w-0 flex-1 bg-transparent py-2 text-sm text-white outline-none placeholder:text-white/40 sm:text-base"
            />
            <button ref={sendRef} type="submit" disabled={!text.trim()} className="btn-party btn-sm shrink-0">
              <Send size={16} /> Release
            </button>
          </form>
        </div>
      </Reveal>
    </section>
  );
}
