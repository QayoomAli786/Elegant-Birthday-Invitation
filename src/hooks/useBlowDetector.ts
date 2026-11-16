import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

type Status = "idle" | "requesting" | "listening" | "error";
type WindowWithWebkit = Window & { webkitAudioContext?: typeof AudioContext };

interface Options {
  onBlow: () => void;
  /** element whose scaleX reflects the live mic level */
  meterRef: RefObject<HTMLElement | null>;
  threshold?: number;
}

/**
 * Listens to the microphone and calls `onBlow` (throttled) while the user is
 * blowing into it — loud, sustained noise.
 */
export function useBlowDetector({ onBlow, meterRef, threshold = 0.13 }: Options) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const onBlowRef = useRef(onBlow);
  const res = useRef<{ stream?: MediaStream; ctx?: AudioContext; raf?: number }>({});

  useEffect(() => {
    onBlowRef.current = onBlow;
  }, [onBlow]);

  const release = useCallback(() => {
    const r = res.current;
    if (r.raf) cancelAnimationFrame(r.raf);
    r.stream?.getTracks().forEach((t) => t.stop());
    r.ctx?.close().catch(() => undefined);
    res.current = {};
  }, []);

  const stop = useCallback(() => {
    release();
    setStatus((s) => (s === "error" ? s : "idle"));
  }, [release]);

  const start = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setError("This browser can't use the microphone here — tap the flames instead!");
      return;
    }
    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      const Ctor = window.AudioContext || (window as WindowWithWebkit).webkitAudioContext;
      const ctx = new Ctor();
      if (ctx.state === "suspended") await ctx.resume().catch(() => undefined);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      let loud = 0;
      let lastBlow = 0;
      let smooth = 0;

      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        smooth = smooth * 0.7 + rms * 0.3;
        const meter = meterRef.current;
        if (meter) meter.style.transform = `scaleX(${Math.min(1, smooth / (threshold * 1.6))})`;
        const now = performance.now();
        if (smooth > threshold) {
          loud++;
          if (loud > 3 && now - lastBlow > 140) {
            lastBlow = now;
            onBlowRef.current();
          }
        } else {
          loud = Math.max(0, loud - 1);
        }
        res.current.raf = requestAnimationFrame(tick);
      };

      res.current = { stream, ctx };
      setStatus("listening");
      res.current.raf = requestAnimationFrame(tick);
    } catch {
      release();
      setStatus("error");
      setError("Couldn't reach your microphone — no worries, tap the flames or use the button!");
    }
  }, [meterRef, release, threshold]);

  useEffect(() => release, [release]);

  return {
    status,
    error,
    listening: status === "listening",
    requesting: status === "requesting",
    start,
    stop,
  };
}
