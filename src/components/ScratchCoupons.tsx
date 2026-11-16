import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { sfx } from "@/lib/audio";
import { celebration } from "@/lib/celebration";
import { parseCoupon } from "@/lib/config";
import { cn } from "@/utils/cn";

const TICKETS = [
  "linear-gradient(135deg, #ff4fa0 0%, #9b6bff 100%)",
  "linear-gradient(135deg, #0fb0d4 0%, #2fcf98 100%)",
  "linear-gradient(135deg, #ff6a3d 0%, #f0a020 100%)",
];
const GOLD_DUST = ["#ffe9a0", "#ffcf5a", "#fff7d6", "#e8b13a"];

interface CardProps {
  text: string;
  index: number;
  onReveal: () => void;
}

/** A gold-foil scratch card drawn on canvas — scratch past ~half to reveal. */
function ScratchCard({ text, index, onReveal }: CardProps) {
  const coupon = parseCoupon(text, index);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [revealed, setRevealed] = useState(false);
  const s = useRef({ drawing: false, last: null as { x: number; y: number } | null, touched: false, done: false, check: 0, dust: 0 });
  const onRevealRef = useRef(onReveal);

  useEffect(() => {
    onRevealRef.current = onReveal;
  }, [onReveal]);

  const ctx2d = () => canvasRef.current?.getContext("2d", { willReadFrequently: true }) ?? null;

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const ctx = ctx2d();
    if (!canvas || !wrap || !ctx) return;
    const { width, height } = wrap.getBoundingClientRect();
    if (!width || !height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";

    const g = ctx.createLinearGradient(0, 0, width, height);
    g.addColorStop(0, "#f2c75c");
    g.addColorStop(0.3, "#fff1b3");
    g.addColorStop(0.55, "#dca236");
    g.addColorStop(0.8, "#ffe7a1");
    g.addColorStop(1, "#c4881c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255,255,255,.13)";
    for (let x = -height; x < width; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 12, 0);
      ctx.lineTo(x + 12 + height, height);
      ctx.lineTo(x + height, height);
      ctx.closePath();
      ctx.fill();
    }
    const specks = Math.round((width * height) / 40);
    for (let i = 0; i < specks; i++) {
      ctx.fillStyle = Math.random() < 0.55 ? "rgba(255,255,255,.4)" : "rgba(140,80,0,.2)";
      ctx.fillRect(Math.random() * width, Math.random() * height, 1.3, 1.3);
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(110,62,0,.8)";
    ctx.font = "700 20px Fredoka, ui-rounded, system-ui, sans-serif";
    ctx.fillText("SCRATCH HERE", width / 2, height / 2 - 10);
    ctx.fillStyle = "rgba(110,62,0,.6)";
    ctx.font = "500 13px Fredoka, ui-rounded, system-ui, sans-serif";
    ctx.fillText("✨ use your finger or mouse ✨", width / 2, height / 2 + 16);
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const state = s.current;
    paint();
    const ro = new ResizeObserver(() => {
      if (!state.touched) paint();
    });
    ro.observe(wrap);
    document.fonts?.ready
      .then(() => {
        if (!state.touched) paint();
      })
      .catch(() => undefined);
    return () => {
      ro.disconnect();
      clearTimeout(state.check);
    };
  }, [paint]);

  const reveal = useCallback(() => {
    if (s.current.done) return;
    s.current.done = true;
    setRevealed(true);
    const r = wrapRef.current?.getBoundingClientRect();
    if (r) celebration.confetti({ x: r.left + r.width / 2, y: r.top + r.height / 2, count: 70, spread: 360, velocity: 760 });
    sfx.chime();
    onRevealRef.current();
  }, []);

  const measure = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctx2d();
    if (!canvas || !ctx || s.current.done) return;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let clear = 0;
    let total = 0;
    for (let i = 3; i < data.length; i += 32) {
      total++;
      if (data[i] < 64) clear++;
    }
    if (total && clear / total > 0.48) reveal();
  }, [reveal]);

  const scratch = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const ctx = ctx2d();
    if (!ctx) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const st = s.current;
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 42;
    const from = st.last ?? { x: x - 0.1, y };
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    st.last = { x, y };
    st.touched = true;
    sfx.scratch();
    const now = performance.now();
    if (now - st.dust > 60) {
      st.dust = now;
      celebration.trail(e.clientX, e.clientY, GOLD_DUST);
    }
    if (!st.check) {
      st.check = window.setTimeout(() => {
        st.check = 0;
        measure();
      }, 140);
    }
  };

  const end = () => {
    s.current.drawing = false;
    s.current.last = null;
  };

  return (
    <div>
      <div ref={wrapRef} className="ticket relative h-60 overflow-hidden rounded-[26px] shadow-[0_30px_60px_-30px_rgba(0,0,0,.85)]">
        <div
          className="absolute inset-0 flex flex-col items-center justify-center px-10 text-center text-white"
          style={{ background: TICKETS[index % TICKETS.length] }}
        >
          <div
            className="absolute inset-0 opacity-25"
            style={{ background: "radial-gradient(circle, #fff 0 1.5px, transparent 2.5px) 0 0 / 22px 22px" }}
          />
          <span className="absolute inset-y-6 left-[19px] border-l-2 border-dashed border-white/30" />
          <span className="absolute inset-y-6 right-[19px] border-r-2 border-dashed border-white/30" />
          <span className="relative text-[11px] font-semibold uppercase tracking-[0.3em] text-white/85">
            Birthday coupon · No. 00{index + 1}
          </span>
          <span className={cn("relative mt-3 text-5xl drop-shadow-lg", revealed && "pop-in")}>{coupon.icon}</span>
          <h3 className="relative mt-2 text-2xl font-bold leading-tight drop-shadow">{coupon.title}</h3>
          <p className="relative mt-1.5 text-sm text-white/85">{coupon.note}</p>
        </div>
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className={cn(
            "scratch-canvas absolute inset-0 h-full w-full transition-opacity duration-700",
            revealed && "pointer-events-none opacity-0",
          )}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            s.current.drawing = true;
            s.current.last = null;
            scratch(e);
          }}
          onPointerMove={(e) => {
            if (s.current.drawing) scratch(e);
          }}
          onPointerUp={end}
          onPointerCancel={end}
          onLostPointerCapture={end}
        />
      </div>
      {revealed ? (
        <p className="pop-in mt-3 text-center text-xs font-semibold uppercase tracking-[0.25em] text-party-gold">Unlocked ✓</p>
      ) : (
        <button
          type="button"
          onClick={reveal}
          className="mx-auto mt-3 block text-xs text-white/40 transition hover:text-white/75"
        >
          or tap here to reveal
        </button>
      )}
    </div>
  );
}

export function ScratchCoupons({ coupons, name }: { coupons: string[]; name: string }) {
  const [count, setCount] = useState(0);
  const onReveal = useCallback(() => setCount((n) => n + 1), []);

  return (
    <section id="coupons" className="relative px-5 py-24 sm:py-32">
      <Reveal>
        <SectionHeading
          eyebrow="Scratch & win"
          title={
            <>
              Golden <span className="text-shimmer">birthday tickets</span>
            </>
          }
          subtitle={`Three lucky coupons, all for ${name}. Scratch off the gold foil to see what you've won!`}
        />
      </Reveal>
      <div className="mx-auto mt-14 grid max-w-5xl gap-8 md:grid-cols-3 md:gap-6 lg:gap-8">
        {coupons.map((c, i) => (
          <Reveal key={`${i}-${c}`} delay={i * 120}>
            <ScratchCard text={c} index={i} onReveal={onReveal} />
          </Reveal>
        ))}
      </div>
      {count >= coupons.length && (
        <p className="pop-in mt-12 text-center text-xl font-semibold sm:text-2xl">
          🎊 All {coupons.length} unlocked! Screenshot them — they never expire.
        </p>
      )}
    </section>
  );
}
