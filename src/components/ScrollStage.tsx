"use client";
import { useEffect, useRef } from "react";

/**
 * Palco de fundo da home: camadas gráficas fixas cujo movimento é dirigido
 * pelo progresso da rolagem — profundidade 2.5D sem imagens externas, só
 * transform/opacity. Além da grade, feixes e anéis, três cenas temáticas se
 * alternam conforme a página desce: hélice de DNA, retículo molecular e um
 * alvo de precisão. Desliga-se com prefers-reduced-motion.
 */

// Hélice de DNA gerada uma única vez em escopo de módulo (idêntica no
// servidor e no cliente — sem risco de divergência na hidratação).
function gerarDNA() {
  const A = 46, k = Math.PI / 110, cx = 80;
  let fita1 = "", fita2 = "";
  const degraus: { x1: number; x2: number; y: number }[] = [];
  for (let y = 0; y <= 900; y += 6) {
    const x1 = cx + A * Math.sin(k * y);
    const x2 = cx + A * Math.sin(k * y + Math.PI);
    fita1 += `${y === 0 ? "M" : "L"}${x1.toFixed(1)},${y}`;
    fita2 += `${y === 0 ? "M" : "L"}${x2.toFixed(1)},${y}`;
  }
  for (let y = 24; y <= 880; y += 44) {
    degraus.push({ x1: cx + A * Math.sin(k * y), x2: cx + A * Math.sin(k * y + Math.PI), y });
  }
  return { fita1, fita2, degraus };
}
const DNA = gerarDNA();

function hexPontos(cx: number, cy: number, r: number) {
  const p: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    p.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return p.join(" ");
}
const HEXAGONOS = [
  { cx: 120, cy: 110, r: 52 },
  { cx: 210, cy: 162, r: 52 },
  { cx: 210, cy: 58, r: 52 },
  { cx: 300, cy: 110, r: 52 },
];
const NOS = HEXAGONOS.flatMap((h) =>
  [0, 2, 4].map((i) => {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    return { x: h.cx + h.r * Math.cos(a), y: h.cy + h.r * Math.sin(a) };
  })
);

/** Janela de visibilidade suave: 1 dentro de [a,b], rampa de 0.07 nas bordas. */
const janela = (p: number, a: number, b: number) =>
  Math.max(0, Math.min(1, Math.min(p - a, b - p) / 0.07));

