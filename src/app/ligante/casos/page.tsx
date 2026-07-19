import { exigirLigante } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function CasosLigantePage() {
  const s = await exigirLigante();
  const casos = db().prepare("SELECT id, titulo, tema, contexto, visibilidade FROM casos ORDER BY id DESC").all() as
    { id: number; titulo: string; tema: string; contexto: string; visibilidade: string }[];
  const feitos = db().prepare(
    "SELECT caso_id, MAX(acertos * 100.0 / total) AS melhor FROM casos_resultados WHERE user_id = ? GROUP BY caso_id"
  ).all(s.id) as { caso_id: number; melhor: number }[];
  const melhorPor = new Map(feitos.map((f) => [f.caso_id, Math.round(f.melhor)]));

  return (
    <>
      <h1 className="page-title">Casos Clínicos Interativos</h1>
      <p className="page-sub">Simulações de atendimento com decisões em etapas e feedback imediato.</p>
      <div className="grid2">
        {casos.length === 0 && <p className="muted">A diretoria ainda não publicou casos clínicos.</p>}
        {casos.map((c) => (
          <Link key={c.id} href={`/ligante/casos/${c.id}`} className="card hoverable" style={{ display: "block" }}>
            <div className="flex-between">
              <span className="badge badge-red">{c.tema}</span>
              {melhorPor.has(c.id) && <span className="badge badge-green">Melhor: {melhorPor.get(c.id)}%</span>}
            </div>
            <h3 style={{ fontSize: 17, margin: "12px 0 6px" }}>{c.titulo}</h3>
            <p className="muted" style={{ fontSize: 14, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {c.contexto}
            </p>
            <div className="small mt-2" style={{ color: "var(--blue)" }}>Iniciar atendimento →</div>
          </Link>
        ))}
      </div>
    </>
  );
}
