"use client";
import { useEffect, useState } from "react";

type Capitulo = { id: string; label: string };

/**
 * Navegação por capítulos da página inicial: trilho lateral fixo com
 * numeração, título curto e estado ativo conforme o scroll. Complementa o
 * menu institucional — não o substitui.
 */
export default function ChapterNav({ chapters }: { chapters: Capitulo[] }) {
  const [ativo, setAtivo] = useState(chapters[0]?.id ?? "");

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        let atual = chapters[0]?.id ?? "";
        for (const c of chapters) {
          const el = document.getElementById(c.id);
          if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.42) atual = c.id;
        }
        setAtivo(atual);
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
  }, [chapters]);

  return (
    <nav className="chapter-rail" aria-label="Capítulos da página inicial">
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
