"use server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { setSessionCookie, clearSession, getSessao, BCRYPT_COST, custoDoHash } from "@/lib/auth";
import { registrarAcao } from "@/lib/audit";
import { redirect } from "next/navigation";

const MAX_TENTATIVAS = 3;
const BLOQUEIO_MS = 30 * 60 * 1000;

export async function login(formData: FormData) {
  const identificador = String(formData.get("identificador") || "").trim().toLowerCase();
  const senha = String(formData.get("senha") || "");
  if (!identificador || !senha) redirect("/login?erro=" + encodeURIComponent("Informe suas credenciais."));

  const user = (await db()
    .prepare("SELECT id, senha_hash, role, ativo, must_change_password, tentativas_falhas, bloqueado_ate FROM users WHERE lower(email) = ? OR lower(matricula) = ?")
    .get(identificador, identificador)) as
    | { id: number; senha_hash: string; role: string; ativo: number; must_change_password: number; tentativas_falhas: number; bloqueado_ate: string | null }
    | undefined;

  if (user?.bloqueado_ate && new Date(user.bloqueado_ate) > new Date()) {
    const minutos = Math.max(1, Math.ceil((new Date(user.bloqueado_ate).getTime() - Date.now()) / 60000));
    redirect("/login?erro=" + encodeURIComponent(`Muitas tentativas incorretas. Tente novamente em ${minutos} minuto(s).`));
  }

  if (!user || !bcrypt.compareSync(senha, user.senha_hash)) {
    if (user) {
      const tentativas = user.tentativas_falhas + 1;
      if (tentativas >= MAX_TENTATIVAS) {
        await db().prepare("UPDATE users SET tentativas_falhas = 0, bloqueado_ate = ? WHERE id = ?")
          .run(new Date(Date.now() + BLOQUEIO_MS).toISOString(), user.id);
        redirect("/login?erro=" + encodeURIComponent("Muitas tentativas incorretas. Tente novamente em 30 minutos."));
      }
      await db().prepare("UPDATE users SET tentativas_falhas = ? WHERE id = ?").run(tentativas, user.id);
    }
    redirect("/login?erro=" + encodeURIComponent("Credenciais inválidas. Ligantes: no primeiro acesso, use a matrícula como senha."));
  }
  if (!user.ativo)
    redirect("/login?erro=" + encodeURIComponent("Seu acesso está desativado. Fale com a diretoria."));

  if (user.tentativas_falhas > 0 || user.bloqueado_ate)
    await db().prepare("UPDATE users SET tentativas_falhas = 0, bloqueado_ate = NULL WHERE id = ?").run(user.id);

  // Migração silenciosa de hashes antigos (custo mais alto) para o custo atual.
  if (custoDoHash(user.senha_hash) > BCRYPT_COST)
    await db().prepare("UPDATE users SET senha_hash = ? WHERE id = ?").run(bcrypt.hashSync(senha, BCRYPT_COST), user.id);

  await setSessionCookie(user.id);
  await registrarAcao(user.id, "login");
  if (user.must_change_password) redirect("/trocar-senha");
  redirect(user.role === "diretoria" ? "/diretoria" : user.role === "candidato" ? "/candidato" : "/ligante");
}

export async function trocarSenha(formData: FormData) {
  const s = await getSessao();
  if (!s) redirect("/login");
  const atual = String(formData.get("atual") || "");
  const nova = String(formData.get("nova") || "");
  const confirma = String(formData.get("confirma") || "");
  if (nova.length < 8) redirect("/trocar-senha?erro=" + encodeURIComponent("A nova senha deve ter ao menos 8 caracteres."));
  if (nova !== confirma) redirect("/trocar-senha?erro=" + encodeURIComponent("A confirmação não confere."));

  const row = (await db().prepare("SELECT senha_hash FROM users WHERE id = ?").get(s.id)) as { senha_hash: string };
  if (!bcrypt.compareSync(atual, row.senha_hash))
    redirect("/trocar-senha?erro=" + encodeURIComponent("Senha atual incorreta."));

  await db().prepare("UPDATE users SET senha_hash = ?, must_change_password = 0 WHERE id = ?").run(bcrypt.hashSync(nova, BCRYPT_COST), s.id);
  await registrarAcao(s.id, "troca_senha");
  redirect(s.role === "diretoria" ? "/diretoria" : s.role === "candidato" ? "/candidato" : "/ligante");
}

export async function logout() {
  await clearSession();
  redirect("/");
}
