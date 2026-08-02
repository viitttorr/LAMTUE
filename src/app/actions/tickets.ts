"use server";
import { db } from "@/lib/db";
import { getSessao, exigirDiretoria } from "@/lib/auth";
import { registrarAcao } from "@/lib/audit";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function areaDe(role: string) {
  return role === "diretoria" ? "/diretoria" : role === "candidato" ? "/candidato" : "/ligante";
}

export async function criarTicket(formData: FormData) {
  const s = await getSessao();
  if (!s) redirect("/login");
  const assunto = String(formData.get("assunto") || "").trim();
  const mensagem = String(formData.get("mensagem") || "").trim();
  const area = areaDe(s.role);
  if (!assunto || !mensagem) return { erro: "Preencha o assunto e a mensagem." };

  const r = await db().prepare("INSERT INTO tickets (user_id, assunto) VALUES (?, ?)").run(s.id, assunto);
  const ticketId = r.lastInsertRowid;
  await db().prepare("INSERT INTO ticket_mensagens (ticket_id, autor_id, mensagem) VALUES (?, ?, ?)").run(ticketId, s.id, mensagem);
  await registrarAcao(s.id, "ticket_criado", `#${ticketId} ${assunto}`);
  revalidatePath(`${area}/tickets`);
  revalidatePath("/diretoria/tickets");
  redirect(`${area}/tickets/${ticketId}`);
}

export async function responderTicket(formData: FormData) {
  const s = await getSessao();
  if (!s) redirect("/login");
  const ticketId = Number(formData.get("ticket_id"));
  const mensagem = String(formData.get("mensagem") || "").trim();
  const area = areaDe(s.role);
  if (!mensagem) return;

  const ticket = (await db().prepare("SELECT id, user_id FROM tickets WHERE id = ?").get(ticketId)) as
    | { id: number; user_id: number } | undefined;
  if (!ticket) return;
  if (s.role !== "diretoria" && ticket.user_id !== s.id) return; // só o autor ou a diretoria respondem

  await db().prepare("INSERT INTO ticket_mensagens (ticket_id, autor_id, mensagem) VALUES (?, ?, ?)").run(ticketId, s.id, mensagem);
  const novoStatus = s.role === "diretoria" ? "em_andamento" : "aberto";
  await db().prepare("UPDATE tickets SET atualizado_em = datetime('now'), status = ? WHERE id = ?").run(novoStatus, ticketId);
  await registrarAcao(s.id, "ticket_respondido", `#${ticketId}`);
  revalidatePath(`${area}/tickets/${ticketId}`);
  revalidatePath("/diretoria/tickets");
  revalidatePath(`${area}/tickets`);
  return { ok: "Resposta enviada." };
}

export async function alterarStatusTicket(formData: FormData) {
  await exigirDiretoria();
  const ticketId = Number(formData.get("ticket_id"));
  const status = String(formData.get("status") || "");
  if (!["aberto", "em_andamento", "resolvido"].includes(status)) return;
  await db().prepare("UPDATE tickets SET status = ?, atualizado_em = datetime('now') WHERE id = ?").run(status, ticketId);
  revalidatePath(`/diretoria/tickets/${ticketId}`);
  revalidatePath("/diretoria/tickets");
  return { ok: "Status atualizado." };
}
