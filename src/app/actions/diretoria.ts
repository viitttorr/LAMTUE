"use server";
import bcrypt from "bcryptjs";
import { db, getConfig, setConfig } from "@/lib/db";
import { exigirDiretoria, podeVerFinanceiro, exigirGaleria, exigirPresidente, BCRYPT_COST } from "@/lib/auth";
import { registrarAcao } from "@/lib/audit";
import { salvarArquivo, MATERIAIS_MAX_BYTES } from "@/lib/arquivos";
import { notificar, notificarLigantes } from "@/lib/notify";
import { enviarEmail } from "@/lib/mailer";
import { waIniciar, waDesconectar } from "@/lib/whatsapp";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { calcularSemestre, brasiliaParaUTC } from "@/lib/util";

/* ── Aulas ─────────────────────────────────────── */
export async function salvarAula(formData: FormData) {
  const s = await exigirDiretoria();
  const id = Number(formData.get("id") || 0);
  const titulo = String(formData.get("titulo") || "").trim();
  const tema = String(formData.get("tema") || "").trim() || null;
  const data = String(formData.get("data") || "");
  const local = String(formData.get("local") || "").trim() || null;
  const descricao = String(formData.get("descricao") || "").trim() || null;
  if (!titulo || !data) return;
  if (id) {
    await db().prepare("UPDATE aulas SET titulo=?, tema=?, data=?, local=?, descricao=? WHERE id=?").run(titulo, tema, data, local, descricao, id);
    await registrarAcao(s.id, "aula_editada", `#${id} ${titulo}`);
  } else {
    await db().prepare("INSERT INTO aulas (titulo, tema, data, local, descricao) VALUES (?,?,?,?,?)").run(titulo, tema, data, local, descricao);
    await registrarAcao(s.id, "aula_criada", titulo);
  }
  revalidatePath("/diretoria/aulas");
  return { ok: "Aula salva." };
}

export async function excluirAula(formData: FormData) {
  const s = await exigirDiretoria();
  const id = Number(formData.get("id"));
  await db().prepare("DELETE FROM aulas WHERE id = ?").run(id);
  await registrarAcao(s.id, "aula_excluida", `#${id}`);
  revalidatePath("/diretoria/aulas");
  return { ok: "Aula excluída." };
}

export async function lembrarAula(formData: FormData) {
  const s = await exigirDiretoria();
  const id = Number(formData.get("id"));
  const aula = (await db().prepare("SELECT titulo, data, local FROM aulas WHERE id = ?").get(id)) as { titulo: string; data: string; local: string | null } | undefined;
  if (!aula) return;
  await notificarLigantes(
    "todos",
    "Lembrete de aula — LAMTUE",
    `Amanhã tem LAMTUE! 🚑\n\nAula: ${aula.titulo}\nData: ${new Date(aula.data + "T12:00").toLocaleDateString("pt-BR")}${aula.local ? `\nLocal: ${aula.local}` : ""}\n\nSua presença conta para a certificação.`,
    "lembrete_aula"
  );
  await registrarAcao(s.id, "lembrete_aula_enviado", aula.titulo);
  revalidatePath("/diretoria/notificacoes");
  return { ok: "Lembrete enviado aos ligantes." };
}

/* ── Frequência ────────────────────────────────── */
export async function confirmarChamada(formData: FormData) {
  const s = await exigirDiretoria();
  const aulaId = Number(formData.get("aula_id"));
  const aula = (await db().prepare("SELECT titulo, data FROM aulas WHERE id = ?").get(aulaId)) as { titulo: string; data: string } | undefined;
  if (!aula) return;
  const ligantes = (await db().prepare("SELECT id, nome, email, telefone FROM users WHERE role='ligante' AND ativo=1").all()) as
    { id: number; nome: string; email: string | null; telefone: string | null }[];

  const upsert = db().prepare(
    "INSERT INTO presencas (aula_id, user_id, presente) VALUES (?, ?, ?) ON CONFLICT(aula_id, user_id) DO UPDATE SET presente = excluded.presente, registrado_em = datetime('now')"
  );
  const presentes: typeof ligantes = [];
  for (const l of ligantes) {
    const presente = formData.get(`p_${l.id}`) === "on" ? 1 : 0;
    await upsert.run(aulaId, l.id, presente);
    if (presente) presentes.push(l);
  }
  await registrarAcao(s.id, "chamada_confirmada", `aula #${aulaId} (${aula.titulo}): ${presentes.length}/${ligantes.length} presentes`);

  for (const l of presentes) {
    await notificar(
      l,
      "Presença registrada — LAMTUE",
      `Sua presença na aula "${aula.titulo}" (${new Date(aula.data + "T12:00").toLocaleDateString("pt-BR")}) foi registrada com sucesso. ✅`,
      "presenca_registrada"
    );
  }
  revalidatePath("/diretoria/frequencia");
  return { ok: "Chamada confirmada! Os ligantes presentes foram notificados." };
}

