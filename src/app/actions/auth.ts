"use server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { setSessionCookie, clearSession, getSessao } from "@/lib/auth";
import { registrarAcao } from "@/lib/audit";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const identificador = String(formData.get("identificador") || "").trim().toLowerCase();
  const senha = String(formData.get("senha") || "");
  if (!identificador || !senha) redirect("/login?erro=" + encodeURIComponent("Informe suas credenciais."));

  const user = db()
    .prepare("SELECT id, senha_hash, role, ativo, must_change_password FROM users WHERE lower(email) = ? OR lower(matricula) = ?")
    .get(identificador, identificador) as
    | { id: number; senha_hash: string; role: string; ativo: number; must_change_password: number }
    | undefined;

  if (!user || !bcrypt.compareSync(senha, user.senha_hash))
    redirect("/login?erro=" + encodeURIComponent("Credenciais inválidas. Ligantes: no primeiro acesso, use a matrícula como senha."));
  if (!user.ativo)
    redirect("/login?erro=" + encodeURIComponent("Seu acesso está desativado. Fale com a diretoria."));

  await setSessionCookie(user.id);
  registrarAcao(user.id, "login");
  if (user.must_change_password) redirect("/trocar-senha");
  redirect(user.role === "diretoria" ? "/diretoria" : "/ligante");
}

export async function trocarSenha(formData: FormData) {
  const s = await getSessao();
  if (!s) redirect("/login");
  const atual = String(formData.get("atual") || "");
  const nova = String(formData.get("nova") || "");
  const confirma = String(formData.get("confirma") || "");
  if (nova.length < 8) redirect("/trocar-senha?erro=" + encodeURIComponent("A nova senha deve ter ao menos 8 caracteres."));
  if (nova !== confirma) redirect("/trocar-senha?erro=" + encodeURIComponent("A confirmação não confere."));

  const row = db().prepare("SELECT senha_hash FROM users WHERE id = ?").get(s.id) as { senha_hash: string };
  if (!bcrypt.compareSync(atual, row.senha_hash))
    redirect("/trocar-senha?erro=" + encodeURIComponent("Senha atual incorreta."));

  db().prepare("UPDATE users SET senha_hash = ?, must_change_password = 0 WHERE id = ?").run(bcrypt.hashSync(nova, 10), s.id);
  registrarAcao(s.id, "troca_senha");
  redirect(s.role === "diretoria" ? "/diretoria" : "/ligante");
}

export async function logout() {
  await clearSession();
  redirect("/");
}
