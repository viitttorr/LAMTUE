import { exigirDiretoria } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtData } from "@/lib/util";

const RELATORIOS = [
  { href: "/api/relatorios/frequencia", titulo: "Frequência dos ligantes", desc: "Presenças, faltas e percentual de cada ligante ativo.", icon: "✓" },
  { href: "/api/relatorios/inscritos", titulo: "Inscritos do seletivo", desc: "Todos os candidatos com status e dados de contato.", icon: "✍" },
  { href: "/api/relatorios/simulados", titulo: "Desempenho em simulados", desc: "Histórico de simulados por ligante, tema e nota.", icon: "◎" },
  { href: "/api/relatorios/mensagens", titulo: "Histórico de notificações", desc: "Todas as mensagens enviadas por e-mail e WhatsApp.", icon: "✉" },
  { href: "/api/relatorios/financeiro", titulo: "Financeiro", desc: "Entradas e saídas registradas (visível ao Tesoureiro).", icon: "$" },
];

export default async function RelatoriosPage() {
  await exigirDiretoria();
  const auditoria = db().prepare(
    "SELECT a.acao, a.detalhes, a.criado_em, u.nome FROM audit_log a LEFT JOIN users u ON u.id = a.user_id ORDER BY a.id DESC LIMIT 40"
  ).all() as { acao: string; detalhes: string | null; criado_em: string; nome: string | null }[];

  return (
    <>
      <h1 className="page-title">Relatórios e Exportações</h1>
      <p className="page-sub">Exportação em CSV (abre direto no Excel/Google Planilhas).</p>
      <div className="grid3">
        {RELATORIOS.map((r) => (
          <a key={r.href} href={r.href} className="card hoverable" style={{ display: "block" }}>
            <div style={{ fontSize: 22, color: "var(--blue)" }}>{r.icon}</div>
            <strong style={{ display: "block", marginTop: 8, fontFamily: "var(--font-display)" }}>{r.titulo}</strong>
            <p className="small mt-1">{r.desc}</p>
            <span className="small" style={{ color: "var(--blue)" }}>Baixar CSV ↓</span>
          </a>
        ))}
      </div>

      <h3 style={{ fontSize: 17, margin: "34px 0 12px" }}>Log completo de ações da diretoria</h3>
      <div className="table-wrap">
        <table className="tbl">
          <thead><tr><th>Quando</th><th>Quem</th><th>Ação</th><th>Detalhes</th></tr></thead>
          <tbody>
            {auditoria.map((a, i) => (
              <tr key={i}>
                <td className="muted" style={{ fontSize: 13 }}>{fmtData(a.criado_em, true)}</td>
                <td>{a.nome ?? "Sistema"}</td>
                <td>{a.acao.replace(/_/g, " ")}</td>
                <td className="muted" style={{ fontSize: 13 }}>{a.detalhes ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
