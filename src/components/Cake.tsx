import { useId, useMemo, type CSSProperties, type KeyboardEvent } from "react";

/* ----------------------------- Geometry ----------------------------- */

interface Tier {
  cx: number;
  ty: number;
  h: number;
  rx: number;
  ry: number;
}

const TOP: Tier = { cx: 200, ty: 182, h: 90, rx: 104, ry: 17 };
const BOT: Tier = { cx: 200, ty: 274, h: 104, rx: 154, ry: 25 };
const PLATE = { cx: 200, cy: 398, rx: 190, ry: 30 };

const STICK_COLORS = ["#4fd8ff", "#ff4fa0", "#5ef2c0", "#ffcf5a", "#b28cff", "#ff9f45", "#ff5a6e"];
const DIGIT_COLORS = ["#ff4fa0", "#4fd8ff", "#b28cff"];
const SPRINKLE_COLORS = ["#ffcf5a", "#4fd8ff", "#5ef2c0", "#ffffff", "#b28cff", "#ff4fa0", "#ff9f45"];
const TOP_SPRINKLES = ["#ffffff", "#ffcf5a", "#4fd8ff", "#5ef2c0", "#b28cff"];

/* Cross-section revealed when the cake is cut: [top, bottom, color] */
const TOP_LAYERS: [number, number, string][] = [
  [176, 192, "#ff6aa8"],
  [192, 217, "#f8d9a6"],
  [217, 222, "#fff4e8"],
  [222, 225, "#ff4f8a"],
  [225, 251, "#f8d9a6"],
  [251, 256, "#fff4e8"],
  [256, 291, "#f8d9a6"],
];
const BOT_LAYERS: [number, number, string][] = [
  [272, 286, "#fff4e8"],
  [286, 316, "#f7a1c4"],
  [316, 322, "#fff4e8"],
  [322, 326, "#e8417f"],
  [326, 358, "#f7a1c4"],
  [358, 364, "#fff4e8"],
  [364, 404, "#f7a1c4"],
];
const CUT_X = 172;
const CUT_W = 56;

const FLAME_OUTER = "M0,-30 C3,-22 8,-16 8,-9 C8,-3 4.4,1 0,1 C-4.4,1 -8,-3 -8,-9 C-8,-16 -3,-22 0,-30 Z";
const FLAME_INNER =
  "M0,-18 C2,-13 4.5,-9 4.5,-5 C4.5,-1.5 2.4,0.6 0,0.6 C-2.4,0.6 -4.5,-1.5 -4.5,-5 C-4.5,-9 -2,-13 0,-18 Z";

export type CutState = "none" | "cutting" | "cut";

export type CandleSpec =
  | { id: number; kind: "stick"; x: number; base: number; height: number; color: string }
  | { id: number; kind: "digit"; x: number; base: number; digit: string; size: number; color: string };

type CandleDraft = CandleSpec extends infer C ? (C extends { id: number } ? Omit<C, "id"> : never) : never;

/** Number-shaped candles for the age (plus a few sticks), or 7 sticks if no age. */
export function buildCandles(age: number | null): CandleSpec[] {
  const { cx, ty } = TOP;
  const list: CandleDraft[] = [];

  if (age && age > 0) {
    const digits = String(Math.min(age, 999)).split("");
    const three = digits.length >= 3;
    const size = three ? 64 : 80;
    const spacing = three ? 42 : 52;
    const sticks: [number, number][] = three ? [[-88, -2]] : [[-86, -3], [-66, 7]];
    sticks.forEach(([dx, dy], i) => {
      list.push({ kind: "stick", x: cx + dx, base: ty + dy, height: 50, color: STICK_COLORS[i * 2] });
      list.push({ kind: "stick", x: cx - dx, base: ty + dy, height: 50, color: STICK_COLORS[i * 2 + 1] });
    });
    digits.forEach((d, i) =>
      list.push({
        kind: "digit",
        x: cx + (i - (digits.length - 1) / 2) * spacing,
        base: ty + 8,
        digit: d,
        size,
        color: DIGIT_COLORS[i % DIGIT_COLORS.length],
      }),
    );
  } else {
    const spots: [number, number][] = [
      [-52, -7],
      [0, -10],
      [52, -7],
      [-78, 4],
      [-26, 9],
      [26, 9],
      [78, 4],
    ];
    spots.forEach(([dx, dy], i) =>
      list.push({ kind: "stick", x: cx + dx, base: ty + dy, height: 52, color: STICK_COLORS[i % STICK_COLORS.length] }),
    );
  }

  return list.sort((a, b) => a.base - b.base).map((c, i) => ({ ...c, id: i }) as CandleSpec);
}

