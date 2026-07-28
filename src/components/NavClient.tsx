"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ScrollHeartbeat from "./ScrollHeartbeat";

const LINKS = [
  { href: "/#sobre", label: "A Liga" },
  { href: "/seletivo", label: "Processo Seletivo" },
  { href: "/calendario", label: "Calendário" },
  { href: "/extensao", label: "Extensão" },
  { href: "/galeria", label: "Galeria" },
  { href: "/contato", label: "Contato" },
];

/**
 * Menu institucional fixo: mesmos itens e destinos de sempre, com indicação
 * da página ativa, fundo que se adensa após o scroll, altura levemente
 * reduzida e gaveta acessível no celular.
 */
export default function NavClient({ area, entrarLabel }: { area: string; entrarLabel: string }) {
  const pathname = usePathname();
  const [rolou, setRolou] = useState(false);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    const onScroll = () => setRolou(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setAberto(false); }, [pathname]);

  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setAberto(false); };
    document.addEventListener("keydown", onKey);
    document.documentElement.classList.add("drawer-lock");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("drawer-lock");
    };
  }, [aberto]);

  const ativo = (href: string) => {
    const alvo = href.split("#")[0] || "/";
    return alvo === "/" ? pathname === "/" : pathname.startsWith(alvo);
  };

  const itens = (
    <>
      {LINKS.map((l) => (
        <Link
          key={l.href}
          className={`nav-link${ativo(l.href) ? " active" : ""}`}
          aria-current={ativo(l.href) ? "page" : undefined}
          href={l.href}
        >
          {l.label}
        </Link>
      ))}
      <Link className="btn btn-primary btn-sm" href={area}>{entrarLabel}</Link>
    </>
  );

  return (
    <>
      <header className={`nav${rolou ? " scrolled" : ""}`}>
        <div className="container nav-inner">
          <Link href="/" className="flex" style={{ gap: 12 }} aria-label="LAMTUE — página inicial">
            <Image src="/logo.png" alt="LAMTUE" width={40} height={40} className="logo-ring" style={{ borderRadius: "50%" }} />
            <div>
              <div style={{ font: "700 17px var(--font-display)", letterSpacing: "0.12em" }}>LAMTUE</div>
              <div style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.05em" }}>URI ERECHIM · CAMED</div>
            </div>
          </Link>
          <nav className="nav-links" aria-label="Menu institucional">{itens}</nav>
          <button
            type="button"
            className="nav-burger"
            aria-expanded={aberto}
            aria-controls="menu-movel"
            aria-label={aberto ? "Fechar menu" : "Abrir menu"}
            onClick={() => setAberto((v) => !v)}
          >
            <span /><span /><span />
          </button>
        </div>
        <ScrollHeartbeat />
      </header>
      {/* fora do <header>: o backdrop-filter do header cria um containing
          block para os descendentes fixed, o que quebrava o inset da gaveta
          móvel (fundo e fechamento não apareciam) */}
      <div className={`nav-scrim${aberto ? " open" : ""}`} onClick={() => setAberto(false)} aria-hidden />
      <nav id="menu-movel" className={`nav-drawer${aberto ? " open" : ""}`} aria-label="Menu institucional">
        <button type="button" className="nav-drawer-close" aria-label="Fechar menu" onClick={() => setAberto(false)}>
          <span /><span />
        </button>
        {itens}
      </nav>
    </>
  );
}
