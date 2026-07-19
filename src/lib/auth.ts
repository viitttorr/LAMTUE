import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "./db";
import { redirect } from "next/navigation";

const SECRET = process.env.SESSION_SECRET || "lamtue-dev-secret";
const COOKIE = "lamtue_session";

export type Sessao = {
  id: number;
  nome: string;
  role: "ligante" | "diretoria";
  cargo: string | null;
  mustChange: boolean;
};

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function tokenFor(userId: number): string {
  const payload = `${userId}.${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

export async function setSessionCookie(userId: number) {
  const jar = await cookies();
  jar.set(COOKIE, tokenFor(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export async function getSessao(): Promise<Sessao | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const payload = `${parts[0]}.${parts[1]}`;
  const expected = Buffer.from(sign(payload));
  const got = Buffer.from(parts[2]);
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) return null;
  // sessões expiram em 14 dias
  if (Date.now() - Number(parts[1]) > 14 * 24 * 60 * 60 * 1000) return null;
  const user = db()
    .prepare("SELECT id, nome, role, cargo, ativo, must_change_password FROM users WHERE id = ?")
    .get(Number(parts[0])) as
    | { id: number; nome: string; role: "ligante" | "diretoria"; cargo: string | null; ativo: number; must_change_password: number }
    | undefined;
  if (!user || !user.ativo) return null;
  return { id: user.id, nome: user.nome, role: user.role, cargo: user.cargo, mustChange: !!user.must_change_password };
}

export async function exigirLigante(): Promise<Sessao> {
  const s = await getSessao();
  if (!s) redirect("/login");
  return s;
}

export async function exigirDiretoria(): Promise<Sessao> {
  const s = await getSessao();
  if (!s) redirect("/login");
  if (s.role !== "diretoria") redirect("/ligante");
  return s;
}

export function ehTesoureiro(s: Sessao): boolean {
  return s.role === "diretoria" && !!s.cargo && s.cargo.toLowerCase().includes("tesoureiro");
}
