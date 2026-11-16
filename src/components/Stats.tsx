import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { useCountUp } from "@/hooks/useCountUp";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/utils/cn";

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

interface Stat {
  emoji: string;
  label: string;
  value: number;
  accent: string;
  compact?: boolean;
}

function StatCard({ stat, start, delay }: { stat: Stat; start: boolean; delay: number }) {
  const infinite = !Number.isFinite(stat.value);
  const v = useCountUp(infinite ? 0 : stat.value, { duration: 2200, start, delay: delay + 200 });
  const display = infinite ? "∞" : stat.compact ? compact.format(v) : Math.round(v).toLocaleString("en-US");

  return (
    <div
      className={cn(
        "glass group relative overflow-hidden rounded-3xl p-5 transition-all duration-700 hover:-translate-y-1 sm:p-7",
        start ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
      )}
      style={{ transitionDelay: start ? `${delay}ms` : "0ms" }}
    >
      <div
        className="absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-25 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
        style={{ background: stat.accent }}
      />
      <div className="text-3xl transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-125 sm:text-4xl">
        {stat.emoji}
      </div>
      <div
        className={cn("mt-4 text-3xl font-bold tabular-nums sm:text-5xl", infinite && "heartbeat")}
        style={{ color: stat.accent }}
      >
        {display}
      </div>
      <div className="mt-1 text-sm text-white/65 sm:text-base">{stat.label}</div>
    </div>
  );
}

export function Stats({ age, name }: { age: number; name: string }) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.2 });
  const days = Math.round(age * 365.25);
  const stats: Stat[] = [
    { emoji: "🎂", label: "Years of being awesome", value: age, accent: "#ff8cc6" },
    { emoji: "🌙", label: "Months of memories", value: age * 12, accent: "#b28cff" },
    { emoji: "☀️", label: "Sunrises seen", value: days, accent: "#ffcf5a" },
    { emoji: "⏰", label: "Hours of pure magic", value: days * 24, accent: "#4fd8ff" },
    { emoji: "💓", label: "Heartbeats (and counting)", value: days * 24 * 60 * 72, accent: "#ff5a6e", compact: true },
    { emoji: "😊", label: "Smiles shared", value: Infinity, accent: "#5ef2c0" },
  ];

  return (
    <section id="numbers" className="relative px-5 py-24 sm:py-32">
      <Reveal>
        <SectionHeading
          eyebrow="By the numbers"
          title={
            <>
              {age} years of <span className="text-shimmer">wonderful</span>
            </>
          }
          subtitle={`A little birthday math on just how long ${name} has been making the world brighter.`}
        />
      </Reveal>
      <div ref={ref} className="mx-auto mt-14 grid max-w-5xl grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} stat={stat} start={inView} delay={i * 110} />
        ))}
      </div>
    </section>
  );
}
