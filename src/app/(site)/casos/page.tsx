import { redirect } from "next/navigation";
import { getSessao } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Casos Clínicos migraram para a área logada — este link antigo só encaminha. */
export default async function CasosPublicosPage() {
  const sessao = await getSessao();
  if (!sessao) redirect("/login?destino=casos");
  redirect(sessao.role === "diretoria" ? "/diretoria/casos" : "/ligante/casos");
}
