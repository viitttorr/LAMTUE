import { exigirLigante } from "@/lib/auth";
import { frequenciaDe, getConfig } from "@/lib/db";

export default async function CertificadoPage() {
  const s = await exigirLigante();
  const freq = frequenciaDe(s.id);
  const horas = freq.presentes * Number(getConfig("horas_por_aula", "2"));
  const periodo = getConfig("periodo_atual", "2026");

  return (
    <>
      <h1 className="page-title">Certificado</h1>
      <p className="page-sub">Elegibilidade: frequência mínima de 2/3 das aulas com chamada registrada.</p>
      <div className="card" style={{ maxWidth: 620 }}>
        <div className="grid2">
          <div>
            <div className="small">Frequência</div>
            <div className="stat-num" style={{ fontSize: 30, color: freq.elegivel ? "var(--green)" : "var(--red-bright)" }}>{freq.pct}%</div>
          </div>
          <div>
            <div className="small">Carga horária acumulada</div>
            <div className="stat-num" style={{ fontSize: 30, color: "var(--blue)" }}>{horas}h</div>
          </div>
        </div>
        <div className="mt-2">
          {freq.elegivel ? (
            <>
              <div className="alert alert-green">
                Você está elegível! Seu certificado do período {periodo} inclui nome, carga horária e
                assinatura referencial da diretoria.
              </div>
              <a className="btn btn-primary" href="/api/certificado" download>
                ⬇ Baixar certificado (PDF)
              </a>
            </>
          ) : (
            <div className="alert alert-amber">
              {freq.total === 0
                ? "Ainda não há chamadas registradas neste período. O certificado ficará disponível quando você atingir a frequência mínima."
                : `Você precisa de pelo menos 2/3 de presença para emitir o certificado. Frequência atual: ${freq.pct}%.`}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
