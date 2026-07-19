"use server";
import bcrypt from "bcryptjs";
import { db, getConfig, setConfig } from "@/lib/db";
import { exigirDiretoria, ehTesoureiro } from "@/lib/auth";
import { registrarAcao } from "@/lib/audit";
import { salvarArquivo } from "@/lib/arquivos";
import { notificar, notificarLigantes } from "@/lib/notify";
import { enviarEmail } from "@/lib/mailer";
import { waIniciar, waDesconectar } from "@/lib/whatsapp";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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
    db().prepare("UPDATE aulas SET titulo=?, tema=?, data=?, local=?, descricao=? WHERE id=?").run(titulo, tema, data, local, descricao, id);
    registrarAcao(s.id, "aula_editada", `#${id} ${titulo}`);
  } else {
    db().prepare("INSERT INTO aulas (titulo, tema, data, local, descricao) VALUES (?,?,?,?,?)").run(titulo, tema, data, local, descricao);
    registrarAcao(s.id, "aula_criada", titulo);
  }
  revalidatePath("/diretoria/aulas");
}

export async function excluirAula(formData: FormData) {
  const s = await exigirDiretoria();
  const id = Number(formData.get("id"));
  db().prepare("DELETE FROM aulas WHERE id = ?").run(id);
  registrarAcao(s.id, "aula_excluida", `#${id}`);
  revalidatePath("/diretoria/aulas");
}

export async function lembrarAula(formData: FormData) {
  const s = await exigirDiretoria();
  const id = Number(formData.get("id"));
  const aula = db().prepare("SELECT titulo, data, local FROM aulas WHERE id = ?").get(id) as { titulo: string; data: string; local: string | null } | undefined;
  if (!aula) return;
  await notificarLigantes(
    "todos",
    "Lembrete de aula — LAMTUE",
    `Amanhã tem LAMTUE! 🚑\n\nAula: ${aula.titulo}\nData: ${new Date(aula.data + "T12:00").toLocaleDateString("pt-BR")}${aula.local ? `\nLocal: ${aula.local}` : ""}\n\nSua presença conta para a certificação.`,
    "lembrete_aula"
  );
  registrarAcao(s.id, "lembrete_aula_enviado", aula.titulo);
  revalidatePath("/diretoria/notificacoes");
}

/* ── Frequência ────────────────────────────────── */
export async function confirmarChamada(formData: FormData) {
  const s = await exigirDiretoria();
  const aulaId = Number(formData.get("aula_id"));
  const aula = db().prepare("SELECT titulo, data FROM aulas WHERE id = ?").get(aulaId) as { titulo: string; data: string } | undefined;
  if (!aula) return;
  const ligantes = db().prepare("SELECT id, nome, email, telefone FROM users WHERE role='ligante' AND ativo=1").all() as
    { id: number; nome: string; email: string | null; telefone: string | null }[];

  const upsert = db().prepare(
    "INSERT INTO presencas (aula_id, user_id, presente) VALUES (?, ?, ?) ON CONFLICT(aula_id, user_id) DO UPDATE SET presente = excluded.presente, registrado_em = datetime('now','localtime')"
  );
  const presentes: typeof ligantes = [];
  for (const l of ligantes) {
    const presente = formData.get(`p_${l.id}`) === "on" ? 1 : 0;
    upsert.run(aulaId, l.id, presente);
    if (presente) presentes.push(l);
  }
  registrarAcao(s.id, "chamada_confirmada", `aula #${aulaId} (${aula.titulo}): ${presentes.length}/${ligantes.length} presentes`);

  for (const l of presentes) {
    await notificar(
      l,
      "Presença registrada — LAMTUE",
      `Sua presença na aula "${aula.titulo}" (${new Date(aula.data + "T12:00").toLocaleDateString("pt-BR")}) foi registrada com sucesso. ✅`,
      "presenca_registrada"
    );
  }
  redirect(`/diretoria/frequencia?ok=1&aula=${aulaId}`);
}

