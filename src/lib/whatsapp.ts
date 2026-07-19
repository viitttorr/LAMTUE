/**
 * Conexão WhatsApp via Baileys, com autenticação por QR code e número
 * dedicado da liga. A sessão fica persistida em data/whatsapp/.
 * Todas as falhas são toleradas: o envio registra o status no histórico.
 */
import path from "path";
import fs from "fs";
import QRCode from "qrcode";
import { db } from "./db";

type WAState = {
  sock: unknown | null;
  status: "desconectado" | "aguardando_qr" | "conectado" | "erro";
  qrDataUrl: string | null;
  numero: string | null;
  erro: string | null;
  iniciando: boolean;
};

const g = globalThis as unknown as { __lamtueWA?: WAState };
if (!g.__lamtueWA) {
  g.__lamtueWA = { sock: null, status: "desconectado", qrDataUrl: null, numero: null, erro: null, iniciando: false };
}
const state = g.__lamtueWA;

export function waStatus() {
  return { status: state.status, qrDataUrl: state.qrDataUrl, numero: state.numero, erro: state.erro };
}

export async function waIniciar(): Promise<void> {
  if (state.iniciando || state.status === "conectado") return;
  state.iniciando = true;
  state.erro = null;
  try {
    const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = await import("@whiskeysockets/baileys");
    const authDir = path.join(process.cwd(), "data", "whatsapp");
    fs.mkdirSync(authDir, { recursive: true });
    const { state: authState, saveCreds } = await useMultiFileAuthState(authDir);

    const sock = makeWASocket({
      auth: authState,
      printQRInTerminal: false,
      syncFullHistory: false,
    });
    state.sock = sock;
    state.status = "aguardando_qr";

    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("connection.update", (update) => {
      void (async () => {
        if (update.qr) {
          state.qrDataUrl = await QRCode.toDataURL(update.qr, { margin: 1, width: 280 });
          state.status = "aguardando_qr";
        }
        if (update.connection === "open") {
          state.status = "conectado";
          state.qrDataUrl = null;
          state.numero = sock.user?.id?.split(":")[0] ?? null;
        }
        if (update.connection === "close") {
          const erro = update.lastDisconnect?.error as { output?: { statusCode?: number } } | undefined;
          const code = erro?.output?.statusCode;
          state.status = "desconectado";
          state.sock = null;
          state.qrDataUrl = null;
          // reconecta automaticamente, exceto em logout explícito
          if (code !== DisconnectReason.loggedOut) {
            state.iniciando = false;
            setTimeout(() => waIniciar().catch(() => {}), 3000);
          }
        }
      })();
    });
  } catch (e) {
    state.status = "erro";
    state.erro = e instanceof Error ? e.message : String(e);
  } finally {
    state.iniciando = false;
  }
}

export async function waDesconectar() {
  try {
    const sock = state.sock as { logout?: () => Promise<void> } | null;
    await sock?.logout?.();
  } catch {}
  state.sock = null;
  state.status = "desconectado";
  state.qrDataUrl = null;
  state.numero = null;
  const authDir = path.join(process.cwd(), "data", "whatsapp");
  fs.rmSync(authDir, { recursive: true, force: true });
}

/** Envia mensagem WhatsApp e registra no histórico. Nunca lança. */
export async function enviarWhatsApp(telefone: string, corpo: string, evento: string): Promise<string> {
  let status = "enviado";
  const digits = telefone.replace(/\D/g, "");
  if (!digits) status = "telefone inválido";
  else if (state.status !== "conectado" || !state.sock) status = "whatsapp desconectado";
  else {
    try {
      const jid = `${digits.length <= 11 ? "55" + digits : digits}@s.whatsapp.net`;
      const sock = state.sock as { sendMessage: (jid: string, msg: object) => Promise<unknown> };
      await sock.sendMessage(jid, { text: corpo });
    } catch (e) {
      status = `erro: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
  db().prepare(
    "INSERT INTO mensagens (canal, destinatario, assunto, corpo, evento, status) VALUES ('whatsapp', ?, NULL, ?, ?, ?)"
  ).run(telefone, corpo, evento, status);
  return status;
}
