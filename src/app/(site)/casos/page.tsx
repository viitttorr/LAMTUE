import { db } from "@/lib/db";
import Link from "next/link";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";

export default function CasosPublicosPage() {
  const casos = db().prepare("SELECT id, titulo, tema, contexto FROM casos WHERE visibilidade='publico' ORDER BY id DESC").all() as
    { id: number; titulo: string; tema: string; contexto: string }[];

  return (
    <div className="container" style={{ padding: "60px 24px 20px" }}>
      <Reveal>
        <div className="eyebrow">Desafie-se</div>
        <h1 className="section-title">Casos Clínicos</h1>
        <p className="muted" style={{ maxWidth: 700 }}>
          Casos liberados pela diretoria para o público. O gabarito comentado e a versão interativa
          ficam disponíveis na área do ligante.
        </p>
      </Reveal>
      <div className="grid2 mt-3">
        {casos.length === 0 && <p className="muted">Nenhum caso público publicado no momento.</p>}
        {casos.map((c, i) => (
          <Reveal key={c.id} delay={i * 70}>
            <Link href={`/casos/${c.id}`} className="card hoverable" style={{ display: "block", height: "100%" }}>
              <span className="badge badge-red">{c.tema}</span>
              <h3 style={{ fontSize: 18, margin: "12px 0 8px" }}>{c.titulo}</h3>
              <p className="muted" style={{ fontSize: 14, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {c.contexto}
              </p>
              <div className="small mt-2" style={{ color: "var(--blue)" }}>Ler o caso →</div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
