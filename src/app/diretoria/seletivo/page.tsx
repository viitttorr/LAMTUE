import { exigirDiretoria } from "@/lib/auth";
import { db, STATUS_LABEL } from "@/lib/db";
import { salvarSeletivo, enviarResultados, matricularAprovados, importarInscritos, removerEditalPdf, salvarGabarito, removerGabaritoPdf, criarInscricaoManual } from "@/app/actions/diretoria";
import { utcParaBrasiliaLocal } from "@/lib/util";
import InscritosTable from "@/components/InscritosTable";
import Countdown from "@/components/Countdown";

export default async function SeletivoAdminPage({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  await exigirDiretoria();
  const { ok, erro } = await searchParams;
  const sel = (await db().prepare("SELECT * FROM seletivo WHERE id = 1").get()) as {
    ativo: number; vagas: number; prazo: string | null; taxa_centavos: number; edital: string | null; cronograma: string | null;
    edital_arquivo_id: number | null; gabarito_libera_em: string | null; gabarito_arquivo_id: number | null;
  };
  const inscritos = (await db().prepare("SELECT * FROM inscricoes ORDER BY nome COLLATE NOCASE ASC").all()) as {
    id: number; nome: string; matricula: string; semestre: string; email: string; telefone: string;
    comprovante_id: number | null; status: string; criado_em: string; user_id: number | null; turma: string | null;
    acertos: number;
  }[];
  const porStatus = (st: string) => inscritos.filter((i) => i.status === st).length;
  const cronogramaTexto = sel.cronograma
    ? (JSON.parse(sel.cronograma) as { etapa: string; data: string }[]).map((c) => `${c.etapa} | ${c.data}`).join("\n")
    : "";

  return (
    <>
      <h1 className="page-title">Processo Seletivo</h1>
      <p className="page-sub">Configure o edital, acompanhe inscrições em tempo real e envie os resultados.</p>
      {ok && <div className="alert alert-green">{ok === "1" ? "Salvo." : ok}</div>}
      {erro && <div className="alert alert-red">{erro}</div>}

      <div className="grid4 mb-3">
        <div className="card stat"><div className="stat-num" style={{ color: "var(--blue)" }}>{inscritos.length}</div><div className="stat-label">Inscritos</div></div>
        <div className="card stat"><div className="stat-num" style={{ color: "var(--amber)" }}>{porStatus("pendente")}</div><div className="stat-label">Pendentes</div></div>
        <div className="card stat"><div className="stat-num" style={{ color: "var(--green)" }}>{porStatus("aprovado")}</div><div className="stat-label">Aprovados</div></div>
        <div className="card stat"><div className="stat-num" style={{ color: "var(--red-bright)" }}>{porStatus("reprovado") + porStatus("espera")}</div><div className="stat-label">Reprovados + espera</div></div>
      </div>

      <div className="card mb-3">
        <h3 style={{ fontSize: 16 }}>Configuração do seletivo</h3>
        <form action={salvarSeletivo}>
          <div className="grid4" style={{ gap: 12 }}>
            <div>
              <label className="label">Situação</label>
              <label className="flex" style={{ gap: 8, padding: "10px 0" }}>
                <input type="checkbox" name="ativo" defaultChecked={!!sel.ativo} style={{ width: 18, height: 18, accentColor: "#a01d43" }} />
                <span style={{ fontSize: 14 }}>Inscrições abertas</span>
              </label>
            </div>
            <div><label className="label">Vagas</label><input className="input" type="number" name="vagas" defaultValue={sel.vagas} min={1} /></div>
            <div><label className="label">Prazo final</label><input className="input" type="date" name="prazo" defaultValue={sel.prazo ?? ""} /></div>
            <div><label className="label">Taxa (R$)</label><input className="input" name="taxa" defaultValue={(sel.taxa_centavos / 100).toFixed(2).replace(".", ",")} /></div>
          </div>
          <label className="label">Edital (texto exibido na página pública)</label>
          <textarea className="input" name="edital" rows={5} defaultValue={sel.edital ?? ""} />
          <label className="label">Edital em PDF (disponível para download público e na área do candidato)</label>
          {sel.edital_arquivo_id && (
            <div className="flex mb-1" style={{ gap: 8, alignItems: "center" }}>
              <a
                className="btn btn-sm"
                href={`/api/arquivos/${sel.edital_arquivo_id}`}
                target="_blank"
                rel="noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                📄 Edital atual (PDF)
              </a>
              <button
                type="submit"
                formAction={removerEditalPdf}
                className="btn btn-sm btn-danger"
                title="Remover PDF atual"
                style={{ padding: "6px 10px" }}
              >
                ✕
              </button>
            </div>
          )}
          <input className="input" type="file" name="edital_pdf" accept=".pdf,application/pdf" />
          <p className="small mt-1">Envie um novo arquivo para substituir; deixe em branco para manter o atual.</p>
          <label className="label">Cronograma — uma etapa por linha: <code>Etapa | AAAA-MM-DD</code></label>
          <textarea className="input" name="cron_etapas" rows={4} defaultValue={cronogramaTexto} placeholder={"Inscrições | 2026-08-01\nProva teórica | 2026-08-15\nResultado final | 2026-08-20"} />
          <button className="btn btn-primary btn-sm mt-2" type="submit">Salvar configuração</button>
        </form>
      </div>

      <div className="card mb-3">
        <h3 style={{ fontSize: 16 }}>Resultados e matrícula</h3>
        <p className="small mt-1">O envio dispara e-mail e WhatsApp para todos os candidatos do status escolhido.</p>
        <div className="flex mt-2" style={{ flexWrap: "wrap", gap: 10 }}>
          {(["aprovado", "espera", "reprovado"] as const).map((st) => (
            <form key={st} action={enviarResultados}>
              <input type="hidden" name="status" value={st} />
              <button className="btn btn-sm" type="submit">Enviar resultado: {STATUS_LABEL[st].label} ({porStatus(st)})</button>
            </form>
          ))}
          <form action={matricularAprovados}>
            <button className="btn btn-sm btn-blue" type="submit">Criar contas dos aprovados ({porStatus("aprovado")})</button>
          </form>
        </div>
      </div>

      <div className="grid3 mb-3" style={{ alignItems: "start", gap: 16 }}>
        <div className="card">
          <h3 style={{ fontSize: 15 }}>Liberação do gabarito</h3>
          <p className="small mt-1">Quando fica visível na área do candidato. Horário de Brasília.</p>
          <form action={salvarGabarito}>
            <label className="label">Liberar em</label>
            <input className="input" type="datetime-local" name="gabarito_libera_em" defaultValue={utcParaBrasiliaLocal(sel.gabarito_libera_em)} style={{ fontSize: 13.5 }} />
            <label className="label mt-2">Gabarito oficial em PDF</label>
            {sel.gabarito_arquivo_id && (
              <div className="flex mb-1" style={{ gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <a
                  className="btn btn-sm"
                  href={`/api/arquivos/${sel.gabarito_arquivo_id}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  📄 Atual
                </a>
                <button
                  type="submit"
                  formAction={removerGabaritoPdf}
                  className="btn btn-sm btn-danger"
                  title="Remover PDF atual"
                  style={{ padding: "6px 10px" }}
                >
                  ✕
                </button>
              </div>
            )}
            <input className="input" type="file" name="gabarito_pdf" accept=".pdf,application/pdf" style={{ fontSize: 12.5 }} />
            <button className="btn btn-primary btn-sm mt-2" type="submit">Salvar</button>
          </form>
          {sel.gabarito_libera_em && (
            <p className="small mt-2">
              {new Date(sel.gabarito_libera_em) <= new Date()
                ? <span className="badge badge-green">Já liberado</span>
                : <>Libera em: <Countdown prazo={sel.gabarito_libera_em} /></>}
            </p>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: 15 }}>Importar candidatos (CSV)</h3>
          <p className="small mt-1">
            Colunas: <code>nome;email;matricula;telefone;turma</code>. Semestre calculado a partir da turma.
          </p>
          <form action={importarInscritos}>
            <label className="label">Arquivo CSV</label>
            <input className="input" type="file" name="csv" accept=".csv,text/csv" required style={{ fontSize: 12.5 }} />
            <button className="btn btn-blue btn-sm mt-2" type="submit">Importar em massa</button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 15 }}>Cadastrar candidato manualmente</h3>
          <p className="small mt-1">Um candidato de cada vez, sem CSV.</p>
          <form action={criarInscricaoManual}>
            <label className="label">Nome *</label>
            <input className="input" name="nome" required style={{ fontSize: 13.5 }} />
            <label className="label">Matrícula *</label>
            <input className="input" name="matricula" required style={{ fontSize: 13.5 }} />
            <label className="label">E-mail *</label>
            <input className="input" type="email" name="email" required style={{ fontSize: 13.5 }} />
            <label className="label">Telefone *</label>
            <input className="input" name="telefone" required style={{ fontSize: 13.5 }} />
            <label className="label">Turma</label>
            <input className="input" name="turma" placeholder="T7" style={{ fontSize: 13.5 }} />
            <button className="btn btn-blue btn-sm mt-2" type="submit">Cadastrar</button>
          </form>
        </div>
      </div>

      <InscritosTable inscritos={inscritos} />
    </>
  );
}