/* ── Ligantes ──────────────────────────────────── */
export async function salvarMembro(formData: FormData) {
  const id = Number(formData.get("id") || 0);
  // criar conta: qualquer diretoria; editar conta existente: só o Presidente
  const s = id ? await exigirPresidente() : await exigirDiretoria();
  const nome = String(formData.get("nome") || "").trim();
  const matricula = String(formData.get("matricula") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase() || null;
  const telefone = String(formData.get("telefone") || "").trim() || null;
  const role = String(formData.get("role") || "ligante") === "diretoria" ? "diretoria" : "ligante";
  const turma = role === "ligante" ? String(formData.get("turma") || "").trim() || null : null;
  const cargo = role === "diretoria" ? String(formData.get("cargo") || "").trim() || null : null;
  if (!nome || !matricula) return { erro: "Nome e matrícula são obrigatórios." };
  try {
    if (id) {
      await db().prepare(
        "UPDATE users SET nome=?, matricula=?, email=?, telefone=?, turma=?, role=?, cargo=? WHERE id=? AND role IN ('ligante','diretoria')"
      ).run(nome, matricula, email, telefone, turma, role, cargo, id);
      await registrarAcao(s.id, "membro_editado", `#${id} ${nome}`);
    } else {
      // credencial temporária = matrícula (troca obrigatória no 1º login)
      await db().prepare(
        "INSERT INTO users (nome, matricula, email, telefone, turma, cargo, senha_hash, role, must_change_password) VALUES (?,?,?,?,?,?,?,?,1)"
      ).run(nome, matricula, email, telefone, turma, cargo, bcrypt.hashSync(matricula, BCRYPT_COST), role);
      await registrarAcao(s.id, "membro_cadastrado", `${nome} (${matricula}) — ${role}`);
    }
  } catch {
    return { erro: "Matrícula ou e-mail já cadastrado." };
  }
  revalidatePath("/diretoria/ligantes");
  return { ok: "Salvo." };
}

export async function importarLigantes(formData: FormData) {
  const s = await exigirDiretoria();
  const file = formData.get("csv") as File | null;
  if (!file || file.size === 0) return { erro: "Envie um arquivo CSV." };
  const texto = Buffer.from(await file!.arrayBuffer()).toString("utf-8").replace(/^﻿/, "");
  const linhas = texto.split(/\r?\n/).filter((l) => l.trim());
  let importados = 0, ignorados = 0;
  const ins = db().prepare(
    "INSERT INTO users (nome, matricula, email, telefone, turma, senha_hash, role, must_change_password) VALUES (?,?,?,?,?,?,'ligante',1)"
  );
  for (const [i, linha] of linhas.entries()) {
    const cols = linha.split(/[;,]/).map((c) => c.trim().replace(/^"|"$/g, ""));
    if (i === 0 && /nome/i.test(cols[0])) continue; // cabeçalho
    const [nome, matricula, email, telefone, turma] = cols;
    if (!nome || !matricula) { ignorados++; continue; }
    try {
      await ins.run(nome, matricula, email?.toLowerCase() || null, telefone || null, turma || null, bcrypt.hashSync(matricula, BCRYPT_COST));
      importados++;
    } catch { ignorados++; }
  }
  await registrarAcao(s.id, "ligantes_importados", `${importados} importados, ${ignorados} ignorados`);
  revalidatePath("/diretoria/ligantes");
  return { ok: `${importados} ligante(s) importado(s), ${ignorados} ignorado(s).` };
}

export async function alternarAtivo(formData: FormData) {
  const s = await exigirDiretoria();
  const id = Number(formData.get("id"));
  await db().prepare("UPDATE users SET ativo = 1 - ativo WHERE id = ? AND role IN ('ligante','diretoria')").run(id);
  await registrarAcao(s.id, "membro_ativado_desativado", `#${id}`);
  revalidatePath("/diretoria/ligantes");
  return { ok: "Situação da conta alterada." };
}

/** Redefine a senha de volta à matrícula (mesma convenção do 1º acesso) — restrito ao Presidente. */
export async function redefinirSenhaMembro(formData: FormData) {
  const s = await exigirPresidente();
  const id = Number(formData.get("id"));
  const membro = (await db().prepare("SELECT matricula FROM users WHERE id = ? AND role IN ('ligante','diretoria')").get(id)) as
    { matricula: string | null } | undefined;
  if (!membro?.matricula) return { erro: "Conta sem matrícula definida." };
  await db().prepare("UPDATE users SET senha_hash = ?, must_change_password = 1 WHERE id = ?")
    .run(bcrypt.hashSync(membro.matricula, BCRYPT_COST), id);
  await registrarAcao(s.id, "membro_senha_redefinida", `#${id}`);
  revalidatePath("/diretoria/ligantes");
  return { ok: "Senha redefinida para a matrícula. O usuário deverá trocá-la no próximo acesso." };
}

/* ── Materiais ─────────────────────────────────── */
export async function salvarMaterial(formData: FormData) {
  const s = await exigirDiretoria();
  const titulo = String(formData.get("titulo") || "").trim();
  const tema = String(formData.get("tema") || "").trim();
  const tipo = String(formData.get("tipo") || "link");
  const url = String(formData.get("url") || "").trim() || null;
  const visibilidade = String(formData.get("visibilidade") || "ligantes");
  const aulaId = Number(formData.get("aula_id") || 0) || null;
  if (!titulo || !tema) return;
  let arquivoId: number | null = null;
  try {
    arquivoId = await salvarArquivo(formData.get("arquivo") as File | null, MATERIAIS_MAX_BYTES);
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Falha no upload." };
  }
  if (!url && !arquivoId) return { erro: "Informe um link ou envie um arquivo." };
  await db().prepare(
    "INSERT INTO materiais (titulo, tema, tipo, url, arquivo_id, visibilidade, aula_id) VALUES (?,?,?,?,?,?,?)"
  ).run(titulo, tema, tipo, url, arquivoId, visibilidade, aulaId);
  await registrarAcao(s.id, "material_publicado", `${titulo} (${tema})`);
  await notificarLigantes("todos", "Novo material na biblioteca — LAMTUE",
    `Novo material disponível: "${titulo}" (tema: ${tema}). Acesse a biblioteca na área do ligante.`, "novo_material");
  revalidatePath("/diretoria/materiais");
  return { ok: "Salvo." };
}

export async function excluirMaterial(formData: FormData) {
  const s = await exigirDiretoria();
  const id = Number(formData.get("id"));
  await db().prepare("DELETE FROM materiais WHERE id = ?").run(id);
  await registrarAcao(s.id, "material_excluido", `#${id}`);
  revalidatePath("/diretoria/materiais");
  return { ok: "Material excluído." };
}

/* ── Questões ──────────────────────────────────── */
export async function salvarQuestao(formData: FormData) {
  const s = await exigirDiretoria();
  const tema = String(formData.get("tema") || "");
  const dificuldade = String(formData.get("dificuldade") || "media");
  const enunciado = String(formData.get("enunciado") || "").trim();
  const alternativas = [0, 1, 2, 3].map((i) => String(formData.get(`alt_${i}`) || "").trim()).filter(Boolean);
  const correta = Number(formData.get("correta") || 0);
  const comentario = String(formData.get("comentario") || "").trim();
  if (!tema || !enunciado || alternativas.length < 4) return;
  await db().prepare(
    "INSERT INTO questoes (tema, dificuldade, enunciado, alternativas, correta, comentario, origem, aprovada) VALUES (?,?,?,?,?,?,'manual',1)"
  ).run(tema, dificuldade, enunciado, JSON.stringify(alternativas), correta, comentario);
  await registrarAcao(s.id, "questao_criada", tema);
  revalidatePath("/diretoria/questoes");
  return { ok: "Questão adicionada ao banco." };
}

export async function moderarQuestao(formData: FormData) {
  const s = await exigirDiretoria();
  const id = Number(formData.get("id"));
  const acao = String(formData.get("acao"));
  if (acao === "aprovar") await db().prepare("UPDATE questoes SET aprovada = 1 WHERE id = ?").run(id);
  else await db().prepare("DELETE FROM questoes WHERE id = ?").run(id);
  await registrarAcao(s.id, `questao_${acao === "aprovar" ? "aprovada" : "excluida"}`, `#${id}`);
  revalidatePath("/diretoria/questoes");
  return { ok: "Questão atualizada." };
}

/**
 * Importação em massa de questões via CSV. Colunas:
 * tema;dificuldade;enunciado;alt_a;alt_b;alt_c;alt_d;correta;comentario
 * "correta" aceita A/B/C/D ou 0-3. Entram já aprovadas (origem manual).
 */
export async function importarQuestoes(formData: FormData) {
  const s = await exigirDiretoria();
  const file = formData.get("csv") as File | null;
  if (!file || file.size === 0) return { erro: "Envie um arquivo CSV." };
  const texto = Buffer.from(await file!.arrayBuffer()).toString("utf-8").replace(/^﻿/, "");
  const linhas = texto.split(/\r?\n/).filter((l) => l.trim());
  let importadas = 0, ignoradas = 0;
  const ins = db().prepare(
    "INSERT INTO questoes (tema, dificuldade, enunciado, alternativas, correta, comentario, origem, aprovada) VALUES (?,?,?,?,?,?,'manual',1)"
  );
  for (const [i, linha] of linhas.entries()) {
    const cols = linha.split(";").map((c) => c.trim().replace(/^"|"$/g, ""));
    if (i === 0 && /tema/i.test(cols[0])) continue; // cabeçalho
    const [tema, dificuldade, enunciado, altA, altB, altC, altD, corretaRaw, comentario = ""] = cols;
    const alternativas = [altA, altB, altC, altD].map((a) => (a || "").trim());
    if (!tema || !enunciado || alternativas.some((a) => !a)) { ignoradas++; continue; }
    const letra = (corretaRaw || "").trim().toUpperCase();
    const correta = "ABCD".includes(letra) ? "ABCD".indexOf(letra) : Math.max(0, Math.min(3, Number(corretaRaw) || 0));
    try {
      await ins.run(tema, ["facil", "media", "dificil"].includes(dificuldade) ? dificuldade : "media", enunciado, JSON.stringify(alternativas), correta, comentario.trim());
      importadas++;
    } catch { ignoradas++; }
  }
  await registrarAcao(s.id, "questoes_importadas", `${importadas} importadas, ${ignoradas} ignoradas`);
  revalidatePath("/diretoria/questoes");
  return { ok: `${importadas} questão(ões) importada(s), ${ignoradas} ignorada(s).` };
}

/* ── Casos clínicos ────────────────────────────── */
type Etapa = { pergunta: string; opcoes: { texto: string; correta: boolean; feedback: string }[] };

/* Formato de texto das etapas:
   ? Pergunta da etapa
   * opção correta | feedback
   - opção errada | feedback            */
function parseEtapas(etapasRaw: string): Etapa[] {
  const etapas: Etapa[] = [];
  for (const linhaBruta of etapasRaw.split("\n")) {
    const linha = linhaBruta.trim();
    if (!linha) continue;
    if (linha.startsWith("?")) {
      etapas.push({ pergunta: linha.slice(1).trim(), opcoes: [] });
    } else if ((linha.startsWith("*") || linha.startsWith("-")) && etapas.length > 0) {
      const [texto, feedback = ""] = linha.slice(1).split("|").map((p) => p.trim());
      if (texto) etapas[etapas.length - 1].opcoes.push({ texto, correta: linha.startsWith("*"), feedback });
    }
  }
  return etapas;
}
function etapasValidas(etapas: Etapa[]) {
  return etapas.length > 0 && etapas.every((e) => e.pergunta && e.opcoes.length >= 2 && e.opcoes.some((o) => o.correta));
}

export async function salvarCaso(formData: FormData) {
  const s = await exigirDiretoria();
  const id = Number(formData.get("id") || 0);
  const titulo = String(formData.get("titulo") || "").trim();
  const tema = String(formData.get("tema") || "");
  const contexto = String(formData.get("contexto") || "").trim();
  const visibilidade = String(formData.get("visibilidade") || "ligantes");
  const etapasRaw = String(formData.get("etapas") || "");
  if (!titulo || !tema || !contexto) return { erro: "Preencha título, tema e cenário." };
  const etapas = parseEtapas(etapasRaw);
  if (!etapasValidas(etapas))
    return { erro: "Estrutura de etapas inválida: cada etapa precisa de uma pergunta (linha com ?) e ao menos 2 opções (linhas com * ou -), sendo 1 correta (*)." };
  if (id) {
    await db().prepare("UPDATE casos SET titulo=?, tema=?, contexto=?, etapas=?, visibilidade=? WHERE id=?")
      .run(titulo, tema, contexto, JSON.stringify(etapas), visibilidade, id);
    await registrarAcao(s.id, "caso_editado", `#${id} ${titulo}`);
  } else {
    await db().prepare("INSERT INTO casos (titulo, tema, contexto, etapas, visibilidade) VALUES (?,?,?,?,?)")
      .run(titulo, tema, contexto, JSON.stringify(etapas), visibilidade);
    await registrarAcao(s.id, "caso_criado", titulo);
  }
  revalidatePath("/diretoria/casos");
  return { ok: "Salvo." };
}

/**
 * Importação em massa de casos clínicos via arquivo de texto. Vários casos
 * no mesmo arquivo, separados por uma linha "===". Cada bloco:
 * TITULO: ...
 * TEMA: ...
 * VISIBILIDADE: ligantes|publico   (opcional, padrão ligantes)
 * CENARIO: ...  (pode ocupar várias linhas até a linha ETAPAS:)
 * ETAPAS:
 * ? Pergunta
 * * opção correta | feedback
 * - opção errada | feedback
 */
export async function importarCasos(formData: FormData) {
  const s = await exigirDiretoria();
  const file = formData.get("txt") as File | null;
  if (!file || file.size === 0) return { erro: "Envie um arquivo de texto." };
  const texto = Buffer.from(await file!.arrayBuffer()).toString("utf-8").replace(/^﻿/, "");
  const blocos = texto.split(/^===+\s*$/m).map((b) => b.trim()).filter(Boolean);
  let importados = 0, ignorados = 0;
  const ins = db().prepare("INSERT INTO casos (titulo, tema, contexto, etapas, visibilidade) VALUES (?,?,?,?,?)");
  for (const bloco of blocos) {
    const mTitulo = bloco.match(/^TITULO:\s*(.+)$/im);
    const mTema = bloco.match(/^TEMA:\s*(.+)$/im);
    const mVis = bloco.match(/^VISIBILIDADE:\s*(.+)$/im);
    const mCenario = bloco.match(/^CENARIO:\s*([\s\S]*?)(?=^ETAPAS:\s*$)/im);
    const mEtapas = bloco.match(/^ETAPAS:\s*\n([\s\S]*)$/im);
    const titulo = mTitulo?.[1].trim() || "";
    const tema = mTema?.[1].trim() || "";
    const contexto = mCenario?.[1].trim() || "";
    const visibilidade = mVis?.[1].trim().toLowerCase() === "publico" ? "publico" : "ligantes";
    const etapas = mEtapas ? parseEtapas(mEtapas[1]) : [];
    if (!titulo || !tema || !contexto || !etapasValidas(etapas)) { ignorados++; continue; }
    try {
      await ins.run(titulo, tema, contexto, JSON.stringify(etapas), visibilidade);
      importados++;
    } catch { ignorados++; }
  }
  await registrarAcao(s.id, "casos_importados", `${importados} importados, ${ignorados} ignorados`);
  revalidatePath("/diretoria/casos");
  return { ok: `${importados} caso(s) importado(s), ${ignorados} ignorado(s).` };
}

export async function excluirCaso(formData: FormData) {
  const s = await exigirDiretoria();
  const id = Number(formData.get("id"));
  await db().prepare("DELETE FROM casos WHERE id = ?").run(id);
  await registrarAcao(s.id, "caso_excluido", `#${id}`);
  revalidatePath("/diretoria/casos");
  return { ok: "Caso excluído." };
}

/* ── Processo seletivo ─────────────────────────── */
export async function salvarSeletivo(formData: FormData) {
  const s = await exigirDiretoria();
  const ativo = formData.get("ativo") === "on" ? 1 : 0;
  const vagas = Number(formData.get("vagas") || 20);
  const prazo = String(formData.get("prazo") || "") || null;
  const taxa = Math.round(Number(String(formData.get("taxa") || "0").replace(",", ".")) * 100);
  const edital = String(formData.get("edital") || "").trim() || null;
  const etapas = String(formData.get("cron_etapas") || "").split("\n").map((l) => l.trim()).filter(Boolean);
  const cronograma = etapas.map((l) => {
    const [etapa, data] = l.split("|").map((p) => p.trim());
    return { etapa, data: data || "" };
  });

  let editalArquivoId: number | null = null;
  try {
    editalArquivoId = await salvarArquivo(formData.get("edital_pdf") as File | null);
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Falha no upload do edital." };
  }
  if (!editalArquivoId) {
    const atual = (await db().prepare("SELECT edital_arquivo_id FROM seletivo WHERE id=1").get()) as { edital_arquivo_id: number | null } | undefined;
    editalArquivoId = atual?.edital_arquivo_id ?? null;
  }

  await db().prepare("UPDATE seletivo SET ativo=?, vagas=?, prazo=?, taxa_centavos=?, edital=?, cronograma=?, edital_arquivo_id=? WHERE id=1")
    .run(ativo, vagas, prazo, taxa, edital, JSON.stringify(cronograma), editalArquivoId);
  await registrarAcao(s.id, "seletivo_configurado", `ativo=${ativo}, vagas=${vagas}, prazo=${prazo}`);
  revalidatePath("/diretoria/seletivo");
  revalidatePath("/seletivo");
  revalidatePath("/candidato");
  revalidatePath("/");
  return { ok: "Salvo." };
}

export async function excluirInscricao(formData: FormData) {
  const s = await exigirDiretoria();
  const id = Number(formData.get("id"));
  await db().prepare("DELETE FROM inscricoes WHERE id = ?").run(id);
  await registrarAcao(s.id, "inscricao_excluida", `#${id}`);
  revalidatePath("/diretoria/seletivo");
  return { ok: "Inscrição excluída." };
}

/**
 * Gabarito da prova do seletivo — 21 questões, 0 = ainda não lançado.
 * Um único envio para todas as linhas da tabela (inputs referenciam este
 * form por id, via atributo `form`), em vez de um botão "OK" por candidato —
 * evita dezenas de entradas separadas no log de auditoria.
 */
export async function salvarAcertosEmMassa(formData: FormData) {
  const s = await exigirDiretoria();
  let atualizados = 0;
  for (const [chave, valor] of formData.entries()) {
    const m = chave.match(/^acertos_(\d+)$/);
    if (!m) continue;
    const id = Number(m[1]);
    const acertos = Math.max(0, Math.min(21, Number(valor) || 0));
    await db().prepare("UPDATE inscricoes SET acertos = ? WHERE id = ?").run(acertos, id);
    atualizados++;
  }
  await registrarAcao(s.id, "inscricao_acertos_lote", `${atualizados} inscrição(ões) atualizada(s)`);
  revalidatePath("/diretoria/seletivo");
  revalidatePath("/candidato");
  return { ok: `Gabarito atualizado para ${atualizados} inscrito(s).` };
}

export async function removerEditalPdf() {
  const s = await exigirDiretoria();
  await db().prepare("UPDATE seletivo SET edital_arquivo_id = NULL WHERE id = 1").run();
  await registrarAcao(s.id, "edital_pdf_removido");
  revalidatePath("/diretoria/seletivo");
  revalidatePath("/seletivo");
  revalidatePath("/candidato");
  return { ok: "PDF do edital removido." };
}

/**
 * Liberação programada do gabarito para os candidatos: data/hora (Brasília,
 * convertida para UTC ao salvar — o Worker roda em UTC) + PDF opcional do
 * gabarito oficial, mesmo padrão de upload do edital.
 */
export async function salvarGabarito(formData: FormData) {
  const s = await exigirDiretoria();
  const liberaEm = brasiliaParaUTC(String(formData.get("gabarito_libera_em") || ""));

  let gabaritoArquivoId: number | null = null;
  try {
    gabaritoArquivoId = await salvarArquivo(formData.get("gabarito_pdf") as File | null);
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Falha no upload do gabarito." };
  }
  if (!gabaritoArquivoId) {
    const atual = (await db().prepare("SELECT gabarito_arquivo_id FROM seletivo WHERE id=1").get()) as { gabarito_arquivo_id: number | null } | undefined;
    gabaritoArquivoId = atual?.gabarito_arquivo_id ?? null;
  }

  await db().prepare("UPDATE seletivo SET gabarito_libera_em=?, gabarito_arquivo_id=? WHERE id=1").run(liberaEm, gabaritoArquivoId);
  await registrarAcao(s.id, "gabarito_configurado", liberaEm ? `libera em ${liberaEm}` : "data removida");
  revalidatePath("/diretoria/seletivo");
  revalidatePath("/candidato");
  return { ok: "Salvo." };
}

export async function removerGabaritoPdf() {
  const s = await exigirDiretoria();
  await db().prepare("UPDATE seletivo SET gabarito_arquivo_id = NULL WHERE id = 1").run();
  await registrarAcao(s.id, "gabarito_pdf_removido");
  revalidatePath("/diretoria/seletivo");
  revalidatePath("/candidato");
  return { ok: "PDF do gabarito removido." };
}

/**
 * Importação em massa de candidatos — para inscrições recebidas fora do
 * formulário público (ex.: planilha de outro canal). Colunas:
 * nome;email;matricula;telefone;turma. O semestre é calculado a partir da
 * turma, mesma convenção usada para ligantes.
 */
export async function importarInscritos(formData: FormData) {
  const s = await exigirDiretoria();
  const file = formData.get("csv") as File | null;
  if (!file || file.size === 0) return { erro: "Envie um arquivo CSV." };
  const texto = Buffer.from(await file!.arrayBuffer()).toString("utf-8").replace(/^﻿/, "");
  const linhas = texto.split(/\r?\n/).filter((l) => l.trim());
  const periodoAtual = await getConfig("periodo_atual", "2026/2");
  let importados = 0, ignorados = 0;
  const ins = db().prepare(
    "INSERT INTO inscricoes (nome, matricula, semestre, email, telefone, turma) VALUES (?,?,?,?,?,?)"
  );
  for (const [i, linha] of linhas.entries()) {
    const cols = linha.split(/[;,]/).map((c) => c.trim().replace(/^"|"$/g, ""));
    if (i === 0 && /nome/i.test(cols[0])) continue; // cabeçalho
    const [nome, email, matricula, telefone, turma] = cols;
    if (!nome || !email || !matricula || !telefone) { ignorados++; continue; }
    const semestre = calcularSemestre(turma, periodoAtual) ?? "—";
    try {
      await ins.run(nome, matricula, semestre, email.toLowerCase(), telefone, turma || null);
      importados++;
    } catch { ignorados++; }
  }
  await registrarAcao(s.id, "inscritos_importados", `${importados} importados, ${ignorados} ignorados`);
  revalidatePath("/diretoria/seletivo");
  return { ok: `${importados} candidato(s) importado(s), ${ignorados} ignorado(s).` };
}

/** Cadastro manual de um único candidato, mesma convenção do import em massa (semestre calculado a partir da turma). */
export async function criarInscricaoManual(formData: FormData) {
  const s = await exigirDiretoria();
  const nome = String(formData.get("nome") || "").trim();
  const matricula = String(formData.get("matricula") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const telefone = String(formData.get("telefone") || "").trim();
  const turma = String(formData.get("turma") || "").trim() || null;
  if (!nome || !matricula || !email || !telefone)
    return { erro: "Preencha nome, matrícula, e-mail e telefone." };

  const periodoAtual = await getConfig("periodo_atual", "2026/2");
  const semestre = calcularSemestre(turma, periodoAtual) ?? "—";
  try {
    await db().prepare(
      "INSERT INTO inscricoes (nome, matricula, semestre, email, telefone, turma) VALUES (?,?,?,?,?,?)"
    ).run(nome, matricula, semestre, email, telefone, turma);
  } catch {
    return { erro: "Matrícula ou e-mail já cadastrado." };
  }
  await registrarAcao(s.id, "inscricao_manual_criada", `${nome} (${matricula})`);
  revalidatePath("/diretoria/seletivo");
  return { ok: "Candidato cadastrado manualmente." };
}

export async function alterarStatusInscricao(formData: FormData) {
  const s = await exigirDiretoria();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status"));
  if (!["pendente", "aprovado", "reprovado", "espera"].includes(status)) return;
  await db().prepare("UPDATE inscricoes SET status = ? WHERE id = ?").run(status, id);
  await registrarAcao(s.id, "inscricao_status", `#${id} → ${status}`);
  revalidatePath("/diretoria/seletivo");
  return { ok: "Status atualizado." };
}

/**
 * Cria uma conta de acesso limitado (role='candidato') para o inscrito no
 * seletivo poder acompanhar o status pelo portal, antes mesmo do resultado.
 * Login/senha temporária = matrícula, mesma convenção de salvarMembro.
 */
export async function criarContaCandidato(formData: FormData) {
  const s = await exigirDiretoria();
  const id = Number(formData.get("id"));
  const insc = (await db().prepare("SELECT * FROM inscricoes WHERE id = ?").get(id)) as
    | { id: number; nome: string; matricula: string; email: string; telefone: string; semestre: string; user_id: number | null }
    | undefined;
  if (!insc || insc.user_id) return;
  try {
    const r = await db().prepare(
      "INSERT INTO users (nome, matricula, email, telefone, semestre, senha_hash, role, must_change_password) VALUES (?,?,?,?,?,?,'candidato',1)"
    ).run(insc.nome, insc.matricula, insc.email.toLowerCase(), insc.telefone, insc.semestre, bcrypt.hashSync(insc.matricula, BCRYPT_COST));
    await db().prepare("UPDATE inscricoes SET user_id = ? WHERE id = ?").run(r.lastInsertRowid, id);
    await registrarAcao(s.id, "candidato_conta_criada", `#${id} ${insc.nome}`);
  } catch {
    return { erro: "Matrícula ou e-mail já cadastrado em outra conta." };
  }
  revalidatePath("/diretoria/seletivo");
  return { ok: "Conta do candidato criada." };
}

const TEXTOS_RESULTADO: Record<string, { assunto: string; corpo: (nome: string) => string }> = {
  aprovado: {
    assunto: "Resultado do Processo Seletivo LAMTUE — Aprovado(a)! 🎉",
    corpo: (n) => `Parabéns, ${n}! Você foi APROVADO(A) no processo seletivo da LAMTUE.\n\nEm breve a diretoria entrará em contato com as orientações do primeiro encontro e o seu acesso à área do ligante (login e senha iniciais = sua matrícula).\n\nSeja bem-vindo(a) à liga!`,
  },
  reprovado: {
    assunto: "Resultado do Processo Seletivo LAMTUE",
    corpo: (n) => `Olá, ${n}. Agradecemos sua participação no processo seletivo da LAMTUE.\n\nInfelizmente você não foi classificado(a) nesta edição. Não desanime: novas turmas abrem a cada período, e esperamos você no próximo seletivo.`,
  },
  espera: {
    assunto: "Resultado do Processo Seletivo LAMTUE — Lista de espera",
    corpo: (n) => `Olá, ${n}. Você ficou na LISTA DE ESPERA do processo seletivo da LAMTUE.\n\nHavendo desistências, os candidatos da lista serão chamados na ordem de classificação. Fique atento(a) ao seu e-mail e WhatsApp.`,
  },
};

export async function enviarResultados(formData: FormData) {
  const s = await exigirDiretoria();
  const status = String(formData.get("status"));
  const modelo = TEXTOS_RESULTADO[status];
  if (!modelo) return;
  const inscritos = (await db().prepare("SELECT nome, email, telefone FROM inscricoes WHERE status = ?").all(status)) as
    { nome: string; email: string; telefone: string }[];
  for (const i of inscritos) {
    await notificar(i, modelo.assunto, modelo.corpo(i.nome.split(" ")[0]), `resultado_${status}`);
  }
  await registrarAcao(s.id, "resultado_enviado", `${status}: ${inscritos.length} candidato(s)`);
  revalidatePath("/diretoria/seletivo");
  return { ok: `Resultado enviado para ${inscritos.length} candidato(s) (${status}).` };
}

export async function matricularAprovados() {
  const s = await exigirDiretoria();
  const aprovados = (await db().prepare(
    "SELECT id, nome, matricula, email, telefone, semestre, user_id FROM inscricoes WHERE status='aprovado'"
  ).all()) as { id: number; nome: string; matricula: string; email: string; telefone: string; semestre: string; user_id: number | null }[];
  let criados = 0, promovidos = 0;
  const ins = db().prepare(
    "INSERT INTO users (nome, matricula, email, telefone, semestre, senha_hash, role, must_change_password) VALUES (?,?,?,?,?,?,'ligante',1)"
  );
  const promove = db().prepare("UPDATE users SET role='ligante' WHERE id = ? AND role='candidato'");
  const vincula = db().prepare("UPDATE inscricoes SET user_id = ? WHERE id = ?");
  for (const a of aprovados) {
    if (a.user_id) {
      // já tinha conta de candidato (acesso limitado) — só promove, sem mexer na senha
      await promove.run(a.user_id);
      promovidos++;
      continue;
    }
    try {
      const r = await ins.run(a.nome, a.matricula, a.email.toLowerCase(), a.telefone, a.semestre, bcrypt.hashSync(a.matricula, BCRYPT_COST));
      await vincula.run(r.lastInsertRowid, a.id);
      criados++;
    } catch { /* já cadastrado */ }
  }
  await registrarAcao(s.id, "aprovados_matriculados", `${criados} contas criadas, ${promovidos} promovidas`);
  revalidatePath("/diretoria/ligantes");
  revalidatePath("/diretoria/seletivo");
  return { ok: `${criados} conta(s) criada(s), ${promovidos} candidato(s) promovido(s) a ligante.` };
}

/* ── Avisos e notificações ─────────────────────── */
export async function publicarAviso(formData: FormData) {
  const s = await exigirDiretoria();
  const titulo = String(formData.get("titulo") || "").trim();
  const mensagem = String(formData.get("mensagem") || "").trim();
  const notificarTb = formData.get("notificar") === "on";
  if (!titulo || !mensagem) return;
  await db().prepare("INSERT INTO avisos (titulo, mensagem, autor_id) VALUES (?,?,?)").run(titulo, mensagem, s.id);
  await registrarAcao(s.id, "aviso_publicado", titulo);
  if (notificarTb) await notificarLigantes("todos", titulo, mensagem, "aviso_diretoria");
  revalidatePath("/diretoria/notificacoes");
  revalidatePath("/ligante/mural");
  return { ok: "Aviso publicado no mural." };
}

export async function enviarMensagem(formData: FormData) {
  const s = await exigirDiretoria();
  const destino = String(formData.get("destino") || "todos");
  const assunto = String(formData.get("assunto") || "").trim();
  const corpo = String(formData.get("corpo") || "").trim();
  if (!assunto || !corpo) return;
  if (destino === "todos") {
    await notificarLigantes("todos", assunto, corpo, "aviso_diretoria");
  } else if (destino === "grupo") {
    const ids = formData.getAll("ids").map(Number).filter(Boolean);
    await notificarLigantes(ids, assunto, corpo, "aviso_diretoria");
  } else {
    const id = Number(formData.get("individual"));
    if (id) await notificarLigantes([id], assunto, corpo, "aviso_diretoria");
  }
  await registrarAcao(s.id, "mensagem_manual_enviada", `${destino}: ${assunto}`);
  revalidatePath("/diretoria/notificacoes");
  return { ok: "Salvo." };
}

/* ── WhatsApp ──────────────────────────────────── */
export async function conectarWhatsApp() {
  const s = await exigirDiretoria();
  if (process.env.RUNTIME === "cloudflare") return;
  await registrarAcao(s.id, "whatsapp_conectar");
  await waIniciar();
  revalidatePath("/diretoria/whatsapp");
}

export async function desconectarWhatsApp() {
  const s = await exigirDiretoria();
  if (process.env.RUNTIME === "cloudflare") return;
  await registrarAcao(s.id, "whatsapp_desconectar");
  await waDesconectar();
  revalidatePath("/diretoria/whatsapp");
}

/* ── Financeiro (restrito ao Tesoureiro) ───────── */
export async function lancarFinanceiro(formData: FormData) {
  const s = await exigirDiretoria();
  if (!podeVerFinanceiro(s)) redirect("/diretoria");
  const tipo = String(formData.get("tipo") || "entrada");
  const descricao = String(formData.get("descricao") || "").trim();
  const valor = Math.round(Number(String(formData.get("valor") || "0").replace(/\./g, "").replace(",", ".")) * 100);
  const data = String(formData.get("data") || new Date().toISOString().slice(0, 10));
  if (!descricao || !valor) return;
  await db().prepare("INSERT INTO financeiro (tipo, descricao, valor_centavos, data, autor_id) VALUES (?,?,?,?,?)")
    .run(tipo, descricao, Math.abs(valor), data, s.id);
  await registrarAcao(s.id, "lancamento_financeiro", `${tipo}: ${descricao}`);
  revalidatePath("/diretoria/financeiro");
  return { ok: "Lançamento registrado." };
}

export async function excluirLancamento(formData: FormData) {
  const s = await exigirDiretoria();
  if (!podeVerFinanceiro(s)) redirect("/diretoria");
  const id = Number(formData.get("id"));
  await db().prepare("DELETE FROM financeiro WHERE id = ?").run(id);
  await registrarAcao(s.id, "lancamento_excluido", `#${id}`);
  revalidatePath("/diretoria/financeiro");
  return { ok: "Lançamento excluído." };
}

/* ── Eventos / produção / extensão (conteúdo público) ── */
export async function salvarEvento(formData: FormData) {
  const s = await exigirDiretoria();
  const titulo = String(formData.get("titulo") || "").trim();
  const tipo = String(formData.get("tipo") || "atividade");
  const data = String(formData.get("data") || "");
  const local = String(formData.get("local") || "").trim() || null;
  if (!titulo || !data) return;
  await db().prepare("INSERT INTO eventos (titulo, tipo, data, local) VALUES (?,?,?,?)").run(titulo, tipo, data, local);
  await registrarAcao(s.id, "evento_criado", titulo);
  revalidatePath("/diretoria/conteudo");
  revalidatePath("/calendario");
  return { ok: "Evento salvo." };
}

export async function salvarExtensao(formData: FormData) {
  const s = await exigirDiretoria();
  const titulo = String(formData.get("titulo") || "").trim();
  const tipo = String(formData.get("tipo") || "acao");
  const descricao = String(formData.get("descricao") || "").trim();
  const data = String(formData.get("data") || "") || null;
  const link = String(formData.get("link") || "").trim() || null;
  if (!titulo || !descricao) return;
  let arquivoId: number | null = null;
  try {
    arquivoId = await salvarArquivo(formData.get("arquivo") as File | null);
  } catch { /* ignora upload inválido */ }
  await db().prepare("INSERT INTO extensao (titulo, tipo, descricao, data, link, arquivo_id) VALUES (?,?,?,?,?,?)")
    .run(titulo, tipo, descricao, data, link, arquivoId);
  await registrarAcao(s.id, "extensao_criada", titulo);
  revalidatePath("/diretoria/conteudo");
  revalidatePath("/extensao");
  return { ok: "Ação de extensão salva." };
}

export async function salvarConfiguracoes(formData: FormData) {
  const s = await exigirDiretoria();
  await setConfig("periodo_atual", String(formData.get("periodo") || (await getConfig("periodo_atual"))));
  await setConfig("horas_por_aula", String(Number(formData.get("horas_por_aula")) || 2));
  await setConfig("email_contato", String(formData.get("email_contato") || "").trim());
  const liberados = formData.get("certificados_liberados") === "on" ? "1" : "0";
  const jaLiberado = (await getConfig("certificados_liberados", "0")) === "1";
  await setConfig("certificados_liberados", liberados);
  if (liberados === "1" && !jaLiberado) {
    await registrarAcao(s.id, "certificados_liberados");
  }
  await registrarAcao(s.id, "configuracoes_salvas");
  revalidatePath("/diretoria");
  return { ok: "Salvo." };
}

/**
 * Modo manutenção: enquanto ativo, a diretoria continua acessando
 * normalmente; site público, ligantes e candidatos veem um aviso no lugar
 * do conteúdo (o menu/sidebar de cada área continua aparecendo).
 */
export async function salvarStatusSite(formData: FormData) {
  const s = await exigirDiretoria();
  const status = formData.get("status") === "manutencao" ? "manutencao" : "online";
  await setConfig("site_status", status);
  await registrarAcao(s.id, "site_status_alterado", status === "manutencao" ? "Manutenção ativada" : "Site voltou a ficar online");
  revalidatePath("/diretoria");
  return { ok: status === "manutencao" ? "Modo manutenção ativado." : "Site online novamente." };
}

/* reenvio de confirmação de inscrição, caso necessário */
export async function reenviarConfirmacao(formData: FormData) {
  await exigirDiretoria();
  const id = Number(formData.get("id"));
  const i = (await db().prepare("SELECT nome, email, matricula, semestre FROM inscricoes WHERE id = ?").get(id)) as
    { nome: string; email: string; matricula: string; semestre: string } | undefined;
  if (!i) return;
  await enviarEmail(
    i.email,
    "Inscrição confirmada — Processo Seletivo LAMTUE",
    `Olá, ${i.nome.split(" ")[0]}!\n\nConfirmamos sua inscrição no processo seletivo da LAMTUE.\nMatrícula: ${i.matricula} · Semestre: ${i.semestre}`,
    "inscricao_seletivo"
  );
  revalidatePath("/diretoria/seletivo");
  return { ok: "E-mail de confirmação reenviado." };
}

/* ── Galeria ───────────────────────────────────── */
export async function criarAlbum(formData: FormData) {
  const s = await exigirGaleria();
  const titulo = String(formData.get("titulo") || "").trim();
  const descricao = String(formData.get("descricao") || "").trim() || null;
  const data = String(formData.get("data") || "") || null;
  const visibilidade = String(formData.get("visibilidade") || "publico") === "ligantes" ? "ligantes" : "publico";
  if (!titulo) return { erro: "Informe o título do álbum." };
  const r = await db().prepare(
    "INSERT INTO galeria_albuns (titulo, descricao, data, visibilidade) VALUES (?, ?, ?, ?)"
  ).run(titulo, descricao, data, visibilidade);
  await registrarAcao(s.id, "album_criado", titulo);
  revalidatePath("/diretoria/galeria");
  redirect(`/diretoria/galeria/${r.lastInsertRowid}`);
}

export async function excluirAlbum(formData: FormData) {
  const s = await exigirGaleria();
  const id = Number(formData.get("id"));
  await db().prepare("DELETE FROM galeria_albuns WHERE id = ?").run(id);
  await registrarAcao(s.id, "album_excluido", `#${id}`);
  revalidatePath("/diretoria/galeria");
  revalidatePath("/galeria");
  redirect("/diretoria/galeria");
}

export async function adicionarFotos(formData: FormData) {
  const s = await exigirGaleria();
  const albumId = Number(formData.get("album_id"));
  const legenda = String(formData.get("legenda") || "").trim() || null;
  const arquivos = formData.getAll("fotos") as File[];
  const falhas: string[] = [];
  let salvas = 0;
  for (const f of arquivos) {
    if (!f || f.size === 0) continue;
    if (!f.type.startsWith("image/")) { falhas.push(`${f.name} (tipo não suportado)`); continue; }
    try {
      const arquivoId = await salvarArquivo(f);
      if (!arquivoId) continue;
      await db().prepare("INSERT INTO galeria_fotos (album_id, arquivo_id, legenda) VALUES (?, ?, ?)").run(albumId, arquivoId, legenda);
      salvas++;
    } catch (e) {
      falhas.push(`${f.name} (${e instanceof Error ? e.message : "falha no upload"})`);
    }
  }
  await registrarAcao(s.id, "fotos_adicionadas", `album #${albumId}: ${salvas} foto(s)`);
  revalidatePath(`/diretoria/galeria/${albumId}`);
  revalidatePath("/galeria");
  revalidatePath(`/galeria/${albumId}`);
  if (falhas.length) return { erro: `Algumas fotos não foram salvas: ${falhas.join(", ")}` };
  return { ok: `${salvas} foto(s) adicionada(s).` };
}

export async function excluirFoto(formData: FormData) {
  const s = await exigirGaleria();
  const id = Number(formData.get("id"));
  const albumId = Number(formData.get("album_id"));
  await db().prepare("DELETE FROM galeria_fotos WHERE id = ?").run(id);
  await registrarAcao(s.id, "foto_excluida", `#${id}`);
  revalidatePath(`/diretoria/galeria/${albumId}`);
  revalidatePath("/galeria");
  revalidatePath(`/galeria/${albumId}`);
  return { ok: "Foto excluída." };
}