/* ----------------------------- Decoration ----------------------------- */

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const bodyPath = ({ cx, ty, h, rx, ry }: Tier) =>
  `M ${cx - rx} ${ty} L ${cx - rx} ${ty + h} A ${rx} ${ry} 0 0 0 ${cx + rx} ${ty + h} L ${cx + rx} ${ty} Z`;

interface Drip {
  x: number;
  w: number;
  d: number;
}

/** Icing that covers the top of a tier and drips down its front. */
function icingPath({ cx, ty, rx, ry }: Tier, base: number, drips: Drip[]) {
  let d = `M ${cx - rx} ${ty} A ${rx} ${ry} 0 0 1 ${cx + rx} ${ty} L ${cx + rx} ${ty + base}`;
  for (let x = cx + rx; x >= cx - rx; x -= 1.5) {
    const u = (x - cx) / rx;
    let y = ty + base + ry * Math.sqrt(Math.max(0, 1 - u * u));
    for (const dr of drips) {
      const v = (x - dr.x) / (dr.w / 2);
      if (Math.abs(v) < 1) y += dr.d * Math.sqrt(1 - v * v);
    }
    d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return `${d} L ${cx - rx} ${ty + base} Z`;
}

interface Pore {
  x: number;
  y: number;
  r: number;
}

function buildDecor() {
  const rnd = mulberry32(20240607);
  const r = (a: number, b: number) => a + rnd() * (b - a);
  const color = (list: string[]) => list[Math.floor(rnd() * list.length)];

  const drips = (t: Tier, spacing: number, w: [number, number], depth: [number, number]) => {
    const out: Drip[] = [];
    for (let x = t.cx - t.rx + spacing * 0.6; x < t.cx + t.rx - spacing * 0.4; x += spacing * r(0.8, 1.2)) {
      out.push({ x: x + r(-3, 3), w: r(w[0], w[1]), d: r(depth[0], depth[1]) });
    }
    return out;
  };

  const pearls: { x: number; y: number }[] = [];
  for (let x = BOT.cx - BOT.rx + 7; x <= BOT.cx + BOT.rx - 7; x += 10.5) {
    const u = (x - BOT.cx) / BOT.rx;
    pearls.push({ x, y: BOT.ty + BOT.h + BOT.ry * Math.sqrt(1 - u * u) - 5 });
  }

  const dollops = Array.from({ length: 11 }, (_, i) => {
    const th = ((12 + i * 15.6) * Math.PI) / 180;
    return { x: BOT.cx + BOT.rx * 0.9 * Math.cos(th), y: BOT.ty + BOT.ry * 0.88 * Math.sin(th) };
  });

  const sideSprinkles = Array.from({ length: 30 }, () => ({
    x: r(TOP.cx - TOP.rx + 8, TOP.cx + TOP.rx - 8),
    y: r(242, 268),
    rot: r(0, 180),
    w: r(6, 8),
    color: color(SPRINKLE_COLORS),
  }));

  const topSprinkles = Array.from({ length: 26 }, () => {
    const a = r(0, Math.PI * 2);
    const rr = Math.sqrt(rnd());
    return {
      x: TOP.cx + Math.cos(a) * rr * TOP.rx * 0.86,
      y: TOP.ty + Math.sin(a) * rr * TOP.ry * 0.72,
      rot: r(0, 180),
      w: r(5, 6.5),
      color: color(TOP_SPRINKLES),
    };
  });

  const pores = (layers: [number, number, string][], sponge: string) => {
    const out: Pore[] = [];
    for (const [y0, y1, fill] of layers) {
      if (fill !== sponge) continue;
      const n = Math.round((y1 - y0) * 0.9);
      for (let i = 0; i < n; i++) out.push({ x: r(CUT_X + 2, CUT_X + CUT_W - 2), y: r(y0 + 1.5, y1 - 1.5), r: r(0.6, 1.5) });
    }
    return out;
  };

  return {
    botIcing: icingPath(BOT, 9, drips(BOT, 25, [13, 20], [5, 22])),
    topIcing: icingPath(TOP, 8, drips(TOP, 21, [11, 17], [5, 25])),
    pearls,
    dollops,
    sideSprinkles,
    topSprinkles,
    poresTop: pores(TOP_LAYERS, "#f8d9a6"),
    poresBot: pores(BOT_LAYERS, "#f7a1c4"),
  };
}

type Decor = ReturnType<typeof buildDecor>;

/* ----------------------------- Pieces ----------------------------- */

function Flame({ uid, seed }: { uid: string; seed: number }) {
  const duration = 0.8 + ((seed * 37) % 10) / 20;
  const delay = -((seed * 53) % 10) / 10;
  return (
    <g className="flame-ignite">
      <circle cx={0} cy={-12} r={26} fill={`url(#${uid}-glow)`} className="flame-halo" style={{ animationDelay: `${delay}s` }} />
      <g className="flame" style={{ animationDuration: `${duration}s`, animationDelay: `${delay}s` }}>
        <path d={FLAME_OUTER} fill={`url(#${uid}-flameOuter)`} />
        <path d={FLAME_INNER} fill={`url(#${uid}-flameInner)`} />
        <ellipse cx={0} cy={-2} rx={2.4} ry={3.2} fill="#7cc4ff" opacity={0.7} />
      </g>
    </g>
  );
}

const SMOKE = [
  { dx: -6, delay: 0, r: 3.5 },
  { dx: 6, delay: 0.25, r: 4.5 },
  { dx: -2, delay: 0.5, r: 3 },
];

function Smoke() {
  return (
    <g>
      {SMOKE.map((s, i) => (
        <g key={i} transform="translate(0 -6)">
          <circle className="smoke" r={s.r} style={{ animationDelay: `${s.delay}s`, "--dx": `${s.dx}px` } as CSSProperties} />
        </g>
      ))}
    </g>
  );
}

interface CandleProps {
  spec: CandleSpec;
  lit: boolean;
  uid: string;
  onBlow: () => void;
}

function Candle({ spec, lit, uid, onBlow }: CandleProps) {
  const top = spec.kind === "stick" ? spec.base - spec.height : spec.base - spec.size * 0.7;
  const flameY = top - 7;
  const onKey = (e: KeyboardEvent<SVGGElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onBlow();
    }
  };

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={lit ? "Blow out this candle" : "Candle already blown out"}
      onClick={onBlow}
      onKeyDown={onKey}
      className="cursor-pointer outline-none"
    >
      <rect x={spec.x - 17} y={flameY - 38} width={34} height={spec.base - flameY + 38} fill="transparent" />
      {spec.kind === "stick" ? (
        <g>
          <rect x={spec.x - 5} y={top} width={10} height={spec.height} rx={2.5} fill={`url(#${uid}-stripe-${spec.color.slice(1)})`} />
          <rect x={spec.x - 5} y={top} width={10} height={spec.height} rx={2.5} fill={`url(#${uid}-candleShade)`} />
          <ellipse cx={spec.x} cy={top + 0.5} rx={5} ry={1.6} fill="rgba(255,255,255,.75)" />
        </g>
      ) : (
        <text
          x={spec.x}
          y={spec.base}
          textAnchor="middle"
          fontFamily="Fredoka, ui-rounded, system-ui, sans-serif"
          fontWeight={700}
          fontSize={spec.size}
          fill={`url(#${uid}-dstripe-${spec.color.slice(1)})`}
          stroke="#ffffff"
          strokeWidth={3}
          strokeLinejoin="round"
          paintOrder="stroke"
          style={{ filter: "drop-shadow(0 3px 2px rgba(0,0,0,.28))" }}
        >
          {spec.digit}
        </text>
      )}
      <line x1={spec.x} y1={top + 1} x2={spec.x} y2={flameY + 1} stroke="#3b2a1e" strokeWidth={1.8} strokeLinecap="round" />
      <g transform={`translate(${spec.x} ${flameY})`}>
        {lit ? <Flame key="on" uid={uid} seed={spec.id + 1} /> : <Smoke key="off" />}
      </g>
    </g>
  );
}

