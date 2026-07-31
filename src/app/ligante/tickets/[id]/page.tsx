import { exigirLigante } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import TicketThread from "@/components/TicketThread";

export default async function LiganteTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const s = await exigirLigante();
  const { id } = await params;
  const ticketId = Number(id);

  const ticket = (await db().prepare(
    "SELECT t.id, t.assunto, t.status, t.criado_em, t.user_id, u.nome AS requerente_nome FROM tickets t JOIN users u ON u.id = t.user_id WHERE t.id = ?"
  ).get(ticketId)) as { id: number; assunto: string; status: string; criado_em: string; user_id: number; requerente_nome: string } | undefined;
  if (!ticket || ticket.user_id !== s.id) redirect("/ligante/tickets");

  const mensagens = (await db().prepare(
    "SELECT m.id, m.autor_id, m.mensagem, m.criado_em, u.nome AS autor_nome, u.role AS autor_role FROM ticket_mensagens m JOIN users u ON u.id = m.autor_id WHERE m.ticket_id = ? ORDER BY m.id ASC"
  ).all(ticketId)) as { id: number; autor_id: number; mensagem: string; criado_em: string; autor_nome: string; autor_role: string }[];

  return <TicketThread area="ligante" ticket={ticket} mensagens={mensagens} meuId={s.id} souDiretoria={false} />;
}
