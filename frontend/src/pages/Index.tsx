import { lazy, Suspense, useEffect } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { Footer } from "@/components/Footer";
import { ScrollReveal } from "@/components/ScrollReveal";
import { useSiteSeo } from "@/lib/siteSeo";
import { syncFromPublished } from "@/lib/siteContent";
import { useLiveEdit } from "@/contexts/LiveEditContext";

// Lazy-load all heavy sections — none are needed for first paint
const ProjectSection = lazy(() =>
  import("@/components/ProjectSection").then((m) => ({ default: m.ProjectSection }))
);
const DocumentationSection = lazy(() =>
  import("@/components/DocumentationSection").then((m) => ({ default: m.DocumentationSection }))
);
const GallerySection = lazy(() =>
  import("@/components/GallerySection").then((m) => ({ default: m.GallerySection }))
);
const AboutSection = lazy(() =>
  import("@/components/AboutSection").then((m) => ({ default: m.AboutSection }))
);
const ContactSection = lazy(() =>
  import("@/components/ContactSection").then((m) => ({ default: m.ContactSection }))
);

/** Hairline gradient separator — marks section boundaries without creating a visual gap */
function SectionLine({ variant = "teal" }: { variant?: "teal" | "blue" | "gold" }) {
  const stop = {
    teal: "rgba(0,201,167,0.30)",
    blue: "rgba(56,189,248,0.26)",
    gold: "rgba(250,204,21,0.24)",
  }[variant];

  return (
    <div
      className="h-px w-full pointer-events-none"
      style={{ background: `linear-gradient(90deg, transparent 0%, ${stop} 35%, ${stop} 65%, transparent 100%)` }}
      aria-hidden="true"
    />
  );
}

const SectionFallback = () => (
  <div className="py-20 flex justify-center">
    <div className="w-8 h-8 border-2 border-white/20 border-t-accent rounded-full animate-spin" />
  </div>
);

const Index = () => {
  useSiteSeo();
  const { isEditMode } = useLiveEdit();

  // Sync published content from backend into localStorage so all visitors
  // see the latest text. Skip during live edit to preserve unsaved drafts.
  useEffect(() => {
    if (!isEditMode) {
      syncFromPublished();
    }
  }, [isEditMode]);

  return (
    <main className="min-h-screen bg-mango-dark">
      <Header />
      <div id="contenido" tabIndex={-1} />
      <HeroSection />

      <Suspense fallback={<SectionFallback />}>
        <ProjectSection />
      </Suspense>

      <SectionLine variant="blue" />

      <Suspense fallback={<SectionFallback />}>
        <ScrollReveal variant="fade-up" delay={0.1}>
          <DocumentationSection />
        </ScrollReveal>
      </Suspense>

      <SectionLine variant="teal" />

      <Suspense fallback={<SectionFallback />}>
        <ScrollReveal variant="scale">
          <GallerySection />
        </ScrollReveal>
      </Suspense>

      <SectionLine variant="gold" />

      <Suspense fallback={<SectionFallback />}>
        <ScrollReveal variant="fade-up">
          <AboutSection />
        </ScrollReveal>
      </Suspense>

      <SectionLine variant="blue" />

      <Suspense fallback={<SectionFallback />}>
        <ScrollReveal variant="fade-up" delay={0.1}>
          <ContactSection />
        </ScrollReveal>
      </Suspense>

      <Footer />
    </main>
  );
};

export default Index;
