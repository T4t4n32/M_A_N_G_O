import { useState } from "react";
import { X } from "lucide-react";

const filters = ["Todo", "Hardware", "Software", "Campo", "Progreso"];

const images = [
  { src: "/placeholder.svg", title: "Prototipo de sensores v2", cat: "Hardware", date: "Nov 2025", desc: "Segunda iteración del módulo de sensores con carcasa impermeable." },
  { src: "/placeholder.svg", title: "Dashboard en tiempo real", cat: "Software", date: "Oct 2025", desc: "Interfaz web para visualización de datos ambientales." },
  { src: "/placeholder.svg", title: "Estación de manglar", cat: "Campo", date: "Sep 2025", desc: "Instalación de sensores en zona de manglar piloto." },
  { src: "/placeholder.svg", title: "Placa PCB personalizada", cat: "Hardware", date: "Ago 2025", desc: "Diseño de PCB para integración de microcontrolador y sensores." },
  { src: "/placeholder.svg", title: "Calibración de sensores", cat: "Progreso", date: "Jul 2025", desc: "Proceso de calibración en laboratorio del SENA." },
  { src: "/placeholder.svg", title: "App móvil de alertas", cat: "Software", date: "Jun 2025", desc: "Aplicación complementaria para notificaciones de campo." },
  { src: "/placeholder.svg", title: "Equipo en terreno", cat: "Campo", date: "May 2025", desc: "Equipo realizando mediciones manuales comparativas." },
  { src: "/placeholder.svg", title: "Ensamble electrónico", cat: "Progreso", date: "Abr 2025", desc: "Proceso de soldadura y ensamble de componentes." },
];

export function GallerySection() {
  const [active, setActive] = useState("Todo");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const filtered = active === "Todo" ? images : images.filter((img) => img.cat === active);

  return (
    <section id="galeria" className="py-20 md:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Galería de Registro</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Registro visual del desarrollo y pruebas del proyecto
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                active === f
                  ? "bg-accent text-accent-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {filtered.map((img, i) => (
            <div
              key={i}
              className="break-inside-avoid bg-card rounded-xl border border-border overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => setLightbox(i)}
            >
              <div className={`bg-muted flex items-center justify-center ${i % 3 === 0 ? "h-48" : i % 3 === 1 ? "h-64" : "h-56"}`}>
                <img src={img.src} alt={img.title} className="w-16 h-16 opacity-30" />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-foreground text-sm">{img.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{img.desc}</p>
                <span className="text-xs text-accent mt-2 inline-block">{img.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-6 right-6 text-white/70 hover:text-white" onClick={() => setLightbox(null)} aria-label="Close">
            <X className="h-8 w-8" />
          </button>
          <div className="max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-muted rounded-xl aspect-video flex items-center justify-center mb-4">
              <img src={filtered[lightbox]?.src} alt={filtered[lightbox]?.title} className="w-24 h-24 opacity-30" />
            </div>
            <h3 className="text-white font-bold text-lg">{filtered[lightbox]?.title}</h3>
            <p className="text-white/60 mt-1">{filtered[lightbox]?.desc}</p>
            <span className="text-accent text-sm mt-2 inline-block">{filtered[lightbox]?.date}</span>
          </div>
        </div>
      )}
    </section>
  );
}
