"use client";
import { useRef } from "react";

/**
 * Envolve um cartão com inclinação 3D sutil que segue o cursor
 * (efeito "tilt"). O filho mantém seu próprio hover (glow/elevação);
 * este wrapper só cuida da rotação em perspectiva.
 */
export default function TiltCard({
  children, className = "", style, max = 9,
}: { children: React.ReactNode; className?: string; style?: React.CSSProperties; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (0.5 - py) * max;
    const ry = (px - 0.5) * max;
    el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  };
  const onLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
  };

  return (
    <div ref={ref} className={`tilt-wrap ${className}`} style={style} onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </div>
  );
}
