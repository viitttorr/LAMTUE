import { getSessao } from "@/lib/auth";
import { db, frequenciaDe, getConfig } from "@/lib/db";
import { gerarCertificado } from "@/lib/certificado";
import { enviarEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSessao();
  if (!s) return new Response("Acesso negado", { status: 403 });
  const freq = await frequenciaDe(s.id);
  if (!freq.elegivel) return new Response("Frequência mínima de 2/3 não atingida.", { status: 403 });
  const liberado = (await getConfig("certificados_liberados", "0")) === "1";
  if (!liberado) return new Response("Certificados ainda não foram liberados pela diretoria.", { status: 403 });

  const horas = freq.presentes * Number(await getConfig("horas_por_aula", "2"));
  const periodo = await getConfig("periodo_atual", "2026");
  const pdf = await gerarCertificado(s.nome, horas, periodo);

  // registra a emissão e notifica por e-mail (uma vez por download)
  const user = (await db().prepare("SELECT email FROM users WHERE id = ?").get(s.id)) as { email: string | null };
  if (user.email) {
    const jaAvisado = await db().prepare(
      "SELECT id FROM mensagens WHERE evento = 'certificado_disponivel' AND destinatario = ?"
    ).get(user.email);
    if (!jaAvisado) {
      await enviarEmail(
        user.email,
        "Seu certificado LAMTUE está disponível",
        `Parabéns! Você atingiu a frequência mínima e seu certificado de ${horas} horas (período ${periodo}) já pode ser baixado na área do ligante.`,
        "certificado_disponivel"
      );
    }
  }

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificado-lamtue-${s.nome.toLowerCase().replace(/\s+/g, "-")}.pdf"`,
    },
  });
}
