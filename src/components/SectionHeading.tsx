import type { ReactNode } from "react";

interface Props {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
}

export function SectionHeading({ eyebrow, title, subtitle }: Props) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-4 text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
        {title}
      </h2>
      {subtitle && <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-white/70 sm:text-lg">{subtitle}</p>}
    </div>
  );
}
