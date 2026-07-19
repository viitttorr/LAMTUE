import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";

type Etapa = { pergunta: string; opcoes: { texto: string }[] };

export default async function CasoPublicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caso = db().prepare("SELECT * FROM casos WHERE id = ? AND visibilidade='publico'").get(Number(id)) as
    | { titulo: string; tema: string; contexto: string; etapas: string }
    | undefined;
  if (!caso) notFound();
  const etapas: Etapa[] = JSON.parse(caso.etapas);

  return (
    <div className="container" style={{ padding: "60px 24px 20px", maxWidth: 820 }}>
      <Reveal>
        <span className="badge badge-red">{caso.tema}</span>
        <h1 className="section-title" style={{ marginTop: 12 }}>{caso.titulo}</h1>
        <div className="card mt-2">
          <div className="eyebrow" style={{ fontSize: 11 }}>Cenário</div>
          <p className="mt-1" style={{ whiteSpace: "pre-line" }}>{caso.contexto}</p>
        </div>
      </Reveal>
      {etapas.map((e, i) => (
        <Reveal key={i} delay={80}>
          <div className="card mt-2">
            <div className="small" style={{ color: "var(--blue)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Decisão {i + 1} de {etapas.length}
            </div>
            <p className="mt-1" style={{ fontWeight: 600 }}>{e.pergunta}</p>
            <div className="mt-2" style={{ display: "grid", gap: 8 }}>
              {e.opcoes.map((o, j) => (
                <div key={j} className="glass" style={{ padding: "11px 16px", fontSize: 14.5 }}>
                  <strong style={{ color: "var(--text-3)", marginRight: 8 }}>{String.fromCharCode(65 + j)})</strong>
                  {o.texto}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      ))}
      <Reveal>
        <div className="alert alert-blue mt-3">
          O gabarito comentado deste caso — e a versão interativa, com feedback a cada decisão —
          está disponível na <Link href="/login" style={{ color: "var(--blue)", fontWeight: 700 }}>área do ligante</Link>.
        </div>
      </Reveal>
    </div>
  );
}
