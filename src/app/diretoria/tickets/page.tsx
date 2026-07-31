import Link from "next/link";
import { exigirDiretoria } from "@/lib/auth";
import { db, TICKET_STATUS_LABEL } from "@/lib/db";
import { fmtData } from "@/lib/util";

export default async function DiretoriaTicketsPage() {
  await exigirDiretoria();
  const tickets = (await db().prepare(
    "SELECT t.id, t.assunto, t.status, t.criado_em, t.atualizado_em, u.nome AS requerente_nome, u.role AS requerente_role FROM tickets t JOIN users u ON u.id = t.user_id ORDER BY t.atualizado_em DESC"
  ).all()) as { id: number; assunto: string; status: string; criado_em: string; atualizado_em: string; requerente_nome: string; requerente_role: string }[];
  const abertos = tickets.filter((t) => t.status !== "resolvido").length;

  return (
    <>
      <h1 className="page-title">Tickets</h1>
      <p className="page-sub">Contestações e mensagens de candidatos e ligantes. {abertos > 0 && <span className="badge badge-amber">{abertos} em aberto</span>}</p>

      {tickets.length === 0 && <p className="muted">Nenhum ticket registrado.</p>}
      <div className="table-wrap">
        <table className="tbl">
          <thead><tr><th>Assunto</th><th>De</th><th>Status</th><th>Atualizado</th></tr></thead>
          <tbody>
            {tickets.map((t) => {
              const st = TICKET_STATUS_LABEL[t.status] ?? { label: t.status, badge: "" };
              return (
                <tr key={t.id}>
                  <td><Link href={`/diretoria/tickets/${t.id}`} style={{ color: "var(--blue)" }}>{t.assunto}</Link></td>
                  <td className="muted">{t.requerente_nome} <span className="small">({t.requerente_role})</span></td>
                  <td><span className={`badge ${st.badge}`}>{st.label}</span></td>
                  <td className="muted" style={{ fontSize: 13 }}>{fmtData(t.atualizado_em, true)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
