"use client";
import { useEffect, useRef } from "react";

/**
 * Conteúdo do hero: some suavemente e desliza de leve conforme a página rola.
 * Também apaga cedo o indicador "role para explorar" e o ECG do rodapé do
 * hero, para o texto nunca se sobrepor a eles durante a saída.
 *
 * O listener de scroll só fica ligado enquanto o hero está perto da tela —
 * sem esse corte ele rodava para sempre, cobrando um custo pequeno mas
 * constante em toda rolagem da página, até no rodapé.
 */
export default function HeroParallax({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const secao = el?.parentElement;
    if (!el || !secao) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cue = secao.querySelector<HTMLElement>(".scroll-cue");
    const ecg = secao.querySelector<HTMLElement>(".hero2-ecg");

    let raf = 0;
    const aplicar = () => {
      const y = window.scrollY;
      el.style.opacity = String(Math.max(0, 1 - y / 360));
      el.style.transform = `translate3d(0, ${Math.min(y * 0.12, 60)}px, 0)`;
      if (cue) cue.style.opacity = String(Math.max(0, 0.85 - y / 160));
      if (ecg) ecg.style.opacity = String(Math.max(0, 0.55 - y / 420));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(aplicar);
    };

    let ligado = false;
    const ligar = () => {
      if (ligado) return;
      ligado = true;
      window.addEventListener("scroll", onScroll, { passive: true });
    };
    const desligar = () => {
      if (!ligado) return;
      ligado = false;
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? ligar() : desligar()),
      { rootMargin: "500px 0px" }
    );
    io.observe(secao);
    aplicar();

    return () => {
      desligar();
      io.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className="container hero-content" style={{ padding: "90px 24px" }}>
      {children}
    </div>
  );
}
