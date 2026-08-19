import { FileText, Youtube } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import DecryptedText from "@/components/effects/DecryptedText";
import GradientText from "@/components/effects/GradientText";
import { ScrollReveal } from "@/components/ScrollReveal";
import liderFoto from "@/assets/lider-foto.jpg";
import { useSiteValue } from "@/lib/siteContent";
import { parseValue, useResolvedSrc, useResolvedSrcs } from "@/lib/siteMedia";
import { DrawerCard } from "./DrawerCard";
import { Estanteria } from "./estanteria/Estanteria";
import { personasCards, YOUTUBE_CHANNEL } from "./personasData";
import { seasons, milestones } from "./leaderData";

const milestoneIdsByCard: Record<string, string[]> = {
  formacion: [],
  inicios: ["inicios", "robisoft"],
  vision: ["ecolatas"],
  reconocimientos: ["reconocimiento-electronica", "reconocimiento-houston"],
};

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
            <div className="relative aspect-[4/5] rounded-[22px] overflow-hidden ring-[1.5px] ring-white/[0.15]">
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
 * Personas — bio + real photo carousel, then Drawer Cards (Formación /
 * Inicios / Visión / Reconocimientos) + the Librería (Estantería). Plain
 * document flow throughout, revealed with the site's existing scroll-into-
 * view fade (ScrollReveal) rather than a pinned scroll-jacked morph: the
 * pin+crossfade version shipped a real bug (books not rendering visibly,
 * reported as a blank/black area) that isn't safely fixable without a
 * browser to verify against, so this trades the scripted transition for
 * something that reliably shows every book, at any shelf height, on any
 * device — no sticky pin, no inner scroll box, no clipping.
 */
export function PersonasHero() {
  const slides = usePersonaPhotos();

  return (
    <div className="space-y-16 md:space-y-20">
      <div className="grid md:grid-cols-2 gap-10 items-center">
        <Bio />
        <ScrollReveal variant="fade-up" delay={0.1}>
          <PhotoCarousel slides={slides} />
        </ScrollReveal>
      </div>

      <ScrollReveal variant="fade-up">
        <div className="grid md:grid-cols-[280px_1fr] gap-8 items-start">
          <div className="grid grid-cols-2 gap-3">
            {personasCards.map((c) => (
              <DrawerCard key={c.id} card={c} milestoneIds={milestoneIdsByCard[c.id]} />
            ))}
          </div>
          <div>
            <LibraryHeading />
            <Estanteria />
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
