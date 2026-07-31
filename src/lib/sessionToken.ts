/**
 * Assinatura/validação do token de sessão — isolado do resto de src/lib/auth.ts
 * (que importa next/headers) porque o middleware.ts também precisa desta
 * lógica, mas roda no Edge Runtime do Next.js, que não suporta o módulo
 * `node:crypto`. Web Crypto (`crypto.subtle`) funciona tanto no Edge Runtime
 * quanto no Node e no Workers, então é a única opção portátil aqui.
 */
const SECRET = process.env.SESSION_SECRET || "lamtue-dev-secret";

export const SESSION_COOKIE = "lamtue_session";

/** Sessão expira após este tempo sem atividade — renovada a cada requisição autenticada pelo middleware. */
export const SESSION_MAX_AGE_MS = 15 * 60 * 1000;

let chavePromise: Promise<CryptoKey> | null = null;
function chave(): Promise<CryptoKey> {
  if (!chavePromise) {
    chavePromise = crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );
  }
  return chavePromise;
}

function paraBase64Url(buf: ArrayBuffer): string {
  let bin = "";
  for (const b of new Uint8Array(buf)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function deBase64Url(s: string): Uint8Array<ArrayBuffer> {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/").padEnd(s.length + ((4 - (s.length % 4)) % 4), "=");
  const bin = atob(b64);
  const bytes = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export async function criarToken(userId: number): Promise<string> {
  const payload = `${userId}.${Date.now()}`;
  const assinatura = await crypto.subtle.sign("HMAC", await chave(), new TextEncoder().encode(payload));
  return `${payload}.${paraBase64Url(assinatura)}`;
}

export async function validarToken(token: string | undefined | null): Promise<{ userId: number; emitidoEm: number } | null> {
  if (!token) return null;
  const partes = token.split(".");
  if (partes.length !== 3) return null;
  const payload = `${partes[0]}.${partes[1]}`;
  let assinatura: Uint8Array<ArrayBuffer>;
  try {
    assinatura = deBase64Url(partes[2]);
  } catch {
    return null;
  }
  const valido = await crypto.subtle.verify("HMAC", await chave(), assinatura, new TextEncoder().encode(payload));
  if (!valido) return null;
  const emitidoEm = Number(partes[1]);
  if (!emitidoEm || Date.now() - emitidoEm > SESSION_MAX_AGE_MS) return null;
  return { userId: Number(partes[0]), emitidoEm };
}
