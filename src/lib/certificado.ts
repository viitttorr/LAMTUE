import PDFDocument from "pdfkit";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { DIRETORIA, getConfig } from "./db";

/**
 * Lê um asset estático (fonte, logo) via o binding ASSETS do Worker — pdfkit
 * por padrão resolve as fontes "Helvetica" via fs.readFileSync em arquivos
 * empacotados dentro do próprio pacote, o que não existe em Workers (sem
 * sistema de arquivos). Por isso a fonte é embutida (registerFont) a partir
 * de um asset público, em vez de referenciada pelo nome padrão do pdfkit.
 */
async function lerAsset(caminho: string): Promise<Buffer> {
  const { env } = getCloudflareContext();
  if (!env.ASSETS) throw new Error("Binding ASSETS não encontrado.");
  const res = await env.ASSETS.fetch(new URL(caminho, "http://assets.local"));
  if (!res.ok) throw new Error(`Asset não encontrado: ${caminho}`);
  return Buffer.from(await res.arrayBuffer());
}

/** Gera o certificado em PDF (paisagem) e resolve com o buffer. */
export async function gerarCertificado(nome: string, horas: number, periodo: string): Promise<Buffer> {
  const [fonte, logo] = await Promise.all([
    lerAsset("/fonts/certificado.ttf"),
    lerAsset("/logo.png").catch(() => null),
  ]);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 0 });
    doc.registerFont("Sans", fonte);
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width;
    const H = doc.page.height;
    const vinho = "#8b1538";
    const escuro = "#0a0f1c";

    // fundo
    doc.rect(0, 0, W, H).fill(escuro);
    doc.rect(24, 24, W - 48, H - 48).lineWidth(2).stroke(vinho);
    doc.rect(32, 32, W - 64, H - 64).lineWidth(0.5).stroke("#334155");

    // faixa lateral
    doc.rect(24, 24, 14, H - 48).fill(vinho);

    if (logo) {
      try {
        doc.image(logo, W / 2 - 45, 56, { width: 90 });
      } catch {}
    }

    doc.font("Sans").fontSize(30).fillColor("#ffffff")
      .text("CERTIFICADO", 0, 165, { align: "center", characterSpacing: 6 });
    doc.font("Sans").fontSize(12).fillColor("#94a3b8")
      .text("Liga Acadêmica de Medicina de Trauma, Urgência e Emergência — LAMTUE", 0, 205, { align: "center" });
    doc.fontSize(10).text("URI Erechim · vinculada ao CAMED", 0, 222, { align: "center" });

    doc.font("Sans").fontSize(13).fillColor("#c4ccda")
      .text("Certificamos que", 0, 262, { align: "center" });
    doc.font("Sans").fontSize(24).fillColor("#e2536f")
      .text(nome, 0, 284, { align: "center" });
    doc.font("Sans").fontSize(13).fillColor("#c4ccda")
      .text(
        `participou das atividades da LAMTUE no período ${periodo}, com frequência mínima de 2/3 das aulas,\ntotalizando carga horária de ${horas} horas.`,
        60, 322, { align: "center", width: W - 120, lineGap: 4 }
      );

    // assinaturas referenciais
    const presidente = DIRETORIA[0];
    const ensino = DIRETORIA[3];
    const y = H - 130;
    for (const [i, m] of [presidente, ensino].entries()) {
      const x = i === 0 ? W / 2 - 300 : W / 2 + 60;
      doc.moveTo(x, y).lineTo(x + 240, y).lineWidth(0.75).stroke("#475569");
      doc.font("Sans").fontSize(11).fillColor("#e8ecf4").text(m.nome, x, y + 8, { width: 240, align: "center" });
      doc.font("Sans").fontSize(9).fillColor("#94a3b8").text(m.cargo + " — LAMTUE", x, y + 22, { width: 240, align: "center" });
    }

    doc.font("Sans").fontSize(8.5).fillColor("#64748b")
      .text(`Documento gerado automaticamente pelo Portal LAMTUE em ${new Date().toLocaleDateString("pt-BR")}.`, 0, H - 58, { align: "center" });

    doc.end();
  });
}

export async function horasCertificado(): Promise<number> {
  const porAula = Number(await getConfig("horas_por_aula", "2"));
  return porAula;
}
