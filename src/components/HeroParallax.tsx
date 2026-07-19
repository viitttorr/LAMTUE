"use client";
import { useEffect, useRef } from "react";

/** Conteúdo do hero: some suavemente e desliza para cima conforme a página rola. */
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
        const fade = Math.max(0, 1 - y / 520);
        el.style.opacity = String(fade);
        el.style.transform = `translate3d(0, ${Math.min(y * 0.3, 170)}px, 0)`;
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
