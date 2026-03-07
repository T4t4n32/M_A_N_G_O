import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Play, X, Camera } from "lucide-react";

interface MediaItem {
  type: "image" | "video";
  src: string;
  alt: string;
  category: string;
}

const leaderMedia: MediaItem[] = [
  // Inicios
  { type: "image", src: "/images/gallery/leader/inicios_1.jpg", alt: "Inicios en robótica — ensamblando piezas", category: "Inicios" },
  { type: "image", src: "/images/gallery/leader/inicios_2.jpg", alt: "Inicios en robótica — armando carro seguidor", category: "Inicios" },
  { type: "image", src: "/images/gallery/leader/inicios_3.jpg", alt: "Inicios en robótica — soldadura y electrónica", category: "Inicios" },
  { type: "image", src: "/images/gallery/leader/inicios_4.jpg", alt: "Inicios en robótica — primer carro terminado", category: "Inicios" },
  { type: "video", src: "/images/gallery/leader/inicios_video_1.mp4", alt: "Video de inicios en robótica #1", category: "Inicios" },
  { type: "video", src: "/images/gallery/leader/inicios_video_2.mp4", alt: "Video de inicios en robótica #2", category: "Inicios" },
  // Competencias
  { type: "image", src: "/images/gallery/leader/masterpiece_1.jpg", alt: "Nacional FLL Submerged — Premiación", category: "Competencias" },
  { type: "image", src: "/images/gallery/leader/masterpiece_2.jpg", alt: "Mejor Proyecto Innovación — Certificado", category: "Competencias" },
  { type: "image", src: "/images/gallery/leader/masterpiece_3.jpg", alt: "Nacional FLL — Con compañero y diploma", category: "Competencias" },
  { type: "image", src: "/images/gallery/leader/masterpiece_4.jpg", alt: "Diploma Mejor Proyecto Innovación — FLL Submerged", category: "Competencias" },
];

export function LeaderCarousel() {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("Todos");

  const categories = ["Todos", "Inicios", "Competencias"];
  const filtered = filter === "Todos" ? leaderMedia : leaderMedia.filter((m) => m.category === filter);

  const next = useCallback(() => setCurrent((c) => (c + 1) % filtered.length), [filtered.length]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + filtered.length) % filtered.length), [filtered.length]);

  // Reset current when filter changes
  const handleFilter = (cat: string) => {
    setFilter(cat);
    setCurrent(0);
  };

  const item = filtered[current];
  if (!item) return null;

  return (
    <>
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Camera className="h-4 w-4 text-accent" />
          <h4 className="text-white font-semibold text-sm uppercase tracking-wider">Galería</h4>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mb-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleFilter(cat)}
              className={`text-xs px-3 py-1 rounded-full transition-colors font-medium ${
                filter === cat
                  ? "bg-accent/20 text-accent border border-accent/30"
                  : "bg-white/[0.06] text-white/50 border border-white/[0.08] hover:text-white/70"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Carousel */}
        <div className="relative rounded-xl overflow-hidden bg-white/[0.04] border border-white/[0.08]">
          <div
            className="aspect-[16/10] cursor-pointer"
            onClick={() => setLightbox(current)}
          >
            {item.type === "image" ? (
              <img
                src={item.src}
                alt={item.alt}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <video
                src={item.src}
                className="w-full h-full object-cover"
                muted
                playsInline
                loop
                autoPlay
              />
            )}
          </div>

          {/* Nav arrows */}
          {filtered.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white/80 hover:text-white transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white/80 hover:text-white transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}

          {/* Bottom bar */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2.5">
            <div className="flex items-center justify-between">
              <p className="text-white/80 text-xs truncate max-w-[70%]">{item.alt}</p>
              <span className="text-white/50 text-xs font-mono shrink-0">
                {current + 1} / {filtered.length}
              </span>
            </div>
            {/* Dots */}
            <div className="flex gap-1 mt-1.5 justify-center">
              {filtered.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                  className={`h-1.5 rounded-full transition-all ${
                    i === current ? "w-4 bg-accent" : "w-1.5 bg-white/30"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Video play badge */}
          {item.type === "video" && (
            <div className="absolute top-2 right-2 bg-accent/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Play className="h-3 w-3" /> VIDEO
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
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
            {filtered[lightbox]?.type === "image" ? (
              <img
                src={filtered[lightbox].src}
                alt={filtered[lightbox].alt}
                className="w-full h-full max-h-[85vh] object-contain"
              />
            ) : (
              <video
                src={filtered[lightbox]?.src}
                className="w-full max-h-[85vh]"
                controls
                autoPlay
                playsInline
              />
            )}
          </div>

          {filtered.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + filtered.length) % filtered.length); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % filtered.length); }}
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
