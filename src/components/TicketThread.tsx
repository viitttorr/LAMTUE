import Link from "next/link";
import { TICKET_STATUS_LABEL } from "@/lib/db";
import { fmtData } from "@/lib/util";
import { responderTicket, alterarStatusTicket } from "@/app/actions/tickets";

type Mensagem = { id: number; autor_id: number; autor_nome: string; autor_role: string; mensagem: string; criado_em: string };
type Ticket = { id: number; assunto: string; status: string; criado_em: string; requerente_nome: string };

const ROLE_LABEL: Record<string, string> = { diretoria: "Diretoria", ligante: "Ligante", candidato: "Candidato" };

/** Conversa de um ticket — usada nas três áreas (ligante, candidato, diretoria). */
export default function TicketThread({
  area, ticket, mensagens, meuId, souDiretoria,
}: {
  area: "candidato" | "ligante" | "diretoria";
  ticket: Ticket;
  mensagens: Mensagem[];
  meuId: number;
  souDiretoria: boolean;
}) {
  const st = TICKET_STATUS_LABEL[ticket.status] ?? { label: ticket.status, badge: "" };

  return (
    <>
      <Link href={`/${area}/tickets`} className="small" style={{ color: "var(--blue)" }}>← {souDiretoria ? "Todos os tickets" : "Meus tickets"}</Link>
      <div className="flex-between mt-1" style={{ flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 2 }}>{ticket.assunto}</h1>
          <p className="small">
            {souDiretoria && <>Aberto por {ticket.requerente_nome} · </>}
            {fmtData(ticket.criado_em, true)}
          </p>
        </div>
        {souDiretoria ? (
          <form action={alterarStatusTicket} className="flex" style={{ gap: 8 }}>
            <input type="hidden" name="ticket_id" value={ticket.id} />
            <select className="input" name="status" defaultValue={ticket.status} style={{ padding: "6px 10px", fontSize: 13, width: "auto" }}>
              {Object.entries(TICKET_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <button className="btn btn-sm" type="submit">Salvar status</button>
          </form>
        ) : (
          <span className={`badge ${st.badge}`}>{st.label}</span>
        )}
      </div>

      <div className="mt-3" style={{ display: "grid", gap: 10, maxWidth: 640 }}>
        {mensagens.map((m) => {
          const minha = m.autor_id === meuId;
          return (
            <div
              key={m.id}
              className="card"
              style={{
                marginLeft: minha ? "auto" : 0,
                maxWidth: "85%",
                borderColor: m.autor_role === "diretoria" ? "rgba(56,189,248,0.3)" : "var(--border)",
              }}
            >
              <div className="flex-between" style={{ gap: 10 }}>
                <strong style={{ fontSize: 13.5 }}>{m.autor_nome}{m.autor_role === "diretoria" && <span className="badge badge-blue" style={{ marginLeft: 6, fontSize: 10.5 }}>{ROLE_LABEL[m.autor_role]}</span>}</strong>
                <span className="small">{fmtData(m.criado_em, true)}</span>
              </div>
              <p className="mt-1" style={{ fontSize: 14.5, whiteSpace: "pre-line" }}>{m.mensagem}</p>
            </div>
          );
        })}
      </div>

      <div className="card mt-3" style={{ maxWidth: 640 }}>
        <form action={responderTicket}>
          <input type="hidden" name="ticket_id" value={ticket.id} />
          <label className="label">Responder</label>
          <textarea className="input" name="mensagem" rows={4} required />
          <button className="btn btn-primary btn-sm mt-2" type="submit">Enviar resposta</button>
        </form>
      </div>
    </>
  );
}
