"use client";
import { useEffect, useRef } from "react";

/**
 * Conteúdo do hero: some suavemente e desliza de leve conforme a página rola.
 * Também apaga cedo o indicador "role para explorar" e o ECG do rodapé do
 * hero, para o texto nunca se sobrepor a eles durante a saída.
 */
export default function HeroParallax({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const y = window.scrollY;
        el.style.opacity = String(Math.max(0, 1 - y / 360));
        el.style.transform = `translate3d(0, ${Math.min(y * 0.12, 60)}px, 0)`;
        const secao = el.parentElement;
        const cue = secao?.querySelector<HTMLElement>(".scroll-cue");
        if (cue) cue.style.opacity = String(Math.max(0, 0.85 - y / 160));
        const ecg = secao?.querySelector<HTMLElement>(".hero2-ecg");
        if (ecg) ecg.style.opacity = String(Math.max(0, 0.55 - y / 420));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div ref={ref} className="container hero-content" style={{ padding: "90px 24px" }}>
      {children}
    </div>
  );
}