/* ── Ligantes ──────────────────────────────────── */
export async function salvarLigante(formData: FormData) {
  const s = await exigirDiretoria();
  const id = Number(formData.get("id") || 0);
  const nome = String(formData.get("nome") || "").trim();
  const matricula = String(formData.get("matricula") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase() || null;
  const telefone = String(formData.get("telefone") || "").trim() || null;
  const semestre = String(formData.get("semestre") || "").trim() || null;
  if (!nome || !matricula) redirect("/diretoria/ligantes?erro=" + encodeURIComponent("Nome e matrícula são obrigatórios."));
  try {
    if (id) {
      db().prepare("UPDATE users SET nome=?, matricula=?, email=?, telefone=?, semestre=? WHERE id=? AND role='ligante'")
        .run(nome, matricula, email, telefone, semestre, id);
      registrarAcao(s.id, "ligante_editado", `#${id} ${nome}`);
    } else {
      // credencial temporária = matrícula (troca obrigatória no 1º login)
      db().prepare(
        "INSERT INTO users (nome, matricula, email, telefone, semestre, senha_hash, role, must_change_password) VALUES (?,?,?,?,?,?,'ligante',1)"
      ).run(nome, matricula, email, telefone, semestre, bcrypt.hashSync(matricula, 10));
      registrarAcao(s.id, "ligante_cadastrado", `${nome} (${matricula})`);
    }
  } catch {
    redirect("/diretoria/ligantes?erro=" + encodeURIComponent("Matrícula ou e-mail já cadastrado."));
  }
  revalidatePath("/diretoria/ligantes");
  redirect("/diretoria/ligantes?ok=1");
}

export async function importarLigantes(formData: FormData) {
  const s = await exigirDiretoria();
  const file = formData.get("csv") as File | null;
  if (!file || file.size === 0) redirect("/diretoria/ligantes?erro=" + encodeURIComponent("Envie um arquivo CSV."));
  const texto = Buffer.from(await file!.arrayBuffer()).toString("utf-8").replace(/^﻿/, "");
  const linhas = texto.split(/\r?\n/).filter((l) => l.trim());
  let importados = 0, ignorados = 0;
  const ins = db().prepare(
    "INSERT INTO users (nome, matricula, email, telefone, semestre, senha_hash, role, must_change_password) VALUES (?,?,?,?,?,?,'ligante',1)"
  );
  for (const [i, linha] of linhas.entries()) {
    const cols = linha.split(/[;,]/).map((c) => c.trim().replace(/^"|"$/g, ""));
    if (i === 0 && /nome/i.test(cols[0])) continue; // cabeçalho
    const [nome, matricula, email, telefone, semestre] = cols;
    if (!nome || !matricula) { ignorados++; continue; }
    try {
      ins.run(nome, matricula, email?.toLowerCase() || null, telefone || null, semestre || null, bcrypt.hashSync(matricula, 10));
      importados++;
    } catch { ignorados++; }
  }
  registrarAcao(s.id, "ligantes_importados", `${importados} importados, ${ignorados} ignorados`);
  revalidatePath("/diretoria/ligantes");
  redirect("/diretoria/ligantes?ok=" + encodeURIComponent(`${importados} ligante(s) importado(s), ${ignorados} ignorado(s).`));
}

export async function alternarAtivo(formData: FormData) {
  const s = await exigirDiretoria();
  const id = Number(formData.get("id"));
  db().prepare("UPDATE users SET ativo = 1 - ativo WHERE id = ? AND role='ligante'").run(id);
  registrarAcao(s.id, "ligante_ativado_desativado", `#${id}`);
  revalidatePath("/diretoria/ligantes");
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
    arquivoId = await salvarArquivo(formData.get("arquivo") as File | null);
  } catch (e) {
    redirect("/diretoria/materiais?erro=" + encodeURIComponent(e instanceof Error ? e.message : "Falha no upload."));
  }
  if (!url && !arquivoId) redirect("/diretoria/materiais?erro=" + encodeURIComponent("Informe um link ou envie um arquivo."));
  db().prepare(
    "INSERT INTO materiais (titulo, tema, tipo, url, arquivo_id, visibilidade, aula_id) VALUES (?,?,?,?,?,?,?)"
  ).run(titulo, tema, tipo, url, arquivoId, visibilidade, aulaId);
  registrarAcao(s.id, "material_publicado", `${titulo} (${tema})`);
  await notificarLigantes("todos", "Novo material na biblioteca — LAMTUE",
    `Novo material disponível: "${titulo}" (tema: ${tema}). Acesse a biblioteca na área do ligante.`, "novo_material");
  revalidatePath("/diretoria/materiais");
  redirect("/diretoria/materiais?ok=1");
}

