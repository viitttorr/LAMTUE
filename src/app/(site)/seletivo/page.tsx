import { db } from "@/lib/db";
import { salvarArquivo } from "@/lib/arquivos";
import { enviarEmail } from "@/lib/mailer";
import { fmtData, fmtValor } from "@/lib/util";
import Countdown from "@/components/Countdown";
import Counter from "@/components/Counter";
import Reveal from "@/components/Reveal";
import PageHeader from "@/components/PageHeader";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function inscrever(formData: FormData) {
  "use server";
  const sel = (await db().prepare("SELECT ativo, prazo FROM seletivo WHERE id=1").get()) as { ativo: number; prazo: string | null };
  if (!sel.ativo) redirect("/seletivo?erro=" + encodeURIComponent("O processo seletivo não está aberto."));
  if (sel.prazo && new Date(sel.prazo + "T23:59:59") < new Date())
    redirect("/seletivo?erro=" + encodeURIComponent("O prazo de inscrição já encerrou."));

  const nome = String(formData.get("nome") || "").trim();
  const matricula = String(formData.get("matricula") || "").trim();
  const semestre = String(formData.get("semestre") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const telefone = String(formData.get("telefone") || "").trim();
  if (!nome || !matricula || !semestre || !email || !telefone)
    redirect("/seletivo?erro=" + encodeURIComponent("Preencha todos os campos obrigatórios."));

  let comprovanteId: number | null = null;
  try {
    comprovanteId = await salvarArquivo(formData.get("comprovante") as File | null);
  } catch (e) {
    redirect("/seletivo?erro=" + encodeURIComponent(e instanceof Error ? e.message : "Falha no upload."));
  }

  const dup = await db().prepare("SELECT id FROM inscricoes WHERE matricula = ? OR email = ?").get(matricula, email);
  if (dup) redirect("/seletivo?erro=" + encodeURIComponent("Já existe uma inscrição com esta matrícula ou e-mail."));

  await db().prepare(
    "INSERT INTO inscricoes (nome, matricula, semestre, email, telefone, comprovante_id) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(nome, matricula, semestre, email, telefone, comprovanteId);

  await enviarEmail(
    email,
    "Inscrição confirmada — Processo Seletivo LAMTUE",
    `Olá, ${nome.split(" ")[0]}!\n\nSua inscrição no processo seletivo da LAMTUE foi recebida com sucesso.\n\nMatrícula: ${matricula}\nSemestre: ${semestre}\n\nAcompanhe o cronograma no portal e fique de olho no seu e-mail: o resultado será enviado por aqui.\n\nBoa sorte!`,
    "inscricao_seletivo"
  );
  redirect("/seletivo?ok=1");
}

export default async function SeletivoPage({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const { ok, erro } = await searchParams;
  const sel = (await db().prepare("SELECT * FROM seletivo WHERE id = 1").get()) as {
    ativo: number; vagas: number; prazo: string | null; taxa_centavos: number; edital: string | null; cronograma: string | null;
  };
  const inscritos = ((await db().prepare("SELECT COUNT(*) AS n FROM inscricoes").get()) as { n: number }).n;
  const cronograma: { etapa: string; data: string }[] = sel.cronograma ? JSON.parse(sel.cronograma) : [];
  const encerrado = sel.prazo ? new Date(sel.prazo + "T23:59:59") < new Date() : false;

  return (
    <div className="container" style={{ padding: "60px 24px 20px" }}>
      <div className="page-panel">
      <PageHeader eyebrow="Ingresso na liga" titulo="Processo Seletivo" />

      {!sel.ativo ? (
        <div className="alert alert-blue" style={{ maxWidth: 640 }}>
          Não há processo seletivo aberto no momento. Acompanhe nossas redes e este portal — o
          próximo edital será publicado aqui.
        </div>
      ) : (
        <>
          <Reveal>
            <div className="grid4 mt-2">
              <div className="card stat"><div className="stat-num" style={{ color: "var(--red-bright)" }}><Counter to={sel.vagas} /></div><div className="stat-label">Vagas</div></div>
              <div className="card stat"><div className="stat-num" style={{ color: "var(--blue)" }}><Counter to={inscritos} /></div><div className="stat-label">Inscritos</div></div>
              <div className="card stat"><div className="stat-num" style={{ fontSize: 24 }}>{sel.taxa_centavos ? fmtValor(sel.taxa_centavos) : "Gratuita"}</div><div className="stat-label">Taxa de inscrição</div></div>
              <div className="card stat">{sel.prazo ? <Countdown prazo={sel.prazo} /> : <div className="stat-num">—</div>}<div className="stat-label">Prazo{sel.prazo ? ` · ${fmtData(sel.prazo)}` : ""}</div></div>
            </div>
          </Reveal>

          <div className="grid2 mt-3" style={{ alignItems: "start" }}>
            <div>
              {sel.edital && (
                <Reveal>
                  <div className="card">
                    <h3 style={{ fontSize: 18, marginBottom: 10 }}>Edital</h3>
                    <p className="muted" style={{ whiteSpace: "pre-line", fontSize: 14.5 }}>{sel.edital}</p>
                  </div>
                </Reveal>
              )}
              {cronograma.length > 0 && (
                <Reveal>
                  <div className="card mt-2">
                    <h3 style={{ fontSize: 18, marginBottom: 14 }}>Cronograma</h3>
                    {cronograma.map((c, i) => (
                      <div key={i} className="flex-between" style={{ padding: "10px 0", borderBottom: i < cronograma.length - 1 ? "1px solid var(--border)" : "none" }}>
                        <span style={{ fontSize: 14.5 }}>{c.etapa}</span>
                        <span className="badge badge-blue">{fmtData(c.data)}</span>
                      </div>
                    ))}
                  </div>
                </Reveal>
              )}
            </div>

            <Reveal delay={120}>
              <div className="card" style={{ borderColor: "rgba(226,83,111,0.3)" }}>
                <h3 style={{ fontSize: 18 }}>Formulário de inscrição</h3>
                {ok && <div className="alert alert-green">Inscrição confirmada! Você receberá um e-mail com os próximos passos.</div>}
                {erro && <div className="alert alert-red">{erro}</div>}
                {encerrado ? (
                  <div className="alert alert-amber">O prazo de inscrição encerrou em {fmtData(sel.prazo)}.</div>
                ) : (
                  <form action={inscrever}>
                    <label className="label">Nome completo *</label>
                    <input className="input" name="nome" required maxLength={120} />
                    <div className="grid2" style={{ gap: 14 }}>
                      <div>
                        <label className="label">Matrícula *</label>
                        <input className="input" name="matricula" required maxLength={30} />
                      </div>
                      <div>
                        <label className="label">Semestre *</label>
                        <select className="input" name="semestre" required defaultValue="">
                          <option value="" disabled>Selecione</option>
                          {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={`${i + 1}º`}>{i + 1}º semestre</option>)}
                        </select>
                      </div>
                    </div>
                    <label className="label">E-mail *</label>
                    <input className="input" type="email" name="email" required maxLength={120} />
                    <label className="label">Telefone (WhatsApp) *</label>
                    <input className="input" name="telefone" required placeholder="(54) 9 9999-9999" maxLength={20} />
                    <label className="label">Comprovante de pagamento {sel.taxa_centavos ? "*" : "(se aplicável)"}</label>
                    <input className="input" type="file" name="comprovante" accept=".pdf,.jpg,.jpeg,.png,.webp" required={!!sel.taxa_centavos} />
                    <div className="small mt-1">PDF ou imagem, até 20 MB.</div>
                    <button className="btn btn-primary mt-3" style={{ width: "100%" }} type="submit">
                      Enviar inscrição
                    </button>
                  </form>
                )}
              </div>
            </Reveal>
          </div>
        </>
      )}
      </div>
    </div>
  );
}
