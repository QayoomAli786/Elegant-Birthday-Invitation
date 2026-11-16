import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";

const ITEMS = [
  { id: "home", label: "Home" },
  { id: "wish", label: "Make a wish" },
  { id: "memories", label: "Memory lane" },
  { id: "balloons", label: "Balloon wishes" },
  { id: "numbers", label: "By the numbers" },
  { id: "coupons", label: "Scratch cards" },
  { id: "gift", label: "Your gift" },
  { id: "lanterns", label: "Wish lanterns" },
  { id: "celebrate", label: "Fireworks" },
];

/** Floating dot navigation on wide screens; highlights the section in view. */
export function SectionNav({ refreshKey }: { refreshKey: string }) {
  const [active, setActive] = useState("home");
  const [present, setPresent] = useState<string[]>([]);

  useEffect(() => {
    const els = ITEMS.map((i) => document.getElementById(i.id)).filter((el): el is HTMLElement => !!el);
    setPresent(els.map((el) => el.id));
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [refreshKey]);

  return (
    <nav
      aria-label="Page sections"
      className="fade-up fixed right-4 top-1/2 z-[64] hidden -translate-y-1/2 flex-col items-end gap-3 xl:flex"
      style={{ animationDelay: "1.5s" }}
    >
      {ITEMS.filter((i) => present.includes(i.id)).map((item) => {
        const on = active === item.id;
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            aria-label={item.label}
            aria-current={on ? "true" : undefined}
            className="group flex items-center gap-3"
          >
            <span className="pointer-events-none translate-x-2 rounded-full bg-night-950/85 px-2.5 py-1 text-xs font-medium text-white/90 opacity-0 backdrop-blur transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
              {item.label}
            </span>
            <span
              className={cn(
                "block w-2.5 rounded-full transition-all duration-300",
                on
                  ? "h-7 bg-gradient-to-b from-party-pink to-party-gold shadow-[0_0_12px_rgba(255,79,160,.8)]"
                  : "h-2.5 bg-white/30 group-hover:bg-white/70",
              )}
            />
          </a>
        );
      })}
    </nav>
  );
}
