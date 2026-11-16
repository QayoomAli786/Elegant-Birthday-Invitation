import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { BalloonWishes } from "@/components/BalloonWishes";
import { CakeSection } from "@/components/CakeSection";
import { CelebrationCanvas } from "@/components/CelebrationCanvas";
import { Finale } from "@/components/Finale";
import { FloatingControls } from "@/components/FloatingControls";
import { GiftSection } from "@/components/GiftSection";
import { Hero } from "@/components/Hero";
import { Intro } from "@/components/Intro";
import { MemoryLane } from "@/components/MemoryLane";
import { Personalize } from "@/components/Personalize";
import { ScratchCoupons } from "@/components/ScratchCoupons";
import { ScrollProgress } from "@/components/ScrollProgress";
import { SectionNav } from "@/components/SectionNav";
import { Starfield } from "@/components/Starfield";
import { Stats } from "@/components/Stats";
import { WishLanterns } from "@/components/WishLanterns";
import { music, sfx } from "@/lib/audio";
import { celebration } from "@/lib/celebration";
import { readConfigFromUrl, writeConfigToUrl, type BirthdayConfig, type ThemeId } from "@/lib/config";

type Stage = "intro" | "revealing" | "party";

export default function App() {
  const [config, setConfig] = useState<BirthdayConfig>(() => readConfigFromUrl());
  const [stage, setStage] = useState<Stage>("intro");
  const [customizing, setCustomizing] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<ThemeId | null>(null);
  const theme = previewTheme ?? config.theme;

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    document.title = `Happy Birthday, ${config.name}! 🎉`;
  }, [config.name]);

  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }, []);

  // A little sparkle wherever you click (except on controls).
  useEffect(() => {
    if (stage === "intro") return;
    const onClick = (e: MouseEvent) => {
      const el = e.target as Element | null;
      if (el?.closest("button, a, input, textarea, select, label, canvas, [role='button'], [role='dialog'], [data-no-sparkle]")) return;
      celebration.sparkle(e.clientX, e.clientY);
      sfx.twinkle();
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [stage]);

  // Magic dust trailing the mouse cursor.
  useEffect(() => {
    if (stage === "intro") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let lastX = -999;
    let lastY = -999;
    let lastT = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const now = performance.now();
      if (now - lastT < 30) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (dx * dx + dy * dy < 120) return;
      lastT = now;
      lastX = e.clientX;
      lastY = e.clientY;
      celebration.trail(e.clientX, e.clientY);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [stage]);

  const openCustomize = useCallback(() => setCustomizing(true), []);
  const closeCustomize = useCallback(() => setCustomizing(false), []);

  const save = (next: BirthdayConfig) => {
    setConfig(next);
    writeConfigToUrl(next);
    setCustomizing(false);
    window.setTimeout(() => {
      celebration.cannons();
      sfx.chime();
    }, 250);
  };

  const replay = () => {
    music.stop();
    window.scrollTo({ top: 0 });
    setStage("intro");
  };

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <Starfield />
      <CelebrationCanvas />

      {stage !== "party" && (
        <Intro
          name={config.name}
          onReveal={() => setStage("revealing")}
          onDone={() => setStage("party")}
          onCustomize={openCustomize}
        />
      )}

      {stage !== "intro" && (
        <>
          <main className="relative z-10">
            <Hero config={config} />
            <CakeSection key={`cake-${config.age ?? "none"}`} config={config} />
            <MemoryLane />
            <BalloonWishes />
            {config.age ? <Stats age={config.age} name={config.name} /> : null}
            <ScratchCoupons key={config.coupons.join("|")} coupons={config.coupons} name={config.name} />
            <GiftSection config={config} />
            <WishLanterns name={config.name} />
            <Finale config={config} onCustomize={openCustomize} onReplay={replay} />
          </main>
          <ScrollProgress />
          <SectionNav refreshKey={config.age ? "with-age" : "no-age"} />
          <FloatingControls name={config.name} onCustomize={openCustomize} />
        </>
      )}

      {customizing && (
        <Personalize config={config} onSave={save} onClose={closeCustomize} onPreviewTheme={setPreviewTheme} />
      )}
    </div>
  );
}
