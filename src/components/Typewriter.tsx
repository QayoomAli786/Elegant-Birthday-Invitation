import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/utils/cn";

interface Props {
  text: string;
  speed?: number;
  className?: string;
  onDone?: () => void;
}

/** Types text out character by character, pausing on punctuation. Click to finish instantly. */
export function Typewriter({ text, speed = 26, className, onDone }: Props) {
  const chars = useMemo(() => Array.from(text), [text]);
  const [count, setCount] = useState(0);
  const onDoneRef = useRef(onDone);
  const done = count >= chars.length;

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (done) {
      onDoneRef.current?.();
      return;
    }
    const ch = chars[count];
    const delay = /[.!?]/.test(ch) ? speed * 9 : /[,;:—\n]/.test(ch) ? speed * 5 : speed;
    const t = window.setTimeout(() => setCount((c) => c + 1), delay);
    return () => clearTimeout(t);
  }, [count, done, chars, speed]);

  return (
    <p
      className={cn("cursor-text", className)}
      onClick={() => setCount(chars.length)}
      title={done ? undefined : "Click to show the whole message"}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {chars.slice(0, count).join("")}
        <span className={cn("caret", done && "opacity-0")}>|</span>
      </span>
    </p>
  );
}
