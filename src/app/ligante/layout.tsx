import { exigirLigante } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import ManutencaoAviso from "@/components/ManutencaoAviso";
import { getConfig } from "@/lib/db";
import RegistroDePagina from "@/components/RegistroDePagina";

export const dynamic = "force-dynamic";

const ITENS = [
  { href: "/ligante", label: "Painel", icon: "▣" },
  { href: "/ligante/mural", label: "Mural", icon: "☰" },
  { href: "/ligante/presencas", label: "Presenças", icon: "✓" },
  { href: "/ligante/biblioteca", label: "Biblioteca", icon: "▤" },
  { href: "/ligante/simulados", label: "Simulados", icon: "◎" },
  { href: "/ligante/casos", label: "Casos Clínicos", icon: "✚" },
  { href: "/ligante/trilha", label: "Trilha", icon: "➤" },
  { href: "/ligante/certificado", label: "Certificado", icon: "❖" },
  { href: "/ligante/tickets", label: "Tickets", icon: "🗨" },
];

export default async function LiganteLayout({ children }: { children: React.ReactNode }) {
  const s = await exigirLigante();
  if (s.mustChange) redirect("/trocar-senha");
  const emManutencao = (await getConfig("site_status", "online")) === "manutencao";
  return (
    <AppShell titulo="ÁREA DO LIGANTE" nome={s.nome} itens={ITENS} logoutAction={logout}>
      <RegistroDePagina />
      {emManutencao ? <ManutencaoAviso /> : children}
    </AppShell>
  );
}
