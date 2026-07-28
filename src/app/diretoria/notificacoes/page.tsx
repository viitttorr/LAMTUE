import { exigirDiretoria } from "@/lib/auth";
import { db } from "@/lib/db";
import { enviarMensagem, publicarAviso } from "@/app/actions/diretoria";
import { fmtData } from "@/lib/util";

export default async function NotificacoesPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  await exigirDiretoria();
  const { ok } = await searchParams;
  const ligantes = (await db().prepare("SELECT id, nome FROM users WHERE role='ligante' AND ativo=1 ORDER BY nome").all()) as { id: number; nome: string }[];
  const historico = (await db().prepare("SELECT * FROM mensagens ORDER BY id DESC LIMIT 100").all()) as
    { id: number; canal: string; destinatario: string; assunto: string | null; corpo: string; evento: string; status: string; criado_em: string }[];

  return (
    <>
      <h1 className="page-title">Central de Notificações</h1>
      <p className="page-sub">Envio manual por WhatsApp e e-mail, com histórico completo de tudo que o sistema disparou.</p>
      {ok && <div className="alert alert-green">Mensagem enviada. Confira o status no histórico abaixo.</div>}

      <div className="grid2" style={{ alignItems: "start" }}>
        <div className="card">
          <h3 style={{ fontSize: 16 }}>Enviar mensagem</h3>
          <form action={enviarMensagem}>
            <label className="label">Destinatários</label>
            <select className="input" name="destino" defaultValue="todos">
              <option value="todos">Todos os ligantes</option>
              <option value="grupo">Grupo (selecione abaixo)</option>
              <option value="individual">Individual (selecione abaixo)</option>
            </select>
            <label className="label">Grupo — segure Ctrl/Cmd para múltiplos</label>
            <select className="input" name="ids" multiple size={5}>
              {ligantes.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
            <label className="label">Individual</label>
            <select className="input" name="individual" defaultValue="">
              <option value="">—</option>
              {ligantes.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
            <label className="label">Assunto *</label>
            <input className="input" name="assunto" required />
            <label className="label">Mensagem *</label>
            <textarea className="input" name="corpo" rows={4} required />
            <button className="btn btn-primary btn-sm mt-2" type="submit">Enviar (e-mail + WhatsApp)</button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 16 }}>Publicar aviso no mural</h3>
          <form action={publicarAviso}>
            <label className="label">Título *</label>
            <input className="input" name="titulo" required />
            <label className="label">Mensagem *</label>
            <textarea className="input" name="mensagem" rows={4} required />
            <label className="flex mt-2" style={{ gap: 8 }}>
              <input type="checkbox" name="notificar" defaultChecked style={{ width: 17, height: 17, accentColor: "#a01d43" }} />
              <span style={{ fontSize: 14 }}>Também notificar por e-mail e WhatsApp</span>
            </label>
            <button className="btn btn-blue btn-sm mt-2" type="submit">Publicar aviso</button>
          </form>
        </div>
      </div>

      <h3 style={{ fontSize: 17, margin: "30px 0 12px" }}>Histórico de mensagens (últimas 100)</h3>
      <div className="table-wrap">
        <table className="tbl">
          <thead><tr><th>Canal</th><th>Destinatário</th><th>Assunto / mensagem</th><th>Evento</th><th>Status</th><th>Enviada</th></tr></thead>
          <tbody>
            {historico.length === 0 && <tr><td colSpan={6} className="muted">Nenhuma mensagem enviada ainda.</td></tr>}
            {historico.map((m) => (
              <tr key={m.id}>
                <td><span className={`badge ${m.canal === "whatsapp" ? "badge-green" : "badge-blue"}`}>{m.canal === "whatsapp" ? "WhatsApp" : "E-mail"}</span></td>
                <td className="muted" style={{ fontSize: 13 }}>{m.destinatario}</td>
                <td style={{ fontSize: 13, maxWidth: 320 }}>{m.assunto ?? (m.corpo.length > 80 ? m.corpo.slice(0, 80) + "…" : m.corpo)}</td>
                <td className="muted" style={{ fontSize: 12.5 }}>{m.evento.replace(/_/g, " ")}</td>
                <td>
                  <span className={`badge ${m.status === "enviado" ? "badge-green" : "badge-red"}`} title={m.status}>
                    {m.status === "enviado" ? "Enviado" : m.status.length > 26 ? m.status.slice(0, 26) + "…" : m.status}
                  </span>
                </td>
                <td className="muted" style={{ fontSize: 13 }}>{fmtData(m.criado_em, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
