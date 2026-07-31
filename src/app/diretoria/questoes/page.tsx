import { exigirDiretoria } from "@/lib/auth";
import { db, TEMAS } from "@/lib/db";
import { salvarQuestao, moderarQuestao, importarQuestoes } from "@/app/actions/diretoria";
import TemaSelect from "@/components/TemaSelect";
import Link from "next/link";
import FormAcao from "@/components/FormAcao";

export default async function QuestoesPage({ searchParams }: { searchParams: Promise<{ tema?: string }> }) {
  await exigirDiretoria();
  const { tema: temaFiltro } = await searchParams;
  const pendentes = (await db().prepare("SELECT * FROM questoes WHERE aprovada = 0 ORDER BY id DESC").all()) as
    { id: number; tema: string; dificuldade: string; enunciado: string; alternativas: string; correta: number; comentario: string | null }[];
  const totais = (await db().prepare(
    "SELECT tema, COUNT(*) AS n, SUM(CASE WHEN origem='ia' THEN 1 ELSE 0 END) AS ia FROM questoes WHERE aprovada = 1 GROUP BY tema ORDER BY tema"
  ).all()) as { tema: string; n: number; ia: number }[];
  const aprovadasDoTema = temaFiltro
    ? ((await db().prepare("SELECT * FROM questoes WHERE aprovada = 1 AND tema = ? ORDER BY id DESC").all(temaFiltro)) as
        { id: number; tema: string; dificuldade: string; enunciado: string; alternativas: string; correta: number; comentario: string | null }[])
    : [];

  return (
    <>
      <h1 className="page-title">Banco de Questões</h1>
      <p className="page-sub">Questões manuais entram aprovadas; questões geradas por IA aguardam sua revisão.</p>

      <div className="card mb-3">
        <h3 style={{ fontSize: 16 }}>Importar questões em massa (CSV)</h3>
        <p className="small mt-1">
          Colunas: <code>tema;dificuldade;enunciado;alt_a;alt_b;alt_c;alt_d;correta;comentario</code> — separadas por{" "}
          <code>;</code>, uma linha por questão (cabeçalho opcional). <code>correta</code> aceita A/B/C/D ou 0-3.
          Entram já aprovadas.
        </p>
        <FormAcao action={importarQuestoes}>
          <label className="label">Arquivo CSV</label>
          <input className="input" type="file" name="csv" accept=".csv,text/csv" required />
          <button className="btn btn-blue btn-sm mt-2" type="submit">Importar em massa</button>
        </FormAcao>
      </div>

      <div className="grid2" style={{ alignItems: "start" }}>
        <div className="card">
          <h3 style={{ fontSize: 16 }}>Nova questão manual</h3>
          <FormAcao action={salvarQuestao}>
            <div className="grid2" style={{ gap: 12 }}>
              <div>
                <label className="label">Tema *</label>
                <TemaSelect name="tema" temas={TEMAS} required />
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
          </FormAcao>
        </div>

        <div>
          <div className="card">
            <h3 style={{ fontSize: 16 }}>Questões aprovadas por tema</h3>
            {totais.length === 0 && <p className="muted mt-1" style={{ fontSize: 14 }}>Banco vazio. As questões geradas por IA nos simulados aparecerão aqui para revisão.</p>}
            <div className="mt-1" style={{ display: "grid", gap: 6 }}>
              {totais.map((t) => (
                <Link
                  key={t.tema}
                  href={temaFiltro === t.tema ? "/diretoria/questoes" : `/diretoria/questoes?tema=${encodeURIComponent(t.tema)}`}
                  className="flex-between hoverable"
                  style={{ fontSize: 14, padding: "4px 0", color: "inherit", textDecoration: "none" }}
                >
                  <span style={{ fontWeight: temaFiltro === t.tema ? 700 : 400 }}>{t.tema}</span>
                  <span className="flex" style={{ gap: 6 }}>
                    <span className="badge badge-blue">{t.n} questões</span>
                    {t.ia > 0 && <span className="badge">{t.ia} de IA</span>}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {temaFiltro && (
            <div className="mt-2">
              <div className="flex-between">
                <h3 style={{ fontSize: 16 }}>Questões aprovadas — {temaFiltro}</h3>
                <Link href="/diretoria/questoes" className="small" style={{ color: "var(--blue)" }}>Fechar ✕</Link>
              </div>
              {aprovadasDoTema.length === 0 && <p className="muted mt-1" style={{ fontSize: 14 }}>Nenhuma questão aprovada neste tema.</p>}
              {aprovadasDoTema.map((q) => {
                const alts: string[] = JSON.parse(q.alternativas);
                return (
                  <div key={q.id} className="card mt-2">
                    <div className="flex" style={{ gap: 8 }}>
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
                    <FormAcao action={moderarQuestao} className="mt-2">
                      <input type="hidden" name="id" value={q.id} />
                      <input type="hidden" name="acao" value="excluir" />
                      <button className="btn btn-sm btn-danger" type="submit">Excluir</button>
                    </FormAcao>
                  </div>
                );
              })}
            </div>
          )}

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
                  <FormAcao action={moderarQuestao}>
                    <input type="hidden" name="id" value={q.id} />
                    <input type="hidden" name="acao" value="aprovar" />
                    <button className="btn btn-sm btn-blue" type="submit">Aprovar</button>
                  </FormAcao>
                  <FormAcao action={moderarQuestao}>
                    <input type="hidden" name="id" value={q.id} />
                    <input type="hidden" name="acao" value="excluir" />
                    <button className="btn btn-sm btn-danger" type="submit">Excluir</button>
                  </FormAcao>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
