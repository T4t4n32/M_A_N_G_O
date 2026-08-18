import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DocumentationSection } from "@/components/DocumentationSection";
import { useSiteSeo } from "@/lib/siteSeo";

export default function Documentacion() {
  useSiteSeo();

  return (
    <main className="min-h-screen bg-mango-dark">
      <Header />
      <div id="contenido" tabIndex={-1} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 lg:pt-32">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al inicio
        </Link>
      </div>
      <DocumentationSection />
      <Footer />
    </main>
  );
}
