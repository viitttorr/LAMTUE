"use client";
import { useEffect, useRef } from "react";

type Variant = "up" | "left" | "right" | "scale";

/** Envolve conteúdo com animação de surgimento ao entrar na viewport. */
export default function Reveal({
  children, delay = 0, variant = "up",
}: { children: React.ReactNode; delay?: number; variant?: Variant }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add("visible");
            obs.disconnect();
          }
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal reveal-${variant}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}
