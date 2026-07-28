import { exigirLigante } from "@/lib/auth";
import { db } from "@/lib/db";

const ICONES: Record<string, string> = { slide: "▤", pdf: "▨", video: "▶", link: "↗" };

export default async function BibliotecaPage() {
  await exigirLigante();
  const materiais = (await db().prepare("SELECT * FROM materiais ORDER BY tema, id DESC").all()) as
    { id: number; titulo: string; tema: string; tipo: string; url: string | null; arquivo_id: number | null; visibilidade: string }[];

  const porTema = new Map<string, typeof materiais>();
  for (const m of materiais) {
    if (!porTema.has(m.tema)) porTema.set(m.tema, []);
    porTema.get(m.tema)!.push(m);
  }

  return (
    <>
      <h1 className="page-title">Biblioteca de Materiais</h1>
      <p className="page-sub">Slides, PDFs, vídeos e links organizados por tema.</p>
      {materiais.length === 0 && <div className="card"><p className="muted">A diretoria ainda não publicou materiais.</p></div>}
      {[...porTema.entries()].map(([tema, itens]) => (
        <div key={tema} className="mb-3">
          <h3 style={{ fontSize: 17, marginBottom: 12, color: "var(--red-bright)" }}>{tema}</h3>
          <div className="grid3">
            {itens.map((m) => {
              const href = m.url || (m.arquivo_id ? `/api/arquivos/${m.arquivo_id}` : "#");
              return (
                <a key={m.id} href={href} target={m.url ? "_blank" : undefined} rel="noreferrer" className="card hoverable" style={{ display: "block", padding: 18 }}>
                  <div className="flex-between">
                    <span style={{ fontSize: 20, color: "var(--blue)" }}>{ICONES[m.tipo] ?? "▤"}</span>
                    <span className="badge">{m.tipo.toUpperCase()}</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14.5, marginTop: 10 }}>{m.titulo}</div>
                  <div className="small mt-1" style={{ color: "var(--blue)" }}>{m.url ? "Abrir link →" : "Baixar arquivo ↓"}</div>
                </a>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
