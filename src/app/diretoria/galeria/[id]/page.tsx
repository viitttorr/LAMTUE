import { notFound } from "next/navigation";
import Image from "next/image";
import { exigirGaleria } from "@/lib/auth";
import { db } from "@/lib/db";
import { adicionarFotos, excluirFoto, excluirAlbum } from "@/app/actions/diretoria";
import FormAcao from "@/components/FormAcao";

export default async function AlbumAdminPage({ params }: { params: Promise<{ id: string }> }) {
  await exigirGaleria();
  const { id } = await params;
  const albumId = Number(id);
  const album = (await db().prepare("SELECT * FROM galeria_albuns WHERE id = ?").get(albumId)) as
    | { id: number; titulo: string; visibilidade: string }
    | undefined;
  if (!album) notFound();

  const fotos = (await db().prepare("SELECT id, arquivo_id, legenda FROM galeria_fotos WHERE album_id = ? ORDER BY id ASC").all(albumId)) as
    { id: number; arquivo_id: number; legenda: string | null }[];

  return (
    <>
      <div className="flex-between">
        <div>
          <h1 className="page-title">{album.titulo}</h1>
          <p className="page-sub">{fotos.length} foto{fotos.length === 1 ? "" : "s"} · {album.visibilidade === "publico" ? "Álbum público" : "Apenas ligantes"}</p>
        </div>
        <form action={excluirAlbum}>
          <input type="hidden" name="id" value={album.id} />
          <button className="btn btn-sm btn-danger" type="submit">Excluir álbum</button>
        </form>
      </div>

      <div className="card mb-3">
        <h3 style={{ fontSize: 16 }}>Adicionar fotos</h3>
        <FormAcao action={adicionarFotos}>
          <input type="hidden" name="album_id" value={album.id} />
          <label className="label">Fotos (pode selecionar várias)</label>
          <input className="input" type="file" name="fotos" accept="image/*" multiple required />
          <label className="label">Legenda (opcional, aplicada a todas)</label>
          <input className="input" name="legenda" maxLength={200} />
          <button className="btn btn-primary btn-sm mt-2" type="submit">Enviar fotos</button>
        </FormAcao>
      </div>

      <div className="foto-grid">
        {fotos.length === 0 && <p className="muted">Nenhuma foto enviada ainda.</p>}
        {fotos.map((f, i) => (
          <div key={f.id} className="foto-item foto-item-admin">
            <Image src={`/api/arquivos/${f.arquivo_id}`} alt={f.legenda || ""} fill unoptimized sizes="(max-width: 700px) 50vw, 25vw" style={{ objectFit: "cover" }} />
            {i === 0 && <span className="badge badge-blue foto-capa-tag">capa</span>}
            <FormAcao action={excluirFoto} className="foto-excluir">
              <input type="hidden" name="id" value={f.id} />
              <input type="hidden" name="album_id" value={album.id} />
              <button className="btn btn-sm btn-danger" type="submit" aria-label="Excluir foto">Excluir</button>
            </FormAcao>
          </div>
        ))}
      </div>
    </>
  );
}
