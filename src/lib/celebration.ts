/**
 * Full-screen canvas particle engine: confetti (with 3D flip), sparkles,
 * firework rockets & explosions (sphere / ring / heart / double).
 */
import { sfx } from "./audio";

export const PARTY_COLORS = ["#ff4fa0", "#ffcf5a", "#4fd8ff", "#5ef2c0", "#b28cff", "#ff9f45", "#ffffff"];
const FIREWORK_COLORS = ["#ff4fa0", "#ffcf5a", "#4fd8ff", "#5ef2c0", "#b28cff", "#ff9f45", "#ff5a6e", "#fff3c4"];

export type ConfettiShape = "rect" | "circle" | "ribbon" | "star" | "heart";

const DEFAULT_SHAPES: ConfettiShape[] = ["rect", "rect", "circle", "ribbon"];
const RAIN_SHAPES: ConfettiShape[] = ["rect", "rect", "circle", "ribbon", "heart"];
const BURST_TYPES = ["sphere", "sphere", "ring", "heart", "double"] as const;

interface Confetto {
  kind: "confetti";
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  shape: ConfettiShape;
  rot: number;
  vrot: number;
  tilt: number;
  vtilt: number;
  wob: number;
  vwob: number;
  age: number;
  life: number;
}
interface Spark {
  kind: "spark";
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  age: number;
  life: number;
  gravity: number;
  drag: number;
  twinkle: boolean;
}
interface Rocket {
  kind: "rocket";
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetY: number;
  color: string;
  trail: number[];
  age: number;
  life: number;
}
interface Flash {
  kind: "flash";
  x: number;
  y: number;
  radius: number;
  color: string;
  age: number;
  life: number;
}
type Particle = Confetto | Spark | Rocket | Flash;

export interface ConfettiOptions {
  x?: number;
  y?: number;
  count?: number;
  /** launch angle in degrees (90 = straight up) */
  angle?: number;
  spread?: number;
  /** initial speed in px/s */
  velocity?: number;
  colors?: string[];
  shapes?: ConfettiShape[];
  scalar?: number;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];
const reducedMotion = () =>
  typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const MAX_PARTICLES = 2400;
const TAU = Math.PI * 2;

function starPath(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const rad = i % 2 === 0 ? r : r * 0.38;
    const a = (i * Math.PI) / 4 - Math.PI / 2;
    if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
    else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath();
}

function heartPath(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath();
  ctx.moveTo(0, s * 0.35);
  ctx.bezierCurveTo(-s, -s * 0.2, -s * 0.5, -s * 0.95, 0, -s * 0.42);
  ctx.bezierCurveTo(s * 0.5, -s * 0.95, s, -s * 0.2, 0, s * 0.35);
  ctx.closePath();
}

class CelebrationEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: Particle[] = [];
  private raf = 0;
  private last = 0;
  private w = typeof window !== "undefined" ? window.innerWidth : 1200;
  private h = typeof window !== "undefined" ? window.innerHeight : 800;
  private dpr = 1;

  attach(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.resize();
    window.addEventListener("resize", this.resize);
    if (this.particles.length) this.run();
  }

  detach() {
    window.removeEventListener("resize", this.resize);
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.canvas = null;
    this.ctx = null;
  }

  private resize = () => {
    const c = this.canvas;
    if (!c) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    c.width = Math.round(this.w * this.dpr);
    c.height = Math.round(this.h * this.dpr);
  };

  private get scale() {
    return Math.min(1.1, Math.max(0.55, Math.min(this.w, this.h) / 820));
  }

  private amount(n: number) {
    return Math.max(1, Math.round(reducedMotion() ? n * 0.35 : n));
  }

  private run() {
    if (this.raf || !this.ctx) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (now: number) => {
    const dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    this.step(dt);
    this.render();
    if (this.particles.length && this.ctx) {
      this.raf = requestAnimationFrame(this.frame);
    } else {
      this.raf = 0;
      this.render();
    }
  };

  private push(p: Particle) {
    if (this.particles.length < MAX_PARTICLES) this.particles.push(p);
  }

  private step(dt: number) {
    const list = this.particles;
    const confDrag = Math.exp(-2.4 * dt);
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.age += dt;
      let dead = p.age >= p.life;
      switch (p.kind) {
        case "confetti":
          p.vx *= confDrag;
          p.vy = p.vy * confDrag + 560 * dt;
          p.wob += p.vwob * dt;
          p.x += (p.vx + Math.sin(p.wob) * 36) * dt;
          p.y += p.vy * dt;
          p.rot += p.vrot * dt;
          p.tilt += p.vtilt * dt;
          if (p.y > this.h + 40) dead = true;
          break;
        case "spark": {
          const d = Math.exp(-p.drag * dt);
          p.vx *= d;
          p.vy = p.vy * d + p.gravity * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          break;
        }
        case "rocket":
          p.trail.push(p.x, p.y);
          if (p.trail.length > 24) p.trail.splice(0, 2);
          p.vy += 900 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.y <= p.targetY || p.vy > -45) {
            this.explode(p.x, p.y, p.color);
            dead = true;
          }
          break;
        case "flash":
          break;
      }
      if (dead) {
        list[i] = list[list.length - 1];
        list.pop();
      }
    }
  }

  private render() {
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    if (!this.particles.length) return;

    // Pass 1 — glowing light (additive)
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    for (const p of this.particles) {
      if (p.kind === "flash") {
        const t = p.age / p.life;
        const r = p.radius * (0.5 + t * 0.7);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        g.addColorStop(0, p.color);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalAlpha = Math.max(0, (1 - t) * 0.45);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, TAU);
        ctx.fill();
      } else if (p.kind === "spark") {
        const t = p.age / p.life;
        let a = 1 - t * t;
        if (p.twinkle && t > 0.45) a *= Math.random() < 0.5 ? 1 : 0.15;
        ctx.globalAlpha = Math.max(0, a);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(p.x - p.vx * 0.035, p.y - p.vy * 0.035);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      } else if (p.kind === "rocket") {
        const tr = p.trail;
        const n = tr.length / 2;
        ctx.fillStyle = "#ffd9a0";
        for (let k = 0; k < n; k++) {
          const a = (k + 1) / n;
          ctx.globalAlpha = a * 0.7;
          ctx.beginPath();
          ctx.arc(tr[k * 2], tr[k * 2 + 1], 0.6 + a * 1.6, 0, TAU);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#fffbe8";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.4, 0, TAU);
        ctx.fill();
      }
    }

    // Pass 2 — confetti (normal blending, 3D flip via scaleY)
    ctx.globalCompositeOperation = "source-over";
    for (const p of this.particles) {
      if (p.kind !== "confetti") continue;
      const remain = p.life - p.age;
      ctx.globalAlpha = remain < 0.8 ? Math.max(0, remain / 0.8) : 1;
      const cos = Math.cos(p.rot);
      const sin = Math.sin(p.rot);
      const flip = Math.cos(p.tilt);
      const d = this.dpr;
      ctx.setTransform(d * cos, d * sin, -d * sin * flip, d * cos * flip, d * p.x, d * p.y);
      ctx.fillStyle = p.color;
      const s = p.size;
      switch (p.shape) {
        case "rect":
          ctx.fillRect(-s / 2, -s * 0.3, s, s * 0.6);
          break;
        case "ribbon":
          ctx.fillRect(-s * 0.13, -s * 0.9, s * 0.26, s * 1.8);
          break;
        case "circle":
          ctx.beginPath();
          ctx.arc(0, 0, s * 0.36, 0, TAU);
          ctx.fill();
          break;
        case "star":
          starPath(ctx, s * 0.55);
          ctx.fill();
          break;
        case "heart":
          heartPath(ctx, s * 0.7);
          ctx.fill();
          break;
      }
    }
    ctx.globalAlpha = 1;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  /* ----------------------------- Public API ----------------------------- */

  confetti(o: ConfettiOptions = {}) {
    const {
      x = this.w / 2,
      y = this.h / 2,
      count = 80,
      angle = 90,
      spread = 70,
      velocity = 1100,
      colors = PARTY_COLORS,
      shapes = DEFAULT_SHAPES,
      scalar = 1,
    } = o;
    const total = this.amount(count);
    for (let i = 0; i < total; i++) {
      const a = ((angle + rand(-spread / 2, spread / 2)) * Math.PI) / 180;
      const v = velocity * rand(0.4, 1) * (0.7 + 0.3 * this.scale);
      this.push({
        kind: "confetti",
        x,
        y,
        vx: Math.cos(a) * v,
        vy: -Math.sin(a) * v,
        size: rand(7, 12) * scalar,
        color: pick(colors),
        shape: pick(shapes),
        rot: rand(0, TAU),
        vrot: rand(-7, 7),
        tilt: rand(0, TAU),
        vtilt: rand(5, 12) * (Math.random() < 0.5 ? -1 : 1),
        wob: rand(0, TAU),
        vwob: rand(2, 6),
        age: 0,
        life: rand(3.2, 5.5),
      });
    }
    this.run();
  }

  /** Two confetti cannons firing from the bottom corners. */
  cannons() {
    const v = 1500 + this.h * 0.9;
    this.confetti({ x: -10, y: this.h + 10, angle: 62, spread: 34, count: 130, velocity: v });
    this.confetti({ x: this.w + 10, y: this.h + 10, angle: 118, spread: 34, count: 130, velocity: v });
  }

  /** Confetti (and a few hearts) gently raining from the top of the screen. */
  rain(duration = 3000) {
    const end = performance.now() + duration;
    const drop = () => {
      if (!this.ctx) return;
      const total = this.amount(5);
      for (let i = 0; i < total; i++) {
        this.push({
          kind: "confetti",
          x: rand(0, this.w),
          y: rand(-40, -10),
          vx: rand(-60, 60),
          vy: rand(80, 240),
          size: rand(7, 12),
          color: pick(PARTY_COLORS),
          shape: pick(RAIN_SHAPES),
          rot: rand(0, TAU),
          vrot: rand(-5, 5),
          tilt: rand(0, TAU),
          vtilt: rand(4, 10),
          wob: rand(0, TAU),
          vwob: rand(2, 5),
          age: 0,
          life: (this.h + 80) / 190 + 1.5,
        });
      }
      this.run();
      if (performance.now() < end) window.setTimeout(drop, 50);
    };
    drop();
  }

  /** Small magical sparkle burst — used for clicks anywhere on the page. */
  sparkle(x: number, y: number) {
    const colors = ["#ffcf5a", "#ffffff", "#ff8cc6", "#4fd8ff", "#5ef2c0"];
    const total = this.amount(16);
    for (let i = 0; i < total; i++) {
      const a = rand(0, TAU);
      const s = rand(120, 360);
      this.push({
        kind: "spark",
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        size: rand(1.4, 2.6),
        color: pick(colors),
        age: 0,
        life: rand(0.45, 0.85),
        gravity: 260,
        drag: 3.4,
        twinkle: true,
      });
    }
    this.confetti({ x, y, count: 7, spread: 360, velocity: 420, shapes: ["star"], colors, scalar: 0.95 });
  }

  /** A couple of tiny twinkling specks — used for the cursor trail & scratch dust. */
  trail(x: number, y: number, colors: string[] = ["#ffcf5a", "#ffffff", "#ff8cc6", "#4fd8ff"]) {
    for (let i = 0; i < 2; i++) {
      const a = rand(0, TAU);
      const s = rand(10, 60);
      this.push({
        kind: "spark",
        x: x + rand(-4, 4),
        y: y + rand(-4, 4),
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s + 20,
        size: rand(1.4, 2.4),
        color: pick(colors),
        age: 0,
        life: rand(0.45, 0.8),
        gravity: 50,
        drag: 2,
        twinkle: true,
      });
    }
    this.run();
  }

  /** Launch a rocket that explodes at (x, y). Random position when omitted. */
  firework(x?: number, y?: number, color?: string) {
    if (!this.ctx) return;
    const tx = x ?? rand(this.w * 0.15, this.w * 0.85);
    const ty = y ?? rand(this.h * 0.12, this.h * 0.42);
    const sx = tx + rand(-80, 80);
    const sy = this.h + 10;
    const dist = Math.max(80, sy - ty);
    const vy = -Math.sqrt(2 * 900 * dist);
    const time = -vy / 900;
    this.push({
      kind: "rocket",
      x: sx,
      y: sy,
      vx: (tx - sx) / time,
      vy,
      targetY: ty,
      color: color ?? pick(FIREWORK_COLORS),
      trail: [],
      age: 0,
      life: 6,
    });
    this.run();
  }

  /** A timed fireworks show with a finale volley. */
  fireworksShow(duration = 6500) {
    const end = performance.now() + duration;
    const loop = () => {
      if (!this.ctx) return;
      if (performance.now() > end) {
        for (let i = 0; i < 6; i++) window.setTimeout(() => this.firework(), i * 110);
        return;
      }
      this.firework();
      if (Math.random() < 0.35) window.setTimeout(() => this.firework(), 120);
      window.setTimeout(loop, rand(260, 620));
    };
    loop();
  }

  private explode(x: number, y: number, color: string) {
    const s = this.scale;
    const alt = Math.random() < 0.5 ? pick(FIREWORK_COLORS) : color;
    const type = pick(BURST_TYPES);
    const total = this.amount(type === "heart" ? 90 : Math.round(rand(80, 120)));
    const base = rand(230, 330) * s;

    for (let i = 0; i < total; i++) {
      let vx: number;
      let vy: number;
      let c = i % 3 === 0 ? alt : color;
      if (type === "heart") {
        const t = (i / total) * TAU;
        const hx = 16 * Math.sin(t) ** 3;
        const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        vx = (hx / 16) * base * 1.05;
        vy = (hy / 16) * base * 1.05;
        c = i % 5 === 0 ? "#ffffff" : i % 2 ? "#ff4fa0" : "#ff8cc6";
      } else if (type === "ring") {
        const a = (i / total) * TAU;
        vx = Math.cos(a) * base;
        vy = Math.sin(a) * base * 0.92;
      } else {
        const z = rand(-1, 1);
        const phi = rand(0, TAU);
        const r = Math.sqrt(1 - z * z);
        const sp = type === "double" && i % 2 ? base * 0.55 : base;
        vx = Math.cos(phi) * r * sp;
        vy = Math.sin(phi) * r * sp;
        if (type === "double") c = i % 2 ? alt : color;
      }
      this.push({
        kind: "spark",
        x,
        y,
        vx,
        vy,
        size: rand(1.7, 2.7),
        color: c,
        age: 0,
        life: rand(1.1, 1.8),
        gravity: type === "heart" ? 70 : 150,
        drag: 1.5,
        twinkle: Math.random() < 0.35,
      });
    }

    const glitter = this.amount(18);
    for (let i = 0; i < glitter; i++) {
      const a = rand(0, TAU);
      const sp = rand(20, base * 0.6);
      this.push({
        kind: "spark",
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        size: 1.3,
        color: "#fff6d8",
        age: 0,
        life: rand(1.4, 2.2),
        gravity: 90,
        drag: 2,
        twinkle: true,
      });
    }

    this.push({ kind: "flash", x, y, radius: 150 * s, color, age: 0, life: 0.35 });
    sfx.boom();
  }
}

export const celebration = new CelebrationEngine();
