import { exigirDiretoria } from "@/lib/auth";
import { db, TEMAS } from "@/lib/db";
import { salvarQuestao, moderarQuestao } from "@/app/actions/diretoria";

export default async function QuestoesPage() {
  await exigirDiretoria();
  const pendentes = db().prepare("SELECT * FROM questoes WHERE aprovada = 0 ORDER BY id DESC").all() as
    { id: number; tema: string; dificuldade: string; enunciado: string; alternativas: string; correta: number; comentario: string | null }[];
  const totais = db().prepare(
    "SELECT tema, COUNT(*) AS n, SUM(CASE WHEN origem='ia' THEN 1 ELSE 0 END) AS ia FROM questoes WHERE aprovada = 1 GROUP BY tema ORDER BY tema"
  ).all() as { tema: string; n: number; ia: number }[];

  return (
    <>
      <h1 className="page-title">Banco de Questões</h1>
      <p className="page-sub">Questões manuais entram aprovadas; questões geradas por IA aguardam sua revisão.</p>

      <div className="grid2" style={{ alignItems: "start" }}>
        <div className="card">
          <h3 style={{ fontSize: 16 }}>Nova questão manual</h3>
          <form action={salvarQuestao}>
            <div className="grid2" style={{ gap: 12 }}>
              <div>
                <label className="label">Tema *</label>
                <select className="input" name="tema" required defaultValue="">
                  <option value="" disabled>Selecione</option>
                  {TEMAS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Dificuldade</label>
                <select className="input" name="dificuldade" defaultValue="media">
                  <option value="facil">Fácil</option><option value="media">Média</option><option value="dificil">Difícil</option>
                </select>
              </div>
            </div>
            <label className="label">Enunciado *</label>
            <textarea className="input" name="enunciado" rows={3} required />
            {[0, 1, 2, 3].map((i) => (
              <div key={i}>
                <label className="label">Alternativa {String.fromCharCode(65 + i)} *</label>
                <input className="input" name={`alt_${i}`} required />
              </div>
            ))}
            <div className="grid2" style={{ gap: 12 }}>
              <div>
                <label className="label">Gabarito</label>
                <select className="input" name="correta" defaultValue="0">
                  {[0, 1, 2, 3].map((i) => <option key={i} value={i}>{String.fromCharCode(65 + i)}</option>)}
                </select>
              </div>
            </div>
            <label className="label">Comentário do gabarito</label>
            <textarea className="input" name="comentario" rows={2} />
            <button className="btn btn-primary btn-sm mt-2" type="submit">Adicionar ao banco</button>
          </form>
        </div>

        <div>
          <div className="card">
            <h3 style={{ fontSize: 16 }}>Questões aprovadas por tema</h3>
            {totais.length === 0 && <p className="muted mt-1" style={{ fontSize: 14 }}>Banco vazio. As questões geradas por IA nos simulados aparecerão aqui para revisão.</p>}
            <div className="mt-1" style={{ display: "grid", gap: 6 }}>
              {totais.map((t) => (
                <div key={t.tema} className="flex-between" style={{ fontSize: 14 }}>
                  <span>{t.tema}</span>
                  <span className="flex" style={{ gap: 6 }}>
                    <span className="badge badge-blue">{t.n} questões</span>
                    {t.ia > 0 && <span className="badge">{t.ia} de IA</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <h3 style={{ fontSize: 16, margin: "24px 0 10px" }}>
            Revisão de questões geradas por IA {pendentes.length > 0 && <span className="badge badge-amber">{pendentes.length} pendente(s)</span>}
          </h3>
          {pendentes.length === 0 && <p className="muted" style={{ fontSize: 14 }}>Nenhuma questão aguardando revisão.</p>}
          {pendentes.map((q) => {
            const alts: string[] = JSON.parse(q.alternativas);
            return (
              <div key={q.id} className="card mb-2" style={{ borderColor: "rgba(251,191,36,0.3)" }}>
                <div className="flex" style={{ gap: 8 }}>
                  <span className="badge">{q.tema}</span>
                  <span className="badge" style={{ textTransform: "capitalize" }}>{q.dificuldade}</span>
                </div>
                <p className="mt-1" style={{ fontSize: 14.5, fontWeight: 600 }}>{q.enunciado}</p>
                <div className="mt-1" style={{ display: "grid", gap: 4, fontSize: 13.5 }}>
                  {alts.map((a, i) => (
                    <div key={i} style={{ color: i === q.correta ? "var(--green)" : "var(--text-2)" }}>
                      <strong>{String.fromCharCode(65 + i)})</strong> {a} {i === q.correta && "✓"}
                    </div>
                  ))}
                </div>
                {q.comentario && <p className="small mt-1">{q.comentario}</p>}
                <div className="flex mt-2" style={{ gap: 8 }}>
                  <form action={moderarQuestao}>
                    <input type="hidden" name="id" value={q.id} />
                    <input type="hidden" name="acao" value="aprovar" />
                    <button className="btn btn-sm btn-blue" type="submit">Aprovar</button>
                  </form>
                  <form action={moderarQuestao}>
                    <input type="hidden" name="id" value={q.id} />
                    <input type="hidden" name="acao" value="excluir" />
                    <button className="btn btn-sm btn-danger" type="submit">Excluir</button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
