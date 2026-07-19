import { db } from "./db";
import { enviarEmail } from "./mailer";
import { enviarWhatsApp } from "./whatsapp";

type Destinatario = { nome: string; email: string | null; telefone: string | null };

/** Notifica um usuário nos dois canais disponíveis. */
export async function notificar(dest: Destinatario, assunto: string, corpo: string, evento: string) {
  const texto = `Olá, ${dest.nome.split(" ")[0]}!\n\n${corpo}\n\n— LAMTUE · URI Erechim`;
  if (dest.email) await enviarEmail(dest.email, assunto, texto, evento);
  if (dest.telefone) await enviarWhatsApp(dest.telefone, `*LAMTUE — ${assunto}*\n\n${texto}`, evento);
}

export async function notificarLigantes(userIds: number[] | "todos", assunto: string, corpo: string, evento: string) {
  let rows: Destinatario[];
  if (userIds === "todos") {
    rows = db().prepare("SELECT nome, email, telefone FROM users WHERE role='ligante' AND ativo=1").all() as Destinatario[];
  } else if (userIds.length === 0) {
    return;
  } else {
    const marks = userIds.map(() => "?").join(",");
    rows = db().prepare(`SELECT nome, email, telefone FROM users WHERE id IN (${marks}) AND ativo=1`).all(...userIds) as Destinatario[];
  }
  for (const r of rows) await notificar(r, assunto, corpo, evento);
}
