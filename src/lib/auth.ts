import { cookies } from "next/headers";
import { db } from "./db";
import { redirect } from "next/navigation";
import { criarToken, validarToken, SESSION_COOKIE, SESSION_MAX_AGE_MS } from "./sessionToken";

/**
 * Custo do bcrypt. No plano Workers Free, o limite de CPU é 10ms por
 * requisição — bcryptjs (implementação pura em JS, sem binário nativo) em
 * custo 10 sozinho já pode estourar isso, causando Error 1102 no login.
 * Custo 8 (4× mais rápido) ainda é adequado para senhas iniciais = matrícula.
 */
export const BCRYPT_COST = 8;

/** Extrai o custo embutido num hash bcrypt ("$2a$10$..." → 10). */
export function custoDoHash(hash: string): number {
  const partes = hash.split("$");
  return Number(partes[2]) || 0;
}

export type Sessao = {
  id: number;
  nome: string;
  role: "ligante" | "diretoria" | "candidato";
  cargo: string | null;
  mustChange: boolean;
};

export async function setSessionCookie(userId: number) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await criarToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_MS / 1000,
  });
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/**
 * A validade do token (15min) é conferida em validarToken(); o middleware
 * renova o cookie a cada requisição autenticada, então "15min" aqui é uma
 * janela deslizante de inatividade, não um limite fixo desde o login.
 */
export async function getSessao(): Promise<Sessao | null> {
  const jar = await cookies();
  const validado = await validarToken(jar.get(SESSION_COOKIE)?.value);
  if (!validado) return null;
  const user = (await db()
    .prepare("SELECT id, nome, role, cargo, ativo, must_change_password FROM users WHERE id = ?")
    .get(validado.userId)) as
    | { id: number; nome: string; role: "ligante" | "diretoria" | "candidato"; cargo: string | null; ativo: number; must_change_password: number }
    | undefined;
  if (!user || !user.ativo) return null;
  return { id: user.id, nome: user.nome, role: user.role, cargo: user.cargo, mustChange: !!user.must_change_password };
}

export async function exigirLigante(): Promise<Sessao> {
  const s = await getSessao();
  if (!s) redirect("/login");
  if (s.role === "candidato") redirect("/candidato");
  return s;
}

export async function exigirDiretoria(): Promise<Sessao> {
  const s = await getSessao();
  if (!s) redirect("/login");
  if (s.role === "candidato") redirect("/candidato");
  if (s.role !== "diretoria") redirect("/ligante");
  return s;
}

export async function exigirCandidato(): Promise<Sessao> {
  const s = await getSessao();
  if (!s) redirect("/login");
  if (s.role !== "candidato") redirect(s.role === "diretoria" ? "/diretoria" : "/ligante");
  return s;
}

export function ehTesoureiro(s: Sessao): boolean {
  return s.role === "diretoria" && !!s.cargo && s.cargo.toLowerCase().includes("tesoureiro");
}

/**
 * "vice-presidente" contém "presidente": a exclusão é proposital, para o
 * acesso não ser concedido por coincidência de texto.
 */
export function ehPresidente(s: Sessao): boolean {
  if (s.role !== "diretoria" || !s.cargo) return false;
  const c = s.cargo.toLowerCase();
  return c.includes("presidente") && !c.includes("vice");
}

/** Edição completa de contas (senha, login, e-mail, papel etc.) é restrita ao Presidente. */
export async function exigirPresidente(): Promise<Sessao> {
  const s = await exigirDiretoria();
  if (!ehPresidente(s)) redirect("/diretoria/ligantes");
  return s;
}

/** Tesoureiro e Presidente têm acesso ao módulo financeiro. */
export function podeVerFinanceiro(s: Sessao): boolean {
  return ehTesoureiro(s) || (s.role === "diretoria" && !!s.cargo && s.cargo.toLowerCase().includes("presidente"));
}

/**
 * Galeria: publica a Diretoria de Comunicação (marketing) e, como respaldo,
 * a Presidência.
 */
export function podeGerenciarGaleria(s: Sessao): boolean {
  if (s.role !== "diretoria" || !s.cargo) return false;
  return s.cargo.toLowerCase().includes("comunica") || ehPresidente(s);
}

/** Porta de entrada das telas de gestão da galeria. */
export async function exigirGaleria(): Promise<Sessao> {
  const s = await exigirDiretoria();
  if (!podeGerenciarGaleria(s)) redirect("/diretoria");
  return s;
}
