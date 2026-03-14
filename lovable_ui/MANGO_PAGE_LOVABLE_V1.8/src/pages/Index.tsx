import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ProjectSection } from "@/components/ProjectSection";
import { DocumentationSection } from "@/components/DocumentationSection";
import { GallerySection } from "@/components/GallerySection";
import { AboutSection } from "@/components/AboutSection";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";
import { ScrollReveal } from "@/components/ScrollReveal";
import { ParallaxBackground } from "@/components/ParallaxBackground";

/** Subtle gradient divider that blends sections together */
function SectionDivider({ flip = false }: { flip?: boolean }) {
  return (
    <div
      className="h-24 md:h-32 bg-mango-dark relative -mt-1 -mb-1"
      aria-hidden="true"
    >
      <div
        className={`absolute inset-0 ${
          flip
            ? "bg-[radial-gradient(ellipse_at_60%_50%,hsl(168_72%_42%/0.04),transparent_60%)]"
            : "bg-[radial-gradient(ellipse_at_40%_50%,hsl(204_70%_53%/0.04),transparent_60%)]"
        }`}
      />
      {/* Faint horizontal line */}
      <div className="absolute left-1/2 -translate-x-1/2 top-1/2 w-[60%] max-w-xl h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
    </div>
  );
}

const Index = () => {
  return (
    <main className="min-h-screen bg-mango-dark relative">
      <ParallaxBackground />
      <div className="relative z-10">
      <Header />
      <HeroSection />

      <SectionDivider />

      <ScrollReveal variant="fade-up">
        <ProjectSection />
      </ScrollReveal>

      <SectionDivider flip />

      <ScrollReveal variant="fade-up" delay={0.1}>
        <DocumentationSection />
      </ScrollReveal>

      <SectionDivider />

      <ScrollReveal variant="scale">
        <GallerySection />
      </ScrollReveal>

      <SectionDivider flip />

      <ScrollReveal variant="fade-up">
        <AboutSection />
      </ScrollReveal>

      <SectionDivider />

      <ScrollReveal variant="fade-up" delay={0.1}>
        <ContactSection />
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={0.05}>
        <Footer />
      </ScrollReveal>
      </div>
    </main>
  );
};

export default Index;
