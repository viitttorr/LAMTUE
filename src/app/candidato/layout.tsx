import { exigirCandidato } from "@/lib/auth";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions/auth";
import AppShell from "@/components/AppShell";

export const dynamic = "force-dynamic";

const ITENS = [
  { href: "/candidato", label: "Painel", icon: "▣" },
  { href: "/candidato/mural", label: "Mural", icon: "☰" },
  { href: "/candidato/presencas", label: "Presenças", icon: "✓" },
  { href: "/candidato/biblioteca", label: "Biblioteca", icon: "▤" },
  { href: "/candidato/simulados", label: "Simulados", icon: "◎" },
  { href: "/candidato/casos", label: "Casos Clínicos", icon: "✚" },
  { href: "/candidato/trilha", label: "Trilha", icon: "➤" },
  { href: "/candidato/certificado", label: "Certificado", icon: "❖" },
];

export default async function CandidatoLayout({ children }: { children: React.ReactNode }) {
  const s = await exigirCandidato();
  if (s.mustChange) redirect("/trocar-senha");
  return (
    <AppShell titulo="PROCESSO SELETIVO" nome={s.nome} itens={ITENS} logoutAction={logout}>
      {children}
    </AppShell>
  );
}
