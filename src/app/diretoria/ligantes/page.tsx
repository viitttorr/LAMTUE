import { exigirDiretoria } from "@/lib/auth";
import { db, frequenciaDe, getConfig } from "@/lib/db";
import { salvarMembro, importarLigantes, alternarAtivo } from "@/app/actions/diretoria";
import { calcularSemestre } from "@/lib/util";
import RoleCargoFields from "@/components/RoleCargoFields";

export default async function LigantesPage({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  await exigirDiretoria();
  const { ok, erro } = await searchParams;
  const periodoAtual = getConfig("periodo_atual", "2026/2");
  const membros = db().prepare(
    "SELECT id, nome, matricula, email, telefone, semestre, turma, role, cargo, ativo, must_change_password FROM users WHERE role IN ('ligante','diretoria') ORDER BY role, nome"
  ).all() as {
    id: number; nome: string; matricula: string | null; email: string | null; telefone: string | null;
    semestre: string | null; turma: string | null; role: "ligante" | "diretoria"; cargo: string | null;
    ativo: number; must_change_password: number;
  }[];

  return (
    <>
      <h1 className="page-title">Gestão de Ligantes e Diretoria</h1>
      <p className="page-sub">O acesso inicial de cada conta usa a matrícula como login e senha temporária.</p>
      {ok && <div className="alert alert-green">{ok === "1" ? "Conta salva com sucesso." : ok}</div>}
      {erro && <div className="alert alert-red">{erro}</div>}

      <div className="grid2" style={{ alignItems: "start" }}>
        <div className="card">
          <h3 style={{ fontSize: 16 }}>Cadastrar conta</h3>
          <form action={salvarMembro}>
            <label className="label">Nome completo *</label>
            <input className="input" name="nome" required />
            <RoleCargoFields />
            <div className="grid2" style={{ gap: 12 }}>
              <div><label className="label">Matrícula *</label><input className="input" name="matricula" required /></div>
              <div><label className="label">E-mail</label><input className="input" type="email" name="email" /></div>
            </div>
            <label className="label">Telefone</label>
            <input className="input" name="telefone" />
            <button className="btn btn-primary btn-sm mt-2" type="submit">Cadastrar</button>
          </form>
        </div>
        <div className="card">
          <h3 style={{ fontSize: 16 }}>Importar lista de ligantes (CSV)</h3>
          <p className="small mt-1">
            Colunas: <code>nome;matricula;email;telefone;turma</code> — separadas por <code>;</code> ou <code>,</code>,
            uma linha por ligante (cabeçalho opcional). Importação em massa só cria ligantes.
          </p>
          <form action={importarLigantes}>
            <label className="label">Arquivo CSV</label>
            <input className="input" type="file" name="csv" accept=".csv,text/csv" required />
            <button className="btn btn-blue btn-sm mt-2" type="submit">Importar em massa</button>
          </form>
        </div>
      </div>

      <h3 style={{ fontSize: 17, margin: "30px 0 12px" }}>Contas cadastradas ({membros.length})</h3>
      <div className="table-wrap">
        <table className="tbl">
          <thead><tr><th>Nome</th><th>Matrícula</th><th>Contato</th><th>Papel/Cargo</th><th>Turma</th><th>Semestre</th><th>Frequência</th><th>Situação</th><th></th></tr></thead>
          <tbody>
            {membros.length === 0 && <tr><td colSpan={9} className="muted">Nenhuma conta cadastrada ainda.</td></tr>}
            {membros.map((m) => {
              const f = m.role === "ligante" ? frequenciaDe(m.id) : null;
              return (
                <tr key={m.id} style={{ opacity: m.ativo ? 1 : 0.5 }}>
                  <td>
                    {m.nome}
                    {!!m.must_change_password && <span className="badge badge-amber" style={{ marginLeft: 8 }}>1º acesso pendente</span>}
                  </td>
                  <td className="muted">{m.matricula}</td>
                  <td className="muted" style={{ fontSize: 13 }}>{[m.email, m.telefone].filter(Boolean).join(" · ") || "—"}</td>
                  <td className="muted">{m.role === "diretoria" ? (m.cargo ?? "Diretoria") : "Ligante"}</td>
                  <td className="muted">{m.role === "ligante" ? m.turma ?? "—" : "—"}</td>
                  <td className="muted">{m.role === "ligante" ? calcularSemestre(m.turma, periodoAtual) ?? m.semestre ?? "—" : "—"}</td>
                  <td>
                    {!f || f.total === 0 ? <span className="muted">—</span> : (
                      <span className={`badge ${f.elegivel ? "badge-green" : "badge-red"}`}>{f.pct}% ({f.presentes}/{f.total})</span>
                    )}
                  </td>
                  <td>{m.ativo ? <span className="badge badge-green">Ativo</span> : <span className="badge badge-red">Inativo</span>}</td>
                  <td>
                    <form action={alternarAtivo}>
                      <input type="hidden" name="id" value={m.id} />
                      <button className={`btn btn-sm ${m.ativo ? "btn-danger" : "btn-blue"}`} type="submit">
                        {m.ativo ? "Desativar" : "Ativar"}
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
