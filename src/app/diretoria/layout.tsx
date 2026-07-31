import { exigirDiretoria, podeGerenciarGaleria } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function DiretoriaLayout({ children }: { children: React.ReactNode }) {
  const s = await exigirDiretoria();
  if (s.mustChange) redirect("/trocar-senha");
  const itens = [
    { href: "/diretoria", label: "Dashboard", icon: "▣" },
    { href: "/diretoria/frequencia", label: "Frequência", icon: "✓" },
    { href: "/diretoria/ligantes", label: "Ligantes", icon: "☺" },
    { href: "/diretoria/aulas", label: "Aulas", icon: "▷" },
    { href: "/diretoria/materiais", label: "Materiais", icon: "▤" },
    { href: "/diretoria/questoes", label: "Questões", icon: "◎" },
    { href: "/diretoria/casos", label: "Casos Clínicos", icon: "✚" },
    { href: "/diretoria/seletivo", label: "Seletivo", icon: "✍" },
    { href: "/diretoria/notificacoes", label: "Notificações", icon: "✉" },
    { href: "/diretoria/tickets", label: "Tickets", icon: "🗨" },
    { href: "/diretoria/whatsapp", label: "WhatsApp", icon: "☏" },
    { href: "/diretoria/conteudo", label: "Site Público", icon: "☰" },
    { href: "/diretoria/relatorios", label: "Relatórios", icon: "▦" },
    ...(podeGerenciarGaleria(s) ? [{ href: "/diretoria/galeria", label: "Galeria", icon: "▧" }] : []),
    { href: "/diretoria/financeiro", label: "Financeiro", icon: "$" },
  ];
  return (
    <AppShell titulo="ÁREA DA DIRETORIA" nome={s.nome} cargo={s.cargo} itens={itens} logoutAction={logout}>
      {children}
    </AppShell>
  );
}