function CakeInterior({ decor, uid }: { decor: Decor; uid: string }) {
  const band = (layers: [number, number, string][]) =>
    layers.map(([y0, y1, fill]) => <rect key={y0} x={CUT_X} y={y0} width={CUT_W} height={y1 - y0 + 0.5} fill={fill} />);
  const dots = (list: Pore[], fill: string, prefix: string) =>
    list.map((p, i) => <circle key={`${prefix}${i}`} cx={p.x} cy={p.y} r={p.r} fill={fill} opacity={0.55} />);
  return (
    <g>
      {band(BOT_LAYERS)}
      {dots(decor.poresBot, "#d9739a", "b")}
      {band(TOP_LAYERS)}
      {dots(decor.poresTop, "#d9a965", "t")}
      <rect x={CUT_X} y={176} width={CUT_W} height={228} fill={`url(#${uid}-cutShade)`} />
    </g>
  );
}

function Knife({ uid }: { uid: string }) {
  return (
    <g transform="translate(200 40)" pointerEvents="none">
      <g className="knife">
        <path d="M0 0 L-12 -28 L-12 -150 L7 -150 L7 -24 Z" fill={`url(#${uid}-blade)`} stroke="#8d95a5" strokeWidth={0.8} />
        <path d="M-9.5 -32 L-9.5 -146" stroke="#ffffff" strokeOpacity={0.75} strokeWidth={1.2} />
        <rect x={-13.5} y={-161} width={22} height={11} rx={2.5} fill="#5c5f6b" />
        <rect x={-12} y={-224} width={19} height={65} rx={7} fill={`url(#${uid}-handle)`} />
        <circle cx={-2.5} cy={-209} r={2.2} fill="#e6e6ee" />
        <circle cx={-2.5} cy={-177} r={2.2} fill="#e6e6ee" />
      </g>
    </g>
  );
}

