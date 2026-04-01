import { useState } from "react";
import { Trophy, MapPin, Camera, Play, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CompetitionEvent {
  id: string;
  title: string;
  subtitle: string;
  year: string;
  location: string;
  icon: typeof Trophy;
  accentColor: string;
  media: { type: "image" | "video"; src: string; alt: string }[];
}

const competitions: CompetitionEvent[] = [
  {
    id: "masterpiece",
    title: "MASTERPIECE",
    subtitle: "1er Puesto Nacional — FLL 2023-2024",
    year: "2023-2024",
    location: "Bogotá, Colombia",
    icon: Trophy,
    accentColor: "text-yellow-400",
    media: [],
  },
  {
    id: "submerged-cartagena",
    title: "Submerged — Nacional",
    subtitle: "Mejor Proyecto Innovador (SiembraTech)",
    year: "2024-2025",
    location: "Cartagena, Colombia",
    icon: Trophy,
    accentColor: "text-accent",
    media: [],
  },
  {
    id: "submerged-houston",
    title: "Submerged — Internacional",
    subtitle: "Premio \"Motivated\" — Representando a Colombia",
    year: "2024-2025",
    location: "Houston, Texas",
    icon: MapPin,
    accentColor: "text-accent",
    media: [],
  },
  {
    id: "robisoft",
    title: "Copa RobiSoft",
    subtitle: "7mo Puesto Nacional",
    year: "2024",
    location: "Colombia",
    icon: Trophy,
    accentColor: "text-secondary",
    media: [],
  },
];

export function CompetitionsGallery() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="bg-white/[0.06] backdrop-blur rounded-xl border-2 border-secondary/20 p-7 md:p-10 hover:shadow-xl transition-all duration-300 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-accent/15 text-accent">
          <Camera className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Competencias y Logros</h3>
          <p className="text-white/50 text-sm">Galería de momentos destacados en torneos FLL y más</p>
        </div>
      </div>

      <div className="grid gap-4">
        {competitions.map((comp) => (
          <div
            key={comp.id}
            className="bg-white/[0.04] rounded-xl border border-white/[0.08] overflow-hidden transition-all duration-300"
          >
            {/* Header clickeable */}
            <button
              onClick={() => setExpanded(expanded === comp.id ? null : comp.id)}
              className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.03] transition-colors"
            >
              <div className={`p-2 rounded-lg bg-white/[0.06] ${comp.accentColor}`}>
                <comp.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-white font-semibold text-sm">{comp.title}</h4>
                  <span className="text-accent/70 font-mono text-xs bg-accent/10 px-2 py-0.5 rounded-full">
                    {comp.year}
                  </span>
                </div>
                <p className="text-white/60 text-xs mt-0.5">{comp.subtitle}</p>
                <div className="flex items-center gap-1 mt-1 text-white/40">
                  <MapPin className="h-3 w-3" />
                  <span className="text-xs">{comp.location}</span>
                </div>
              </div>
              <div className="text-white/40 shrink-0">
                {expanded === comp.id ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </div>
            </button>

            {/* Contenido expandible */}
            {expanded === comp.id && (
              <div className="px-4 pb-4 border-t border-white/[0.06]">
                {comp.media.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                    {comp.media.map((item, i) => (
                      <div
                        key={i}
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
                          <div className="w-full h-full flex items-center justify-center bg-mango-dark/50">
                            <Play className="h-8 w-8 text-accent" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 py-8 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.06] flex items-center justify-center mb-3">
                      <Camera className="h-7 w-7 text-white/20" />
                    </div>
                    <p className="text-white/40 text-sm font-medium">Próximamente</p>
                    <p className="text-white/25 text-xs mt-1">
                      Imágenes y videos de esta competencia serán añadidos pronto
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-white/30 text-xs text-center mt-5">
        Las imágenes y videos se irán agregando progresivamente
      </p>
    </div>
  );
}