export default function ScrollStage() {
  const ref = useRef<HTMLDivElement>(null);
  const ecgRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const raiz = ref.current;
    if (!raiz) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const q = (sel: string) => raiz.querySelector<HTMLElement>(sel);
    const grid = q(".stage-grid");
    const beamA = q(".stage-beam.azul");
    const beamB = q(".stage-beam.rubro");
    const rings = q(".stage-rings");
    const glowFrio = q(".stage-glow.frio");
    const dna = q(".stage-dna");
    const molecula = q(".stage-molecula");
    const alvo = q(".stage-alvo");
    const path = ecgRef.current;
    const len = path ? path.getTotalLength() : 0;
    if (path) {
      path.style.strokeDasharray = `${len}`;
      path.style.strokeDashoffset = `${len}`;
    }

    // Cada cena temática só fica visível numa fração do percurso — na maior
    // parte da rolagem sua opacidade-alvo é 0. Evitar escrever estilo quando
    // já estava e continua invisível corta a maioria dos frames pela metade.
    const ultimo: Record<string, number> = { rings: -1, dna: -1, molecula: -1, alvo: -1 };
    const aplicarCena = (nome: string, el: HTMLElement | null, opacidade: number, transformar: () => string) => {
      if (!el) return;
      if (opacidade < 0.004 && ultimo[nome] < 0.004) {
        ultimo[nome] = opacidade;
        return;
      }
      ultimo[nome] = opacidade;
      el.style.opacity = opacidade.toFixed(3);
      el.style.transform = transformar();
    };

    let raf = 0;
    let ultimoOffset = -1;
    const cena = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (grid) grid.style.transform = `translate3d(0, ${(-p * 150).toFixed(1)}px, 0)`;
      if (beamA) beamA.style.transform = `rotate(${(8 + p * 26).toFixed(2)}deg) translate3d(0, ${(p * 260).toFixed(1)}px, 0)`;
      if (beamB) beamB.style.transform = `rotate(${(-6 - p * 20).toFixed(2)}deg) translate3d(0, ${(-p * 220).toFixed(1)}px, 0)`;
      if (glowFrio) glowFrio.style.opacity = `${(0.25 + Math.sin(p * Math.PI) * 0.75).toFixed(3)}`;
      aplicarCena("rings", rings, Math.max(0, 1 - p / 0.3), () =>
        `translate3d(${(-p * 30).toFixed(2)}vw, ${(140 - p * 380).toFixed(1)}px, 0) scale(${(1 + p * 0.4).toFixed(3)})`
      );
      aplicarCena("dna", dna, janela(p, 0.16, 0.52) * 0.9, () =>
        `translate3d(0, ${(-120 - p * 320).toFixed(1)}px, 0) rotate(${(p * 10).toFixed(2)}deg)`
      );
      aplicarCena("molecula", molecula, janela(p, 0.44, 0.78) * 0.9, () =>
        `translate3d(0, ${(120 - p * 280).toFixed(1)}px, 0) rotate(${(-6 + p * 14).toFixed(2)}deg)`
      );
      aplicarCena("alvo", alvo, Math.max(0, Math.min(1, (p - 0.74) / 0.08)) * 0.95, () =>
        `scale(${(0.85 + p * 0.25).toFixed(3)}) rotate(${(p * 24).toFixed(2)}deg)`
      );
      // ECG gigante: repintar só quando o avanço for perceptível
      if (path) {
        const off = len * (1 - p);
        if (Math.abs(off - ultimoOffset) > 3) {
          ultimoOffset = off;
          path.style.strokeDashoffset = `${off.toFixed(1)}`;
        }
      }
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
      <svg className="stage-dna" viewBox="0 0 160 900" preserveAspectRatio="xMidYMid meet">
        {DNA.degraus.map((d, i) => (
          <line key={i} x1={d.x1.toFixed(1)} y1={d.y} x2={d.x2.toFixed(1)} y2={d.y} />
        ))}
        <path className="fita1" d={DNA.fita1} />
        <path className="fita2" d={DNA.fita2} />
      </svg>
      <svg className="stage-molecula" viewBox="0 0 420 220" preserveAspectRatio="xMidYMid meet">
        {HEXAGONOS.map((h, i) => (
          <polygon key={i} points={hexPontos(h.cx, h.cy, h.r)} />
        ))}
        {NOS.map((n, i) => (
          <circle key={i} cx={n.x.toFixed(1)} cy={n.y.toFixed(1)} r="4" />
        ))}
      </svg>
      <svg className="stage-alvo" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
        <circle cx="200" cy="200" r="190" />
        <circle cx="200" cy="200" r="132" />
        <circle cx="200" cy="200" r="74" />
        <circle cx="200" cy="200" r="18" className="miolo" />
        <line x1="200" y1="0" x2="200" y2="86" />
        <line x1="200" y1="314" x2="200" y2="400" />
        <line x1="0" y1="200" x2="86" y2="200" />
        <line x1="314" y1="200" x2="400" y2="200" />
      </svg>
      <svg className="stage-ecg" viewBox="0 0 1400 160" preserveAspectRatio="none">
        <path
          ref={ecgRef}
          d="M0,80 L180,80 L200,80 L216,44 L232,116 L248,80 L420,80 L436,68 L452,80 L640,80 L660,18 L684,144 L706,80 L900,80 L916,66 L932,80 L1120,80 L1140,40 L1160,112 L1178,80 L1400,80"
        />
      </svg>
    </div>
  );
}
