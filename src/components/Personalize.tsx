import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Copy, Link2, MessageCircle, Share2, Sparkles, WandSparkles, X } from "lucide-react";
import {
  DEFAULT_CONFIG,
  DEFAULT_COUPONS,
  HEADLINE_SUGGESTIONS,
  LIMITS,
  THEMES,
  buildShareUrl,
  parseAge,
  type BirthdayConfig,
  type ThemeId,
} from "@/lib/config";
import { canNativeShare, copyText, whatsappUrl } from "@/lib/share";
import { cn } from "@/utils/cn";

interface Props {
  config: BirthdayConfig;
  onSave: (config: BirthdayConfig) => void;
  onClose: () => void;
  onPreviewTheme: (theme: ThemeId | null) => void;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-white/80">
        {label}
        {hint && <span className="text-xs font-normal text-white/40">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-t border-white/10 pt-5">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-party-gold/90">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

/** Modal to personalize everything — and share the result as a link. */
export function Personalize({ config, onSave, onClose, onPreviewTheme }: Props) {
  const [name, setName] = useState(config.name);
  const [age, setAge] = useState(config.age ? String(config.age) : "");
  const [from, setFrom] = useState(config.from);
  const [headline, setHeadline] = useState(config.headline);
  const [message, setMessage] = useState(config.message);
  const [theme, setTheme] = useState<ThemeId>(config.theme);
  const [coupons, setCoupons] = useState<string[]>(config.coupons);
  const [copied, setCopied] = useState(false);
  const firstRef = useRef<HTMLInputElement>(null);
  const cbs = useRef({ onClose, onPreviewTheme });

  useEffect(() => {
    cbs.current = { onClose, onPreviewTheme };
  }, [onClose, onPreviewTheme]);

  useEffect(() => {
    const ref = cbs;
    firstRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") ref.current.onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      ref.current.onPreviewTheme(null);
    };
  }, []);

  // Live-preview the theme behind the modal
  useEffect(() => {
    cbs.current.onPreviewTheme(theme);
  }, [theme]);

  const draft: BirthdayConfig = {
    name: name.trim() || DEFAULT_CONFIG.name,
    age: parseAge(age),
    from: from.trim() || DEFAULT_CONFIG.from,
    message: message.trim() || DEFAULT_CONFIG.message,
    headline: headline.trim() || DEFAULT_CONFIG.headline,
    theme,
    coupons: coupons.map((c, i) => c.trim() || DEFAULT_COUPONS[i]),
  };
  const shareUrl = buildShareUrl(draft);
  const shareText = `🎉 I made a birthday surprise for ${draft.name}! Open it here: ${shareUrl}`;

  const copy = async () => {
    setCopied(await copyText(shareUrl));
    window.setTimeout(() => setCopied(false), 2200);
  };

  const nativeShare = () => {
    navigator
      .share({ title: `Happy Birthday, ${draft.name}!`, text: `🎉 A birthday surprise for ${draft.name}!`, url: shareUrl })
      .catch(() => undefined);
  };

  const resetToExample = () => {
    setName(DEFAULT_CONFIG.name);
    setAge(DEFAULT_CONFIG.age ? String(DEFAULT_CONFIG.age) : "");
    setFrom(DEFAULT_CONFIG.from);
    setHeadline(DEFAULT_CONFIG.headline);
    setMessage(DEFAULT_CONFIG.message);
    setTheme(DEFAULT_CONFIG.theme);
    setCoupons(DEFAULT_COUPONS);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="personalize-title"
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6"
    >
      <div className="fade-in absolute inset-0 bg-night-950/70 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(draft);
        }}
        className="modal-in relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#1a0a3c]/95 shadow-[0_40px_120px_-30px_rgba(0,0,0,.9)] sm:rounded-3xl"
      >
        <div className="overflow-y-auto px-6 pb-6 pt-6 sm:px-8 sm:pt-8">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>

          <div className="mb-6 flex items-center gap-3 pr-10">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-party-pink to-party-orange shadow-lg shadow-party-pink/30">
              <WandSparkles size={22} />
            </div>
            <div>
              <h2 id="personalize-title" className="text-2xl font-bold">
                Personalize the party
              </h2>
              <p className="text-sm text-white/60">Make it theirs, then share the magic link.</p>
            </div>
          </div>

