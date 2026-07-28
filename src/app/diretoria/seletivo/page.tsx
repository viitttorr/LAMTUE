import { exigirDiretoria } from "@/lib/auth";
import { db, STATUS_LABEL } from "@/lib/db";
import { salvarSeletivo, alterarStatusInscricao, enviarResultados, matricularAprovados, reenviarConfirmacao, criarContaCandidato } from "@/app/actions/diretoria";
import { fmtData } from "@/lib/util";

export default async function SeletivoAdminPage({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  await exigirDiretoria();
  const { ok, erro } = await searchParams;
  const sel = db().prepare("SELECT * FROM seletivo WHERE id = 1").get() as {
    ativo: number; vagas: number; prazo: string | null; taxa_centavos: number; edital: string | null; cronograma: string | null;
  };
  const inscritos = db().prepare("SELECT * FROM inscricoes ORDER BY criado_em DESC").all() as {
    id: number; nome: string; matricula: string; semestre: string; email: string; telefone: string;
    comprovante_id: number | null; status: string; criado_em: string; user_id: number | null;
  }[];
  const porStatus = (st: string) => inscritos.filter((i) => i.status === st).length;
  const cronogramaTexto = sel.cronograma
    ? (JSON.parse(sel.cronograma) as { etapa: string; data: string }[]).map((c) => `${c.etapa} | ${c.data}`).join("\n")
    : "";

  return (
    <>
      <h1 className="page-title">Processo Seletivo</h1>
      <p className="page-sub">Configure o edital, acompanhe inscrições em tempo real e envie os resultados.</p>
      {ok && <div className="alert alert-green">{ok === "1" ? "Salvo." : ok}</div>}
      {erro && <div className="alert alert-red">{erro}</div>}

      <div className="grid4 mb-3">
        <div className="card stat"><div className="stat-num" style={{ color: "var(--blue)" }}>{inscritos.length}</div><div className="stat-label">Inscritos</div></div>
        <div className="card stat"><div className="stat-num" style={{ color: "var(--amber)" }}>{porStatus("pendente")}</div><div className="stat-label">Pendentes</div></div>
        <div className="card stat"><div className="stat-num" style={{ color: "var(--green)" }}>{porStatus("aprovado")}</div><div className="stat-label">Aprovados</div></div>
        <div className="card stat"><div className="stat-num" style={{ color: "var(--red-bright)" }}>{porStatus("reprovado") + porStatus("espera")}</div><div className="stat-label">Reprovados + espera</div></div>
      </div>

      <div className="card mb-3">
        <h3 style={{ fontSize: 16 }}>Configuração do seletivo</h3>
        <form action={salvarSeletivo}>
          <div className="grid4" style={{ gap: 12 }}>
            <div>
              <label className="label">Situação</label>
              <label className="flex" style={{ gap: 8, padding: "10px 0" }}>
                <input type="checkbox" name="ativo" defaultChecked={!!sel.ativo} style={{ width: 18, height: 18, accentColor: "#a01d43" }} />
                <span style={{ fontSize: 14 }}>Inscrições abertas</span>
              </label>
            </div>
            <div><label className="label">Vagas</label><input className="input" type="number" name="vagas" defaultValue={sel.vagas} min={1} /></div>
            <div><label className="label">Prazo final</label><input className="input" type="date" name="prazo" defaultValue={sel.prazo ?? ""} /></div>
            <div><label className="label">Taxa (R$)</label><input className="input" name="taxa" defaultValue={(sel.taxa_centavos / 100).toFixed(2).replace(".", ",")} /></div>
          </div>
          <label className="label">Edital (texto exibido na página pública)</label>
          <textarea className="input" name="edital" rows={5} defaultValue={sel.edital ?? ""} />
          <label className="label">Cronograma — uma etapa por linha: <code>Etapa | AAAA-MM-DD</code></label>
          <textarea className="input" name="cron_etapas" rows={4} defaultValue={cronogramaTexto} placeholder={"Inscrições | 2026-08-01\nProva teórica | 2026-08-15\nResultado final | 2026-08-20"} />
          <button className="btn btn-primary btn-sm mt-2" type="submit">Salvar configuração</button>
        </form>
      </div>

      <div className="card mb-3">
        <h3 style={{ fontSize: 16 }}>Resultados e matrícula</h3>
        <p className="small mt-1">O envio dispara e-mail e WhatsApp para todos os candidatos do status escolhido.</p>
        <div className="flex mt-2" style={{ flexWrap: "wrap", gap: 10 }}>
          {(["aprovado", "espera", "reprovado"] as const).map((st) => (
            <form key={st} action={enviarResultados}>
              <input type="hidden" name="status" value={st} />
              <button className="btn btn-sm" type="submit">Enviar resultado: {STATUS_LABEL[st].label} ({porStatus(st)})</button>
            </form>
          ))}
          <form action={matricularAprovados}>
            <button className="btn btn-sm btn-blue" type="submit">Criar contas dos aprovados ({porStatus("aprovado")})</button>
          </form>
        </div>
      </div>

      <h3 style={{ fontSize: 17, margin: "10px 0 12px" }}>Inscritos em tempo real</h3>
      <div className="table-wrap">
        <table className="tbl">
          <thead><tr><th>Candidato</th><th>Matrícula</th><th>Sem.</th><th>Contato</th><th>Comprovante</th><th>Inscrição</th><th>Status</th><th>Conta</th></tr></thead>
          <tbody>
            {inscritos.length === 0 && <tr><td colSpan={8} className="muted">Nenhuma inscrição recebida.</td></tr>}
            {inscritos.map((i) => (
              <tr key={i.id}>
                <td><strong>{i.nome}</strong></td>
                <td className="muted">{i.matricula}</td>
                <td className="muted">{i.semestre}</td>
                <td className="muted" style={{ fontSize: 13 }}>{i.email}<br />{i.telefone}</td>
                <td>
                  {i.comprovante_id
                    ? <a className="btn btn-sm" href={`/api/arquivos/${i.comprovante_id}`} target="_blank">Ver</a>
                    : <span className="muted">—</span>}
                </td>
                <td className="muted" style={{ fontSize: 13 }}>{fmtData(i.criado_em, true)}</td>
                <td>
                  <div className="flex" style={{ gap: 6 }}>
                    <form action={alterarStatusInscricao} className="flex" style={{ gap: 6 }}>
                      <input type="hidden" name="id" value={i.id} />
                      <select className="input" name="status" defaultValue={i.status} style={{ padding: "6px 10px", fontSize: 13, width: "auto" }}>
                        {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                      <button className="btn btn-sm" type="submit">OK</button>
                    </form>
                    <form action={reenviarConfirmacao}>
                      <input type="hidden" name="id" value={i.id} />
                      <button className="btn btn-sm btn-ghost" type="submit" title="Reenviar e-mail de confirmação">✉</button>
                    </form>
                  </div>
                </td>
                <td>
                  {i.user_id ? (
                    <span className="badge badge-green">Conta criada</span>
                  ) : (
                    <form action={criarContaCandidato}>
                      <input type="hidden" name="id" value={i.id} />
                      <button className="btn btn-sm btn-blue" type="submit" title="Cria login limitado para o candidato acompanhar o status">Criar conta</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
