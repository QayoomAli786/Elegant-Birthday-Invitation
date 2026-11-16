import type { CSSProperties } from "react";
import { cn } from "@/utils/cn";

export type GiftState = "idle" | "shake" | "open";

interface Props {
  state: GiftState;
  size?: number;
  label: string;
  onClick?: () => void;
}

/** A CSS-drawn present that floats, hops, shakes and pops its lid off. */
export function GiftBox({ state, size = 180, label, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={state !== "idle"}
      className={cn("gift", `gift--${state}`)}
      style={{ "--w": `${size}px` } as CSSProperties}
    >
      <span className="gift-shadow" />
      <span className="gift-inner">
        {state === "open" && <span className="gift-glow" />}
        <span className="gift-body">
          <span className="gift-ribbon-h" />
          <span className="gift-ribbon-v" />
        </span>
        <span className="gift-lid">
          <span className="gift-ribbon-v" />
          <span className="gift-bow">
            <span className="loop loop-l" />
            <span className="loop loop-r" />
            <span className="knot" />
          </span>
        </span>
      </span>
    </button>
  );
}