          <div className="space-y-6">
            <Group title="The birthday star">
              <Field label="Name">
                <input
                  ref={firstRef}
                  className="input"
                  value={name}
                  maxLength={LIMITS.name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sophia"
                  required
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Turning" hint="optional">
                  <input
                    className="input"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={150}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="25"
                  />
                </Field>
                <Field label="From">
                  <input
                    className="input"
                    value={from}
                    maxLength={LIMITS.from}
                    onChange={(e) => setFrom(e.target.value)}
                    placeholder="Your name"
                  />
                </Field>
              </div>
            </Group>

            <Group title="Big headline">
              <input
                className="input"
                value={headline}
                maxLength={LIMITS.headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Happy Birthday"
                aria-label="Headline"
              />
              <div className="flex flex-wrap gap-2">
                {HEADLINE_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setHeadline(s)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition",
                      headline === s
                        ? "border-party-pink bg-party-pink/20 text-white"
                        : "border-white/15 text-white/70 hover:border-white/40 hover:text-white",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Group>

            <Group title="Your birthday letter">
              <Field label="Message" hint={`${message.length}/${LIMITS.message}`}>
                <textarea
                  className="input resize-none leading-relaxed"
                  rows={6}
                  value={message}
                  maxLength={LIMITS.message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write something from the heart…"
                />
              </Field>
            </Group>

            <Group title="Color theme">
              <div className="grid grid-cols-4 gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    aria-pressed={theme === t.id}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-2xl p-2 text-center transition",
                      theme === t.id ? "bg-white/10 ring-2 ring-party-pink" : "hover:bg-white/5",
                    )}
                  >
                    <span
                      className="h-11 w-11 rounded-full shadow-[inset_0_2px_6px_rgba(255,255,255,.35)] ring-1 ring-white/20"
                      style={{ background: t.swatch }}
                    />
                    <span className="text-[11px] leading-tight text-white/75">{t.label}</span>
                  </button>
                ))}
              </div>
            </Group>

            <Group title="Scratch-card coupons">
              {coupons.map((c, i) => (
                <input
                  key={i}
                  className="input"
                  value={c}
                  maxLength={LIMITS.coupon}
                  onChange={(e) => setCoupons((list) => list.map((v, k) => (k === i ? e.target.value : v)))}
                  placeholder={`e.g. ${DEFAULT_COUPONS[i]}`}
                  aria-label={`Coupon ${i + 1}`}
                />
              ))}
              <p className="text-xs text-white/45">Tip: start with an emoji — it becomes the coupon&apos;s icon.</p>
            </Group>

            <Group title="Share the surprise">
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  className="input min-w-0 flex-1 py-2 text-xs"
                  aria-label="Shareable link"
                />
                <button type="button" onClick={copy} className="btn-ghost btn-sm shrink-0">
                  {copied ? (
                    <>
                      <Check size={16} /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={16} /> Copy
                    </>
                  )}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={whatsappUrl(shareText)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-[#07361b] transition hover:brightness-110"
                >
                  <MessageCircle size={16} /> Send on WhatsApp
                </a>
                {canNativeShare() && (
                  <button type="button" onClick={nativeShare} className="btn-ghost btn-sm">
                    <Share2 size={16} /> More options
                  </button>
                )}
              </div>
              <p className="flex items-start gap-2 text-xs text-white/45">
                <Link2 size={14} className="mt-0.5 shrink-0" />
                The link carries the name, age, headline, theme, coupons &amp; letter. Photos and lantern wishes stay
                on this device.
              </p>
            </Group>
          </div>
        </div>

        <div className="flex flex-col-reverse items-stretch gap-3 border-t border-white/10 bg-[#160833]/95 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <button type="button" onClick={resetToExample} className="text-sm text-white/50 transition hover:text-white">
            Reset to example
          </button>
          <button type="submit" className="btn-party">
            <Sparkles size={18} /> Save &amp; celebrate
          </button>
        </div>
      </form>
    </div>
  );
}
