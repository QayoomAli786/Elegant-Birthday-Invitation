import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type DragEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { useTimers } from "@/hooks/useTimers";
import { sfx } from "@/lib/audio";
import { celebration } from "@/lib/celebration";
import { MAX_PHOTOS, compressImage, loadPhotos, savePhotos, type StoredPhoto } from "@/lib/photos";

const PLACEHOLDERS = [
  { emoji: "🥰", caption: "The day we met", gradient: "linear-gradient(140deg, #ff8cc6, #b28cff)" },
  { emoji: "🏝️", caption: "Adventures together", gradient: "linear-gradient(140deg, #4fd8ff, #4b6bff)" },
  { emoji: "🤣", caption: "Laughing till it hurt", gradient: "linear-gradient(140deg, #ffd66b, #ff8a3d)" },
  { emoji: "🍰", caption: "Cake & chaos", gradient: "linear-gradient(140deg, #5ef2c0, #1d9fb0)" },
  { emoji: "🥂", caption: "Here's to many more", gradient: "linear-gradient(140deg, #c3a6ff, #ff4fa0)" },
];
const BULBS = ["#fff1b8", "#ff8cc6", "#4fd8ff", "#5ef2c0", "#ffcf5a"];
const TILTS = [-4, 3, -2, 4, -3, 2, -4, 3, -2, 4, -3];
const SAG = 22;

type Card =
  | { kind: "photo"; key: string; photo: StoredPhoto; index: number }
  | { kind: "placeholder"; key: string; emoji: string; caption: string; gradient: string }
  | { kind: "add"; key: string };

function useColumns() {
  const query = "(min-width: 768px)";
  const [cols, setCols] = useState(() => (window.matchMedia(query).matches ? 3 : 2));
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setCols(mq.matches ? 3 : 2);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return cols;
}

/** A sagging string of twinkling fairy lights. */
function FairyLights({ count }: { count: number }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-16">
      <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 64" preserveAspectRatio="none">
        <path
          d={`M -1 8 Q 50 ${8 + 2 * SAG} 101 8`}
          fill="none"
          stroke="rgba(255,255,255,.35)"
          strokeWidth="1.4"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {Array.from({ length: count }, (_, k) => {
        const t = (k + 0.5) / count;
        const color = BULBS[k % BULBS.length];
        return (
          <span
            key={k}
            className="fairy-bulb"
            style={{
              left: `${-1 + 102 * t}%`,
              top: 10 + 4 * SAG * t * (1 - t),
              background: color,
              boxShadow: `0 0 10px 2px ${color}`,
              animationDelay: `${-((k * 0.53) % 2.4)}s`,
            }}
          />
        );
      })}
    </div>
  );
}

