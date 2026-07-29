import Link from "next/link";
import { exigirDiretoria } from "@/lib/auth";
import { db, TEMAS } from "@/lib/db";
import { salvarCaso, excluirCaso, importarCasos } from "@/app/actions/diretoria";
import TemaSelect from "@/components/TemaSelect";

const EXEMPLO = `? Qual a primeira conduta na avaliação primária?
* Garantir a permeabilidade da via aérea com controle da coluna cervical | O "A" do ABCDE sempre vem primeiro.
- Realizar exame neurológico completo | O exame neurológico detalhado pertence à avaliação secundária.
- Solicitar tomografia de crânio | Exames de imagem só após estabilização inicial.

? O paciente apresenta respiração ruidosa. E agora?
* Aspirar a cavidade oral e considerar via aérea definitiva | Ruído sugere obstrução: desobstruir e proteger a via aérea.
- Oferecer água ao paciente | Nunca ofereça líquidos a um paciente com rebaixamento.`;

export default async function CasosAdminPage({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  await exigirDiretoria();
  const { ok, erro } = await searchParams;
  const casos = (await db().prepare(
    `SELECT c.*, (SELECT COUNT(*) FROM casos_resultados r WHERE r.caso_id = c.id) AS execucoes FROM casos c ORDER BY c.id DESC`
  ).all()) as { id: number; titulo: string; tema: string; contexto: string; etapas: string; visibilidade: string; execucoes: number }[];

  return (
    <>
      <h1 className="page-title">Gestão de Casos Clínicos</h1>
      <p className="page-sub">
        Os casos ficam na área logada — ligantes e diretoria acessam a versão interativa com gabarito.
        No menu do site público, o lugar deles passou a ser da Galeria.
      </p>
      {ok && <div className="alert alert-green">Caso salvo com sucesso.</div>}
      {erro && <div className="alert alert-red">{erro}</div>}

      <div className="card mb-3">
        <h3 style={{ fontSize: 16 }}>Novo caso</h3>
        <form action={salvarCaso}>
          <div className="grid3" style={{ gap: 12 }}>
            <div><label className="label">Título *</label><input className="input" name="titulo" required /></div>
            <div>
              <label className="label">Tema *</label>
              <TemaSelect name="tema" temas={TEMAS} required />
            </div>
            <div>
              <label className="label">Visibilidade</label>
              <select className="input" name="visibilidade" defaultValue="ligantes">
                <option value="ligantes">Apenas ligantes</option>
                <option value="publico">Pública (sem gabarito)</option>
              </select>
            </div>
          </div>
          <label className="label">Cenário (apresentação do caso) *</label>
          <textarea className="input" name="contexto" rows={3} required placeholder="Homem, 34 anos, vítima de colisão moto × carro, trazido pelo SAMU…" />
          <label className="label">Etapas de decisão *</label>
          <textarea className="input" name="etapas" rows={10} required defaultValue={EXEMPLO} style={{ fontFamily: "monospace", fontSize: 13 }} />
          <p className="small mt-1">
            Linhas com <code>?</code> iniciam uma etapa; <code>*</code> marca a opção correta e <code>-</code> as incorretas.
            Após <code>|</code>, o feedback exibido ao ligante.
          </p>
          <button className="btn btn-primary btn-sm mt-2" type="submit">Salvar caso</button>
        </form>
      </div>

      <div className="card mb-3">
        <h3 style={{ fontSize: 16 }}>Importar casos em massa (arquivo de texto)</h3>
        <p className="small mt-1">
          Vários casos no mesmo arquivo, separados por uma linha <code>===</code>. Cada bloco:
        </p>
        <pre className="small mt-1" style={{ background: "var(--bg-2)", padding: 10, borderRadius: 8, overflowX: "auto", fontSize: 12.5 }}>
{`TITULO: Nome do caso
TEMA: ${TEMAS[0]}
VISIBILIDADE: ligantes
CENARIO: Homem, 34 anos, vítima de colisão...
ETAPAS:
? Qual a primeira conduta?
* Opção correta | Feedback da correta
- Opção errada | Feedback da errada
===
TITULO: Próximo caso
...`}
        </pre>
        <form action={importarCasos}>
          <label className="label">Arquivo de texto (.txt)</label>
          <input className="input" type="file" name="txt" accept=".txt,text/plain" required />
          <button className="btn btn-blue btn-sm mt-2" type="submit">Importar em massa</button>
        </form>
      </div>

      <div className="table-wrap">
        <table className="tbl">
          <thead><tr><th>Título</th><th>Tema</th><th>Etapas</th><th>Visibilidade</th><th>Execuções</th><th></th></tr></thead>
          <tbody>
            {casos.length === 0 && <tr><td colSpan={6} className="muted">Nenhum caso cadastrado.</td></tr>}
            {casos.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.titulo}</strong></td>
                <td className="muted">{c.tema}</td>
                <td><span className="badge">{JSON.parse(c.etapas).length}</span></td>
                <td>{c.visibilidade === "publico" ? <span className="badge badge-blue">Pública</span> : <span className="badge">Ligantes</span>}</td>
                <td><span className="badge badge-green">{c.execucoes}</span></td>
                <td>
                  <div className="flex" style={{ gap: 8 }}>
                    <Link className="btn btn-sm" href={`/ligante/casos/${c.id}`}>Abrir</Link>
                    <form action={excluirCaso}>
                      <input type="hidden" name="id" value={c.id} />
                      <button className="btn btn-sm btn-danger" type="submit">Excluir</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
