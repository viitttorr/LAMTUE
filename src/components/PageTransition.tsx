"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const VEIL_PATH =
  "M0,22 L60,22 L70,22 L78,10 L86,32 L94,22 L150,22 L158,18 L166,22 L230,22 L240,6 L252,38 L262,22 L300,22";

/**
 * Véu curto de transição entre rotas, com a identidade do loader (ECG).
 * Não intercepta a navegação: o <Link> do Next continua fazendo a troca SPA
 * (URL, histórico, voltar/avançar preservados). Aqui apenas exibimos o véu
 * ao clicar em um link interno e o recolhemos quando a nova rota renderiza.
 */
export default function PageTransition() {
  const pathname = usePathname();
  const [ativo, setAtivo] = useState(false);
  const failsafe = useRef(0);
  const ultimaRota = useRef(pathname);

  useEffect(() => {
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const onClick = (e: MouseEvent) => {
      if (reduzido || e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href") || "";
      if (!href.startsWith("/") || href.startsWith("/api/")) return;
      if (a.target && a.target !== "_self") return;
      if (a.hasAttribute("download")) return;
      const destino = new URL(a.href, location.href);
      if (destino.pathname === location.pathname) return; // âncoras e rota atual
      setAtivo(true);
      clearTimeout(failsafe.current);
      failsafe.current = window.setTimeout(() => setAtivo(false), 5000);
    };
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      clearTimeout(failsafe.current);
    };
  }, []);

  useEffect(() => {
    if (ultimaRota.current === pathname) return;
    ultimaRota.current = pathname;
    clearTimeout(failsafe.current);
    const t = window.setTimeout(() => setAtivo(false), 220);
    return () => clearTimeout(t);
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
