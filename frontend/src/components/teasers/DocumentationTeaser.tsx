import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Autoplay from "embla-carousel-autoplay";
import { docs } from "@/components/DocumentationSection";
import { RippleCta } from "@/components/effects/RippleCta";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

/** Real mangrove photography (Pexels — free license, no attribution required)
 *  used as backdrop imagery for the category cards and the CTA button. */
const MANGROVE_PHOTOS = {
  rootsInRiver: "https://images.pexels.com/photos/12708316/pexels-photo-12708316.jpeg?auto=compress&cs=tinysrgb&w=1600",
  aerialRiver: "https://images.pexels.com/photos/29137616/pexels-photo-29137616.jpeg?auto=compress&cs=tinysrgb&w=800",
  sunset: "https://images.pexels.com/photos/36405819/pexels-photo-36405819.jpeg?auto=compress&cs=tinysrgb&w=800",
  forest: "https://images.pexels.com/photos/13035525/pexels-photo-13035525.jpeg?auto=compress&cs=tinysrgb&w=800",
};
const CARD_PHOTOS = [MANGROVE_PHOTOS.rootsInRiver, MANGROVE_PHOTOS.aerialRiver, MANGROVE_PHOTOS.sunset, MANGROVE_PHOTOS.forest];

// lucide-react's actual path data (same icon set used across the rest of
// the site) rendered as inline SVG badges on each card.
const ICON_PATHS = {
  fileText: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  cpu: '<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>',
  clipboardList: '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
  presentation: '<path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m7 21 5-5 5 5"/>',
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>',
} as const;

const TEAL = "#00c9a7";
const BLUE = "#38bdf8";
const GOLD = "#fbbf24";

// Curated preview of the documentation library (the full set, including
// "Fuentes", stays browsable at /documentacion). Counts and formats are
// derived from the real `docs` catalog below — never hardcoded.
const CATEGORY_META = [
  { category: "Investigación", icon: ICON_PATHS.fileText, accent: TEAL, desc: "Base de investigación, revisión bibliográfica y viabilidad económica del proyecto." },
  { category: "Técnico", icon: ICON_PATHS.cpu, accent: BLUE, desc: "Arquitectura del sistema, seguridad, dashboard y despliegue del monitoreo." },
  { category: "Electrónica", icon: ICON_PATHS.cpu, accent: BLUE, desc: "Esquemas de circuito, sensores y comunicación LoRa del hardware M.A.N.G.O." },
  { category: "Bitácoras", icon: ICON_PATHS.clipboardList, accent: GOLD, desc: "Registro periódico de la etapa productiva SENA, bitácora a bitácora." },
  { category: "Presentaciones", icon: ICON_PATHS.presentation, accent: TEAL, desc: "Boards y formatos institucionales usados para presentar el proyecto." },
  { category: "Pitch", icon: ICON_PATHS.mic, accent: GOLD, desc: "Material de pitch para jurados, convocatorias y foros de innovación." },
] as const;

