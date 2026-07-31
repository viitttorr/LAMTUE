import { exigirDiretoria } from "@/lib/auth";
import { db, TEMAS } from "@/lib/db";
import { salvarAula, excluirAula, lembrarAula } from "@/app/actions/diretoria";
import { fmtData } from "@/lib/util";
import Link from "next/link";
import TemaSelect from "@/components/TemaSelect";
import FormAcao from "@/components/FormAcao";

export default async function AulasPage() {
  await exigirDiretoria();
  const aulas = (await db().prepare(
    `SELECT a.*, (SELECT COUNT(*) FROM materiais m WHERE m.aula_id = a.id) AS materiais,
     (SELECT COUNT(*) FROM presencas p WHERE p.aula_id = a.id AND p.presente = 1) AS presentes
     FROM aulas a ORDER BY a.data DESC`
  ).all()) as { id: number; titulo: string; tema: string | null; data: string; local: string | null; descricao: string | null; materiais: number; presentes: number }[];

  return (
    <>
      <h1 className="page-title">Gestão de Aulas</h1>
      <p className="page-sub">Cadastre as aulas do semestre; associe materiais pela página de Materiais.</p>

      <div className="card mb-3">
        <h3 style={{ fontSize: 16 }}>Nova aula</h3>
        <FormAcao action={salvarAula}>
          <div className="grid2" style={{ gap: 12 }}>
            <div><label className="label">Título *</label><input className="input" name="titulo" required /></div>
            <div>
              <label className="label">Tema</label>
              <TemaSelect name="tema" temas={TEMAS} allowBlank />
            </div>
          </div>
          <div className="grid2" style={{ gap: 12 }}>
            <div><label className="label">Data *</label><input className="input" type="date" name="data" required /></div>
            <div><label className="label">Local</label><input className="input" name="local" placeholder="Sala, laboratório…" /></div>
          </div>
          <label className="label">Descrição</label>
          <textarea className="input" name="descricao" rows={2} />
          <button className="btn btn-primary btn-sm mt-2" type="submit">Salvar aula</button>
        </FormAcao>
      </div>

      <div className="table-wrap">
        <table className="tbl">
          <thead><tr><th>Data</th><th>Aula</th><th>Tema</th><th>Local</th><th>Materiais</th><th>Presentes</th><th style={{ width: 260 }}>Ações</th></tr></thead>
          <tbody>
            {aulas.length === 0 && <tr><td colSpan={7} className="muted">Nenhuma aula cadastrada.</td></tr>}
            {aulas.map((a) => (
              <tr key={a.id}>
                <td>{fmtData(a.data)}</td>
                <td><strong>{a.titulo}</strong></td>
                <td className="muted">{a.tema ?? "—"}</td>
                <td className="muted">{a.local ?? "—"}</td>
                <td><span className="badge">{a.materiais}</span></td>
                <td><span className="badge badge-blue">{a.presentes}</span></td>
                <td>
                  <div className="flex" style={{ gap: 6 }}>
                    <Link className="btn btn-sm" href={`/diretoria/frequencia?aula=${a.id}`}>Chamada</Link>
                    <FormAcao action={lembrarAula}>
                      <input type="hidden" name="id" value={a.id} />
                      <button className="btn btn-sm btn-blue" type="submit" title="Envia lembrete por e-mail e WhatsApp a todos os ligantes">Lembrete</button>
                    </FormAcao>
                    <FormAcao action={excluirAula}>
                      <input type="hidden" name="id" value={a.id} />
                      <button className="btn btn-sm btn-danger" type="submit">Excluir</button>
                    </FormAcao>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
