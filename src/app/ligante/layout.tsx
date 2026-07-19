import { exigirLigante } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";

export const dynamic = "force-dynamic";

const ITENS = [
  { href: "/ligante", label: "Painel", icon: "▣" },
  { href: "/ligante/presencas", label: "Presenças", icon: "✓" },
  { href: "/ligante/biblioteca", label: "Biblioteca", icon: "▤" },
  { href: "/ligante/simulados", label: "Simulados", icon: "◎" },
  { href: "/ligante/casos", label: "Casos Clínicos", icon: "✚" },
  { href: "/ligante/trilha", label: "Trilha", icon: "➤" },
  { href: "/ligante/certificado", label: "Certificado", icon: "❖" },
  { href: "/ligante/mural", label: "Mural", icon: "☰" },
];

export default async function LiganteLayout({ children }: { children: React.ReactNode }) {
  const s = await exigirLigante();
  if (s.mustChange) redirect("/trocar-senha");
  return (
    <AppShell titulo="ÁREA DO LIGANTE" nome={s.nome} itens={ITENS} logoutAction={logout}>
      {children}
    </AppShell>
  );
}
