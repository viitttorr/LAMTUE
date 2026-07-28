import { exigirLigante } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import SimuladoRunner from "@/components/SimuladoRunner";

type Q = { enunciado: string; alternativas: string[]; correta: number; comentario: string };

export default async function SimuladoPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ origem?: string }> }) {
  const s = await exigirLigante();
  const { id } = await params;
  const { origem } = await searchParams;
  const sim = (await db().prepare("SELECT * FROM simulados WHERE id = ? AND user_id = ?").get(Number(id), s.id)) as
    | { id: number; tema: string; dificuldade: string; questoes: string; respostas: string | null; score: number | null; finalizado_em: string | null }
    | undefined;
  if (!sim) notFound();
  const questoes: Q[] = JSON.parse(sim.questoes);

  if (!sim.finalizado_em) {
    return (
      <>
        <h1 className="page-title">Simulado — {sim.tema}</h1>
        <p className="page-sub" style={{ textTransform: "capitalize" }}>Dificuldade: {sim.dificuldade}</p>
        {origem === "banco" && (
          <div className="alert alert-blue" style={{ maxWidth: 760 }}>
            Estas questões vieram do banco de questões da liga (a geração por IA não está configurada).
          </div>
        )}
        <SimuladoRunner
          simuladoId={sim.id}
          questoes={questoes.map((q) => ({ enunciado: q.enunciado, alternativas: q.alternativas }))}
        />
      </>
    );
  }

  const respostas: number[] = sim.respostas ? JSON.parse(sim.respostas) : [];
  const acertos = questoes.filter((q, i) => respostas[i] === q.correta).length;

  return (
    <>
      <h1 className="page-title">Resultado — {sim.tema}</h1>
      <p className="page-sub">Gabarito comentado do seu simulado.</p>
      <div className="card" style={{ maxWidth: 760, textAlign: "center", borderColor: sim.score! >= 70 ? "rgba(52,211,153,0.4)" : "rgba(226,83,111,0.4)" }}>
        <div className="stat-num" style={{ fontSize: 46, color: sim.score! >= 70 ? "var(--green)" : sim.score! >= 50 ? "var(--amber)" : "var(--red-bright)" }}>
          {sim.score}%
        </div>
        <div className="muted">{acertos} de {questoes.length} questões corretas</div>
        <div className={`progress mt-2 ${sim.score! >= 70 ? "green" : ""}`} style={{ maxWidth: 320, margin: "14px auto 0" }}>
          <span style={{ width: `${sim.score}%` }} />
        </div>
      </div>

      {questoes.map((q, i) => {
        const minha = respostas[i];
        const acertou = minha === q.correta;
        return (
          <div key={i} className="card mt-2" style={{ maxWidth: 760, borderColor: acertou ? "rgba(52,211,153,0.3)" : "rgba(226,83,111,0.3)" }}>
            <div className="flex-between">
              <span className="badge">Questão {i + 1}</span>
              <span className={`badge ${acertou ? "badge-green" : "badge-red"}`}>{acertou ? "Acertou" : "Errou"}</span>
            </div>
            <p className="mt-2" style={{ fontWeight: 600 }}>{q.enunciado}</p>
            <div className="mt-2" style={{ display: "grid", gap: 8 }}>
              {q.alternativas.map((a, j) => (
                <div
                  key={j}
                  className="glass"
                  style={{
                    padding: "10px 14px", fontSize: 14,
                    border: j === q.correta ? "1px solid rgba(52,211,153,0.55)" : j === minha ? "1px solid rgba(226,83,111,0.55)" : "1px solid var(--border)",
                    background: j === q.correta ? "rgba(52,211,153,0.07)" : j === minha ? "rgba(139,21,56,0.1)" : undefined,
                  }}
                >
                  <strong style={{ marginRight: 8, color: j === q.correta ? "var(--green)" : j === minha ? "var(--red-bright)" : "var(--text-3)" }}>
                    {String.fromCharCode(65 + j)}
                  </strong>
                  {a}
                  {j === q.correta && <span className="small" style={{ color: "var(--green)", marginLeft: 8 }}>✓ gabarito</span>}
                  {j === minha && j !== q.correta && <span className="small" style={{ color: "var(--red-bright)", marginLeft: 8 }}>sua resposta</span>}
                </div>
              ))}
            </div>
            {q.comentario && (
              <div className="alert alert-blue mt-2" style={{ marginBottom: 0 }}>
                <strong>Comentário:</strong> {q.comentario}
              </div>
            )}
          </div>
        );
      })}
      <div className="mt-3" style={{ maxWidth: 760, display: "flex", gap: 12 }}>
        <Link href="/ligante/simulados" className="btn btn-primary">Novo simulado</Link>
        <Link href="/ligante/trilha" className="btn">Ver trilha de aprendizado</Link>
      </div>
    </>
  );
}
