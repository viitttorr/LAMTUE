import { Navbar, Footer } from "@/components/SiteChrome";
import IntroLoader from "@/components/IntroLoader";
import PageTransition from "@/components/PageTransition";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <IntroLoader />
      <PageTransition />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
