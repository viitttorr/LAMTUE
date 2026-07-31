import { exigirDiretoria } from "@/lib/auth";
import { db } from "@/lib/db";
import { confirmarChamada } from "@/app/actions/diretoria";
import { fmtData } from "@/lib/util";
import Link from "next/link";
import FormAcao from "@/components/FormAcao";

export default async function FrequenciaPage({ searchParams }: { searchParams: Promise<{ aula?: string }> }) {
  await exigirDiretoria();
  const { aula: aulaParam } = await searchParams;
  const aulas = (await db().prepare("SELECT id, titulo, data FROM aulas ORDER BY data DESC").all()) as { id: number; titulo: string; data: string }[];
  const aulaId = Number(aulaParam) || aulas[0]?.id;
  const ligantes = (await db().prepare("SELECT id, nome, matricula FROM users WHERE role='ligante' AND ativo=1 ORDER BY nome").all()) as
    { id: number; nome: string; matricula: string | null }[];
  const marcadas = aulaId
    ? new Map(((await db().prepare("SELECT user_id, presente FROM presencas WHERE aula_id = ?").all(aulaId)) as { user_id: number; presente: number }[]).map((p) => [p.user_id, p.presente]))
    : new Map<number, number>();
  const jaTemChamada = marcadas.size > 0;

  return (
    <>
      <h1 className="page-title">Gestão de Frequência</h1>
      <p className="page-sub">Selecione a aula, marque as presenças e confirme. Os ligantes presentes são notificados automaticamente.</p>

      {aulas.length === 0 ? (
        <div className="card">
          <p className="muted">Nenhuma aula cadastrada. <Link href="/diretoria/aulas" style={{ color: "var(--blue)" }}>Cadastre uma aula</Link> para registrar a chamada.</p>
        </div>
      ) : (
        <>
          <div className="card mb-2" style={{ padding: 18 }}>
            <form method="get" className="flex" style={{ flexWrap: "wrap" }}>
              <label className="label" style={{ margin: 0 }}>Aula:</label>
              <select className="input" name="aula" defaultValue={aulaId} style={{ maxWidth: 420 }}>
                {aulas.map((a) => (
                  <option key={a.id} value={a.id}>{fmtData(a.data)} — {a.titulo}</option>
                ))}
              </select>
              <button className="btn btn-sm" type="submit">Selecionar</button>
              {jaTemChamada && <span className="badge badge-blue">Chamada já registrada — edite e reconfirme se necessário</span>}
            </form>
          </div>

          {ligantes.length === 0 ? (
            <div className="card"><p className="muted">Nenhum ligante ativo cadastrado.</p></div>
          ) : (
            <FormAcao action={confirmarChamada}>
              <input type="hidden" name="aula_id" value={aulaId} />
              <div className="table-wrap">
                <table className="tbl">
                  <thead><tr><th style={{ width: 60 }}>Presente</th><th>Ligante</th><th>Matrícula</th></tr></thead>
                  <tbody>
                    {ligantes.map((l) => (
                      <tr key={l.id}>
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="checkbox"
                            name={`p_${l.id}`}
                            defaultChecked={marcadas.get(l.id) === 1}
                            style={{ width: 19, height: 19, accentColor: "#a01d43", cursor: "pointer" }}
                          />
                        </td>
                        <td>{l.nome}</td>
                        <td className="muted">{l.matricula ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="btn btn-primary mt-3" type="submit">
                Confirmar chamada e notificar presentes
              </button>
            </FormAcao>
          )}
        </>
      )}
    </>
  );
}
