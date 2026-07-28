import { db, UPLOADS_DIR } from "./db";
import path from "path";
import fs from "fs";
import { randomBytes } from "crypto";

export const DEFAULT_MAX_BYTES = 20 * 1024 * 1024; // 20 MB — comprovantes, extensão, galeria
export const MATERIAIS_MAX_BYTES = 100 * 1024 * 1024; // 100 MB — só para materiais de aula
const MIMES_PERMITIDOS = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "video/mp4",
]);

/** Valida e salva um upload; retorna o id na tabela arquivos ou null. */
export async function salvarArquivo(file: File | null, maxBytes: number = DEFAULT_MAX_BYTES): Promise<number | null> {
  if (!file || file.size === 0) return null;
  if (file.size > maxBytes) throw new Error(`Arquivo acima do limite de ${Math.round(maxBytes / 1024 / 1024)} MB.`);
  if (!MIMES_PERMITIDOS.has(file.type)) throw new Error(`Tipo de arquivo não permitido (${file.type || "desconhecido"}).`);
  const ext = path.extname(file.name).slice(0, 10) || "";
  const nomeFisico = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
  const destino = path.join(UPLOADS_DIR, nomeFisico);
  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(destino, buf);
  const r = db().prepare(
    "INSERT INTO arquivos (nome, mime, tamanho, caminho) VALUES (?, ?, ?, ?)"
  ).run(file.name, file.type, file.size, nomeFisico);
  return Number(r.lastInsertRowid);
}

export function lerArquivo(id: number): { nome: string; mime: string; buf: Buffer } | null {
  const row = db().prepare("SELECT nome, mime, caminho FROM arquivos WHERE id = ?").get(id) as
    | { nome: string; mime: string; caminho: string }
    | undefined;
  if (!row) return null;
  const p = path.join(UPLOADS_DIR, row.caminho);
  if (!fs.existsSync(p)) return null;
  return { nome: row.nome, mime: row.mime, buf: fs.readFileSync(p) };
}