export async function excluirMaterial(formData: FormData) {
  const s = await exigirDiretoria();
  const id = Number(formData.get("id"));
  db().prepare("DELETE FROM materiais WHERE id = ?").run(id);
  registrarAcao(s.id, "material_excluido", `#${id}`);
  revalidatePath("/diretoria/materiais");
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
  db().prepare(
    "INSERT INTO questoes (tema, dificuldade, enunciado, alternativas, correta, comentario, origem, aprovada) VALUES (?,?,?,?,?,?,'manual',1)"
  ).run(tema, dificuldade, enunciado, JSON.stringify(alternativas), correta, comentario);
  registrarAcao(s.id, "questao_criada", tema);
  revalidatePath("/diretoria/questoes");
}

export async function moderarQuestao(formData: FormData) {
  const s = await exigirDiretoria();
  const id = Number(formData.get("id"));
  const acao = String(formData.get("acao"));
  if (acao === "aprovar") db().prepare("UPDATE questoes SET aprovada = 1 WHERE id = ?").run(id);
  else db().prepare("DELETE FROM questoes WHERE id = ?").run(id);
  registrarAcao(s.id, `questao_${acao === "aprovar" ? "aprovada" : "excluida"}`, `#${id}`);
  revalidatePath("/diretoria/questoes");
}

/* ── Casos clínicos ────────────────────────────── */
export async function salvarCaso(formData: FormData) {
  const s = await exigirDiretoria();
  const id = Number(formData.get("id") || 0);
  const titulo = String(formData.get("titulo") || "").trim();
  const tema = String(formData.get("tema") || "");
  const contexto = String(formData.get("contexto") || "").trim();
  const visibilidade = String(formData.get("visibilidade") || "ligantes");
  const etapasRaw = String(formData.get("etapas") || "");
  if (!titulo || !tema || !contexto) redirect("/diretoria/casos?erro=" + encodeURIComponent("Preencha título, tema e cenário."));
  /* Formato de texto:
     ? Pergunta da etapa
     * opção correta | feedback
     - opção errada | feedback            */
  const etapas: { pergunta: string; opcoes: { texto: string; correta: boolean; feedback: string }[] }[] = [];
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
  const valido = etapas.length > 0 && etapas.every((e) => e.pergunta && e.opcoes.length >= 2 && e.opcoes.some((o) => o.correta));
  if (!valido)
    redirect("/diretoria/casos?erro=" + encodeURIComponent("Estrutura de etapas inválida: cada etapa precisa de uma pergunta (linha com ?) e ao menos 2 opções (linhas com * ou -), sendo 1 correta (*)."));
  if (id) {
    db().prepare("UPDATE casos SET titulo=?, tema=?, contexto=?, etapas=?, visibilidade=? WHERE id=?")
      .run(titulo, tema, contexto, JSON.stringify(etapas), visibilidade, id);
    registrarAcao(s.id, "caso_editado", `#${id} ${titulo}`);
  } else {
    db().prepare("INSERT INTO casos (titulo, tema, contexto, etapas, visibilidade) VALUES (?,?,?,?,?)")
      .run(titulo, tema, contexto, JSON.stringify(etapas), visibilidade);
    registrarAcao(s.id, "caso_criado", titulo);
  }
  revalidatePath("/diretoria/casos");
  redirect("/diretoria/casos?ok=1");
}

