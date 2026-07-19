import { exigirLigante } from "@/lib/auth";
import { db, frequenciaDe, getConfig } from "@/lib/db";
import { temasComMaisErros } from "@/lib/ai";
import { fmtData } from "@/lib/util";
import Link from "next/link";
import Counter from "@/components/Counter";
import ECGLine from "@/components/ECGLine";

export default async function PainelLigante() {
  const s = await exigirLigante();
  const freq = frequenciaDe(s.id);
  const proxAula = db().prepare("SELECT titulo, data, local FROM aulas WHERE data >= date('now') ORDER BY data ASC LIMIT 1").get() as
    | { titulo: string; data: string; local: string | null } | undefined;
  const avisos = db().prepare("SELECT a.titulo, a.mensagem, a.criado_em, u.nome AS autor FROM avisos a LEFT JOIN users u ON u.id = a.autor_id ORDER BY a.id DESC LIMIT 3").all() as
    { titulo: string; mensagem: string; criado_em: string; autor: string | null }[];
  const simulados = db().prepare("SELECT COUNT(*) AS n, AVG(score) AS media FROM simulados WHERE user_id = ? AND score IS NOT NULL").get(s.id) as { n: number; media: number | null };
  const reforco = temasComMaisErros(s.id);
  const emRisco = freq.total > 0 && freq.pct < 75;

  return (
    <>
      <h1 className="page-title">Olá, {s.nome.split(" ")[0]}</h1>
      <p className="page-sub">Seu painel na LAMTUE — período {getConfig("periodo_atual", "2026")}</p>

      {emRisco && (
        <div className="alert alert-red">
          <strong>Atenção à frequência:</strong> você está com {freq.pct}% de presença. O mínimo para
          certificação é 2/3 (≈67%). Evite faltar às próximas aulas.
        </div>
      )}

      <div className="grid3">
        <div className="card stat hoverable">
          <div className="stat-num" style={{ color: freq.elegivel || freq.total === 0 ? "var(--green)" : "var(--red-bright)" }}>
            <Counter to={freq.pct} suffix="%" />
          </div>
          <div className="stat-label">Frequência ({freq.presentes}/{freq.total} aulas)</div>
          <div className={`progress mt-2 ${freq.elegivel || freq.total === 0 ? "green" : ""}`}><span style={{ width: `${freq.pct}%` }} /></div>
        </div>
        <div className="card stat hoverable">
          <div className="stat-num" style={{ fontSize: 21, color: freq.elegivel ? "var(--green)" : "var(--amber)" }}>
            {freq.total === 0 ? "Aguardando aulas" : freq.elegivel ? "Elegível ✓" : "Em construção"}
          </div>
          <div className="stat-label">Status de certificação</div>
          <Link href="/ligante/certificado" className="small mt-2" style={{ display: "inline-block", color: "var(--blue)" }}>Ver certificado →</Link>
        </div>
        <div className="card stat hoverable">
          {proxAula ? (
            <>
              <div style={{ font: "700 17px var(--font-display)" }}>{proxAula.titulo}</div>
              <div className="stat-label">Próxima aula · {fmtData(proxAula.data)}{proxAula.local ? ` · ${proxAula.local}` : ""}</div>
            </>
          ) : (
            <>
              <div style={{ font: "700 17px var(--font-display)" }}>Sem aula agendada</div>
              <div className="stat-label">Próxima aula</div>
            </>
          )}
          <div className="mt-2"><ECGLine height={30} color="rgba(56,189,248,0.7)" /></div>
        </div>
      </div>

      <div className="grid2 mt-3" style={{ alignItems: "start" }}>
        <div className="card">
          <div className="flex-between">
            <h3 style={{ fontSize: 17 }}>Seu desempenho em simulados</h3>
            <Link href="/ligante/simulados" className="btn btn-sm btn-blue">Novo simulado</Link>
          </div>
          <div className="flex mt-2" style={{ gap: 34 }}>
            <div><div className="stat-num" style={{ fontSize: 27, color: "var(--blue)" }}>{simulados.n}</div><div className="small">realizados</div></div>
            <div><div className="stat-num" style={{ fontSize: 27, color: "var(--blue)" }}>{simulados.media !== null ? Math.round(simulados.media) + "%" : "—"}</div><div className="small">média de acerto</div></div>
          </div>
          {reforco.length > 0 && (
            <div className="alert alert-amber mt-2">
              <strong>Sugestão de reforço:</strong> revise {reforco.map((r) => r.tema).join(", ")} na{" "}
              <Link href="/ligante/trilha" style={{ fontWeight: 700, color: "inherit", textDecoration: "underline" }}>trilha de aprendizado</Link>.
            </div>
          )}
        </div>
        <div className="card">
          <div className="flex-between">
            <h3 style={{ fontSize: 17 }}>Mural da diretoria</h3>
            <Link href="/ligante/mural" className="small" style={{ color: "var(--blue)" }}>Ver tudo →</Link>
          </div>
          {avisos.length === 0 && <p className="muted mt-2" style={{ fontSize: 14 }}>Nenhum aviso publicado ainda.</p>}
          {avisos.map((a, i) => (
            <div key={i} style={{ padding: "12px 0", borderBottom: i < avisos.length - 1 ? "1px solid var(--border)" : "none" }}>
              <strong style={{ fontSize: 14.5 }}>{a.titulo}</strong>
              <p className="muted" style={{ fontSize: 13.5, margin: "4px 0" }}>{a.mensagem.length > 140 ? a.mensagem.slice(0, 140) + "…" : a.mensagem}</p>
              <span className="small">{fmtData(a.criado_em, true)}{a.autor ? ` · ${a.autor}` : ""}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
