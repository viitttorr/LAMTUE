import { exigirLigante } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import CasoPlayer from "@/components/CasoPlayer";

export default async function CasoInterativoPage({ params }: { params: Promise<{ id: string }> }) {
  await exigirLigante();
  const { id } = await params;
  const caso = (await db().prepare("SELECT * FROM casos WHERE id = ?").get(Number(id))) as
    | { id: number; titulo: string; tema: string; contexto: string; etapas: string } | undefined;
  if (!caso) notFound();

  return (
    <>
      <span className="badge badge-red">{caso.tema}</span>
      <h1 className="page-title" style={{ marginTop: 10 }}>{caso.titulo}</h1>
      <p className="page-sub">Tome as decisões como se estivesse conduzindo o atendimento.</p>
      <CasoPlayer casoId={caso.id} contexto={caso.contexto} etapas={JSON.parse(caso.etapas)} />
    </>
  );
}
