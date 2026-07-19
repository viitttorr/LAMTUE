"use client";
import { useEffect, useRef } from "react";

type Props = {
  /** 'hero': denso, interativo ao cursor, com leve paralaxe no scroll.
   *  'field': calmo, usado como camada de fundo atrás de conteúdo (ex.: seção de temas). */
  variant?: "hero" | "field";
  palette?: "mixed" | "blue";
  density?: number;
  className?: string;
};

/**
 * Campo de partículas conectadas por linhas finas — remete a rede neural /
 * sinal vital. No modo 'hero' reage ao cursor e se desloca em paralaxe
 * (mais lento que o conteúdo) conforme a página rola.
 */
export default function ParticleField({ variant = "hero", palette = "mixed", density = 1, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let w = 0, h = 0, raf = 0;
    const mouse = { x: -9999, y: -9999 };
    type P = { x: number; y: number; vx: number; vy: number; r: number; blue: boolean };
    let pts: P[] = [];
    const interactive = variant === "hero";

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      w = canvas.width = rect.width * devicePixelRatio;
      h = canvas.height = rect.height * devicePixelRatio;
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      const base = rect.width < 720 ? 42 : 92;
      const n = Math.round(base * density);
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22 * devicePixelRatio,
        vy: (Math.random() - 0.5) * 0.22 * devicePixelRatio,
        r: (Math.random() * 1.4 + 0.7) * devicePixelRatio,
        blue: palette === "blue" ? true : Math.random() < 0.45,
      }));
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) * devicePixelRatio;
      mouse.y = (e.clientY - rect.top) * devicePixelRatio;
    };
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999; };

    const LINK = 130 * devicePixelRatio;
    const t0 = performance.now();
    const draw = (now: number) => {
      ctx.clearRect(0, 0, w, h);
      // "batimento" sutil: onda de brilho que percorre a cena a cada ~2.4s
      const beat = (Math.sin((now - t0) / 1900) + 1) / 2;
      for (const p of pts) {
        if (interactive) {
          const dx = mouse.x - p.x, dy = mouse.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 220 * devicePixelRatio && dist > 1) {
            p.vx += (dx / dist) * 0.008 * devicePixelRatio;
            p.vy += (dy / dist) * 0.008 * devicePixelRatio;
          }
        }
        p.vx *= 0.995; p.vy *= 0.995;
        p.x += p.vx * (interactive ? 1 : 0.55);
        p.y += p.vy * (interactive ? 1 : 0.55);
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK) {
            const alpha = (1 - d / LINK) * (0.16 + beat * 0.1);
            ctx.strokeStyle = a.blue && b.blue ? `rgba(56,189,248,${alpha})` : `rgba(226,83,111,${alpha})`;
            ctx.lineWidth = devicePixelRatio * 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      for (const p of pts) {
        ctx.fillStyle = p.blue ? "rgba(56,189,248,0.75)" : "rgba(226,83,111,0.75)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (1 + beat * 0.25), 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    resize();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    if (interactive) {
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerleave", onLeave);
    }

    // paralaxe leve no scroll (só faz sentido no hero, seção fixa no topo)
    let scrollRaf = 0;
    const onScroll = () => {
      cancelAnimationFrame(scrollRaf);
      scrollRaf = requestAnimationFrame(() => {
        canvas.style.transform = `translate3d(0, ${Math.min(window.scrollY * 0.12, 90)}px, 0)`;
      });
    };
    if (interactive) window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(scrollRaf);
      window.removeEventListener("resize", resize);
      if (interactive) {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerleave", onLeave);
        window.removeEventListener("scroll", onScroll);
      }
    };
  }, [variant, palette, density]);

  return <canvas ref={ref} className={className ?? "hero-canvas"} aria-hidden />;
}
