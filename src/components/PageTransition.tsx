"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const VEIL_PATH =
  "M0,22 L60,22 L70,22 L78,10 L86,32 L94,22 L150,22 L158,18 L166,22 L230,22 L240,6 L252,38 L262,22 L300,22";

/** Tempo mínimo com o véu visível, para a transição ser perceptível. */
const MIN_VISIVEL = 600;

/**
 * Véu curto de transição entre rotas, com a identidade do loader (ECG).
 * Não intercepta a navegação: o <Link> do Next continua fazendo a troca SPA
 * (URL, histórico, voltar/avançar preservados). Aqui apenas exibimos o véu
 * ao clicar em um link interno e o recolhemos quando a nova rota renderiza —
 * respeitando uma duração mínima para o efeito ser visível.
 * Com prefers-reduced-motion, o véu vira um fade simples (sem ECG animado,
 * via CSS) e mais curto.
 */
export default function PageTransition() {
  const pathname = usePathname();
  const [ativo, setAtivo] = useState(false);
  const inicio = useRef(0);
  const failsafe = useRef(0);
  const saida = useRef(0);
  const ultimaRota = useRef(pathname);

  useEffect(() => {
    // Fase de captura: o <Link> do Next chama preventDefault no alvo para
    // navegar via SPA; em bubbling o clique chegaria aqui já "consumido".
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href") || "";
      if (!href.startsWith("/") || href.startsWith("/api/")) return;
      if (a.target && a.target !== "_self") return;
      if (a.hasAttribute("download")) return;
      const destino = new URL(a.href, location.href);
      if (destino.pathname === location.pathname) return; // âncoras e rota atual
      inicio.current = performance.now();
      setAtivo(true);
      clearTimeout(failsafe.current);
      failsafe.current = window.setTimeout(() => setAtivo(false), 5000);
    };
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimeout(failsafe.current);
      clearTimeout(saida.current);
    };
  }, []);

  useEffect(() => {
    if (ultimaRota.current === pathname) return;
    ultimaRota.current = pathname;
    clearTimeout(failsafe.current);
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const minimo = reduzido ? 200 : MIN_VISIVEL;
    const decorrido = performance.now() - inicio.current;
    const restante = Math.max(80, minimo - decorrido);
    clearTimeout(saida.current);
    saida.current = window.setTimeout(() => setAtivo(false), restante);
    return () => clearTimeout(saida.current);
  }, [pathname]);

  return (
    <div className={`route-veil${ativo ? " active" : ""}`} aria-hidden>
      <svg className="veil-ecg" viewBox="0 0 300 44" preserveAspectRatio="none">
        <path d={VEIL_PATH} />
      </svg>
      <span className="veil-dot" />
    </div>
  );
}
