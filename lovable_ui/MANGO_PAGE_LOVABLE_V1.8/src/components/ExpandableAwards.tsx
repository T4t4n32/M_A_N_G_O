import { useState, useEffect, useCallback } from "react";
import { Trophy, MapPin, Lightbulb, Star, Medal, ChevronDown, Play, X, ChevronLeft, ChevronRight, Wrench } from "lucide-react";

interface MediaItem {
  type: "image" | "video";
  src: string;
  alt: string;
}

interface AwardItem {
  id: string;
  titulo: string;
  detalle: string;
  icon: typeof Trophy;
  media: MediaItem[];
}

const awards: AwardItem[] = [
  {
    id: "inicios",
    titulo: "Inicios en Robótica",
    detalle: "Programa Innovación Educativa (Scratch + SB-TDS) — Primer seguidor de línea",
    icon: Wrench,
    media: [
      { type: "image", src: "/images/gallery/leader/inicios_1.jpg", alt: "Ensamblando piezas con compañeros" },
      { type: "image", src: "/images/gallery/leader/inicios_2.jpg", alt: "Armando carro seguidor de línea" },
      { type: "image", src: "/images/gallery/leader/inicios_3.jpg", alt: "Soldadura y electrónica" },
      { type: "image", src: "/images/gallery/leader/inicios_4.jpg", alt: "Primer carro terminado" },
      { type: "image", src: "/images/gallery/leader/inicios_5.jpg", alt: "Ensamblando robot con herramientas" },
      { type: "image", src: "/images/gallery/leader/inicios_6.jpg", alt: "Probando seguidor de línea en pista" },
      { type: "image", src: "/images/gallery/leader/inicios_7.jpg", alt: "Exhibiendo robots terminados" },
      { type: "image", src: "/images/gallery/leader/inicios_8.jpg", alt: "Programa Scratch + SB-TDS — Certificación" },
      { type: "image", src: "/images/gallery/leader/inicios_9.jpg", alt: "Foto grupal con robots" },
      { type: "image", src: "/images/gallery/leader/inicios_10.jpg", alt: "Entrega de diplomas con instructor" },
      { type: "image", src: "/images/gallery/leader/inicios_11.jpg", alt: "Foto final del grupo" },
      { type: "video", src: "/images/gallery/leader/inicios_video_1.mp4", alt: "Video — Primeros pasos en robótica #1" },
      { type: "video", src: "/images/gallery/leader/inicios_video_2.mp4", alt: "Video — Primeros pasos en robótica #2" },
    ],
  },
  {
    id: "masterpiece",
    titulo: "1er Puesto Nacional FLL",
    detalle: "Masterpiece 2023-2024 — Bogotá",
    icon: Trophy,
    media: [
      { type: "image", src: "/images/gallery/leader/diploma_cargo_connect.jpg", alt: "Diploma FLL Cargo Connect — Nacional" },
    ],
  },
  {
    id: "representante",
    titulo: "Representante de Colombia",
    detalle: "FLL Internacional — Houston, Texas",
    icon: MapPin,
    media: [
      { type: "image", src: "/images/gallery/leader/lider_team.jpg", alt: "Equipo CALIBOTS con M.A.N.G.O — Rumbo a Houston" },
    ],
  },
  {
    id: "innovador",
    titulo: "Mejor Proyecto Innovador",
    detalle: "Submerged — Cartagena (SiembraTech → M.A.N.G.O)",
    icon: Lightbulb,
    media: [
      { type: "image", src: "/images/gallery/leader/masterpiece_1.jpg", alt: "Premiación Nacional FLL Submerged" },
      { type: "image", src: "/images/gallery/leader/masterpiece_2.jpg", alt: "Certificado Mejor Proyecto Innovación" },
      { type: "image", src: "/images/gallery/leader/masterpiece_3.jpg", alt: "Con compañero y diploma" },
      { type: "image", src: "/images/gallery/leader/masterpiece_4.jpg", alt: "Diploma oficial Mejor Proyecto Innovación" },
    ],
  },
  {
    id: "motivated",
    titulo: "Premio \"Motivated\"",
    detalle: "FLL Internacional — Houston, Texas",
    icon: Star,
    media: [],
  },
  {
    id: "robisoft",
    titulo: "Copa RobiSoft",
    detalle: "7mo Puesto Nacional — Sumo con Robi",
    icon: Medal,
    media: [
      { type: "image", src: "/images/gallery/leader/coparobi_puesto.jpg", alt: "Tabla de posiciones — Sumo con Robi (7mo puesto)" },
    ],
  },
];

