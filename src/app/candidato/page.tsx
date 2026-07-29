import { exigirCandidato } from "@/lib/auth";
import { db, STATUS_LABEL } from "@/lib/db";
import { fmtData } from "@/lib/util";

const MENSAGEM_STATUS: Record<string, string> = {
  pendente: "Sua inscrição foi recebida e está em análise pela diretoria.",
  aprovado: "Parabéns! Você foi aprovado(a) no processo seletivo. Em breve a diretoria libera seu acesso completo à área do ligante.",
  reprovado: "Você não foi classificado(a) nesta edição do processo seletivo. Acompanhe nossas redes para o próximo seletivo.",
  espera: "Você está na lista de espera. Havendo desistências, os candidatos são chamados na ordem de classificação.",
};

export default async function CandidatoPage() {
  const s = await exigirCandidato();
  const insc = (await db().prepare("SELECT status, criado_em FROM inscricoes WHERE user_id = ?").get(s.id)) as
    | { status: string; criado_em: string }
    | undefined;
  const sel = (await db().prepare("SELECT edital_arquivo_id, cronograma FROM seletivo WHERE id = 1").get()) as
    | { edital_arquivo_id: number | null; cronograma: string | null }
    | undefined;
  const cronograma: { etapa: string; data: string }[] = sel?.cronograma ? JSON.parse(sel.cronograma) : [];

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <h1 className="page-title">Olá, {s.nome.split(" ")[0]}</h1>
      <p className="page-sub">Acompanhe aqui o status da sua inscrição no processo seletivo da LAMTUE.</p>

      {!insc ? (
        <div className="alert alert-amber">Não encontramos sua inscrição vinculada a esta conta. Fale com a diretoria.</div>
      ) : (
        <div className="card mt-2">
          <div className="flex-between">
            <span className="small">Inscrito em {fmtData(insc.criado_em)}</span>
            <span className={`badge ${STATUS_LABEL[insc.status]?.badge ?? ""}`}>{STATUS_LABEL[insc.status]?.label ?? insc.status}</span>
          </div>
          <p className="mt-2" style={{ fontSize: 15 }}>{MENSAGEM_STATUS[insc.status] ?? "Acompanhe seu e-mail e WhatsApp para novidades."}</p>
        </div>
      )}

      {sel?.edital_arquivo_id && (
        <div className="card mt-2">
          <h3 style={{ fontSize: 16 }}>Edital</h3>
          <a className="btn btn-sm mt-2" href={`/api/arquivos/${sel.edital_arquivo_id}`} target="_blank" rel="noreferrer">
            ⬇ Baixar edital em PDF
          </a>
        </div>
      )}

      {cronograma.length > 0 && (
        <div className="card mt-2">
          <h3 style={{ fontSize: 16, marginBottom: 10 }}>Cronograma</h3>
          {cronograma.map((c, i) => (
            <div key={i} className="flex-between" style={{ padding: "10px 0", borderBottom: i < cronograma.length - 1 ? "1px solid var(--border)" : "none" }}>
              <span style={{ fontSize: 14.5 }}>{c.etapa}</span>
              <span className="badge badge-blue">{fmtData(c.data)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
