import { exigirLigante } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtData } from "@/lib/util";

export default async function MuralPage() {
  await exigirLigante();
  const avisos = db().prepare(
    "SELECT a.*, u.nome AS autor FROM avisos a LEFT JOIN users u ON u.id = a.autor_id ORDER BY a.id DESC"
  ).all() as { id: number; titulo: string; mensagem: string; criado_em: string; autor: string | null }[];

  return (
    <>
      <h1 className="page-title">Mural de Avisos</h1>
      <p className="page-sub">Comunicados oficiais da diretoria.</p>
      <div style={{ maxWidth: 720, display: "grid", gap: 14 }}>
        {avisos.length === 0 && <p className="muted">Nenhum aviso publicado.</p>}
        {avisos.map((a) => (
          <div key={a.id} className="card">
            <div className="flex-between">
              <strong style={{ fontFamily: "var(--font-display)" }}>{a.titulo}</strong>
              <span className="small">{fmtData(a.criado_em, true)}</span>
            </div>
            <p className="muted mt-1" style={{ whiteSpace: "pre-line", fontSize: 14.5 }}>{a.mensagem}</p>
            {a.autor && <div className="small mt-1">— {a.autor}</div>}
          </div>
        ))}
      </div>
    </>
  );
}