/* ----------------------------- Cake ----------------------------- */

interface CakeProps {
  candles: CandleSpec[];
  lit: boolean[];
  name: string;
  cut?: CutState;
  onBlow: (index: number) => void;
}

export function Cake({ candles, lit, name, cut = "none", onBlow }: CakeProps) {
  const uid = `c${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const id = (s: string) => `${uid}-${s}`;
  const decor = useMemo(buildDecor, []);
  const litCount = lit.filter(Boolean).length;
  const litFraction = candles.length ? litCount / candles.length : 0;
  const nameSize = Math.max(22, Math.min(44, 44 - Math.max(0, name.length - 8) * 2.4));
  const showHearts = name.length <= 9;
  const stripeColors = Array.from(new Set(candles.map((c) => c.color)));

  const sprinkle = (s: { x: number; y: number; rot: number; w: number; color: string }, i: number) => (
    <rect
      key={i}
      x={-s.w / 2}
      y={-1.2}
      width={s.w}
      height={2.4}
      rx={1.2}
      fill={s.color}
      transform={`translate(${s.x.toFixed(1)} ${s.y.toFixed(1)}) rotate(${s.rot.toFixed(0)})`}
    />
  );

  const body = (
    <>
      {/* Bottom tier */}
      <path d={bodyPath(BOT)} fill={`url(#${id("botBody")})`} />
      <path d={bodyPath(BOT)} fill={`url(#${id("cyl")})`} />
      <text
        x={200}
        y={372}
        textAnchor="middle"
        fontFamily="'Dancing Script', cursive"
        fontWeight={700}
        fontSize={nameSize}
        fill="#fff6ec"
        stroke="#c93a7c"
        strokeWidth={1.2}
        paintOrder="stroke"
      >
        {name}
      </text>
      {showHearts &&
        [88, 312].map((x) => (
          <path
            key={x}
            d="M0 5 C -10 -3, -6 -12, 0 -5 C 6 -12, 10 -3, 0 5 Z"
            transform={`translate(${x} 356)`}
            fill="#fff6ec"
            stroke="#c93a7c"
            strokeWidth={1}
          />
        ))}
      {decor.pearls.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4.3} fill={`url(#${id("pearl")})`} />
      ))}
      <path d={decor.botIcing} fill="#fff4e8" />
      <ellipse cx={BOT.cx} cy={BOT.ty} rx={BOT.rx - 3} ry={BOT.ry - 2.5} fill="#fffaf4" />

      {/* Top tier */}
      <path d={bodyPath(TOP)} fill={`url(#${id("topBody")})`} />
      <path d={bodyPath(TOP)} fill={`url(#${id("cyl")})`} />
      {decor.sideSprinkles.map(sprinkle)}
      {decor.dollops.map((d, i) => (
        <g key={i} transform={`translate(${d.x.toFixed(1)} ${d.y.toFixed(1)})`}>
          <circle r={7.5} fill="#fff4e8" />
          <path d="M-5 -1 Q0 -7 5 -1 Q0 3 -5 -1" fill="none" stroke="#ecd5c1" strokeWidth={1.4} />
          <circle cx={-2.5} cy={-3} r={2} fill="#ffffff" opacity={0.85} />
        </g>
      ))}
      <path d={decor.topIcing} fill="#ff6aa8" />
      <ellipse cx={TOP.cx} cy={TOP.ty} rx={TOP.rx - 3} ry={TOP.ry - 2.5} fill="#ff88bb" />
      <ellipse cx={TOP.cx - 32} cy={TOP.ty - 5} rx={40} ry={4.5} fill="#ffffff" opacity={0.2} />
      {decor.topSprinkles.map(sprinkle)}
    </>
  );

  return (
    <svg
      viewBox="0 70 400 370"
      className="h-auto w-full overflow-visible"
      role="img"
      aria-label={
        cut === "cut"
          ? `A birthday cake for ${name}, cut open to show its layers`
          : `A birthday cake for ${name} with ${litCount} of ${candles.length} candles lit`
      }
    >
      <defs>
        <filter id={id("blur")} x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <clipPath id={id("clipL")}>
          <rect x={-100} y={0} width={300} height={500} />
        </clipPath>
        <clipPath id={id("clipR")}>
          <rect x={200} y={0} width={300} height={500} />
        </clipPath>
        <radialGradient id={id("plate")} cx="50%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#e9e2ff" />
          <stop offset="100%" stopColor="#b3a6dd" />
        </radialGradient>
        <linearGradient id={id("botBody")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff8cc0" />
          <stop offset="100%" stopColor="#e94f93" />
        </linearGradient>
        <linearGradient id={id("topBody")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff0da" />
          <stop offset="100%" stopColor="#f3cf9f" />
        </linearGradient>
        <linearGradient id={id("cyl")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2b0a2a" stopOpacity="0.35" />
          <stop offset="16%" stopColor="#2b0a2a" stopOpacity="0" />
          <stop offset="30%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="42%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="82%" stopColor="#2b0a2a" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#2b0a2a" stopOpacity="0.38" />
        </linearGradient>
        <linearGradient id={id("cutShade")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3a0f2a" stopOpacity="0.4" />
          <stop offset="28%" stopColor="#3a0f2a" stopOpacity="0" />
          <stop offset="72%" stopColor="#3a0f2a" stopOpacity="0" />
          <stop offset="100%" stopColor="#3a0f2a" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id={id("blade")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f2f4f9" />
          <stop offset="50%" stopColor="#c3c9d6" />
          <stop offset="100%" stopColor="#f7f9fc" />
        </linearGradient>
        <linearGradient id={id("handle")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#a56c3c" />
          <stop offset="100%" stopColor="#5d391c" />
        </linearGradient>
        <radialGradient id={id("pearl")} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#f6eadf" />
          <stop offset="100%" stopColor="#d9c4b4" />
        </radialGradient>
        <radialGradient id={id("glow")}>
          <stop offset="0%" stopColor="#ffd66e" stopOpacity="0.65" />
          <stop offset="45%" stopColor="#ffab3d" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#ff8a00" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("warm")}>
          <stop offset="0%" stopColor="#ffd27a" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffb347" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("flameOuter")} cx="50%" cy="78%" r="70%">
          <stop offset="0%" stopColor="#fffbe0" />
          <stop offset="35%" stopColor="#ffd84a" />
          <stop offset="75%" stopColor="#ff8f1f" />
          <stop offset="100%" stopColor="#ff5a1f" stopOpacity="0.85" />
        </radialGradient>
        <radialGradient id={id("flameInner")} cx="50%" cy="75%" r="65%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#fff2a8" />
        </radialGradient>
        <linearGradient id={id("candleShade")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.18" />
          <stop offset="35%" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.22" />
        </linearGradient>
        {stripeColors.map((c) => (
          <pattern
            key={`s${c}`}
            id={id(`stripe-${c.slice(1)}`)}
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-35)"
          >
            <rect width="8" height="8" fill={c} />
            <rect width="3.5" height="8" fill="#ffffff" opacity="0.85" />
          </pattern>
        ))}
        {stripeColors.map((c) => (
          <pattern
            key={`d${c}`}
            id={id(`dstripe-${c.slice(1)}`)}
            width="12"
            height="12"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(40)"
          >
            <rect width="12" height="12" fill={c} />
            <rect width="4.5" height="12" fill="#ffffff" opacity="0.55" />
          </pattern>
        ))}
      </defs>

      {/* Plate */}
      <ellipse cx={PLATE.cx} cy={PLATE.cy + 12} rx={PLATE.rx - 8} ry={PLATE.ry - 6} fill="rgba(0,0,0,.5)" filter={`url(#${id("blur")})`} />
      <ellipse cx={PLATE.cx} cy={PLATE.cy} rx={PLATE.rx} ry={PLATE.ry} fill={`url(#${id("plate")})`} />
      <ellipse
        cx={PLATE.cx}
        cy={PLATE.cy - 3}
        rx={PLATE.rx - 14}
        ry={PLATE.ry - 8}
        fill="none"
        stroke="rgba(255,255,255,.7)"
        strokeWidth={1.5}
      />

      {cut === "none" ? (
        <g>{body}</g>
      ) : (
        <>
          <CakeInterior decor={decor} uid={uid} />
          <g className="cake-half-l">
            <g clipPath={`url(#${id("clipL")})`}>{body}</g>
          </g>
          <g className="cake-half-r">
            <g clipPath={`url(#${id("clipR")})`}>{body}</g>
          </g>
        </>
      )}

      {/* Warm candle light washing over the cake */}
      <ellipse
        cx={200}
        cy={190}
        rx={190}
        ry={110}
        fill={`url(#${id("warm")})`}
        style={{ opacity: litFraction * 0.8, transition: "opacity .6s ease" }}
        pointerEvents="none"
      />

      {/* Candles (back to front) — lifted away before cutting */}
      <g
        style={{ opacity: cut === "none" ? 1 : 0, transition: "opacity .4s ease" }}
        pointerEvents={cut === "none" ? undefined : "none"}
      >
        {candles.map((c, i) => (
          <Candle key={c.id} spec={c} lit={lit[i] ?? false} uid={uid} onBlow={() => onBlow(i)} />
        ))}
      </g>

      {cut === "cutting" && <Knife uid={uid} />}
    </svg>
  );
}
