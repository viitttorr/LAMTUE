"use server";
import { db } from "@/lib/db";
import { exigirLigante } from "@/lib/auth";
import { gerarQuestoes } from "@/lib/ai";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function gerarSimulado(formData: FormData) {
  const s = await exigirLigante();
  const tema = String(formData.get("tema") || "");
  const quantidade = Math.min(20, Math.max(3, Number(formData.get("quantidade") || 5)));
  const dificuldade = String(formData.get("dificuldade") || "media");
  if (!tema) redirect("/ligante/simulados?erro=" + encodeURIComponent("Escolha um tema."));

  const { questoes, origem } = await gerarQuestoes(tema, quantidade, dificuldade);
  if (questoes.length === 0)
    redirect("/ligante/simulados?erro=" + encodeURIComponent(
      "Não foi possível gerar questões deste tema. O banco de questões ainda não tem itens e a IA não está configurada — avise a diretoria."
    ));

  const r = await db().prepare(
    "INSERT INTO simulados (user_id, tema, dificuldade, questoes) VALUES (?, ?, ?, ?)"
  ).run(s.id, tema, dificuldade, JSON.stringify(questoes));
  redirect(`/ligante/simulados/${r.lastInsertRowid}${origem === "banco" ? "?origem=banco" : ""}`);
}

export async function finalizarSimulado(simuladoId: number, respostas: number[]) {
  const s = await exigirLigante();
  const sim = (await db().prepare("SELECT questoes, user_id, finalizado_em FROM simulados WHERE id = ?").get(simuladoId)) as
    | { questoes: string; user_id: number; finalizado_em: string | null } | undefined;
  if (!sim || sim.user_id !== s.id || sim.finalizado_em) return;
  const questoes = JSON.parse(sim.questoes) as { correta: number }[];
  const acertos = questoes.reduce((acc, q, i) => acc + (respostas[i] === q.correta ? 1 : 0), 0);
  const score = Math.round((acertos / questoes.length) * 100);
  await db().prepare(
    "UPDATE simulados SET respostas = ?, score = ?, finalizado_em = datetime('now','localtime') WHERE id = ?"
  ).run(JSON.stringify(respostas), score, simuladoId);
  revalidatePath(`/ligante/simulados/${simuladoId}`);
}

export async function alternarModulo(tema: string) {
  const s = await exigirLigante();
  const existe = await db().prepare("SELECT id FROM trilha_progresso WHERE user_id = ? AND tema = ?").get(s.id, tema);
  if (existe) await db().prepare("DELETE FROM trilha_progresso WHERE user_id = ? AND tema = ?").run(s.id, tema);
  else await db().prepare("INSERT INTO trilha_progresso (user_id, tema) VALUES (?, ?)").run(s.id, tema);
  revalidatePath("/ligante/trilha");
}

export async function registrarCaso(casoId: number, acertos: number, total: number) {
  const s = await exigirLigante();
  await db().prepare("INSERT INTO casos_resultados (caso_id, user_id, acertos, total) VALUES (?, ?, ?, ?)").run(casoId, s.id, acertos, total);
}
