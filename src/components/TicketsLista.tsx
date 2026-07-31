import Link from "next/link";
import { db, TICKET_STATUS_LABEL } from "@/lib/db";
import { fmtData } from "@/lib/util";

type Ticket = { id: number; assunto: string; status: string; criado_em: string; atualizado_em: string };

/** Lista de tickets do próprio usuário — usada nas áreas de ligante e candidato. */
export default async function TicketsLista({ userId, area }: { userId: number; area: "candidato" | "ligante" }) {
  const tickets = (await db().prepare(
    "SELECT id, assunto, status, criado_em, atualizado_em FROM tickets WHERE user_id = ? ORDER BY atualizado_em DESC"
  ).all(userId)) as Ticket[];

  return (
    <>
      <div className="flex-between">
        <div>
          <h1 className="page-title">Meus tickets</h1>
          <p className="page-sub">Dúvidas, contestações e outros contatos com a diretoria.</p>
        </div>
        <Link href={`/${area}/tickets/novo`} className="btn btn-primary btn-sm">+ Novo ticket</Link>
      </div>

      {tickets.length === 0 && <p className="muted">Você ainda não abriu nenhum ticket.</p>}
      <div style={{ display: "grid", gap: 10 }}>
        {tickets.map((t) => {
          const st = TICKET_STATUS_LABEL[t.status] ?? { label: t.status, badge: "" };
          return (
            <Link key={t.id} href={`/${area}/tickets/${t.id}`} className="card hoverable" style={{ color: "inherit", textDecoration: "none" }}>
              <div className="flex-between">
                <strong>{t.assunto}</strong>
                <span className={`badge ${st.badge}`}>{st.label}</span>
              </div>
              <p className="small mt-1">Atualizado em {fmtData(t.atualizado_em, true)}</p>
            </Link>
          );
        })}
      </div>
    </>
  );
}
