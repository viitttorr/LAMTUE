import { Navbar, Footer } from "@/components/SiteChrome";
import IntroLoader from "@/components/IntroLoader";
import PageTransition from "@/components/PageTransition";
import SiteAtmosphere from "@/components/SiteAtmosphere";
import SpineBackground from "@/components/SpineBackground";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <IntroLoader />
      <PageTransition />
      <SiteAtmosphere />
      <SpineBackground />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
