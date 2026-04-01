import { lazy, Suspense } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ProjectSection } from "@/components/ProjectSection";
import { Footer } from "@/components/Footer";
import { ScrollReveal } from "@/components/ScrollReveal";

// Lazy-load heavy sections (large image arrays, GSAP masonry, etc.)
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

/** Minimal divider — pure CSS, zero JS */
function WaveDivider({ variant = "teal" }: { variant?: "teal" | "blue" | "gold" }) {
  const colors = {
    teal: "hsl(168 72% 42%)",
    blue: "hsl(204 70% 53%)",
    gold: "hsl(50 90% 58%)",
  }[variant];

  return (
    <div className="relative h-16 md:h-20 bg-mango-dark -mt-1 -mb-1 overflow-hidden" aria-hidden="true">
      <div
        className="absolute left-1/2 -translate-x-1/2 top-1/2 w-[60%] max-w-xl h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${colors} / 0.15, transparent)`,
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
        style={{
          background: `${colors} / 0.4`,
          boxShadow: `0 0 12px 4px ${colors} / 0.2`,
        }}
      />
    </div>
  );
}

const SectionFallback = () => (
  <div className="py-20 flex justify-center">
    <div className="w-8 h-8 border-2 border-white/20 border-t-accent rounded-full animate-spin" />
  </div>
);

const Index = () => {
  return (
    <main className="min-h-screen bg-mango-dark">
      <Header />
      <HeroSection />

      <WaveDivider variant="teal" />

      <ScrollReveal variant="fade-up">
        <ProjectSection />
      </ScrollReveal>

      <WaveDivider variant="blue" />

      <Suspense fallback={<SectionFallback />}>
        <ScrollReveal variant="fade-up" delay={0.1}>
          <DocumentationSection />
        </ScrollReveal>
      </Suspense>

      <WaveDivider variant="teal" />

      <Suspense fallback={<SectionFallback />}>
        <ScrollReveal variant="scale">
          <GallerySection />
        </ScrollReveal>
      </Suspense>

      <WaveDivider variant="gold" />

      <Suspense fallback={<SectionFallback />}>
        <ScrollReveal variant="fade-up">
          <AboutSection />
        </ScrollReveal>
      </Suspense>

      <WaveDivider variant="blue" />

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
