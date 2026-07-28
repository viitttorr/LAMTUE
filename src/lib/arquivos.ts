import { db, arquivosBucket } from "./db";
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

/** Valida e salva um upload no bucket R2; retorna o id na tabela arquivos ou null. */
export async function salvarArquivo(file: File | null, maxBytes: number = DEFAULT_MAX_BYTES): Promise<number | null> {
  if (!file || file.size === 0) return null;
  if (file.size > maxBytes) throw new Error(`Arquivo acima do limite de ${Math.round(maxBytes / 1024 / 1024)} MB.`);
  if (!MIMES_PERMITIDOS.has(file.type)) throw new Error(`Tipo de arquivo não permitido (${file.type || "desconhecido"}).`);
  const extMatch = file.name.match(/\.[a-zA-Z0-9]{1,10}$/);
  const ext = extMatch ? extMatch[0] : "";
  const chave = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
  const buf = await file.arrayBuffer();
  await arquivosBucket().put(chave, buf, { httpMetadata: { contentType: file.type } });
  const r = await db().prepare(
    "INSERT INTO arquivos (nome, mime, tamanho, caminho) VALUES (?, ?, ?, ?)"
  ).run(file.name, file.type, file.size, chave);
  return Number(r.lastInsertRowid);
}

/** Lê um arquivo do bucket R2 pelo id salvo em `arquivos`; devolve o corpo como stream. */
export async function lerArquivo(id: number): Promise<{ nome: string; mime: string; body: ReadableStream } | null> {
  const row = (await db().prepare("SELECT nome, mime, caminho FROM arquivos WHERE id = ?").get(id)) as
    | { nome: string; mime: string; caminho: string }
    | undefined;
  if (!row) return null;
  const obj = await arquivosBucket().get(row.caminho);
  if (!obj || !obj.body) return null;
  return { nome: row.nome, mime: row.mime, body: obj.body };
}
