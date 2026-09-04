import { lazy, Suspense, useEffect } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { Footer } from "@/components/Footer";
import { TechStackBanner } from "@/components/TechStackBanner";
import { ScrollReveal } from "@/components/ScrollReveal";
import { ApertureDivider } from "@/components/effects/ApertureDivider";
import { useSiteSeo } from "@/lib/siteSeo";
import { syncFromPublished } from "@/lib/siteContent";
import { useLiveEdit } from "@/contexts/LiveEditContext";
import { useScrollToHash } from "@/hooks/useScrollToHash";

// Lazy-load all heavy sections — none are needed for first paint
const ProjectSection = lazy(() =>
  import("@/components/ProjectSection").then((m) => ({ default: m.ProjectSection }))
);
const ContactSection = lazy(() =>
  import("@/components/ContactSection").then((m) => ({ default: m.ContactSection }))
);

// Galería y Sobre now live at their own routes (/galeria, /sobre); the landing
// only shows a lightweight teaser for each. Documentación fue retirada del
// sitio público bajo el Protocolo Legal.
const GalleryTeaser = lazy(() =>
  import("@/components/teasers/GalleryTeaser").then((m) => ({ default: m.GalleryTeaser }))
);
const AboutTeaser = lazy(() =>
  import("@/components/teasers/AboutTeaser").then((m) => ({ default: m.AboutTeaser }))
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
  useScrollToHash();
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

      {/* Proyecto → Galería: the one seam on the page where the content itself
          changes shape (boxed project cards → full-bleed gallery strip), so it
          gets its own graduated transition instead of the plain SectionLine
          hairline used everywhere else. */}
      <ApertureDivider fromColor="hsl(210,38%,6%)" toColor="hsl(213,40%,7%)" glowColor="rgba(250,204,21,0.55)" />

      <Suspense fallback={<SectionFallback />}>
        <ScrollReveal variant="scale">
          <GalleryTeaser />
        </ScrollReveal>
      </Suspense>

      <SectionLine variant="gold" />

      <Suspense fallback={<SectionFallback />}>
        <ScrollReveal variant="fade-up">
          <AboutTeaser />
        </ScrollReveal>
      </Suspense>

      <SectionLine variant="blue" />

      <Suspense fallback={<SectionFallback />}>
        <ScrollReveal variant="fade-up" delay={0.1}>
          <ContactSection />
        </ScrollReveal>
      </Suspense>

      {/* Same background as ContactSection right above (hsl(210,38%,6%)) —
          <main>'s own bg-mango-dark is a slightly different shade
          (hsl(210,35%,8%)), which read as a visible seam right where this
          region starts. Neither TechStackBanner nor Footer paint their own
          fill, so this one flat color is the only backdrop behind both,
          all the way to the bottom of the page — no seam between them
          either. */}
      <div className="bg-[hsl(210,38%,6%)]">
        {/* Landing-page-only — a real DOM sibling of <Footer>, not part of
            it, so it never appears on /galeria, /sobre, etc. and the footer
            growing/shrinking on those pages can't move it. */}
        <div className="pt-4 pb-6 md:pb-10">
          <TechStackBanner />
        </div>

        <Footer />
      </div>
    </main>
  );
};

export default Index;
