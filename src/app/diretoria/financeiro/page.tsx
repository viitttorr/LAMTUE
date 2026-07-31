import { exigirDiretoria, podeVerFinanceiro } from "@/lib/auth";
import { db } from "@/lib/db";
import { lancarFinanceiro, excluirLancamento } from "@/app/actions/diretoria";
import { fmtData, fmtValor } from "@/lib/util";
import { redirect } from "next/navigation";
import FormAcao from "@/components/FormAcao";

export default async function FinanceiroPage() {
  const s = await exigirDiretoria();
  if (!podeVerFinanceiro(s)) redirect("/diretoria");

  const lancamentos = (await db().prepare("SELECT * FROM financeiro ORDER BY data DESC, id DESC").all()) as
    { id: number; tipo: string; descricao: string; valor_centavos: number; data: string }[];
  const entradas = lancamentos.filter((l) => l.tipo === "entrada").reduce((a, l) => a + l.valor_centavos, 0);
  const saidas = lancamentos.filter((l) => l.tipo === "saida").reduce((a, l) => a + l.valor_centavos, 0);
  const inscricoesPagas = ((await db().prepare("SELECT COUNT(*) AS n FROM inscricoes WHERE comprovante_id IS NOT NULL").get()) as { n: number }).n;
  const taxa = ((await db().prepare("SELECT taxa_centavos FROM seletivo WHERE id=1").get()) as { taxa_centavos: number }).taxa_centavos;

  return (
    <>
      <h1 className="page-title">Painel Financeiro</h1>
      <p className="page-sub">Acesso restrito à Presidência e ao Vice-Presidente / Tesoureiro.</p>

      <div className="grid4">
        <div className="card stat"><div className="stat-num" style={{ color: "var(--green)", fontSize: 26 }}>{fmtValor(entradas)}</div><div className="stat-label">Entradas</div></div>
        <div className="card stat"><div className="stat-num" style={{ color: "var(--red-bright)", fontSize: 26 }}>{fmtValor(saidas)}</div><div className="stat-label">Saídas</div></div>
        <div className="card stat"><div className="stat-num" style={{ color: entradas - saidas >= 0 ? "var(--blue)" : "var(--red-bright)", fontSize: 26 }}>{fmtValor(entradas - saidas)}</div><div className="stat-label">Saldo</div></div>
        <div className="card stat"><div className="stat-num" style={{ fontSize: 26 }}>{inscricoesPagas} × {fmtValor(taxa)}</div><div className="stat-label">Comprovantes do seletivo</div></div>
      </div>

      <div className="card mt-3 mb-3" style={{ maxWidth: 720 }}>
        <h3 style={{ fontSize: 16 }}>Novo lançamento</h3>
        <FormAcao action={lancarFinanceiro}>
          <div className="grid4" style={{ gap: 12 }}>
            <div>
              <label className="label">Tipo</label>
              <select className="input" name="tipo" defaultValue="entrada">
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
            </div>
            <div style={{ gridColumn: "span 2" }}><label className="label">Descrição *</label><input className="input" name="descricao" required placeholder="Taxa de inscrição, camisetas…" /></div>
            <div><label className="label">Valor (R$) *</label><input className="input" name="valor" required placeholder="25,00" /></div>
          </div>
          <div className="grid4" style={{ gap: 12 }}>
            <div><label className="label">Data</label><input className="input" type="date" name="data" defaultValue={new Date().toISOString().slice(0, 10)} /></div>
          </div>
          <button className="btn btn-primary btn-sm mt-2" type="submit">Lançar</button>
        </FormAcao>
      </div>

      <div className="table-wrap">
        <table className="tbl">
          <thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th>Valor</th><th></th></tr></thead>
          <tbody>
            {lancamentos.length === 0 && <tr><td colSpan={5} className="muted">Nenhum lançamento registrado.</td></tr>}
            {lancamentos.map((l) => (
              <tr key={l.id}>
                <td>{fmtData(l.data)}</td>
                <td>{l.descricao}</td>
                <td><span className={`badge ${l.tipo === "entrada" ? "badge-green" : "badge-red"}`}>{l.tipo === "entrada" ? "Entrada" : "Saída"}</span></td>
                <td style={{ color: l.tipo === "entrada" ? "var(--green)" : "var(--red-bright)", fontWeight: 600 }}>
                  {l.tipo === "entrada" ? "+" : "−"} {fmtValor(l.valor_centavos)}
                </td>
                <td>
                  <FormAcao action={excluirLancamento}>
                    <input type="hidden" name="id" value={l.id} />
                    <button className="btn btn-sm btn-danger" type="submit">Excluir</button>
                  </FormAcao>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
