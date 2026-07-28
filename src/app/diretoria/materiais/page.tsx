import { exigirDiretoria } from "@/lib/auth";
import { db, TEMAS } from "@/lib/db";
import { salvarMaterial, excluirMaterial } from "@/app/actions/diretoria";
import { fmtData } from "@/lib/util";
import { MATERIAIS_MAX_BYTES } from "@/lib/arquivos";

export default async function MateriaisPage({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  await exigirDiretoria();
  const { ok, erro } = await searchParams;
  const materiais = db().prepare(
    "SELECT m.*, a.titulo AS aula FROM materiais m LEFT JOIN aulas a ON a.id = m.aula_id ORDER BY m.id DESC"
  ).all() as { id: number; titulo: string; tema: string; tipo: string; url: string | null; arquivo_id: number | null; visibilidade: string; aula: string | null; criado_em: string }[];
  const aulas = db().prepare("SELECT id, titulo, data FROM aulas ORDER BY data DESC").all() as { id: number; titulo: string; data: string }[];

  return (
    <>
      <h1 className="page-title">Biblioteca — Gestão de Materiais</h1>
      <p className="page-sub">Ao publicar, todos os ligantes são notificados automaticamente.</p>
      {ok && <div className="alert alert-green">Material publicado e ligantes notificados.</div>}
      {erro && <div className="alert alert-red">{erro}</div>}

      <div className="card mb-3">
        <h3 style={{ fontSize: 16 }}>Novo material</h3>
        <form action={salvarMaterial}>
          <div className="grid2" style={{ gap: 12 }}>
            <div><label className="label">Título *</label><input className="input" name="titulo" required /></div>
            <div>
              <label className="label">Tema *</label>
              <select className="input" name="tema" required defaultValue="">
                <option value="" disabled>Selecione</option>
                {TEMAS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid3" style={{ gap: 12 }}>
            <div>
              <label className="label">Tipo</label>
              <select className="input" name="tipo" defaultValue="pdf">
                <option value="slide">Slides</option><option value="pdf">PDF</option>
                <option value="video">Vídeo</option><option value="link">Link</option>
              </select>
            </div>
            <div>
              <label className="label">Visibilidade</label>
              <select className="input" name="visibilidade" defaultValue="ligantes">
                <option value="ligantes">Apenas ligantes</option>
                <option value="publico">Pública</option>
              </select>
            </div>
            <div>
              <label className="label">Aula associada</label>
              <select className="input" name="aula_id" defaultValue="">
                <option value="">— nenhuma —</option>
                {aulas.map((a) => <option key={a.id} value={a.id}>{fmtData(a.data)} — {a.titulo}</option>)}
              </select>
            </div>
          </div>
          <div className="grid2" style={{ gap: 12 }}>
            <div><label className="label">Link (vídeos/externos)</label><input className="input" name="url" placeholder="https://…" /></div>
            <div><label className="label">Ou arquivo (até {MATERIAIS_MAX_BYTES / 1024 / 1024} MB)</label><input className="input" type="file" name="arquivo" /></div>
          </div>
          <button className="btn btn-primary btn-sm mt-2" type="submit">Publicar material</button>
        </form>
      </div>

      <div className="table-wrap">
        <table className="tbl">
          <thead><tr><th>Título</th><th>Tema</th><th>Tipo</th><th>Visibilidade</th><th>Aula</th><th>Publicado</th><th></th></tr></thead>
          <tbody>
            {materiais.length === 0 && <tr><td colSpan={7} className="muted">Nenhum material publicado.</td></tr>}
            {materiais.map((m) => (
              <tr key={m.id}>
                <td>
                  <a href={m.url || `/api/arquivos/${m.arquivo_id}`} target="_blank" rel="noreferrer" style={{ color: "var(--blue)" }}>{m.titulo}</a>
                </td>
                <td className="muted">{m.tema}</td>
                <td><span className="badge">{m.tipo.toUpperCase()}</span></td>
                <td>{m.visibilidade === "publico" ? <span className="badge badge-blue">Pública</span> : <span className="badge">Ligantes</span>}</td>
                <td className="muted" style={{ fontSize: 13 }}>{m.aula ?? "—"}</td>
                <td className="muted">{fmtData(m.criado_em)}</td>
                <td>
                  <form action={excluirMaterial}>
                    <input type="hidden" name="id" value={m.id} />
                    <button className="btn btn-sm btn-danger" type="submit">Excluir</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