function CategoryIcon({ paths, accent }: { paths: string; accent: string }) {
  return (
    <span
      className="inline-flex items-center justify-center w-11 h-11 rounded-2xl shrink-0"
      style={{ background: `${accent}1f`, border: `1px solid ${accent}59` }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={accent}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        dangerouslySetInnerHTML={{ __html: paths }}
      />
    </span>
  );
}

export function DocumentationTeaser() {
  const navigate = useNavigate();
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  const [slideCount, setSlideCount] = useState(0);

  const { totalDocs, cards } = useMemo(() => {
    const list = CATEGORY_META.map((meta, i) => {
      const inCategory = docs.filter((d) => d.category === meta.category);
      const formats = [...new Set(inCategory.flatMap((d) => d.files.map((f) => f.label)))];
      return {
        ...meta,
        count: inCategory.length,
        formats,
        photo: CARD_PHOTOS[i % CARD_PHOTOS.length],
      };
    });
    return { totalDocs: docs.length, cards: list };
  }, []);

  // Track the active slide so the dot rail below the carousel stays in sync
  // with drag/arrow/autoplay navigation alike.
  useEffect(() => {
    if (!api) return;
    setSlideCount(api.scrollSnapList().length);
    setSelected(api.selectedScrollSnap());
    const onSelect = () => setSelected(api.selectedScrollSnap());
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => { api.off("select", onSelect); };
  }, [api]);

  // react-router doesn't reset scroll on navigate — without this, landing on
  // /documentacion keeps whatever scroll depth this teaser was viewed at,
  // so the new page renders scrolled past its own top instead of starting
  // clean (matches the pattern already used by Header/Footer route links).
  const goToDocs = () => {
    navigate("/documentacion");
    window.scrollTo({ top: 0 });
  };

  const goToCategory = (category: string) => {
    navigate(`/documentacion?categoria=${encodeURIComponent(category)}`);
    window.scrollTo({ top: 0 });
  };

  return (
    <section id="documentacion" className="py-20 md:py-28 bg-[hsl(210,38%,6%)] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-[15%] w-[500px] h-[400px] bg-[hsl(168,72%,42%)] opacity-[0.06] blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-[10%] w-[400px] h-[300px] bg-[hsl(195,70%,48%)] opacity-[0.06] blur-[100px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] text-teal-300 bg-[rgba(0,201,167,0.10)] border border-[rgba(0,201,167,0.25)]">
            Documentación
          </span>
          <h2 className="mt-4 text-3xl md:text-[38px] font-extrabold font-serif text-white">
            Documentación del Proyecto
          </h2>
          <p className="mt-3 text-sm text-white/50">
            {totalDocs} documentos públicos — investigación, bitácoras, presentaciones y fuentes técnicas, organizados por categoría.
          </p>
        </div>

        <Carousel
          setApi={setApi}
          opts={{ align: "start", loop: true }}
          plugins={[Autoplay({ delay: 4500, stopOnInteraction: true, stopOnMouseEnter: true })]}
          className="mt-10"
        >
          <CarouselContent>
            {cards.map((card) => (
              <CarouselItem key={card.category} className="sm:basis-1/2 lg:basis-1/3">
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`Ver documentación de ${card.category}`}
                  onClick={() => goToCategory(card.category)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" && e.key !== " ") return;
                    e.preventDefault();
                    goToCategory(card.category);
                  }}
                  className="h-full rounded-2xl bg-white/[0.045] border border-white/10 overflow-hidden cursor-pointer hover:border-white/20 hover:-translate-y-0.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <div className="relative aspect-[16/10]">
                    <img
                      src={card.photo}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[hsl(210,38%,6%)] via-transparent to-transparent" />
                    <div className="absolute left-4 -bottom-5">
                      <CategoryIcon paths={card.icon} accent={card.accent} />
                    </div>
                  </div>
                  <div className="p-5 pt-8">
                    <h3 className="font-serif font-bold text-lg text-white">{card.category}</h3>
                    <p className="mt-2 text-xs text-white/50 leading-relaxed">
                      {card.desc} {card.count} documento{card.count === 1 ? "" : "s"}.
                    </p>
                    {card.formats.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {card.formats.map((f) => (
                          <span
                            key={f}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] text-sky-300 bg-[rgba(56,189,248,0.10)]"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00c9a7]" />
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2 md:-left-4 bg-white/10 backdrop-blur-sm border-white/10 text-white hover:bg-white/20 hover:text-white" />
          <CarouselNext className="right-2 md:-right-4 bg-white/10 backdrop-blur-sm border-white/10 text-white hover:bg-white/20 hover:text-white" />
        </Carousel>

        {slideCount > 0 && (
          <div className="mt-5 flex justify-center gap-1.5" role="tablist" aria-label="Categorías de documentación">
            {Array.from({ length: slideCount }).map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === selected}
                aria-label={`Ir a la categoría ${i + 1}`}
                onClick={() => api?.scrollTo(i)}
                className={`h-1.5 rounded-full transition-all ${i === selected ? "w-6 bg-accent" : "w-1.5 bg-white/20 hover:bg-white/35"}`}
              />
            ))}
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <RippleCta
            label="Ver documentación completa"
            onActivate={goToDocs}
            backgroundImage={MANGROVE_PHOTOS.rootsInRiver}
          />
        </div>
      </div>
    </section>
  );
}
