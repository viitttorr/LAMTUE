import { exigirDiretoria } from "@/lib/auth";
import { db } from "@/lib/db";
import { salvarEvento, salvarExtensao } from "@/app/actions/diretoria";
import { fmtData } from "@/lib/util";
import FormAcao from "@/components/FormAcao";

export default async function ConteudoPage() {
  await exigirDiretoria();
  const eventos = (await db().prepare("SELECT * FROM eventos ORDER BY data DESC LIMIT 10").all()) as { id: number; titulo: string; tipo: string; data: string }[];
  const extensoes = (await db().prepare("SELECT * FROM extensao ORDER BY id DESC LIMIT 10").all()) as { id: number; titulo: string; tipo: string }[];

  return (
    <>
      <h1 className="page-title">Conteúdo do Site Público</h1>
      <p className="page-sub">Calendário e ações de extensão exibidos aos visitantes.</p>

      <div className="grid2" style={{ alignItems: "start" }}>
        <div className="card">
          <h3 style={{ fontSize: 16 }}>Evento no calendário</h3>
          <FormAcao action={salvarEvento}>
            <label className="label">Título *</label>
            <input className="input" name="titulo" required />
            <div className="grid2" style={{ gap: 10 }}>
              <div>
                <label className="label">Tipo</label>
                <select className="input" name="tipo" defaultValue="atividade">
                  <option value="atividade">Atividade</option>
                  <option value="Ação de extensão">Ação de extensão</option>
                  <option value="Evento científico">Evento científico</option>
                  <option value="Prova">Prova</option>
                </select>
              </div>
              <div><label className="label">Data *</label><input className="input" type="date" name="data" required /></div>
            </div>
            <label className="label">Local</label>
            <input className="input" name="local" />
            <button className="btn btn-sm btn-primary mt-2" type="submit">Adicionar</button>
          </FormAcao>
          <div className="mt-2 small">
            {eventos.map((e) => <div key={e.id} style={{ padding: "4px 0" }}>{fmtData(e.data)} — {e.titulo}</div>)}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 16 }}>Extensão / primeiros socorros</h3>
          <FormAcao action={salvarExtensao}>
            <label className="label">Título *</label>
            <input className="input" name="titulo" required />
            <div className="grid2" style={{ gap: 10 }}>
              <div>
                <label className="label">Tipo</label>
                <select className="input" name="tipo" defaultValue="acao">
                  <option value="acao">Ação / evento realizado</option>
                  <option value="material">Material educativo público</option>
                </select>
              </div>
              <div><label className="label">Data</label><input className="input" type="date" name="data" /></div>
            </div>
            <label className="label">Descrição *</label>
            <textarea className="input" name="descricao" rows={3} required placeholder="Em linguagem acessível ao público geral…" />
            <label className="label">Link</label>
            <input className="input" name="link" placeholder="https://…" />
            <label className="label">Ou arquivo (PDF/imagem)</label>
            <input className="input" type="file" name="arquivo" />
            <button className="btn btn-sm btn-primary mt-2" type="submit">Adicionar</button>
          </FormAcao>
          <div className="mt-2 small">
            {extensoes.map((e) => <div key={e.id} style={{ padding: "4px 0" }}>{e.tipo === "material" ? "📘" : "🚑"} {e.titulo}</div>)}
          </div>
        </div>
      </div>
    </>
  );
}
