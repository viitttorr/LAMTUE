import { db } from "@/lib/db";
import { fmtData } from "@/lib/util";
import Reveal from "@/components/Reveal";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function ExtensaoPage() {
  const acoes = (await db().prepare("SELECT * FROM extensao WHERE tipo='acao' ORDER BY data DESC, id DESC").all()) as
    { id: number; titulo: string; descricao: string; data: string | null; link: string | null; arquivo_id: number | null }[];
  const materiais = (await db().prepare("SELECT * FROM extensao WHERE tipo='material' ORDER BY id DESC").all()) as typeof acoes;

  return (
    <div className="container" style={{ padding: "60px 24px 20px" }}>
      <div className="page-panel">
        <PageHeader eyebrow="Comunidade" titulo="Ações de Extensão">
          <p className="muted" style={{ maxWidth: 700 }}>
            Registro das ações da liga junto à comunidade e materiais de primeiros socorros em
            linguagem acessível a todos.
          </p>
        </PageHeader>

        <h2 style={{ fontSize: 20, margin: "34px 0 14px" }}>Eventos realizados</h2>
        <div className="grid2">
          {acoes.length === 0 && <p className="muted">As ações da gestão serão registradas aqui.</p>}
          {acoes.map((a, i) => (
            <Reveal key={a.id} delay={i * 70}>
              <div className="card hoverable" style={{ height: "100%" }}>
                <div className="flex-between">
                  <strong style={{ fontFamily: "var(--font-display)" }}>{a.titulo}</strong>
                  {a.data && <span className="badge badge-blue">{fmtData(a.data)}</span>}
                </div>
                <p className="muted mt-1" style={{ fontSize: 14.5 }}>{a.descricao}</p>
                {a.link && <a className="btn btn-sm mt-2" href={a.link} target="_blank" rel="noreferrer">Ver mais</a>}
              </div>
            </Reveal>
          ))}
        </div>

        <h2 style={{ fontSize: 20, margin: "40px 0 14px" }}>Primeiros socorros para todos</h2>
        <div className="grid2">
          {materiais.length === 0 && <p className="muted">Os materiais educativos serão publicados aqui.</p>}
          {materiais.map((m, i) => (
            <Reveal key={m.id} delay={i * 70}>
              <div className="card hoverable" style={{ height: "100%", borderColor: "rgba(56,189,248,0.25)" }}>
                <strong style={{ fontFamily: "var(--font-display)" }}>{m.titulo}</strong>
                <p className="muted mt-1" style={{ fontSize: 14.5 }}>{m.descricao}</p>
                <div className="flex mt-2">
                  {m.link && <a className="btn btn-sm btn-blue" href={m.link} target="_blank" rel="noreferrer">Acessar</a>}
                  {m.arquivo_id && <a className="btn btn-sm btn-blue" href={`/api/arquivos/${m.arquivo_id}`}>Baixar material</a>}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
