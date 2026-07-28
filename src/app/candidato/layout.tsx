import { exigirCandidato } from "@/lib/auth";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions/auth";
import AppShell from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function CandidatoLayout({ children }: { children: React.ReactNode }) {
  const s = await exigirCandidato();
  if (s.mustChange) redirect("/trocar-senha");
  return (
    <AppShell titulo="PROCESSO SELETIVO" nome={s.nome} itens={[]} logoutAction={logout}>
      {children}
    </AppShell>
  );
}
