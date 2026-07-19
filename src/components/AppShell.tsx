"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string; icon: string };

export default function AppShell({
  titulo, nome, cargo, itens, children, logoutAction,
}: {
  titulo: string;
  nome: string;
  cargo?: string | null;
  itens: NavItem[];
  children: React.ReactNode;
  logoutAction: () => Promise<void>;
}) {
  const path = usePathname();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="flex" style={{ gap: 10, padding: "4px 10px 18px" }}>
          <Image src="/logo.png" alt="LAMTUE" width={36} height={36} style={{ borderRadius: "50%" }} className="logo-ring" />
          <div>
            <div style={{ font: "700 15px var(--font-display)", letterSpacing: "0.1em" }}>LAMTUE</div>
            <div style={{ fontSize: 10, color: "var(--text-3)" }}>{titulo}</div>
          </div>
        </Link>
        {itens.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className={`side-link ${path === i.href || (i.href !== itens[0].href && path.startsWith(i.href)) ? "active" : ""}`}
          >
            <span style={{ width: 18, textAlign: "center", opacity: 0.9 }}>{i.icon}</span>
            {i.label}
          </Link>
        ))}
        <div style={{ marginTop: 18, padding: "14px 10px", borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{nome}</div>
          {cargo && <div className="small">{cargo}</div>}
          <div className="flex mt-1" style={{ gap: 8 }}>
            <Link href="/trocar-senha" className="small" style={{ color: "var(--blue)" }}>Trocar senha</Link>
            <form action={logoutAction}>
              <button className="small" style={{ background: "none", border: "none", color: "var(--red-bright)", cursor: "pointer", fontFamily: "inherit" }}>
                Sair
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main className="app-main">{children}</main>
    </div>
  );
}
