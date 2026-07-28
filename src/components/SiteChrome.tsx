import Link from "next/link";
import { getSessao } from "@/lib/auth";
import ECGLine from "./ECGLine";
import NavClient from "./NavClient";

export async function Navbar() {
  const sessao = await getSessao();
  const area = sessao ? (sessao.role === "diretoria" ? "/diretoria" : "/ligante") : "/login";
  return <NavClient area={area} entrarLabel={sessao ? "Minha área" : "Entrar"} />;
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
            <Link href="/galeria">Galeria</Link>
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
