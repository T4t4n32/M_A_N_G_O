import { useEffect, useRef, useState } from "react";
import { useScroll, useTransform, motion } from "framer-motion";
import Autoplay from "embla-carousel-autoplay";
import { FileText, Youtube } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import DecryptedText from "@/components/effects/DecryptedText";
import GradientText from "@/components/effects/GradientText";
import liderFoto from "@/assets/lider-foto.jpg";
import { useSiteValue } from "@/lib/siteContent";
import { parseValue, useResolvedSrc, useResolvedSrcs } from "@/lib/siteMedia";
import { Estanteria } from "./estanteria/Estanteria";
import { YOUTUBE_CHANNEL } from "./personasData";
import { seasons, milestones } from "./leaderData";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

function usePersonaPhotos() {
  const overrideRaw = useSiteValue("about.leader.photo", "");
  const overrideParsed = overrideRaw ? parseValue(overrideRaw) : null;
  const overrideDesc = Array.isArray(overrideParsed) ? overrideParsed[0] ?? null : overrideParsed;
  const overrideSrc = useResolvedSrc(overrideDesc);

  // Real gallery already established for this section ("Galería del
  // Desarrollador Principal", editable in Panel Emma) — reused here as the
  // carousel's extra slides instead of inventing new photos. That field
  // also accepts video/3D, which a plain <img> carousel can't render, so
  // only the image entries are pulled in here.
  const galleryRaw = useSiteValue("about.vision.media", "");
  const galleryParsed = galleryRaw ? parseValue(galleryRaw) : null;
  const galleryAll = Array.isArray(galleryParsed) ? galleryParsed : galleryParsed ? [galleryParsed] : [];
  const galleryDescs = galleryAll.filter((d) => d.type === "image");
  const gallery = useResolvedSrcs(galleryDescs);

  const first = { src: overrideSrc || liderFoto, alt: overrideDesc?.alt || "Sebastián Sánchez Chacón" };
  return [first, ...gallery];
}

function Bio() {
  const extraDescription = useSiteValue("about.vision.description", "");
  const seasonsCount = seasons.length;
  const milestonesCount = milestones.length;

  return (
    <div className="space-y-5 text-center md:text-left">
      <span className="text-accent text-xs font-bold uppercase tracking-[0.25em]">Sobre el proyecto</span>
      <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
        <DecryptedText
          text="Sebastián Sánchez Chacón"
          speed={35}
          maxIterations={6}
          animateOn="view"
          className="text-white"
          encryptedClassName="text-accent/30"
        />
      </h2>
      <GradientText
        className="text-base md:text-lg font-medium"
        colors={["#00c9a7", "#38bdf8", "#c084fc", "#00c9a7"]}
        animationSpeed={6}
      >
        Líder de Desarrollo — M.A.N.G.O
      </GradientText>

      <p className="text-white/60 text-sm md:text-base leading-relaxed max-w-xl mx-auto md:mx-0">
        Estudiante y líder técnico con una trayectoria forjada en competencias de robótica a nivel
        nacional e internacional. Combina electrónica, programación y visión ambiental para desarrollar
        tecnología con propósito.
        {extraDescription ? ` ${extraDescription}` : ""}
      </p>

      <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-3 gap-y-1 text-[11px] font-mono uppercase tracking-wide text-white/40">
        <span>{seasonsCount} temporadas FLL</span>
        <span aria-hidden="true">·</span>
        <span>{milestonesCount} hitos</span>
        <span aria-hidden="true">·</span>
        <span>Cali, Colombia</span>
      </div>

      <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-1">
        <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-6 gap-2">
          <a href="/documentacion">
            <FileText className="h-4 w-4" /> Ver Documentación
          </a>
        </Button>
        <Button asChild variant="outline" className="rounded-full px-6 gap-2 border-white/15 text-white/80 hover:bg-white/5">
          <a href={YOUTUBE_CHANNEL} target="_blank" rel="noopener noreferrer">
            <Youtube className="h-4 w-4" /> Ver Canal
          </a>
        </Button>
      </div>
    </div>
  );
}

function PhotoCarousel({ slides }: { slides: { src: string; alt: string }[] }) {
  return (
    <Carousel className="w-full" opts={{ loop: slides.length > 1 }} plugins={slides.length > 1 ? [Autoplay({ delay: 2000, stopOnInteraction: false, stopOnMouseEnter: true })] : []}>
      <CarouselContent>
        {slides.map((s, i) => (
          <CarouselItem key={i}>
            <div className="relative aspect-[4/5] rounded-[22px] overflow-hidden ring-[1.5px] ring-white/80">
              <img src={s.src} alt={s.alt} className="w-full h-full object-cover" loading={i === 0 ? "eager" : "lazy"} />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <span className="text-[10px] font-mono text-white/80 bg-black/40 backdrop-blur px-2 py-1 rounded-full">
                  {i + 1}/{slides.length}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-white/80">
                  Desarrollador Principal
                </span>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}

function LibraryHeading() {
  return (
    <div className="mb-6">
      <h3 className="text-white/85 text-xl md:text-2xl font-bold">Librería</h3>
      <p className="text-white/40 text-sm">Los libros que cuentan el camino del equipo</p>
    </div>
  );
}

/**
 * The Drawer Cards (ex-"Piso 1": Inicios/Visión/Reconocimientos — Formación
 * was dropped, see personasData.ts) render inside Estanteria itself now, as
 * a row within the same bordered shelf panel as the book floors, instead of
 * a separate column beside it — they read as part of the shelf, not
 * floating next to it.
 */
function LibrarySection() {
  return (
    <div>
      <LibraryHeading />
      <Estanteria />
    </div>
  );
}

/**
 * Desktop-only: the hero (bio + photo carousel) pins for one viewport's
 * worth of scroll and fades/scales away, then releases naturally into
 * LibrarySection below — a single fade axis on one self-contained block,
 * not a crossfade between two competing pieces of content. LibrarySection
 * is never inside the pinned box and is never opacity/clip-gated by scroll
 * progress, so it's always fully visible once you scroll to it.
 */
function PinnedHero({ slides }: { slides: { src: string; alt: string }[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);
  const pointerEvents = useTransform(scrollYProgress, (v) => (v > 0.85 ? "none" : "auto"));

  return (
    <div ref={containerRef} className="relative" style={{ height: "160vh" }}>
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <motion.div
          style={{ opacity, scale, pointerEvents }}
          className="w-full grid md:grid-cols-2 gap-10 items-center"
        >
          <Bio />
          <PhotoCarousel slides={slides} />
        </motion.div>
      </div>
    </div>
  );
}

export function PersonasHero() {
  const slides = usePersonaPhotos();
  const isMobile = useIsMobile();

  if (isMobile) {
    // No pin, no two-column stickiness: there's no real hover on touch, and
    // pinning a touch scroll doesn't make sense — everything just stacks.
    return (
      <div className="space-y-14 py-4">
        <div className="grid gap-8">
          <Bio />
          <PhotoCarousel slides={slides} />
        </div>
        <LibrarySection />
      </div>
    );
  }

  return (
    <div>
      <PinnedHero slides={slides} />
      <LibrarySection />
    </div>
  );
}