export async function excluirCaso(formData: FormData) {
  const s = await exigirDiretoria();
  const id = Number(formData.get("id"));
  db().prepare("DELETE FROM casos WHERE id = ?").run(id);
  registrarAcao(s.id, "caso_excluido", `#${id}`);
  revalidatePath("/diretoria/casos");
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
  db().prepare("UPDATE seletivo SET ativo=?, vagas=?, prazo=?, taxa_centavos=?, edital=?, cronograma=? WHERE id=1")
    .run(ativo, vagas, prazo, taxa, edital, JSON.stringify(cronograma));
  registrarAcao(s.id, "seletivo_configurado", `ativo=${ativo}, vagas=${vagas}, prazo=${prazo}`);
  revalidatePath("/diretoria/seletivo");
  revalidatePath("/seletivo");
  revalidatePath("/");
}

export async function alterarStatusInscricao(formData: FormData) {
  const s = await exigirDiretoria();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status"));
  if (!["pendente", "aprovado", "reprovado", "espera"].includes(status)) return;
  db().prepare("UPDATE inscricoes SET status = ? WHERE id = ?").run(status, id);
  registrarAcao(s.id, "inscricao_status", `#${id} → ${status}`);
  revalidatePath("/diretoria/seletivo");
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
  const inscritos = db().prepare("SELECT nome, email, telefone FROM inscricoes WHERE status = ?").all(status) as
    { nome: string; email: string; telefone: string }[];
  for (const i of inscritos) {
    await notificar(i, modelo.assunto, modelo.corpo(i.nome.split(" ")[0]), `resultado_${status}`);
  }
  registrarAcao(s.id, "resultado_enviado", `${status}: ${inscritos.length} candidato(s)`);
  revalidatePath("/diretoria/seletivo");
  redirect("/diretoria/seletivo?ok=" + encodeURIComponent(`Resultado enviado para ${inscritos.length} candidato(s) (${status}).`));
}

export async function matricularAprovados() {
  const s = await exigirDiretoria();
  const aprovados = db().prepare(
    "SELECT nome, matricula, email, telefone, semestre FROM inscricoes WHERE status='aprovado'"
  ).all() as { nome: string; matricula: string; email: string; telefone: string; semestre: string }[];
  let criados = 0;
  const ins = db().prepare(
    "INSERT INTO users (nome, matricula, email, telefone, semestre, senha_hash, role, must_change_password) VALUES (?,?,?,?,?,?,'ligante',1)"
  );
  for (const a of aprovados) {
    try {
      ins.run(a.nome, a.matricula, a.email.toLowerCase(), a.telefone, a.semestre, bcrypt.hashSync(a.matricula, 10));
      criados++;
    } catch { /* já cadastrado */ }
  }
  registrarAcao(s.id, "aprovados_matriculados", `${criados} contas criadas`);
  revalidatePath("/diretoria/ligantes");
  redirect("/diretoria/ligantes?ok=" + encodeURIComponent(`${criados} conta(s) de ligante criada(s) a partir dos aprovados.`));
}

/* ── Avisos e notificações ─────────────────────── */
export async function publicarAviso(formData: FormData) {
  const s = await exigirDiretoria();
  const titulo = String(formData.get("titulo") || "").trim();
  const mensagem = String(formData.get("mensagem") || "").trim();
  const notificarTb = formData.get("notificar") === "on";
  if (!titulo || !mensagem) return;
  db().prepare("INSERT INTO avisos (titulo, mensagem, autor_id) VALUES (?,?,?)").run(titulo, mensagem, s.id);
  registrarAcao(s.id, "aviso_publicado", titulo);
  if (notificarTb) await notificarLigantes("todos", titulo, mensagem, "aviso_diretoria");
  revalidatePath("/diretoria/notificacoes");
  revalidatePath("/ligante/mural");
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
  registrarAcao(s.id, "mensagem_manual_enviada", `${destino}: ${assunto}`);
  revalidatePath("/diretoria/notificacoes");
  redirect("/diretoria/notificacoes?ok=1");
}

/* ── WhatsApp ──────────────────────────────────── */
export async function conectarWhatsApp() {
  const s = await exigirDiretoria();
  registrarAcao(s.id, "whatsapp_conectar");
  await waIniciar();
  revalidatePath("/diretoria/whatsapp");
}

