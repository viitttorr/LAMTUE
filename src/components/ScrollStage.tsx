"use client";
import { useEffect, useRef } from "react";

/**
 * Palco de fundo da home: camadas gráficas fixas (grade, feixes, anéis,
 * brilho e um grande ECG) cujo movimento é dirigido pelo progresso da
 * rolagem — profundidade 2.5D sem imagens externas, só transform/opacity.
 * Desliga-se com prefers-reduced-motion (via CSS) e usa um único listener
 * de scroll com requestAnimationFrame.
 */
export default function ScrollStage() {
  const ref = useRef<HTMLDivElement>(null);
  const ecgRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const raiz = ref.current;
    if (!raiz) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const grid = raiz.querySelector<HTMLElement>(".stage-grid");
    const beamA = raiz.querySelector<HTMLElement>(".stage-beam.azul");
    const beamB = raiz.querySelector<HTMLElement>(".stage-beam.rubro");
    const rings = raiz.querySelector<HTMLElement>(".stage-rings");
    const glowFrio = raiz.querySelector<HTMLElement>(".stage-glow.frio");
    const path = ecgRef.current;
    const len = path ? path.getTotalLength() : 0;
    if (path) {
      path.style.strokeDasharray = `${len}`;
      path.style.strokeDashoffset = `${len}`;
    }

    let raf = 0;
    const cena = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (grid) grid.style.transform = `translate3d(0, ${(-p * 150).toFixed(1)}px, 0)`;
      if (beamA) beamA.style.transform = `rotate(${(8 + p * 26).toFixed(2)}deg) translate3d(0, ${(p * 260).toFixed(1)}px, 0)`;
      if (beamB) beamB.style.transform = `rotate(${(-6 - p * 20).toFixed(2)}deg) translate3d(0, ${(-p * 220).toFixed(1)}px, 0)`;
      if (rings) rings.style.transform = `translate3d(${(-p * 30).toFixed(2)}vw, ${(140 - p * 380).toFixed(1)}px, 0) scale(${(1 + p * 0.4).toFixed(3)})`;
      if (glowFrio) glowFrio.style.opacity = `${(0.25 + Math.sin(p * Math.PI) * 0.75).toFixed(3)}`;
      if (path) path.style.strokeDashoffset = `${(len * (1 - p)).toFixed(1)}`;
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(cena);
    };
    cena();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div ref={ref} className="scroll-stage" aria-hidden>
      <div className="stage-glow quente" />
      <div className="stage-glow frio" />
      <div className="stage-grid" />
      <div className="stage-beam azul" />
      <div className="stage-beam rubro" />
      <div className="stage-rings"><span /><span /><span /><span /></div>
      <svg className="stage-ecg" viewBox="0 0 1400 160" preserveAspectRatio="none">
        <path
          ref={ecgRef}
          d="M0,80 L180,80 L200,80 L216,44 L232,116 L248,80 L420,80 L436,68 L452,80 L640,80 L660,18 L684,144 L706,80 L900,80 L916,66 L932,80 L1120,80 L1140,40 L1160,112 L1178,80 L1400,80"
        />
      </svg>
    </div>
  );
}
