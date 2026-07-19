import { exigirLigante } from "@/lib/auth";
import { db, frequenciaDe } from "@/lib/db";
import { fmtData } from "@/lib/util";

export default async function PresencasPage() {
  const s = await exigirLigante();
  const freq = frequenciaDe(s.id);
  const rows = db().prepare(
    `SELECT a.titulo, a.tema, a.data, p.presente, p.registrado_em
     FROM presencas p JOIN aulas a ON a.id = p.aula_id
     WHERE p.user_id = ? ORDER BY a.data DESC`
  ).all(s.id) as { titulo: string; tema: string | null; data: string; presente: number; registrado_em: string }[];

  // agrupa por semestre (AAAA/1 ou AAAA/2)
  const porSemestre = new Map<string, typeof rows>();
  for (const r of rows) {
    const sem = `${r.data.slice(0, 4)}/${Number(r.data.slice(5, 7)) <= 6 ? 1 : 2}`;
    if (!porSemestre.has(sem)) porSemestre.set(sem, []);
    porSemestre.get(sem)!.push(r);
  }

  return (
    <>
      <h1 className="page-title">Histórico de Presenças</h1>
      <p className="page-sub">
        Frequência geral: <strong style={{ color: freq.elegivel || freq.total === 0 ? "var(--green)" : "var(--red-bright)" }}>{freq.pct}%</strong>{" "}
        ({freq.presentes} presenças em {freq.total} aulas com chamada) · mínimo para certificação: 2/3
      </p>
      {rows.length === 0 && <div className="card"><p className="muted">Nenhuma chamada registrada ainda.</p></div>}
      {[...porSemestre.entries()].map(([sem, aulas]) => {
        const presentes = aulas.filter((a) => a.presente).length;
        return (
          <div key={sem} className="mb-3">
            <div className="flex-between mb-2">
              <h3 style={{ fontSize: 17 }}>Semestre {sem}</h3>
              <span className="badge badge-blue">{presentes}/{aulas.length} presenças</span>
            </div>
            <div className="table-wrap">
              <table className="tbl">
                <thead><tr><th>Aula</th><th>Tema</th><th>Data</th><th>Situação</th></tr></thead>
                <tbody>
                  {aulas.map((a, i) => (
                    <tr key={i}>
                      <td>{a.titulo}</td>
                      <td className="muted">{a.tema ?? "—"}</td>
                      <td>{fmtData(a.data)}</td>
                      <td>{a.presente ? <span className="badge badge-green">Presente</span> : <span className="badge badge-red">Falta</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </>
  );
}
