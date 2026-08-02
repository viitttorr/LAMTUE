/**
 * Brasília é UTC-3 fixo (sem horário de verão desde 2019). O Worker roda em
 * UTC, então valores de <input type="datetime-local"> (sem timezone, hora
 * de Brasília no fuso da diretoria) precisam desse ajuste antes de virar um
 * ISO absoluto comparável com `new Date()` no servidor.
 */
export function brasiliaParaUTC(datetimeLocal: string): string | null {
  if (!datetimeLocal) return null;
  const [data, hora] = datetimeLocal.split("T");
  if (!data || !hora) return null;
  const [y, m, d] = data.split("-").map(Number);
  const [h, min] = hora.split(":").map(Number);
  if (!y || !m || !d || isNaN(h) || isNaN(min)) return null;
  return new Date(Date.UTC(y, m - 1, d, h + 3, min)).toISOString();
}

/** Inverso de brasiliaParaUTC — para preencher o defaultValue do datetime-local ao editar. */
export function utcParaBrasiliaLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return new Date(d.getTime() - 3 * 3600 * 1000).toISOString().slice(0, 16);
}

export const TZ_BRASILIA = "America/Sao_Paulo";

/**
 * Formata um timestamp do banco no fuso de Brasília.
 *
 * O Worker roda em UTC e o banco grava `datetime('now')`, ou seja, UTC sem
 * sufixo de fuso ("2026-08-02 13:53:26"). Sem o "Z" o JS interpretaria essa
 * string como horário LOCAL, exibindo 3h adiantado — era essa a causa dos
 * logs errados. Aqui o "Z" é anexado explicitamente e a conversão para
 * Brasília fica a cargo do Intl, em vez do fuso de quem está olhando.
 *
 * Datas puras ("2026-08-15", sem hora) não sofrem conversão de fuso: são
 * fixadas ao meio-dia UTC só para não escorregar de dia no formato.
 */
export function fmtData(iso: string | null | undefined, comHora = false): string {
  if (!iso) return "—";
  const temHora = iso.includes("T") || iso.includes(" ");
  const temFuso = /(Z|[+-]\d{2}:?\d{2})$/.test(iso.trim());
  const normalizado = temHora
    ? (temFuso ? iso.trim() : iso.trim().replace(" ", "T") + "Z")
    : iso.trim() + "T12:00:00Z";
  const d = new Date(normalizado);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR", {
    timeZone: TZ_BRASILIA,
    day: "2-digit", month: "2-digit", year: "numeric",
    ...(comHora ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

/**
 * Calcula o semestre atual a partir da turma (ex: "T7") e do período vigente
 * (config `periodo_atual`, formato "AAAA/P"). Regra fixada no período de
 * referência 2026/2: T9 = 2º semestre, T8 = 4º, T7 = 6º — ou seja,
 * semestreBase(turma) = 20 - 2×turma nesse período. Para qualquer outro
 * período, soma-se (ano-2026)×2 + (periodo-2) semestres de diferença.
 */
export function calcularSemestre(turma: string | null | undefined, periodoAtual: string | null | undefined): string | null {
  if (!turma || !periodoAtual) return null;
  const turmaNumero = parseInt(turma.replace(/\D/g, ""), 10);
  if (!turmaNumero) return null;
  const [anoStr, periodoStr] = periodoAtual.split("/");
  const ano = parseInt(anoStr, 10);
  const periodo = parseInt(periodoStr, 10);
  if (!ano || (periodo !== 1 && periodo !== 2)) return null;
  const delta = (ano - 2026) * 2 + (periodo - 2);
  const semestre = (20 - 2 * turmaNumero) + delta;
  if (semestre < 1) return null;
  if (semestre > 12) return "Formado(a)";
  return `${semestre}º`;
}

export function fmtValor(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function toCSV(header: string[], rows: (string | number | null)[][]): string {
  const esc = (v: string | number | null) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + [header, ...rows].map((r) => r.map(esc).join(";")).join("\n");
}

export function csvResponse(nome: string, csv: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nome}"`,
    },
  });
}
