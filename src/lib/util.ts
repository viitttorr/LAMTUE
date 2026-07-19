export function fmtData(iso: string | null | undefined, comHora = false): string {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") || iso.includes(" ") ? iso.replace(" ", "T") : iso + "T12:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", comHora ? { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "2-digit", year: "numeric" });
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
