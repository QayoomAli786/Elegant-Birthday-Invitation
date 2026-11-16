import { useEffect, useState } from "react";
import { Music, Pencil } from "lucide-react";
import { NAME_TOKEN, SONG, music, type MusicState } from "@/lib/audio";
import { cn } from "@/utils/cn";

interface Props {
  name: string;
  onCustomize: () => void;
}

/** Floating music toggle with a sing-along lyric bubble, plus the personalize button. */
export function FloatingControls({ name, onCustomize }: Props) {
  const [state, setState] = useState<MusicState>(() => music.getState());

  useEffect(() => music.subscribe(setState), []);

  const line = state.playing && state.line >= 0 ? SONG[state.line] : null;

  return (
    <div
      data-no-sparkle
      className="fade-up fixed bottom-4 right-4 z-[65] flex items-end gap-3 sm:bottom-6 sm:right-6"
      style={{ animationDelay: "1.2s" }}
    >
      {line && (
        <div
          key={state.line}
          aria-live="off"
          className="pop-in glass mb-1 max-w-[calc(100vw-6.5rem)] rounded-2xl px-4 py-2.5 text-sm font-medium sm:text-base"
        >
          <span className="mr-1.5" aria-hidden="true">
            🎤
          </span>
          {line.tokens.map((tok, i) => (
            <span
              key={i}
              className={cn(
                "inline-block whitespace-pre transition-all duration-150",
                i === state.token
                  ? "-translate-y-0.5 scale-110 text-party-gold"
                  : i < state.token
                    ? "text-white"
                    : "text-white/40",
              )}
            >
              {tok === NAME_TOKEN ? name : tok}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onCustomize}
          className="fab"
          aria-label="Personalize this birthday page"
          title="Personalize"
        >
          <Pencil size={20} />
        </button>
        <button
          type="button"
          onClick={() => music.toggle()}
          className={cn("fab fab-music", state.playing && "is-playing")}
          aria-label={state.playing ? "Pause the birthday song" : "Play the birthday song"}
          title={state.playing ? "Pause music" : "Play music"}
        >
          {state.playing ? (
            <span className="eq" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </span>
          ) : (
            <Music size={22} />
          )}
        </button>
      </div>
    </div>
  );
}
