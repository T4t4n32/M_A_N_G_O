import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AboutSection } from "@/components/AboutSection";
import { useSiteSeo } from "@/lib/siteSeo";

export default function Sobre() {
  useSiteSeo();

  return (
    <main className="min-h-screen bg-mango-dark">
      <Header />
      <div id="contenido" tabIndex={-1} />
      {/* No "volver al inicio" breadcrumb here — the header logo already
          navigates home (Header.tsx's onLogoClick), so this was a redundant
          second way to do the same thing, taking up space right under the
          nav on every visit. */}
      <div className="pt-28 lg:pt-32" />
      <AboutSection />
      <Footer />
    </main>
  );
}
