import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ProjectSection } from "@/components/ProjectSection";
import { DocumentationSection } from "@/components/DocumentationSection";
import { GallerySection } from "@/components/GallerySection";
import { AboutSection } from "@/components/AboutSection";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <ProjectSection />
      <DocumentationSection />
      <GallerySection />
      <AboutSection />
      <ContactSection />
      <Footer />
    </main>
  );
};

export default Index;
