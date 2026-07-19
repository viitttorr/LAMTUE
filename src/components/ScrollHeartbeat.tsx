"use client";
import { useEffect, useRef } from "react";

const PATH =
  "M0,40 L140,40 L160,40 L172,20 L184,60 L196,40 L240,40 L252,34 L264,40 L420,40 L440,40 L452,12 L466,70 L480,40 L540,40 L552,32 L564,40 L760,40 L772,22 L784,58 L796,40 L860,40 L872,35 L884,40 L1060,40 L1072,16 L1086,66 L1100,40 L1200,40";

/**
 * Traço de ECG que "adota" a rolagem da página: em vez de animar em loop,
 * o desenho da linha avança conforme o usuário lê o site — um monitor de
 * sinal vital de página inteira, fixado ao rodapé do menu.
 */
export default function ScrollHeartbeat() {
  const pathRef = useRef<SVGPathElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len}`;
    path.style.strokeDashoffset = `${len}`;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        path.style.strokeDashoffset = `${len * (1 - progress)}`;
        if (fillRef.current) fillRef.current.style.width = `${progress * 100}%`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="scroll-heartbeat" aria-hidden>
      <div ref={fillRef} className="scroll-heartbeat-track" />
      <svg viewBox="0 0 1200 80" preserveAspectRatio="none">
        <path ref={pathRef} d={PATH} fill="none" stroke="#e2536f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
