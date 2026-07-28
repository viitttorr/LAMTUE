import { NextRequest } from "next/server";
import { db, frequenciaDe, getConfig } from "@/lib/db";
import { getSessao, podeVerFinanceiro } from "@/lib/auth";
import { registrarAcao } from "@/lib/audit";
import { toCSV, csvResponse, calcularSemestre } from "@/lib/util";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ tipo: string }> }) {
  const s = await getSessao();
  if (!s || s.role !== "diretoria") return new Response("Acesso negado", { status: 403 });
  const { tipo } = await params;
  registrarAcao(s.id, "relatorio_exportado", tipo);

  if (tipo === "frequencia") {
    const periodoAtual = getConfig("periodo_atual", "2026/2");
    const ligantes = db().prepare("SELECT id, nome, matricula, email, semestre, turma FROM users WHERE role='ligante' ORDER BY nome").all() as
      { id: number; nome: string; matricula: string | null; email: string | null; semestre: string | null; turma: string | null }[];
    const rows = ligantes.map((l) => {
      const f = frequenciaDe(l.id);
      const semestreCalc = calcularSemestre(l.turma, periodoAtual) ?? l.semestre;
      return [l.nome, l.matricula, l.email, l.turma, semestreCalc, f.presentes, f.total, `${f.pct}%`, f.elegivel ? "sim" : "não"];
    });
    return csvResponse("frequencia-lamtue.csv", toCSV(["Nome", "Matrícula", "E-mail", "Turma", "Semestre", "Presenças", "Aulas", "Frequência", "Elegível certificado"], rows));
  }

  if (tipo === "inscritos") {
    const rows = (db().prepare("SELECT nome, matricula, semestre, email, telefone, status, criado_em FROM inscricoes ORDER BY criado_em").all() as
      { nome: string; matricula: string; semestre: string; email: string; telefone: string; status: string; criado_em: string }[])
      .map((i) => [i.nome, i.matricula, i.semestre, i.email, i.telefone, i.status, i.criado_em]);
    return csvResponse("inscritos-seletivo-lamtue.csv", toCSV(["Nome", "Matrícula", "Semestre", "E-mail", "Telefone", "Status", "Inscrição"], rows));
  }

  if (tipo === "simulados") {
    const rows = (db().prepare(
      "SELECT u.nome, s.tema, s.dificuldade, s.score, s.criado_em FROM simulados s JOIN users u ON u.id = s.user_id WHERE s.score IS NOT NULL ORDER BY s.criado_em DESC"
    ).all() as { nome: string; tema: string; dificuldade: string; score: number; criado_em: string }[])
      .map((r) => [r.nome, r.tema, r.dificuldade, `${r.score}%`, r.criado_em]);
    return csvResponse("simulados-lamtue.csv", toCSV(["Ligante", "Tema", "Dificuldade", "Nota", "Data"], rows));
  }

  if (tipo === "mensagens") {
    const rows = (db().prepare("SELECT canal, destinatario, assunto, evento, status, criado_em FROM mensagens ORDER BY id DESC").all() as
      { canal: string; destinatario: string; assunto: string | null; evento: string; status: string; criado_em: string }[])
      .map((m) => [m.canal, m.destinatario, m.assunto, m.evento, m.status, m.criado_em]);
    return csvResponse("mensagens-lamtue.csv", toCSV(["Canal", "Destinatário", "Assunto", "Evento", "Status", "Data"], rows));
  }

  if (tipo === "financeiro") {
    if (!podeVerFinanceiro(s)) return new Response("Restrito à Presidência e ao Tesoureiro", { status: 403 });
    const rows = (db().prepare("SELECT tipo, descricao, valor_centavos, data FROM financeiro ORDER BY data").all() as
      { tipo: string; descricao: string; valor_centavos: number; data: string }[])
      .map((f) => [f.data, f.tipo, f.descricao, (f.valor_centavos / 100).toFixed(2).replace(".", ",")]);
    return csvResponse("financeiro-lamtue.csv", toCSV(["Data", "Tipo", "Descrição", "Valor (R$)"], rows));
  }

  return new Response("Relatório não encontrado", { status: 404 });
}
