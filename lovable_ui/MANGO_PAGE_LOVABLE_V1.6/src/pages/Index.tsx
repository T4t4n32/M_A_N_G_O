import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ProjectSection } from "@/components/ProjectSection";
import { DocumentationSection } from "@/components/DocumentationSection";
import { GallerySection } from "@/components/GallerySection";
import { AboutSection } from "@/components/AboutSection";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";
import { ScrollReveal } from "@/components/ScrollReveal";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <ScrollReveal variant="fade-up">
        <ProjectSection />
      </ScrollReveal>
      <ScrollReveal variant="fade-up" delay={0.1}>
        <DocumentationSection />
      </ScrollReveal>
      <ScrollReveal variant="scale">
        <GallerySection />
      </ScrollReveal>
      <ScrollReveal variant="fade-up">
        <AboutSection />
      </ScrollReveal>
      <ScrollReveal variant="fade-up" delay={0.1}>
        <ContactSection />
      </ScrollReveal>
      <ScrollReveal variant="fade-up" delay={0.05}>
        <Footer />
      </ScrollReveal>
    </main>
  );
};

export default Index;
