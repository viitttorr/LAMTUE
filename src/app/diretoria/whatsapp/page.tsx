import { exigirDiretoria } from "@/lib/auth";
import { waStatus } from "@/lib/whatsapp";
import { conectarWhatsApp, desconectarWhatsApp } from "@/app/actions/diretoria";

export default async function WhatsAppPage() {
  await exigirDiretoria();
  const wa = waStatus();

  return (
    <>
      <h1 className="page-title">Conexão WhatsApp</h1>
      <p className="page-sub">
        Use um número dedicado exclusivo da liga. A plataforma pode banir o número a qualquer momento —
        risco conhecido e aceito pela gestão.
      </p>

      <div className="card" style={{ maxWidth: 560 }}>
        <div className="flex-between">
          <h3 style={{ fontSize: 16 }}>Status</h3>
          <span className={`badge ${wa.status === "conectado" ? "badge-green" : wa.status === "aguardando_qr" ? "badge-amber" : "badge-red"}`}>
            {wa.status === "conectado" ? `Conectado${wa.numero ? ` · +${wa.numero}` : ""}`
              : wa.status === "aguardando_qr" ? "Aguardando leitura do QR"
              : wa.status === "erro" ? "Erro" : "Desconectado"}
          </span>
        </div>
        {wa.erro && <div className="alert alert-red">{wa.erro}</div>}

        {wa.status === "aguardando_qr" && wa.qrDataUrl && (
          <div style={{ textAlign: "center", margin: "18px 0" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={wa.qrDataUrl} alt="QR Code do WhatsApp" style={{ borderRadius: 12, background: "#fff", padding: 10 }} />
            <p className="small mt-2">
              No celular da liga: WhatsApp → Configurações → Aparelhos conectados → Conectar aparelho.
            </p>
            <form action={conectarWhatsApp}>
              <button className="btn btn-sm mt-2" type="submit">Atualizar QR / status</button>
            </form>
          </div>
        )}

        <div className="flex mt-3" style={{ gap: 10 }}>
          {wa.status !== "conectado" && (
            <form action={conectarWhatsApp}>
              <button className="btn btn-primary" type="submit">
                {wa.status === "aguardando_qr" ? "Atualizar status" : "Conectar (gerar QR code)"}
              </button>
            </form>
          )}
          {(wa.status === "conectado" || wa.status === "aguardando_qr") && (
            <form action={desconectarWhatsApp}>
              <button className="btn btn-danger" type="submit">Desconectar e limpar sessão</button>
            </form>
          )}
        </div>

        <div className="alert alert-blue mt-3" style={{ marginBottom: 0 }}>
          Após clicar em conectar, aguarde alguns segundos e clique em “Atualizar status” até o QR aparecer.
          Com a conexão ativa, o sistema envia automaticamente: confirmação de presença, lembrete de aula,
          novo material, resultado do seletivo e avisos manuais.
        </div>
      </div>
    </>
  );
}
