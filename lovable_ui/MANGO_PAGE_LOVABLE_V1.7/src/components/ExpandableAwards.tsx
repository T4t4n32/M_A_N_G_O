import { useState } from "react";
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

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);

  const lightboxMedia = lightbox
    ? awards.find((a) => a.id === lightbox.awardId)?.media ?? []
    : [];

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
                {/* Header */}
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

                {/* Expanded media grid */}
                {isOpen && hasMedia && (
                  <div className="px-3 pb-3 border-t border-white/[0.06]">
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                      {award.media.map((item, i) => (
                        <div
                          key={i}
                          onClick={() => setLightbox({ awardId: award.id, index: i })}
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

      {/* Lightbox */}
      {lightbox && lightboxMedia.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="max-w-5xl max-h-[90vh] w-full px-4" onClick={(e) => e.stopPropagation()}>
            {lightboxMedia[lightbox.index]?.type === "image" ? (
              <img
                src={lightboxMedia[lightbox.index].src}
                alt={lightboxMedia[lightbox.index].alt}
                className="w-full h-full max-h-[85vh] object-contain"
              />
            ) : (
              <video
                src={lightboxMedia[lightbox.index]?.src}
                className="w-full max-h-[85vh]"
                controls
                autoPlay
                playsInline
              />
            )}
            <p className="text-white/60 text-xs text-center mt-2">
              {lightboxMedia[lightbox.index]?.alt} — {lightbox.index + 1} / {lightboxMedia.length}
            </p>
          </div>

          {lightboxMedia.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox({ ...lightbox, index: (lightbox.index - 1 + lightboxMedia.length) % lightboxMedia.length });
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox({ ...lightbox, index: (lightbox.index + 1) % lightboxMedia.length });
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
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
