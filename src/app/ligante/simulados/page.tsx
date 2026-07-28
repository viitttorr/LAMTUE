import { exigirLigante } from "@/lib/auth";
import { db, TEMAS } from "@/lib/db";
import { gerarSimulado } from "@/app/actions/ligante";
import { fmtData } from "@/lib/util";
import Link from "next/link";

export default async function SimuladosPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const s = await exigirLigante();
  const { erro } = await searchParams;
  const historico = (await db().prepare(
    "SELECT id, tema, dificuldade, score, criado_em, finalizado_em FROM simulados WHERE user_id = ? ORDER BY id DESC LIMIT 30"
  ).all(s.id)) as { id: number; tema: string; dificuldade: string; score: number | null; criado_em: string; finalizado_em: string | null }[];
  const temIA = !!process.env.ANTHROPIC_API_KEY;

  return (
    <>
      <h1 className="page-title">Simulados</h1>
      <p className="page-sub">
        Questões {temIA ? "geradas por inteligência artificial" : "do banco de questões da liga"} sobre os temas da LAMTUE.
      </p>
      {erro && <div className="alert alert-red">{erro}</div>}

      <div className="card" style={{ borderColor: "rgba(56,189,248,0.3)" }}>
        <h3 style={{ fontSize: 17 }}>Novo simulado</h3>
        <form action={gerarSimulado}>
          <div className="grid3" style={{ gap: 14 }}>
            <div>
              <label className="label">Tema</label>
              <select className="input" name="tema" required defaultValue="">
                <option value="" disabled>Selecione o tema</option>
                {TEMAS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Questões</label>
              <select className="input" name="quantidade" defaultValue="5">
                {[3, 5, 8, 10, 15, 20].map((n) => <option key={n} value={n}>{n} questões</option>)}
              </select>
            </div>
            <div>
              <label className="label">Dificuldade</label>
              <select className="input" name="dificuldade" defaultValue="media">
                <option value="facil">Fácil</option>
                <option value="media">Média</option>
                <option value="dificil">Difícil</option>
              </select>
            </div>
          </div>
          <button className="btn btn-primary mt-3" type="submit">Gerar simulado</button>
          <span className="small" style={{ marginLeft: 12 }}>A geração pode levar alguns segundos.</span>
        </form>
      </div>

      <h3 style={{ fontSize: 17, margin: "30px 0 12px" }}>Seu histórico</h3>
      {historico.length === 0 ? (
        <p className="muted">Você ainda não fez nenhum simulado.</p>
      ) : (
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>Tema</th><th>Dificuldade</th><th>Data</th><th>Resultado</th><th></th></tr></thead>
            <tbody>
              {historico.map((h) => (
                <tr key={h.id}>
                  <td>{h.tema}</td>
                  <td className="muted" style={{ textTransform: "capitalize" }}>{h.dificuldade}</td>
                  <td className="muted">{fmtData(h.criado_em, true)}</td>
                  <td>
                    {h.score === null ? (
                      <span className="badge badge-amber">Em andamento</span>
                    ) : (
                      <span className={`badge ${h.score >= 70 ? "badge-green" : h.score >= 50 ? "badge-amber" : "badge-red"}`}>{h.score}%</span>
                    )}
                  </td>
                  <td><Link className="btn btn-sm" href={`/ligante/simulados/${h.id}`}>{h.score === null ? "Continuar" : "Revisar"}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
