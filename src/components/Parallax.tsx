"use client";
import { useEffect, useRef } from "react";

/**
 * Parallax discreto: desloca o conteúdo interno em função da posição do
 * elemento na viewport. Mede o contêiner externo (sem transform) e move o
 * interno — evita retroalimentação na medida. Desliga-se com
 * prefers-reduced-motion e só anima enquanto visível.
 */
export default function Parallax({
  speed = 0.12,
  className = "",
  style,
  children,
}: {
  speed?: number;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const externo = useRef<HTMLDivElement>(null);
  const interno = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const fora = externo.current;
    const dentro = interno.current;
    if (!fora || !dentro) return;
    let raf = 0;
    let visivel = false;
    const mover = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!visivel) return;
        const r = fora.getBoundingClientRect();
        const centro = r.top + r.height / 2 - window.innerHeight / 2;
        dentro.style.transform = `translate3d(0, ${(-centro * speed).toFixed(1)}px, 0)`;
      });
    };
    const io = new IntersectionObserver(
      ([e]) => {
        visivel = e.isIntersecting;
        if (visivel) mover();
      },
      { rootMargin: "25% 0px" }
    );
    io.observe(fora);
    window.addEventListener("scroll", mover, { passive: true });
    window.addEventListener("resize", mover);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", mover);
      window.removeEventListener("resize", mover);
    };
  }, [speed]);

  return (
    <div ref={externo} className={className} style={style}>
      <div ref={interno} className="plx-inner">{children}</div>
    </div>
  );
}
