import Link from "next/link";
import Image from "next/image";
import { exigirGaleria } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtData } from "@/lib/util";
import { criarAlbum } from "@/app/actions/diretoria";
import FormAcao from "@/components/FormAcao";

export default async function GaleriaAdminPage() {
  await exigirGaleria();
  const albuns = (await db().prepare(
    `SELECT a.id, a.titulo, a.data, a.visibilidade,
            (SELECT COUNT(*) FROM galeria_fotos f WHERE f.album_id = a.id) AS total_fotos,
            (SELECT f.arquivo_id FROM galeria_fotos f WHERE f.album_id = a.id ORDER BY f.id ASC LIMIT 1) AS capa_id
     FROM galeria_albuns a ORDER BY a.id DESC`
  ).all()) as { id: number; titulo: string; data: string | null; visibilidade: string; total_fotos: number; capa_id: number | null }[];

  return (
    <>
      <h1 className="page-title">Gestão de Galeria</h1>
      <p className="page-sub">Álbuns por evento — fotos publicadas aqui aparecem em /galeria para o público (ou só para ligantes, conforme a visibilidade).</p>

      <div className="card mb-3">
        <h3 style={{ fontSize: 16 }}>Novo álbum</h3>
        <FormAcao action={criarAlbum}>
          <div className="grid3" style={{ gap: 12 }}>
            <div><label className="label">Título *</label><input className="input" name="titulo" required /></div>
            <div><label className="label">Data</label><input className="input" type="date" name="data" /></div>
            <div>
              <label className="label">Visibilidade</label>
              <select className="input" name="visibilidade" defaultValue="publico">
                <option value="publico">Pública (site)</option>
                <option value="ligantes">Apenas ligantes</option>
              </select>
            </div>
          </div>
          <label className="label">Descrição</label>
          <textarea className="input" name="descricao" rows={2} />
          <button className="btn btn-primary btn-sm mt-2" type="submit">Criar álbum</button>
        </FormAcao>
      </div>

      <div className="album-grid">
        {albuns.length === 0 && <p className="muted">Nenhum álbum cadastrado ainda.</p>}
        {albuns.map((a) => (
          <Link key={a.id} href={`/diretoria/galeria/${a.id}`} className="card hoverable album-card">
            <div className="album-capa">
              {a.capa_id ? (
                <Image src={`/api/arquivos/${a.capa_id}`} alt="" fill unoptimized sizes="(max-width: 700px) 100vw, 33vw" style={{ objectFit: "cover" }} />
              ) : (
                <div className="album-capa-vazia" />
              )}
              <span className={`badge ${a.visibilidade === "publico" ? "badge-blue" : ""} album-badge`}>
                {a.visibilidade === "publico" ? "Pública" : "Ligantes"}
              </span>
            </div>
            <div style={{ padding: "14px 16px" }}>
              <strong style={{ fontFamily: "var(--font-display)" }}>{a.titulo}</strong>
              <div className="small mt-1">
                {a.total_fotos} foto{a.total_fotos === 1 ? "" : "s"}{a.data ? ` · ${fmtData(a.data)}` : ""}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
