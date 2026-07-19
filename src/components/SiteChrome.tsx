import Link from "next/link";
import Image from "next/image";
import { getSessao } from "@/lib/auth";
import ECGLine from "./ECGLine";
import ScrollHeartbeat from "./ScrollHeartbeat";

export async function Navbar() {
  const sessao = await getSessao();
  const area = sessao ? (sessao.role === "diretoria" ? "/diretoria" : "/ligante") : "/login";
  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link href="/" className="flex" style={{ gap: 12 }}>
          <Image src="/logo.png" alt="LAMTUE" width={40} height={40} className="logo-ring" style={{ borderRadius: "50%" }} />
          <div>
            <div style={{ font: "700 17px var(--font-display)", letterSpacing: "0.12em" }}>LAMTUE</div>
            <div style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.05em" }}>URI ERECHIM · CAMED</div>
          </div>
        </Link>
        <nav className="nav-links">
          <Link className="nav-link" href="/#sobre">A Liga</Link>
          <Link className="nav-link" href="/seletivo">Processo Seletivo</Link>
          <Link className="nav-link" href="/calendario">Calendário</Link>
          <Link className="nav-link" href="/extensao">Extensão</Link>
          <Link className="nav-link" href="/casos">Casos Clínicos</Link>
          <Link className="nav-link" href="/contato">Contato</Link>
          <Link className="btn btn-primary btn-sm" href={area}>
            {sessao ? "Minha área" : "Entrar"}
          </Link>
        </nav>
      </div>
      <ScrollHeartbeat />
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <ECGLine color="rgba(226,83,111,0.5)" height={40} />
      <div className="container mt-3" style={{ display: "flex", flexWrap: "wrap", gap: 30, justifyContent: "space-between" }}>
        <div style={{ maxWidth: 380 }}>
          <div style={{ font: "700 18px var(--font-display)", letterSpacing: "0.12em" }}>LAMTUE</div>
          <p className="small mt-1">
            Liga Acadêmica de Medicina de Trauma, Urgência e Emergência da Universidade Regional
            Integrada do Alto Uruguai e das Missões — campus Erechim/RS, vinculada ao CAMED.
          </p>
        </div>
        <div className="small">
          <div style={{ fontWeight: 700, color: "var(--text-2)", marginBottom: 8 }}>Navegação</div>
          <div style={{ display: "grid", gap: 5 }}>
            <Link href="/seletivo">Processo Seletivo</Link>
            <Link href="/calendario">Calendário</Link>
            <Link href="/casos">Casos Clínicos</Link>
            <Link href="/contato">Contato</Link>
          </div>
        </div>
        <div className="small">
          <div style={{ fontWeight: 700, color: "var(--text-2)", marginBottom: 8 }}>Acesso</div>
          <div style={{ display: "grid", gap: 5 }}>
            <Link href="/login">Área do Ligante</Link>
            <Link href="/login">Área da Diretoria</Link>
          </div>
        </div>
      </div>
      <div className="container small mt-3" style={{ borderTop: "1px solid var(--border)", paddingTop: 18 }}>
        © {new Date().getFullYear()} LAMTUE — Gestão 2026–2027 · Portal oficial
      </div>
    </footer>
  );
}
