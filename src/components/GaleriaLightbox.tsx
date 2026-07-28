"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

export type Foto = { id: number; arquivo_id: number; legenda: string | null };

export default function GaleriaLightbox({ fotos }: { fotos: Foto[] }) {
  const [aberto, setAberto] = useState<number | null>(null);

  useEffect(() => {
    if (aberto === null) return;
    document.documentElement.classList.add("drawer-lock");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(null);
      if (e.key === "ArrowRight") setAberto((i) => (i === null ? i : (i + 1) % fotos.length));
      if (e.key === "ArrowLeft") setAberto((i) => (i === null ? i : (i - 1 + fotos.length) % fotos.length));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.classList.remove("drawer-lock");
      window.removeEventListener("keydown", onKey);
    };
  }, [aberto, fotos.length]);

  return (
    <>
      <div className="foto-grid">
        {fotos.map((f, i) => (
          <button key={f.id} className="foto-item" onClick={() => setAberto(i)} aria-label={f.legenda || `Foto ${i + 1}`}>
            <Image src={`/api/arquivos/${f.arquivo_id}`} alt={f.legenda || ""} fill unoptimized sizes="(max-width: 700px) 50vw, 25vw" />
          </button>
        ))}
      </div>

      {aberto !== null && (
        <div className="lightbox" role="dialog" aria-modal="true">
          <button className="lb-fechar" onClick={() => setAberto(null)} aria-label="Fechar">×</button>
          {fotos.length > 1 && (
            <button className="lb-nav lb-prev" onClick={() => setAberto((aberto - 1 + fotos.length) % fotos.length)} aria-label="Foto anterior">‹</button>
          )}
          <div className="lb-img-wrap">
            <Image
              key={fotos[aberto].id}
              src={`/api/arquivos/${fotos[aberto].arquivo_id}`}
              alt={fotos[aberto].legenda || ""}
              fill
              unoptimized
              sizes="90vw"
              style={{ objectFit: "contain" }}
            />
          </div>
          {fotos.length > 1 && (
            <button className="lb-nav lb-next" onClick={() => setAberto((aberto + 1) % fotos.length)} aria-label="Próxima foto">›</button>
          )}
          <div className="lb-legenda">
            {fotos[aberto].legenda && <span>{fotos[aberto].legenda}</span>}
            {fotos.length > 1 && <span className="lb-contador">{aberto + 1} / {fotos.length}</span>}
          </div>
        </div>
      )}
    </>
  );
}
