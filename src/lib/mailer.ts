import nodemailer from "nodemailer";
import { db } from "./db";

function transporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

/** Envia e-mail e registra no histórico. Nunca lança: retorna o status. */
export async function enviarEmail(para: string, assunto: string, corpo: string, evento: string): Promise<string> {
  let status = "enviado";
  const t = transporter();
  if (!t) {
    status = "smtp não configurado";
  } else {
    try {
      await t.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: para,
        subject: assunto,
        text: corpo,
        html: corpoHtml(assunto, corpo),
      });
    } catch (e) {
      status = `erro: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
  db().prepare(
    "INSERT INTO mensagens (canal, destinatario, assunto, corpo, evento, status) VALUES ('email', ?, ?, ?, ?, ?)"
  ).run(para, assunto, corpo, evento, status);
  return status;
}

function corpoHtml(assunto: string, corpo: string): string {
  const url = process.env.PUBLIC_URL || "http://localhost:3000";
  return `
  <div style="background:#070b14;padding:32px;font-family:Arial,Helvetica,sans-serif;color:#e8ecf4">
    <div style="max-width:560px;margin:0 auto;background:#0c1220;border:1px solid #1e293b;border-radius:12px;overflow:hidden">
      <div style="background:#8b1538;padding:20px 28px">
        <strong style="font-size:18px;letter-spacing:2px;color:#fff">LAMTUE</strong>
        <div style="font-size:11px;color:#f3cfd9;margin-top:2px">Liga Acadêmica de Medicina de Trauma, Urgência e Emergência — URI Erechim</div>
      </div>
      <div style="padding:28px">
        <h2 style="margin:0 0 16px;font-size:17px;color:#fff">${assunto}</h2>
        <div style="font-size:14px;line-height:1.7;color:#c4ccda;white-space:pre-line">${corpo}</div>
        <div style="margin-top:24px;font-size:12px;color:#64748b">Portal oficial: <a href="${url}" style="color:#e2536f">${url}</a></div>
      </div>
    </div>
  </div>`;
}
