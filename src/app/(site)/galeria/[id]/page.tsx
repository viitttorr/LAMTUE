import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getSessao } from "@/lib/auth";
import { fmtData } from "@/lib/util";
import Reveal from "@/components/Reveal";
import GaleriaLightbox from "@/components/GaleriaLightbox";

export const dynamic = "force-dynamic";

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const album = (await db().prepare("SELECT * FROM galeria_albuns WHERE id = ?").get(Number(id))) as
    | { id: number; titulo: string; descricao: string | null; data: string | null; visibilidade: string }
    | undefined;
  if (!album) notFound();

  const sessao = await getSessao();
  if (album.visibilidade === "ligantes" && !sessao) redirect("/login?destino=galeria");

  const fotos = (await db().prepare("SELECT id, arquivo_id, legenda FROM galeria_fotos WHERE album_id = ? ORDER BY id ASC").all(album.id)) as
    { id: number; arquivo_id: number; legenda: string | null }[];

  return (
    <div className="container" style={{ padding: "60px 24px 20px" }}>
      <div className="page-panel">
        <Reveal>
          <Link href="/galeria" className="small" style={{ color: "var(--blue)" }}>← Voltar para a galeria</Link>
          <h1 className="section-title mt-1">{album.titulo}</h1>
          <div className="flex" style={{ gap: 10, alignItems: "center", marginTop: 6 }}>
            {album.data && <span className="small">{fmtData(album.data)}</span>}
            <span className="small">{fotos.length} foto{fotos.length === 1 ? "" : "s"}</span>
          </div>
          {album.descricao && <p className="muted mt-2" style={{ maxWidth: 720 }}>{album.descricao}</p>}
        </Reveal>

        <div className="mt-3">
          {fotos.length === 0 ? (
            <p className="muted">Nenhuma foto neste álbum ainda.</p>
          ) : (
            <GaleriaLightbox fotos={fotos} />
          )}
        </div>
      </div>
    </div>
  );
}
