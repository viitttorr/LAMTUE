import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { lerArquivo } from "@/lib/arquivos";
import { getSessao } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const arquivoId = Number(id);
  const sessao = await getSessao();

  // Controle de acesso conforme o uso do arquivo
  const ehComprovante = db().prepare("SELECT id FROM inscricoes WHERE comprovante_id = ?").get(arquivoId);
  const material = db().prepare("SELECT visibilidade FROM materiais WHERE arquivo_id = ?").get(arquivoId) as { visibilidade: string } | undefined;
  const ehExtensao = db().prepare("SELECT id FROM extensao WHERE arquivo_id = ?").get(arquivoId);

  if (ehComprovante && sessao?.role !== "diretoria") return new Response("Acesso negado", { status: 403 });
  if (material && material.visibilidade !== "publico" && !sessao) return new Response("Acesso negado", { status: 403 });
  if (!ehComprovante && !material && !ehExtensao && !sessao) return new Response("Acesso negado", { status: 403 });

  const f = lerArquivo(arquivoId);
  if (!f) return new Response("Arquivo não encontrado", { status: 404 });
  return new Response(new Uint8Array(f.buf), {
    headers: {
      "Content-Type": f.mime,
      "Content-Disposition": `inline; filename="${encodeURIComponent(f.nome)}"`,
    },
  });
}
