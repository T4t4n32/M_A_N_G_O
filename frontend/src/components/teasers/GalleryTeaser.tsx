import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import DecryptedText from "@/components/effects/DecryptedText";
import { GalleryProcessCards } from "./GalleryProcessCards";
import { Button } from "@/components/ui/button";

export function GalleryTeaser() {
  const navigate = useNavigate();

  const goToGallery = () => {
    navigate("/galeria");
    window.scrollTo({ top: 0 });
  };

  return (
    // Unlike every other landing-page section, this one isn't boxed in a
    // bordered card — the header stays a plain centered block (per the
    // liquid-glass UI/UX brief) and the two process/campo cards below carry
    // the section's full-bleed-adjacent, rounded, glassmorphic feel.
    <section id="galeria" className="relative py-16 md:py-20 overflow-hidden" style={{ background: "hsl(213,40%,7%)" }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-8 right-[8%] w-[420px] h-[320px] bg-[hsl(45,90%,55%)] opacity-[0.05] blur-[130px] rounded-full" />
        <div className="absolute bottom-0 left-[12%] w-[360px] h-[260px] bg-[hsl(168,72%,42%)] opacity-[0.04] blur-[110px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
        <span className="text-sm font-medium uppercase tracking-widest text-white/40">
          Registro visual
        </span>
        <h2 className="mt-3 text-5xl md:text-6xl font-serif font-bold leading-tight tracking-tight text-white">
          <DecryptedText
            text="Del taller al manglar"
            speed={40}
            maxIterations={8}
            animateOn="view"
            className="text-white"
            encryptedClassName="text-amber-400/40"
          />
        </h2>
      </div>

      <div className="mt-10 md:mt-14 relative">
        <GalleryProcessCards />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative mt-10 flex justify-center">
        <Button
          onClick={goToGallery}
          size="lg"
          className="group bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-8 py-6 text-base font-semibold gap-2 shadow-lg shadow-amber-400/10 hover:shadow-amber-400/20 transition-shadow"
        >
          Ver todas las fotos
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </section>
  );
}
