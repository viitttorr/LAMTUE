import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirDiretoria } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtData } from "@/lib/util";
import { descreverAcao } from "@/lib/logs";

const ROLE_LABEL: Record<string, { label: string; cls: string }> = {
  diretoria: { label: "Diretoria", cls: "badge-blue" },
  ligante: { label: "Ligante", cls: "badge-green" },
  candidato: { label: "Candidato", cls: "badge-amber" },
};

const LIMITE = 300;

export default async function LogIndividualPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filtro?: string }>;
}) {
  await exigirDiretoria();
  const { id } = await params;
  const { filtro } = await searchParams;
  const userId = Number(id);

  const usuario = (await db().prepare(
    "SELECT id, nome, matricula, email, role, cargo, turma FROM users WHERE id = ?"
  ).get(userId)) as
    | { id: number; nome: string; matricula: string | null; email: string | null; role: string; cargo: string | null; turma: string | null }
    | undefined;
  if (!usuario) notFound();

  const somentePaginas = filtro === "paginas";
  const somenteAcoes = filtro === "acoes";
  const condicao = somentePaginas
    ? "AND acao = 'pagina_visitada'"
    : somenteAcoes
    ? "AND acao <> 'pagina_visitada'"
    : "";

  const eventos = (await db().prepare(
    `SELECT acao, detalhes, criado_em FROM audit_log
      WHERE user_id = ? ${condicao}
      ORDER BY id DESC LIMIT ${LIMITE}`
  ).all(userId)) as { acao: string; detalhes: string | null; criado_em: string }[];

  const totais = (await db().prepare(
    `SELECT
       SUM(CASE WHEN acao = 'login' THEN 1 ELSE 0 END) AS acessos,
       SUM(CASE WHEN acao = 'pagina_visitada' THEN 1 ELSE 0 END) AS paginas,
       SUM(CASE WHEN acao NOT IN ('login','pagina_visitada') THEN 1 ELSE 0 END) AS acoes,
       MAX(CASE WHEN acao = 'login' THEN criado_em END) AS ultimo_acesso
     FROM audit_log WHERE user_id = ?`
  ).get(userId)) as { acessos: number | null; paginas: number | null; acoes: number | null; ultimo_acesso: string | null };

  const role = ROLE_LABEL[usuario.role] ?? { label: usuario.role, cls: "" };
  const voltar = usuario.role === "candidato" ? "/diretoria/seletivo" : "/diretoria/ligantes";

  return (
    <>
      <Link href={voltar} className="small" style={{ color: "var(--blue)" }}>
        ← {usuario.role === "candidato" ? "Seletivo" : "Ligantes"}
      </Link>
      <h1 className="page-title mt-1" style={{ marginBottom: 2 }}>Log de {usuario.nome}</h1>
      <p className="page-sub">
        <span className={`badge ${role.cls}`}>{role.label}</span>
        {usuario.cargo && <> · {usuario.cargo}</>}
        {usuario.matricula && <> · Matrícula {usuario.matricula}</>}
        {usuario.turma && <> · Turma {usuario.turma}</>}
      </p>

      <div className="grid4 mb-3">
        <div className="card stat"><div className="stat-num" style={{ color: "var(--blue)" }}>{totais.acessos ?? 0}</div><div className="stat-label">Acessos</div></div>
        <div className="card stat"><div className="stat-num">{totais.paginas ?? 0}</div><div className="stat-label">Páginas abertas</div></div>
        <div className="card stat"><div className="stat-num" style={{ color: "var(--green)" }}>{totais.acoes ?? 0}</div><div className="stat-label">Ações realizadas</div></div>
        <div className="card stat"><div className="stat-num" style={{ fontSize: 17 }}>{totais.ultimo_acesso ? fmtData(totais.ultimo_acesso, true) : "—"}</div><div className="stat-label">Último acesso</div></div>
      </div>

      <div className="flex mb-2" style={{ gap: 8, flexWrap: "wrap" }}>
        <Link href={`/diretoria/logs/${userId}`} className={`btn btn-sm ${!filtro ? "btn-blue" : ""}`}>Tudo</Link>
        <Link href={`/diretoria/logs/${userId}?filtro=paginas`} className={`btn btn-sm ${somentePaginas ? "btn-blue" : ""}`}>Só páginas</Link>
        <Link href={`/diretoria/logs/${userId}?filtro=acoes`} className={`btn btn-sm ${somenteAcoes ? "btn-blue" : ""}`}>Só ações</Link>
      </div>

      <div className="card">
        {eventos.length === 0 && <p className="muted" style={{ fontSize: 14 }}>Nenhum registro para este filtro.</p>}
        {eventos.map((e, i) => {
          const { titulo, complemento } = descreverAcao(e.acao, e.detalhes);
          const ehPagina = e.acao === "pagina_visitada";
          return (
            <div
              key={i}
              style={{ padding: "9px 0", borderBottom: i < eventos.length - 1 ? "1px solid var(--border)" : "none", fontSize: 13.5 }}
            >
              <div className="flex-between" style={{ gap: 10 }}>
                <span>
                  <span style={{ opacity: 0.65, marginRight: 6 }}>{ehPagina ? "▤" : "▸"}</span>
                  {titulo}
                  {complemento && <strong style={{ marginLeft: 5 }}>{complemento}</strong>}
                </span>
                <span className="small" style={{ whiteSpace: "nowrap" }}>{fmtData(e.criado_em, true)}</span>
              </div>
            </div>
          );
        })}
        {eventos.length === LIMITE && (
          <p className="small mt-2 muted">Mostrando os {LIMITE} registros mais recentes.</p>
        )}
      </div>
    </>
  );
}
