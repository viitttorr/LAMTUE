import { Navbar, Footer } from "@/components/SiteChrome";
import IntroLoader from "@/components/IntroLoader";
import PageTransition from "@/components/PageTransition";
import SiteAtmosphere from "@/components/SiteAtmosphere";
import SpineBackground from "@/components/SpineBackground";
import ManutencaoAviso from "@/components/ManutencaoAviso";
import { getConfig } from "@/lib/db";
import { getSessao } from "@/lib/auth";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [status, sessao] = await Promise.all([getConfig("site_status", "online"), getSessao()]);
  const emManutencao = status === "manutencao" && sessao?.role !== "diretoria";
  return (
    <>
      <IntroLoader />
      <PageTransition />
      <SiteAtmosphere />
      <SpineBackground />
      <Navbar />
      <main>{emManutencao ? <ManutencaoAviso /> : children}</main>
      <Footer />
    </>
  );
}
