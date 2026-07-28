import { redirect } from "next/navigation";
import { getSessao } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Encaminha o caso avulso para a versão interativa da área logada. */
export default async function CasoPublicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = await getSessao();
  if (!sessao) redirect("/login?destino=casos");
  redirect(sessao.role === "diretoria" ? "/diretoria/casos" : `/ligante/casos/${id}`);
}
