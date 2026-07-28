import { exigirDiretoria } from "@/lib/auth";
import { db, frequenciaDe, getConfig } from "@/lib/db";
import { salvarConfiguracoes } from "@/app/actions/diretoria";
import { fmtData } from "@/lib/util";
import Link from "next/link";
import Counter from "@/components/Counter";

export default async function DashboardDiretoria({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const s = await exigirDiretoria();
  const { ok } = await searchParams;
  const ligantes = (await db().prepare("SELECT id, nome FROM users WHERE role='ligante' AND ativo=1").all()) as { id: number; nome: string }[];
  const aulasRealizadas = ((await db().prepare("SELECT COUNT(*) AS n FROM aulas WHERE data <= date('now')").get()) as { n: number }).n;
  const aulasPlanejadas = ((await db().prepare("SELECT COUNT(*) AS n FROM aulas").get()) as { n: number }).n;
  const pendentes = ((await db().prepare("SELECT COUNT(*) AS n FROM inscricoes WHERE status='pendente'").get()) as { n: number }).n;
  const frequencias = new Map(await Promise.all(ligantes.map(async (l) => [l.id, await frequenciaDe(l.id)] as const)));
  const emRisco = ligantes.filter((l) => { const f = frequencias.get(l.id)!; return f.total > 0 && !f.elegivel; });
  const isCloudflare = process.env.RUNTIME === "cloudflare";
  const wa = isCloudflare ? null : (await import("@/lib/whatsapp")).waStatus();
  const periodoAtual = await getConfig("periodo_atual", "2026/2");
  const horasPorAula = await getConfig("horas_por_aula", "2");
  const emailContato = await getConfig("email_contato", "");
  const certificadosLiberados = (await getConfig("certificados_liberados", "0")) === "1";
  const ultimasAcoes = (await db().prepare(
    "SELECT a.acao, a.detalhes, a.criado_em, u.nome FROM audit_log a LEFT JOIN users u ON u.id = a.user_id ORDER BY a.id DESC LIMIT 8"
  ).all()) as { acao: string; detalhes: string | null; criado_em: string; nome: string | null }[];

  return (
    <>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">Visão geral da liga em tempo real — {s.cargo}</p>

      <div className="grid4">
        <Link href="/diretoria/ligantes" className="card stat hoverable">
          <div className="stat-num" style={{ color: "var(--blue)" }}><Counter to={ligantes.length} /></div>
          <div className="stat-label">Ligantes ativos</div>
        </Link>
        <Link href="/diretoria/aulas" className="card stat hoverable">
          <div className="stat-num">{aulasRealizadas}<span style={{ color: "var(--text-3)", fontSize: 20 }}>/{aulasPlanejadas}</span></div>
          <div className="stat-label">Aulas realizadas / planejadas</div>
        </Link>
        <Link href="/diretoria/frequencia" className="card stat hoverable">
          <div className="stat-num" style={{ color: emRisco.length ? "var(--red-bright)" : "var(--green)" }}><Counter to={emRisco.length} /></div>
          <div className="stat-label">Ligantes em risco (certificado)</div>
        </Link>
        <Link href="/diretoria/seletivo" className="card stat hoverable">
          <div className="stat-num" style={{ color: pendentes ? "var(--amber)" : "var(--text)" }}><Counter to={pendentes} /></div>
          <div className="stat-label">Inscrições pendentes</div>
        </Link>
      </div>

      <div className="grid2 mt-3" style={{ alignItems: "start" }}>
        <div>
          <div className="card">
            <div className="flex-between">
              <h3 style={{ fontSize: 16 }}>Conexão WhatsApp</h3>
              {isCloudflare ? (
                <span className="badge badge-amber">Indisponível</span>
              ) : (
                <span className={`badge ${wa!.status === "conectado" ? "badge-green" : wa!.status === "aguardando_qr" ? "badge-amber" : "badge-red"}`}>
                  <span className={`pulse-dot ${wa!.status === "conectado" ? "" : "red"}`} style={{ width: 7, height: 7 }} />
                  {wa!.status === "conectado" ? `Conectado${wa!.numero ? ` (${wa!.numero})` : ""}` : wa!.status === "aguardando_qr" ? "Aguardando QR" : "Desconectado"}
                </span>
              )}
            </div>
            <p className="small mt-1">Número dedicado da liga para notificações automáticas.</p>
            <Link href="/diretoria/whatsapp" className="btn btn-sm mt-2">Gerenciar conexão</Link>
          </div>

          {emRisco.length > 0 && (
            <div className="card mt-2" style={{ borderColor: "rgba(226,83,111,0.35)" }}>
              <h3 style={{ fontSize: 16 }}>⚠ Em risco de perder o certificado</h3>
              <div className="mt-1" style={{ display: "grid", gap: 6 }}>
                {emRisco.slice(0, 6).map((l) => {
                  const f = frequencias.get(l.id)!;
                  return (
                    <div key={l.id} className="flex-between" style={{ fontSize: 14 }}>
                      <span>{l.nome}</span>
                      <span className="badge badge-red">{f.pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="card mt-2">
            <h3 style={{ fontSize: 16 }}>Configurações gerais</h3>
            {ok && <div className="alert alert-green">Configurações salvas.</div>}
            <form action={salvarConfiguracoes}>
              <div className="grid2" style={{ gap: 12 }}>
                <div>
                  <label className="label">Período atual</label>
                  <input className="input" name="periodo" defaultValue={periodoAtual} />
                </div>
                <div>
                  <label className="label">Horas por aula</label>
                  <input className="input" type="number" name="horas_por_aula" defaultValue={horasPorAula} min={1} />
                </div>
              </div>
              <label className="label">E-mail de contato da liga</label>
              <input className="input" type="email" name="email_contato" defaultValue={emailContato} placeholder="lamtue@..." />
              <label className="flex mt-2" style={{ gap: 8 }}>
                <input
                  type="checkbox"
                  name="certificados_liberados"
                  defaultChecked={certificadosLiberados}
                  style={{ width: 17, height: 17, accentColor: "#a01d43" }}
                />
                <span style={{ fontSize: 14 }}>
                  Certificados liberados para download {certificadosLiberados ? <span className="badge badge-green" style={{ marginLeft: 4 }}>ativos</span> : <span className="badge badge-amber" style={{ marginLeft: 4 }}>bloqueados</span>}
                </span>
              </label>
              <p className="small mt-1">Enquanto desmarcado, ligantes elegíveis veem o status mas não podem baixar o PDF.</p>
              <button className="btn btn-sm mt-2" type="submit">Salvar</button>
            </form>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 16 }}>Log de ações da diretoria</h3>
          <div className="mt-1">
            {ultimasAcoes.length === 0 && <p className="muted" style={{ fontSize: 14 }}>Nenhuma ação registrada.</p>}
            {ultimasAcoes.map((a, i) => (
              <div key={i} style={{ padding: "9px 0", borderBottom: i < ultimasAcoes.length - 1 ? "1px solid var(--border)" : "none", fontSize: 13.5 }}>
                <div className="flex-between">
                  <span><strong>{a.nome ?? "Sistema"}</strong> · {a.acao.replace(/_/g, " ")}</span>
                  <span className="small">{fmtData(a.criado_em, true)}</span>
                </div>
                {a.detalhes && <div className="small">{a.detalhes}</div>}
              </div>
            ))}
          </div>
          <Link href="/diretoria/relatorios" className="small mt-2" style={{ display: "inline-block", color: "var(--blue)" }}>
            Relatórios e exportações →
          </Link>
        </div>
      </div>
    </>
  );
}
