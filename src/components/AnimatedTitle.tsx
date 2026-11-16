import { cn } from "@/utils/cn";

const COLORS = ["#ff8cc6", "#ffcf5a", "#4fd8ff", "#5ef2c0", "#b28cff", "#ff9f45"];
/** Anything outside basic/extended Latin (Devanagari, Arabic, emoji…) animates per word so glyphs never break apart. */
const COMPLEX_SCRIPT = /[^\u0020-\u024F\u1E00-\u1EFF\u2018-\u201F]/;

interface Props {
  text: string;
  /** seconds before the first letter drops in */
  delay?: number;
}

/** Big multi-color title whose letters drop in, then ride a gentle wave. */
export function AnimatedTitle({ text, delay = 0 }: Props) {
  let index = 0;
  const words = text.trim().split(/\s+/);
  const complex = COMPLEX_SCRIPT.test(text);
  const size =
    text.length > 22
      ? "text-[clamp(2.2rem,7.5vw,5.5rem)]"
      : text.length > 15
        ? "text-[clamp(2.6rem,9vw,6.6rem)]"
        : "text-[clamp(3rem,10.5vw,7.6rem)]";

  return (
    <h1
      aria-label={text}
      className={cn("flex flex-wrap justify-center gap-x-[0.28em] font-display font-bold leading-[1.05] tracking-tight", size)}
    >
      {words.map((word, wi) => (
        <span key={wi} aria-hidden="true" className="inline-flex">
          {(complex ? [word] : Array.from(word)).map((unit) => {
            const i = index++;
            const color = COLORS[i % COLORS.length];
            return (
              <span key={i} className="letter-drop" style={{ animationDelay: `${delay + i * 0.07}s` }}>
                <span
                  className="letter-wave"
                  style={{
                    color,
                    animationDelay: `${delay + 1.3 + i * 0.09}s`,
                    textShadow: `0 0 28px ${color}66, 0 5px 0 rgba(0,0,0,.28)`,
                  }}
                >
                  {unit}
                </span>
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}