export async function desconectarWhatsApp() {
  const s = await exigirDiretoria();
  registrarAcao(s.id, "whatsapp_desconectar");
  await waDesconectar();
  revalidatePath("/diretoria/whatsapp");
}

/* ── Financeiro (restrito ao Tesoureiro) ───────── */
export async function lancarFinanceiro(formData: FormData) {
  const s = await exigirDiretoria();
  if (!ehTesoureiro(s)) redirect("/diretoria");
  const tipo = String(formData.get("tipo") || "entrada");
  const descricao = String(formData.get("descricao") || "").trim();
  const valor = Math.round(Number(String(formData.get("valor") || "0").replace(/\./g, "").replace(",", ".")) * 100);
  const data = String(formData.get("data") || new Date().toISOString().slice(0, 10));
  if (!descricao || !valor) return;
  db().prepare("INSERT INTO financeiro (tipo, descricao, valor_centavos, data, autor_id) VALUES (?,?,?,?,?)")
    .run(tipo, descricao, Math.abs(valor), data, s.id);
  registrarAcao(s.id, "lancamento_financeiro", `${tipo}: ${descricao}`);
  revalidatePath("/diretoria/financeiro");
}

export async function excluirLancamento(formData: FormData) {
  const s = await exigirDiretoria();
  if (!ehTesoureiro(s)) redirect("/diretoria");
  const id = Number(formData.get("id"));
  db().prepare("DELETE FROM financeiro WHERE id = ?").run(id);
  registrarAcao(s.id, "lancamento_excluido", `#${id}`);
  revalidatePath("/diretoria/financeiro");
}

/* ── Eventos / produção / extensão (conteúdo público) ── */
export async function salvarEvento(formData: FormData) {
  const s = await exigirDiretoria();
  const titulo = String(formData.get("titulo") || "").trim();
  const tipo = String(formData.get("tipo") || "atividade");
  const data = String(formData.get("data") || "");
  const local = String(formData.get("local") || "").trim() || null;
  if (!titulo || !data) return;
  db().prepare("INSERT INTO eventos (titulo, tipo, data, local) VALUES (?,?,?,?)").run(titulo, tipo, data, local);
  registrarAcao(s.id, "evento_criado", titulo);
  revalidatePath("/diretoria/conteudo");
  revalidatePath("/calendario");
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
  db().prepare("INSERT INTO extensao (titulo, tipo, descricao, data, link, arquivo_id) VALUES (?,?,?,?,?,?)")
    .run(titulo, tipo, descricao, data, link, arquivoId);
  registrarAcao(s.id, "extensao_criada", titulo);
  revalidatePath("/diretoria/conteudo");
  revalidatePath("/extensao");
}

export async function salvarConfiguracoes(formData: FormData) {
  const s = await exigirDiretoria();
  setConfig("periodo_atual", String(formData.get("periodo") || getConfig("periodo_atual")));
  setConfig("horas_por_aula", String(Number(formData.get("horas_por_aula")) || 2));
  setConfig("email_contato", String(formData.get("email_contato") || "").trim());
  registrarAcao(s.id, "configuracoes_salvas");
  revalidatePath("/diretoria");
}

/* reenvio de confirmação de inscrição, caso necessário */
export async function reenviarConfirmacao(formData: FormData) {
  await exigirDiretoria();
  const id = Number(formData.get("id"));
  const i = db().prepare("SELECT nome, email, matricula, semestre FROM inscricoes WHERE id = ?").get(id) as
    { nome: string; email: string; matricula: string; semestre: string } | undefined;
  if (!i) return;
  await enviarEmail(
    i.email,
    "Inscrição confirmada — Processo Seletivo LAMTUE",
    `Olá, ${i.nome.split(" ")[0]}!\n\nConfirmamos sua inscrição no processo seletivo da LAMTUE.\nMatrícula: ${i.matricula} · Semestre: ${i.semestre}`,
    "inscricao_seletivo"
  );
  revalidatePath("/diretoria/seletivo");
}
