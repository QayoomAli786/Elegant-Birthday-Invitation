export type ThemeId = "midnight" | "royal" | "rose" | "ocean";

export interface BirthdayConfig {
  name: string;
  age: number | null;
  from: string;
  message: string;
  headline: string;
  theme: ThemeId;
  coupons: string[];
}

export const DEFAULT_MESSAGE =
  "Happy birthday! 🎉 Another trip around the sun, and somehow you just keep getting more wonderful. Thank you for all the laughter, the late-night talks, and the kindness you sprinkle everywhere like confetti.\n\nMay this year bring you big adventures, cozy little moments, dreams that come true — and way more cake than is strictly reasonable. Today is all about you, so soak up every single second. You deserve all the happiness in the world! 💖";

export const DEFAULT_COUPONS = ["🍕 Dinner on me", "🤗 Unlimited hugs", "🎬 Movie night, my treat"];
const DEFAULT_COUPON_NOTES = [
  "Your pick of place. No arguments.",
  "Redeemable anytime, anywhere, forever.",
  "Snacks, blankets & your choice of film.",
];

export const HEADLINE_SUGGESTIONS = ["Happy Birthday", "Janamdin Mubarak", "Happy Bday", "Saalgirah Mubarak", "Cheers to You"];

export interface ThemeOption {
  id: ThemeId;
  label: string;
  swatch: string;
}

export const THEMES: ThemeOption[] = [
  { id: "midnight", label: "Midnight Party", swatch: "linear-gradient(135deg, #3d1276 15%, #ff4fa0 95%)" },
  { id: "royal", label: "Royal Gold", swatch: "linear-gradient(135deg, #1b1840 15%, #ffcf5a 95%)" },
  { id: "rose", label: "Rose Dream", swatch: "linear-gradient(135deg, #6e1544 15%, #ffb3c7 95%)" },
  { id: "ocean", label: "Ocean Night", swatch: "linear-gradient(135deg, #0e4c73 15%, #5ef2c0 95%)" },
];

export const DEFAULT_CONFIG: BirthdayConfig = {
  name: "Sophia",
  age: 25,
  from: "Your Favorite People",
  message: DEFAULT_MESSAGE,
  headline: "Happy Birthday",
  theme: "midnight",
  coupons: DEFAULT_COUPONS,
};

export const LIMITS = { name: 40, from: 60, message: 1200, headline: 30, coupon: 40 } as const;

const clean = (value: string | null | undefined, max: number) => (value ?? "").trim().slice(0, max);
const isTheme = (value: string | null): value is ThemeId => !!value && THEMES.some((t) => t.id === value);

export function parseAge(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value.trim() === "") return null;
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n > 0 && n <= 150 ? n : null;
}

export function readConfigFromUrl(): BirthdayConfig {
  try {
    const params = new URLSearchParams(window.location.search);
    const theme = params.get("theme");
    return {
      name: clean(params.get("name"), LIMITS.name) || DEFAULT_CONFIG.name,
      age: params.has("age") ? parseAge(params.get("age")) : DEFAULT_CONFIG.age,
      from: clean(params.get("from"), LIMITS.from) || DEFAULT_CONFIG.from,
      message: clean(params.get("msg"), LIMITS.message) || DEFAULT_CONFIG.message,
      headline: clean(params.get("title"), LIMITS.headline) || DEFAULT_CONFIG.headline,
      theme: isTheme(theme) ? theme : DEFAULT_CONFIG.theme,
      coupons: DEFAULT_COUPONS.map((d, i) => clean(params.get(`c${i + 1}`), LIMITS.coupon) || d),
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function toParams(config: BirthdayConfig) {
  const params = new URLSearchParams();
  params.set("name", config.name);
  params.set("age", config.age ? String(config.age) : "");
  params.set("from", config.from);
  if (config.headline !== DEFAULT_CONFIG.headline) params.set("title", config.headline);
  if (config.theme !== DEFAULT_CONFIG.theme) params.set("theme", config.theme);
  config.coupons.forEach((c, i) => {
    if (c !== DEFAULT_COUPONS[i]) params.set(`c${i + 1}`, c);
  });
  if (config.message !== DEFAULT_MESSAGE) params.set("msg", config.message);
  return params;
}

export function buildShareUrl(config: BirthdayConfig) {
  const base = window.location.href.split(/[?#]/)[0];
  return `${base}?${toParams(config).toString()}`;
}

export function writeConfigToUrl(config: BirthdayConfig) {
  try {
    window.history.replaceState(null, "", `?${toParams(config).toString()}`);
  } catch {
    /* sandboxed previews may block history updates — safe to ignore */
  }
}

const EMOJI_START =
  /^((?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:\uFE0F|\u20E3|\p{Emoji_Modifier}|\p{Regional_Indicator}|\u200D\p{Extended_Pictographic}\uFE0F?)*)\s*/u;

/** "🍕 Dinner on me" → { icon: "🍕", title: "Dinner on me", note } */
export function parseCoupon(text: string, index: number) {
  const value = text.trim();
  const m = EMOJI_START.exec(value);
  return {
    icon: m ? m[1] : "🎁",
    title: (m ? value.slice(m[0].length) : value).trim() || "A sweet surprise",
    note: value === DEFAULT_COUPONS[index] ? DEFAULT_COUPON_NOTES[index] : "Redeemable anytime · Never expires",
  };
}

export interface BalloonColor {
  base: string;
  light: string;
  dark: string;
}

export const BALLOON_COLORS: BalloonColor[] = [
  { base: "#ff4fa0", light: "#ffa8d2", dark: "#b8125f" },
  { base: "#ffc53d", light: "#ffe7a0", dark: "#c98a00" },
  { base: "#3fcfff", light: "#aaedff", dark: "#0a86b8" },
  { base: "#4fe3b0", light: "#b3f7df", dark: "#109a6c" },
  { base: "#a27bff", light: "#d8c9ff", dark: "#5f35cc" },
  { base: "#ff8a3d", light: "#ffc9a1", dark: "#c4560c" },
  { base: "#ff5a6e", light: "#ffb0ba", dark: "#c01f35" },
];

export const WISHES = [
  { emoji: "😄", text: "Laughter so big it makes your cheeks hurt" },
  { emoji: "🌍", text: "Adventures to places you've only dreamed of" },
  { emoji: "💖", text: "Love that surrounds you every single day" },
  { emoji: "🍰", text: "Cake. So much cake. Zero calories." },
  { emoji: "✨", text: "Big dreams — and the courage to chase them" },
  { emoji: "🌈", text: "Sunshine after every single storm" },
  { emoji: "🎶", text: "Good music, great friends, best memories" },
  { emoji: "🚀", text: "Your best year yet — starting right now!" },
];
