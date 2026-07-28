export function fmtData(iso: string | null | undefined, comHora = false): string {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") || iso.includes(" ") ? iso.replace(" ", "T") : iso + "T12:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", comHora ? { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "2-digit", year: "numeric" });
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
