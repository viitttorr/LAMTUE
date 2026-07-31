import { exigirLigante } from "@/lib/auth";
import { db, TEMAS } from "@/lib/db";
import { temasComMaisErros } from "@/lib/ai";
import { alternarModulo } from "@/app/actions/ligante";
import Link from "next/link";
import FormAcao from "@/components/FormAcao";

export default async function TrilhaPage() {
  const s = await exigirLigante();
  const concluidos = new Set(
    ((await db().prepare("SELECT tema FROM trilha_progresso WHERE user_id = ?").all(s.id)) as { tema: string }[]).map((r) => r.tema)
  );
  const materiaisPorTema = new Map(
    ((await db().prepare("SELECT tema, COUNT(*) AS n FROM materiais GROUP BY tema").all()) as { tema: string; n: number }[]).map((r) => [r.tema, r.n])
  );
  const reforco = new Set((await temasComMaisErros(s.id)).map((r) => r.tema));
  const pct = Math.round((concluidos.size / TEMAS.length) * 100);

  return (
    <>
      <h1 className="page-title">Trilha de Aprendizado</h1>
      <p className="page-sub">Os {TEMAS.length} temas da LAMTUE. Marque cada módulo ao concluir os estudos.</p>

      <div className="card mb-3" style={{ maxWidth: 640 }}>
        <div className="flex-between">
          <strong>Progresso geral</strong>
          <span className="badge badge-blue">{concluidos.size}/{TEMAS.length} módulos · {pct}%</span>
        </div>
        <div className="progress blue mt-2"><span style={{ width: `${pct}%` }} /></div>
      </div>

      <div style={{ display: "grid", gap: 10, maxWidth: 760 }}>
        {TEMAS.map((tema, i) => {
          const feito = concluidos.has(tema);
          const marcar = alternarModulo.bind(null, tema);
          return (
            <div
              key={tema}
              className="card"
              style={{
                padding: "14px 20px",
                borderColor: feito ? "rgba(52,211,153,0.35)" : reforco.has(tema) ? "rgba(251,191,36,0.4)" : undefined,
              }}
            >
              <div className="flex-between">
                <div className="flex">
                  <span
                    style={{
                      width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      font: "700 13px var(--font-display)",
                      background: feito ? "rgba(52,211,153,0.15)" : "rgba(139,21,56,0.25)",
                      border: `1px solid ${feito ? "rgba(52,211,153,0.5)" : "rgba(226,83,111,0.35)"}`,
                      color: feito ? "var(--green)" : "var(--red-bright)",
                    }}
                  >
                    {feito ? "✓" : i + 1}
                  </span>
                  <div>
                    <strong style={{ fontSize: 14.5 }}>{tema}</strong>
                    <div className="small">
                      {materiaisPorTema.get(tema) ? `${materiaisPorTema.get(tema)} material(is) na biblioteca` : "sem materiais ainda"}
                      {reforco.has(tema) && <span style={{ color: "var(--amber)" }}> · reforço sugerido pelos seus simulados</span>}
                    </div>
                  </div>
                </div>
                <div className="flex" style={{ gap: 8 }}>
                  <Link href="/ligante/biblioteca" className="btn btn-sm btn-ghost">Materiais</Link>
                  <FormAcao action={marcar}>
                    <button className={`btn btn-sm ${feito ? "" : "btn-blue"}`} type="submit">
                      {feito ? "Desmarcar" : "Concluir módulo"}
                    </button>
                  </FormAcao>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
