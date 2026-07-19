import { exigirDiretoria } from "@/lib/auth";
import { db, frequenciaDe } from "@/lib/db";
import { salvarLigante, importarLigantes, alternarAtivo } from "@/app/actions/diretoria";

export default async function LigantesPage({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  await exigirDiretoria();
  const { ok, erro } = await searchParams;
  const ligantes = db().prepare(
    "SELECT id, nome, matricula, email, telefone, semestre, ativo, must_change_password FROM users WHERE role='ligante' ORDER BY nome"
  ).all() as { id: number; nome: string; matricula: string | null; email: string | null; telefone: string | null; semestre: string | null; ativo: number; must_change_password: number }[];

  return (
    <>
      <h1 className="page-title">Gestão de Ligantes</h1>
      <p className="page-sub">O acesso inicial de cada ligante usa a matrícula como login e senha temporária.</p>
      {ok && <div className="alert alert-green">{ok === "1" ? "Ligante salvo com sucesso." : ok}</div>}
      {erro && <div className="alert alert-red">{erro}</div>}

      <div className="grid2" style={{ alignItems: "start" }}>
        <div className="card">
          <h3 style={{ fontSize: 16 }}>Cadastrar ligante</h3>
          <form action={salvarLigante}>
            <label className="label">Nome completo *</label>
            <input className="input" name="nome" required />
            <div className="grid2" style={{ gap: 12 }}>
              <div><label className="label">Matrícula *</label><input className="input" name="matricula" required /></div>
              <div><label className="label">Semestre</label><input className="input" name="semestre" placeholder="4º" /></div>
            </div>
            <div className="grid2" style={{ gap: 12 }}>
              <div><label className="label">E-mail</label><input className="input" type="email" name="email" /></div>
              <div><label className="label">Telefone</label><input className="input" name="telefone" /></div>
            </div>
            <button className="btn btn-primary btn-sm mt-2" type="submit">Cadastrar</button>
          </form>
        </div>
        <div className="card">
          <h3 style={{ fontSize: 16 }}>Importar lista (CSV)</h3>
          <p className="small mt-1">
            Colunas: <code>nome;matricula;email;telefone;semestre</code> — separadas por <code>;</code> ou <code>,</code>,
            uma linha por ligante (cabeçalho opcional).
          </p>
          <form action={importarLigantes}>
            <label className="label">Arquivo CSV</label>
            <input className="input" type="file" name="csv" accept=".csv,text/csv" required />
            <button className="btn btn-blue btn-sm mt-2" type="submit">Importar em massa</button>
          </form>
        </div>
      </div>

      <h3 style={{ fontSize: 17, margin: "30px 0 12px" }}>Ligantes cadastrados ({ligantes.length})</h3>
      <div className="table-wrap">
        <table className="tbl">
          <thead><tr><th>Nome</th><th>Matrícula</th><th>Contato</th><th>Semestre</th><th>Frequência</th><th>Situação</th><th></th></tr></thead>
          <tbody>
            {ligantes.length === 0 && <tr><td colSpan={7} className="muted">Nenhum ligante cadastrado ainda.</td></tr>}
            {ligantes.map((l) => {
              const f = frequenciaDe(l.id);
              return (
                <tr key={l.id} style={{ opacity: l.ativo ? 1 : 0.5 }}>
                  <td>
                    {l.nome}
                    {!!l.must_change_password && <span className="badge badge-amber" style={{ marginLeft: 8 }}>1º acesso pendente</span>}
                  </td>
                  <td className="muted">{l.matricula}</td>
                  <td className="muted" style={{ fontSize: 13 }}>{[l.email, l.telefone].filter(Boolean).join(" · ") || "—"}</td>
                  <td className="muted">{l.semestre ?? "—"}</td>
                  <td>
                    {f.total === 0 ? <span className="muted">—</span> : (
                      <span className={`badge ${f.elegivel ? "badge-green" : "badge-red"}`}>{f.pct}% ({f.presentes}/{f.total})</span>
                    )}
                  </td>
                  <td>{l.ativo ? <span className="badge badge-green">Ativo</span> : <span className="badge badge-red">Inativo</span>}</td>
                  <td>
                    <form action={alternarAtivo}>
                      <input type="hidden" name="id" value={l.id} />
                      <button className={`btn btn-sm ${l.ativo ? "btn-danger" : "btn-blue"}`} type="submit">
                        {l.ativo ? "Desativar" : "Ativar"}
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
