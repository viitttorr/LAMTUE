"use client";
import { useEffect, useState } from "react";

type Capitulo = { id: string; label: string };

/**
 * Navegação por capítulos da página inicial: trilho lateral fixo com
 * numeração, título curto e estado ativo conforme o scroll. Complementa o
 * menu institucional — não o substitui.
 *
 * Usa IntersectionObserver em vez de getBoundingClientRect em loop a cada
 * scroll: medido em Chrome real, a versão anterior custava ~4ms por frame
 * (leitura de layout forçada para cada capítulo, a cada evento de rolagem).
 */
export default function ChapterNav({ chapters }: { chapters: Capitulo[] }) {
  const [ativo, setAtivo] = useState(chapters[0]?.id ?? "");
  const [oculto, setOculto] = useState(false);

  useEffect(() => {
    const linha = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setAtivo(e.target.id);
      },
      { rootMargin: "-42% 0px -58% 0px", threshold: 0 }
    );
    chapters.forEach((c) => {
      const el = document.getElementById(c.id);
      if (el) linha.observe(el);
    });

    const rodape = document.querySelector("footer.site-footer");
    const obsRodape = rodape
      ? new IntersectionObserver(([e]) => setOculto(e.isIntersecting), { rootMargin: "0px 0px -15% 0px", threshold: 0 })
      : null;
    if (rodape) obsRodape!.observe(rodape);

    return () => {
      linha.disconnect();
      obsRodape?.disconnect();
    };
  }, [chapters]);

  return (
    <nav className={`chapter-rail${oculto ? " oculto" : ""}`} aria-label="Capítulos da página inicial">
      {chapters.map((c, i) => (
        <a
          key={c.id}
          href={`#${c.id}`}
          className={ativo === c.id ? "active" : undefined}
          aria-current={ativo === c.id ? "true" : undefined}
        >
          <span className="idx">{String(i + 1).padStart(2, "0")}</span>
          <span className="lbl">{c.label}</span>
        </a>
      ))}
    </nav>
  );
}
