import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { getSessao } from "@/lib/auth";
import Reveal from "@/components/Reveal";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function GaleriaPage() {
  const sessao = await getSessao();
  const filtro = sessao ? "" : "WHERE a.visibilidade = 'publico'";
  const albuns = (await db().prepare(
    `SELECT a.id, a.titulo, a.descricao, a.data, a.visibilidade,
            (SELECT COUNT(*) FROM galeria_fotos f WHERE f.album_id = a.id) AS total_fotos,
            (SELECT f.arquivo_id FROM galeria_fotos f WHERE f.album_id = a.id ORDER BY f.id ASC LIMIT 1) AS capa_id
     FROM galeria_albuns a
     ${filtro}
     ORDER BY a.data DESC, a.id DESC`
  ).all()) as {
    id: number; titulo: string; descricao: string | null; data: string | null;
    visibilidade: string; total_fotos: number; capa_id: number | null;
  }[];
  const comFotos = albuns.filter((a) => a.total_fotos > 0);

  return (
    <div className="container" style={{ padding: "60px 24px 20px" }}>
      <div className="page-panel">
        <PageHeader eyebrow="Registro visual" titulo="Galeria">
          <p className="muted" style={{ maxWidth: 700 }}>
            Fotos dos eventos, simulações e ações da LAMTUE, organizadas por álbum.
          </p>
        </PageHeader>

        <div className="album-grid mt-3">
          {comFotos.length === 0 && <p className="muted">Nenhum álbum publicado no momento.</p>}
          {comFotos.map((a, i) => (
            <Reveal key={a.id} delay={i * 70}>
              <Link href={`/galeria/${a.id}`} className="card hoverable album-card">
                <div className="album-capa">
                  {a.capa_id ? (
                    <Image src={`/api/arquivos/${a.capa_id}`} alt="" fill unoptimized sizes="(max-width: 700px) 100vw, 33vw" style={{ objectFit: "cover" }} />
                  ) : (
                    <div className="album-capa-vazia" />
                  )}
                  {a.visibilidade === "ligantes" && <span className="badge badge-blue album-badge">Ligantes</span>}
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <strong style={{ fontFamily: "var(--font-display)" }}>{a.titulo}</strong>
                  <div className="small mt-1">{a.total_fotos} foto{a.total_fotos === 1 ? "" : "s"}</div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