function Polaroid({ card, tilt, delay, onOpen }: { card: Card; tilt: number; delay: number; onOpen: () => void }) {
  const caption =
    card.kind === "photo" ? card.photo.caption || "A favorite memory" : card.kind === "placeholder" ? card.caption : "Add more memories";

  return (
    <div className="polaroid-swing" style={{ "--tilt": `${tilt}deg`, animationDelay: `${delay}s` } as CSSProperties}>
      <span className="clothespin" aria-hidden="true" />
      <button
        type="button"
        className="polaroid group"
        onClick={onOpen}
        aria-label={card.kind === "photo" ? `Open photo: ${caption}` : "Add your photos"}
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-[3px] bg-[#efe6d8]">
          {card.kind === "photo" && (
            <img src={card.photo.src} alt="" draggable={false} className="h-full w-full object-cover" />
          )}
          {card.kind === "placeholder" && (
            <div className="grid h-full w-full place-items-center" style={{ background: card.gradient }}>
              <span className="text-6xl drop-shadow-[0_8px_12px_rgba(0,0,0,.25)] transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110 sm:text-7xl">
                {card.emoji}
              </span>
              <span className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center gap-1.5 bg-black/40 py-2 text-[11px] font-semibold uppercase tracking-wider text-white transition-transform duration-300 group-hover:translate-y-0 group-focus-visible:translate-y-0">
                <ImagePlus size={14} /> Add your photo
              </span>
            </div>
          )}
          {card.kind === "add" && (
            <div className="grid h-full w-full place-items-center border-2 border-dashed border-[#cdbba8] text-[#9b8574] transition-colors group-hover:border-party-pink group-hover:text-party-pink">
              <span className="flex flex-col items-center gap-2">
                <Plus size={36} />
                <span className="text-sm font-semibold">Add photos</span>
              </span>
            </div>
          )}
        </div>
        <p className="truncate px-0.5 pb-3 pt-2.5 text-center font-script text-base font-bold leading-tight sm:px-1 sm:text-2xl">
          {caption}
        </p>
      </button>
    </div>
  );
}

function PhotoCard({ photo, onCaption }: { photo: StoredPhoto; onCaption: (caption: string) => void }) {
  const [caption, setCaption] = useState(photo.caption);
  return (
    <figure className="lightbox-in relative w-full -rotate-1 rounded-md bg-[#fffdf7] p-3 pb-2 shadow-[0_40px_100px_-30px_rgba(0,0,0,.9)] sm:p-4 sm:pb-3">
      <span className="clothespin" aria-hidden="true" />
      <img
        src={photo.src}
        alt={caption || "Birthday memory"}
        className="max-h-[60vh] w-full rounded-[3px] bg-[#efe6d8] object-contain"
      />
      <input
        value={caption}
        maxLength={50}
        onChange={(e) => setCaption(e.target.value)}
        onBlur={() => onCaption(caption.trim())}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        placeholder="Write a caption…"
        aria-label="Photo caption"
        className="mt-2 w-full rounded-lg bg-transparent px-2 py-1 text-center font-script text-2xl font-bold text-[#3a2048] outline-none transition placeholder:text-[#b9a99a] focus:bg-[#f4ecdf] sm:text-3xl"
      />
    </figure>
  );
}

interface LightboxProps {
  photos: StoredPhoto[];
  index: number;
  onClose: () => void;
  onNavigate: (dir: number) => void;
  onCaption: (id: string, caption: string) => void;
  onRemove: (id: string) => void;
}

function Lightbox({ photos, index, onClose, onNavigate, onCaption, onRemove }: LightboxProps) {
  const photo = photos[index];
  const many = photos.length > 1;
  const handlers = useRef({ onClose, onNavigate });

  useEffect(() => {
    handlers.current = { onClose, onNavigate };
  }, [onClose, onNavigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return handlers.current.onClose();
      if ((e.target as HTMLElement | null)?.tagName === "INPUT") return;
      if (e.key === "ArrowLeft") handlers.current.onNavigate(-1);
      if (e.key === "ArrowRight") handlers.current.onNavigate(1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, []);

  const navBtn =
    "absolute top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo memory"
      className="fixed inset-0 z-[85] flex items-center justify-center px-4 py-10 sm:px-20"
    >
      <div className="fade-in absolute inset-0 bg-night-950/85 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md">
        <PhotoCard key={photo.id} photo={photo} onCaption={(c) => onCaption(photo.id, c)} />
        <div className="mt-6 flex items-center justify-center gap-4">
          <span className="text-sm tabular-nums text-white/60">
            {index + 1} / {photos.length}
          </span>
          <button type="button" onClick={() => onRemove(photo.id)} className="btn-ghost btn-sm">
            <Trash2 size={16} /> Remove
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
      >
        <X size={22} />
      </button>
      {many && (
        <>
          <button type="button" onClick={() => onNavigate(-1)} aria-label="Previous photo" className={`${navBtn} left-2 sm:left-6`}>
            <ChevronLeft size={26} />
          </button>
          <button type="button" onClick={() => onNavigate(1)} aria-label="Next photo" className={`${navBtn} right-2 sm:right-6`}>
            <ChevronRight size={26} />
          </button>
        </>
      )}
    </div>
  );
}

/** Polaroids pinned to fairy lights — add your own photos (stored only on this device). */
export function MemoryLane() {
  const [photos, setPhotos] = useState<StoredPhoto[]>(() => loadPhotos());
  const photosRef = useRef(photos);
  const [open, setOpen] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cols = useColumns();
  const { later } = useTimers();

  const flash = (msg: string) => {
    setNotice(msg);
    later(() => setNotice(null), 4500);
  };

  const commit = (next: StoredPhoto[]) => {
    photosRef.current = next;
    setPhotos(next);
    if (!savePhotos(next)) flash("Pinned for now — this browser couldn't save them for next time.");
  };

  const addFiles = async (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (!images.length) return;
    const room = MAX_PHOTOS - photosRef.current.length;
    if (room <= 0) {
      flash(`The string is full — up to ${MAX_PHOTOS} photos fit.`);
      return;
    }
    setBusy(true);
    const added: StoredPhoto[] = [];
    let failed = 0;
    for (const file of images.slice(0, room)) {
      try {
        const src = await compressImage(file);
        const index = photosRef.current.length + added.length;
        added.push({
          id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
          src,
          caption: PLACEHOLDERS[index]?.caption ?? "A favorite memory",
        });
      } catch {
        failed++;
      }
    }
    setBusy(false);
    if (added.length) {
      commit([...photosRef.current, ...added]);
      sfx.chime();
      celebration.confetti({ x: window.innerWidth / 2, y: window.innerHeight * 0.55, count: 60, spread: 160, velocity: 900 });
    }
    if (failed) flash("One of those images couldn't be read — try a JPG or PNG.");
    else if (images.length > room) flash(`Only ${room} more fit on the string.`);
  };

  const onFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    void addFiles(files);
  };
  const pick = () => fileRef.current?.click();
  const updateCaption = (id: string, caption: string) =>
    commit(photosRef.current.map((p) => (p.id === id ? { ...p, caption } : p)));
  const remove = (id: string) => {
    const next = photosRef.current.filter((p) => p.id !== id);
    commit(next);
    setOpen((o) => (o === null || next.length === 0 ? null : Math.min(o, next.length - 1)));
  };
  const navigate = (dir: number) =>
    setOpen((o) => (o === null ? o : (o + dir + photosRef.current.length) % photosRef.current.length));

  const onDragOver = (e: DragEvent<HTMLElement>) => {
    if (!Array.from(e.dataTransfer.types).includes("Files")) return;
    e.preventDefault();
    setDragging(true);
  };
  const onDragLeave = (e: DragEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
  };
  const onDrop = (e: DragEvent<HTMLElement>) => {
    if (!e.dataTransfer.files.length) return;
    e.preventDefault();
    setDragging(false);
    void addFiles(Array.from(e.dataTransfer.files));
  };

  const cards = useMemo<Card[]>(() => {
    const list: Card[] = photos.map((photo, index) => ({ kind: "photo", key: photo.id, photo, index }));
    for (let i = photos.length; i < PLACEHOLDERS.length; i++) list.push({ kind: "placeholder", key: `ph-${i}`, ...PLACEHOLDERS[i] });
    if (photos.length < MAX_PHOTOS) list.push({ kind: "add", key: "add" });
    return list;
  }, [photos]);

  const rows: Card[][] = [];
  for (let i = 0; i < cards.length; i += cols) rows.push(cards.slice(i, i + cols));

  return (
    <section
      id="memories"
      className="relative px-5 py-24 sm:py-32"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <Reveal>
        <SectionHeading
          eyebrow="Memory lane"
          title={
            <>
              Moments we <span className="text-shimmer">treasure</span>
            </>
          }
          subtitle="Pinned under the fairy lights. Tap a card to add your own photos — they stay private on this device."
        />
      </Reveal>

      <div className="mx-auto mt-12 max-w-4xl space-y-4 sm:mt-16 sm:space-y-8">
        {rows.map((row, r) => {
          const offset = (cols - row.length) / 2;
          return (
            <Reveal key={`${cols}-${r}`} delay={r * 120} className="relative pt-5">
              <FairyLights count={cols * 5} />
              <div className="memory-row flex justify-center">
                {row.map((card, i) => {
                  const t = (offset + i + 0.5) / cols;
                  const n = r * cols + i;
                  return (
                    <div
                      key={card.key}
                      className="shrink-0"
                      style={{ width: `calc((100% - ${cols - 1} * var(--gap)) / ${cols})`, marginTop: 4 * SAG * t * (1 - t) }}
                    >
                      <Polaroid
                        card={card}
                        tilt={TILTS[n % TILTS.length]}
                        delay={-n * 0.7}
                        onOpen={() => (card.kind === "photo" ? setOpen(card.index) : pick())}
                      />
                    </div>
                  );
                })}
              </div>
            </Reveal>
          );
        })}
      </div>

      <div className="mt-12 flex flex-col items-center gap-3 text-center">
        <button type="button" onClick={pick} disabled={busy || photos.length >= MAX_PHOTOS} className="btn-ghost">
          {busy ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
          {busy ? "Pinning your photos…" : "Add your photos"}
        </button>
        <p className="text-xs text-white/45">
          {photos.length}/{MAX_PHOTOS} photos · drag &amp; drop works too
        </p>
        {photos.length > 0 && (
          <button
            type="button"
            onClick={() => {
              commit([]);
              setOpen(null);
            }}
            className="text-xs text-white/40 underline-offset-4 transition hover:text-white/75 hover:underline"
          >
            Remove all photos
          </button>
        )}
        {notice && <p className="pop-in text-sm text-party-rose">{notice}</p>}
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />

      {dragging && (
        <div className="pointer-events-none absolute inset-3 z-20 grid place-items-center rounded-[36px] border-2 border-dashed border-party-pink/70 bg-night-950/70 backdrop-blur-sm">
          <p className="text-2xl font-bold">📸 Drop to pin your photos</p>
        </div>
      )}

      {open !== null &&
        photos[open] &&
        createPortal(
          <Lightbox
            photos={photos}
            index={open}
            onClose={() => setOpen(null)}
            onNavigate={navigate}
            onCaption={updateCaption}
            onRemove={remove}
          />,
          document.body,
        )}
    </section>
  );
}
