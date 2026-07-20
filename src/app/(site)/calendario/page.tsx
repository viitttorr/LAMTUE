import { db } from "@/lib/db";
import { fmtData } from "@/lib/util";
import Reveal from "@/components/Reveal";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default function CalendarioPage() {
  const aulas = db().prepare("SELECT titulo, tema, data, local, 'Aula' AS tipo FROM aulas").all() as
    { titulo: string; tema: string | null; data: string; local: string | null; tipo: string }[];
  const eventos = db().prepare("SELECT titulo, tipo, data, local, NULL AS tema FROM eventos").all() as
    { titulo: string; tema: string | null; data: string; local: string | null; tipo: string }[];
  const tudo = [...aulas, ...eventos].sort((a, b) => a.data.localeCompare(b.data));
  const futuros = tudo.filter((e) => e.data >= new Date().toISOString().slice(0, 10));
  const passados = tudo.filter((e) => e.data < new Date().toISOString().slice(0, 10)).reverse();

  const Bloco = ({ titulo, itens }: { titulo: string; itens: typeof tudo }) => (
    <Reveal>
      <h2 style={{ fontSize: 20, margin: "34px 0 14px" }}>{titulo}</h2>
      {itens.length === 0 ? (
        <p className="muted">Nada por aqui ainda.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {itens.map((e, i) => (
            <div key={i} className="card hoverable" style={{ padding: "16px 22px" }}>
              <div className="flex-between">
                <div className="flex">
                  <div style={{ textAlign: "center", minWidth: 58, borderRight: "1px solid var(--border)", paddingRight: 14 }}>
                    <div style={{ font: "700 21px var(--font-display)", color: "var(--red-bright)" }}>{e.data.slice(8, 10)}</div>
                    <div className="small" style={{ textTransform: "uppercase" }}>
                      {new Date(e.data + "T12:00").toLocaleDateString("pt-BR", { month: "short" })}
                    </div>
                  </div>
                  <div>
                    <strong>{e.titulo}</strong>
                    <div className="small">{[e.tema, e.local, fmtData(e.data)].filter(Boolean).join(" · ")}</div>
                  </div>
                </div>
                <span className={`badge ${e.tipo === "Aula" ? "badge-blue" : "badge-red"}`}>{e.tipo}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Reveal>
  );

  return (
    <div className="container" style={{ padding: "60px 24px 20px" }}>
      <PageHeader eyebrow="Agenda do semestre" titulo="Calendário de Atividades" />
      <Bloco titulo="Próximas atividades" itens={futuros} />
      <Bloco titulo="Atividades realizadas" itens={passados} />
    </div>
  );
}