export function ExpandableAwards() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ awardId: string; index: number } | null>(null);
  const [zoom, setZoom] = useState(1);

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);

  const lightboxMedia = lightbox
    ? awards.find((a) => a.id === lightbox.awardId)?.media ?? []
    : [];

  const closeLightbox = useCallback(() => {
    setLightbox(null);
    setZoom(1);
  }, []);

  const goNext = useCallback(() => {
    if (!lightbox || lightboxMedia.length <= 1) return;
    setZoom(1);
    setLightbox({ ...lightbox, index: (lightbox.index + 1) % lightboxMedia.length });
  }, [lightbox, lightboxMedia.length]);

  const goPrev = useCallback(() => {
    if (!lightbox || lightboxMedia.length <= 1) return;
    setZoom(1);
    setLightbox({ ...lightbox, index: (lightbox.index - 1 + lightboxMedia.length) % lightboxMedia.length });
  }, [lightbox, lightboxMedia.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, closeLightbox, goNext, goPrev]);

  // Preload adjacent
  useEffect(() => {
    if (!lightbox) return;
    const preload = (idx: number) => {
      const item = lightboxMedia[idx];
      if (item?.type === "image") {
        const img = new Image();
        img.src = item.src;
      }
    };
    preload((lightbox.index + 1) % lightboxMedia.length);
    preload((lightbox.index - 1 + lightboxMedia.length) % lightboxMedia.length);
  }, [lightbox, lightboxMedia]);

  return (
    <>
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="h-4 w-4 text-accent" />
          <h4 className="text-white font-semibold text-sm uppercase tracking-wider">Premios y Logros</h4>
          <span className="text-white/30 text-xs ml-auto">Haz clic para ver fotos</span>
        </div>

        <div className="flex flex-col gap-1.5">
          {awards.map((award) => {
            const isOpen = expanded === award.id;
            const hasMedia = award.media.length > 0;

            return (
              <div
                key={award.id}
                className={`rounded-lg overflow-hidden transition-all duration-300 ${
                  isOpen ? "bg-white/[0.06] border border-accent/20" : "bg-white/[0.04] border border-transparent"
                }`}
              >
                <button
                  onClick={() => hasMedia && toggle(award.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    hasMedia ? "hover:bg-white/[0.03] cursor-pointer" : "cursor-default"
                  }`}
                >
                  <award.icon className={`h-4 w-4 shrink-0 ${isOpen ? "text-accent" : "text-accent/70"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white/90 text-sm font-medium leading-tight">{award.titulo}</p>
                    <p className="text-white/50 text-xs">{award.detalle}</p>
                  </div>
                  {hasMedia && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-white/30 text-[10px] font-mono">{award.media.length}</span>
                      <ChevronDown
                        className={`h-4 w-4 text-white/30 transition-transform duration-300 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  )}
                  {!hasMedia && (
                    <span className="text-white/20 text-[10px] shrink-0">Próximamente</span>
                  )}
                </button>

                {isOpen && hasMedia && (
                  <div className="px-3 pb-3 border-t border-white/[0.06]">
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                      {award.media.map((item, i) => (
                        <div
                          key={i}
                          onClick={() => { setLightbox({ awardId: award.id, index: i }); setZoom(1); }}
                          className="aspect-square rounded-lg bg-white/[0.06] border border-white/[0.08] overflow-hidden relative group cursor-pointer"
                        >
                          {item.type === "image" ? (
                            <img
                              src={item.src}
                              alt={item.alt}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full relative">
                              <video
                                src={item.src}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                                preload="metadata"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
                                <Play className="h-6 w-6 text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox — Semi-transparent overlay, click outside to close */}
      {lightbox && lightboxMedia.length > 0 && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 text-white/80 hover:text-white p-2.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Counter */}
          {lightboxMedia.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-white/70 text-xs font-medium bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5">
              {lightbox.index + 1} / {lightboxMedia.length}
            </div>
          )}

          {/* Content — compact, centered */}
          <div className="max-w-3xl max-h-[80vh] w-auto px-4" onClick={(e) => e.stopPropagation()}>
            {lightboxMedia[lightbox.index]?.type === "image" ? (
              <img
                src={lightboxMedia[lightbox.index].src}
                alt={lightboxMedia[lightbox.index].alt}
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
                style={{ transform: zoom !== 1 ? `scale(${zoom})` : undefined, transition: "transform 0.2s" }}
                draggable={false}
              />
            ) : (
              <video
                src={lightboxMedia[lightbox.index]?.src}
                className="max-w-full max-h-[70vh] rounded-xl shadow-2xl"
                controls
                autoPlay
                playsInline
              />
            )}
            <p className="text-white/70 text-xs text-center mt-3 drop-shadow">
              {lightboxMedia[lightbox.index]?.alt}
            </p>
          </div>

          {/* Navigation arrows */}
          {lightboxMedia.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-2 md:left-5 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/40 backdrop-blur-md text-white/80 hover:text-white hover:bg-black/60 transition-all"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-2 md:right-5 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/40 backdrop-blur-md text-white/80 hover:text-white hover:bg-black/60 transition-all"
                aria-label="Siguiente"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
