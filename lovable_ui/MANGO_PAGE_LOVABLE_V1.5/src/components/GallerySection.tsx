import { useState, useCallback, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, ChevronDown } from "lucide-react";

const filters = ["Todo", "Hardware", "Software", "Campo", "Progreso"];

const INITIAL_VISIBLE = 8;

const images = [
  { src: "/images/gallery/hardware/hardware_1_1_ESP32.jpg", title: "hardware_1_1_ESP32", cat: "Hardware", desc: "ESP32 - Microcontrolador principal del sistema." },
  { src: "/images/gallery/hardware/hardware_2_2_ESP32.jpg", title: "hardware_2_2_ESP32", cat: "Hardware", desc: "ESP32 - Vista frontal del módulo." },
  { src: "/images/gallery/hardware/hardware_3_APISQUEEN_PAQUETE_1.jpg", title: "hardware_3_APISQUEEN_PAQUETE_1", cat: "Hardware", desc: "APISQUEEN - UBEC regulador de voltaje." },
  { src: "/images/gallery/hardware/hardware_4_APISQUEEN_PAQUETE_2.jpg", title: "hardware_4_APISQUEEN_PAQUETE_2", cat: "Hardware", desc: "APISQUEEN - Kit completo de propulsión y control." },
  { src: "/images/gallery/hardware/hardware_5_APISQUEEN_PAQUETE_3.jpg", title: "hardware_5_APISQUEEN_PAQUETE_3", cat: "Hardware", desc: "APISQUEEN - Cable splitter XT60." },
  { src: "/images/gallery/hardware/hardware_6_APISQUEEN_PAQUETE_4.jpg", title: "hardware_6_APISQUEEN_PAQUETE_4", cat: "Hardware", desc: "APISQUEEN - Cable splitter XT60 vista alternativa." },
  { src: "/images/gallery/hardware/hardware_7_APISQUEEN_PAQUETE_5.jpg", title: "hardware_7_APISQUEEN_PAQUETE_5", cat: "Hardware", desc: "APISQUEEN - Manual UBEC 3A Switch-Mode." },
  { src: "/images/gallery/hardware/hardware_8_APISQUEEN_PAQUETE_6.jpg", title: "hardware_8_APISQUEEN_PAQUETE_6", cat: "Hardware", desc: "APISQUEEN - Módulo UBEC con conector XT60." },
  { src: "/images/gallery/hardware/hardware_9_APISQUEEN_PAQUETE_7.jpg", title: "hardware_9_APISQUEEN_PAQUETE_7", cat: "Hardware", desc: "APISQUEEN - Ficha técnica Feather ESC." },
  { src: "/images/gallery/hardware/hardware_10_APISQUEEN_PAQUETE_8.jpg", title: "hardware_10_APISQUEEN_PAQUETE_8", cat: "Hardware", desc: "APISQUEEN - ESC sumergible con conectores." },
  { src: "/images/gallery/hardware/hardware_11_APISQUEEN_PAQUETE_9.jpg", title: "hardware_11_APISQUEEN_PAQUETE_9", cat: "Hardware", desc: "APISQUEEN - Componente de propulsión adicional." },
  { src: "/images/gallery/hardware/hardware_12_APISQUEEN_PAQUETE_10.jpg", title: "hardware_12_APISQUEEN_PAQUETE_10", cat: "Hardware", desc: "APISQUEEN - Paquete de componentes electrónicos." },
  { src: "/images/gallery/hardware/hardware_13_APISQUEEN_PAQUETE_11.jpg", title: "hardware_13_APISQUEEN_PAQUETE_11", cat: "Hardware", desc: "APISQUEEN - Detalle de conexiones eléctricas." },
  { src: "/images/gallery/hardware/hardware_14_APISQUEEN_PAQUETE_12.jpg", title: "hardware_14_APISQUEEN_PAQUETE_12", cat: "Hardware", desc: "APISQUEEN - Módulo de control adicional." },
  { src: "/images/gallery/hardware/hardware_15_APISQUEEN_PAQUETE_13.jpg", title: "hardware_15_APISQUEEN_PAQUETE_13", cat: "Hardware", desc: "APISQUEEN - Componentes de montaje." },
  { src: "/images/gallery/hardware/hardware_16_APISQUEEN_PAQUETE_14.jpg", title: "hardware_16_APISQUEEN_PAQUETE_14", cat: "Hardware", desc: "APISQUEEN - Vista de ensamblaje." },
  { src: "/images/gallery/hardware/hardware_17_APISQUEEN_PAQUETE_15.jpg", title: "hardware_17_APISQUEEN_PAQUETE_15", cat: "Hardware", desc: "APISQUEEN - Detalle de cableado." },
  { src: "/images/gallery/hardware/hardware_18_APISQUEEN_PAQUETE_16.jpg", title: "hardware_18_APISQUEEN_PAQUETE_16", cat: "Hardware", desc: "APISQUEEN - Módulo integrado." },
  { src: "/images/gallery/hardware/hardware_19_APISQUEEN_PAQUETE_17.jpg", title: "hardware_19_APISQUEEN_PAQUETE_17", cat: "Hardware", desc: "APISQUEEN - Componente de potencia." },
  { src: "/images/gallery/hardware/hardware_20_APISQUEEN_PAQUETE_18.jpg", title: "hardware_20_APISQUEEN_PAQUETE_18", cat: "Hardware", desc: "APISQUEEN - Kit completo ensamblado." },
  { src: "/images/gallery/hardware/hardware_21_APISQUEEN_PAQUETE_19.jpg", title: "hardware_21_APISQUEEN_PAQUETE_19", cat: "Hardware", desc: "APISQUEEN - Thruster brushless con hélice." },
  { src: "/images/gallery/hardware/hardware_22_APISQUEEN_PAQUETE_20.jpg", title: "hardware_22_APISQUEEN_PAQUETE_20", cat: "Hardware", desc: "APISQUEEN - Detalle de cables y conectores del thruster." },
  { src: "/images/gallery/hardware/hardware_23_APISQUEEN_PAQUETE_21.jpg", title: "hardware_23_APISQUEEN_PAQUETE_21", cat: "Hardware", desc: "APISQUEEN - Thruster sumergible vista superior." },
  { src: "/images/gallery/hardware/hardware_24_APISQUEEN_PAQUETE_22.jpg", title: "hardware_24_APISQUEEN_PAQUETE_22", cat: "Hardware", desc: "APISQUEEN - Caja Brushless Underwater Thruster 2000m." },
  { src: "/images/gallery/hardware/hardware_25_APISQUEEN_PAQUETE_23.jpg", title: "hardware_25_APISQUEEN_PAQUETE_23", cat: "Hardware", desc: "APISQUEEN - Instrucciones de precaución del thruster." },
  { src: "/images/gallery/hardware/hardware_26_APISQUEEN_PAQUETE_24.jpg", title: "hardware_26_APISQUEEN_PAQUETE_24", cat: "Hardware", desc: "APISQUEEN - Caja del thruster vista frontal." },
  { src: "/images/gallery/hardware/hardware_27_APISQUEEN_PAQUETE_25.jpg", title: "hardware_27_APISQUEEN_PAQUETE_25", cat: "Hardware", desc: "APISQUEEN - Parámetros del producto (12-24V, 480kV)." },
  { src: "/images/gallery/hardware/hardware_28_APISQUEEN_PAQUETE_26.jpg", title: "hardware_28_APISQUEEN_PAQUETE_26", cat: "Hardware", desc: "APISQUEEN - Caja Brushless Propeller Motor." },
  { src: "/images/gallery/hardware/hardware_29_APISQUEEN_PAQUETE_27.jpg", title: "hardware_29_APISQUEEN_PAQUETE_27", cat: "Hardware", desc: "APISQUEEN - Control remoto A300 con guía rápida." },
  { src: "/images/gallery/hardware/hardware_30_APISQUEEN_PAQUETE_28.jpg", title: "hardware_30_APISQUEEN_PAQUETE_28", cat: "Hardware", desc: "APISQUEEN - Control remoto A300 vista alternativa." },
  { src: "/images/gallery/hardware/hardware_31_APISQUEEN_PAQUETE_29.jpg", title: "hardware_31_APISQUEEN_PAQUETE_29", cat: "Hardware", desc: "APISQUEEN - Componente adicional del paquete." },
  { src: "/images/gallery/hardware/hardware_32_APISQUEEN_PAQUETE_30.jpg", title: "hardware_32_APISQUEEN_PAQUETE_30", cat: "Hardware", desc: "APISQUEEN - Detalle del paquete 30." },
  { src: "/images/gallery/hardware/hardware_33_APISQUEEN_PAQUETE_31.jpg", title: "hardware_33_APISQUEEN_PAQUETE_31", cat: "Hardware", desc: "APISQUEEN - Componente del paquete 31." },
  { src: "/images/gallery/hardware/hardware_34_APISQUEEN_PAQUETE_32.jpg", title: "hardware_34_APISQUEEN_PAQUETE_32", cat: "Hardware", desc: "APISQUEEN - Detalle del paquete 32." },
  { src: "/images/gallery/hardware/hardware_35_APISQUEEN_PAQUETE_33.jpg", title: "hardware_35_APISQUEEN_PAQUETE_33", cat: "Hardware", desc: "APISQUEEN - Componente del paquete 33." },
  { src: "/images/gallery/hardware/hardware_36_APISQUEEN_PAQUETE_34.jpg", title: "hardware_36_APISQUEEN_PAQUETE_34", cat: "Hardware", desc: "APISQUEEN - Detalle del paquete 34." },
  { src: "/images/gallery/hardware/hardware_37_APISQUEEN_PAQUETE_35.jpg", title: "hardware_37_APISQUEEN_PAQUETE_35", cat: "Hardware", desc: "APISQUEEN - Componente del paquete 35." },
  { src: "/images/gallery/hardware/hardware_38_APISQUEEN_PAQUETE_36.jpg", title: "hardware_38_APISQUEEN_PAQUETE_36", cat: "Hardware", desc: "APISQUEEN - Detalle del paquete 36." },
  { src: "/images/gallery/hardware/hardware_39_APISQUEEN_PAQUETE_37.jpg", title: "hardware_39_APISQUEEN_PAQUETE_37", cat: "Hardware", desc: "APISQUEEN - Componente del paquete 37." },
  { src: "/images/gallery/hardware/hardware_40_APISQUEEN_PAQUETE_38.jpg", title: "hardware_40_APISQUEEN_PAQUETE_38", cat: "Hardware", desc: "APISQUEEN - Detalle del paquete 38." },
  { src: "/images/gallery/hardware/hardware_41_APISQUEEN_PAQUETE_39.jpg", title: "hardware_41_APISQUEEN_PAQUETE_39", cat: "Hardware", desc: "APISQUEEN - ESC empaquetado con conector XT60." },
  { src: "/images/gallery/hardware/hardware_42_APISQUEEN_PAQUETE_40.jpg", title: "hardware_42_APISQUEEN_PAQUETE_40", cat: "Hardware", desc: "APISQUEEN - Cable USB de carga." },
  { src: "/images/gallery/hardware/hardware_43_APISQUEEN_PAQUETE_41.jpg", title: "hardware_43_APISQUEEN_PAQUETE_41", cat: "Hardware", desc: "APISQUEEN - Cable USB vista alternativa." },
  { src: "/images/gallery/hardware/hardware_44_APISQUEEN_PAQUETE_42.jpg", title: "hardware_44_APISQUEEN_PAQUETE_42", cat: "Hardware", desc: "APISQUEEN - Ficha técnica Feather ESC con diagrama." },
  { src: "/images/gallery/hardware/hardware_45_APISQUEEN_PAQUETE_43.jpg", title: "hardware_45_APISQUEEN_PAQUETE_43", cat: "Hardware", desc: "APISQUEEN - ESC empaquetado vista alternativa." },
  { src: "/images/gallery/hardware/hardware_46_APISQUEEN_PAQUETE_44.jpg", title: "hardware_46_APISQUEEN_PAQUETE_44", cat: "Hardware", desc: "APISQUEEN - Receptor RC 6 canales con antena." },
  { src: "/images/gallery/hardware/hardware_47_APISQUEEN_PAQUETE_45.jpg", title: "hardware_47_APISQUEEN_PAQUETE_45", cat: "Hardware", desc: "APISQUEEN - Receptor RC vista posterior (PCB)." },
  { src: "/images/gallery/hardware/hardware_48_APISQUEEN_PAQUETE_46.jpg", title: "hardware_48_APISQUEEN_PAQUETE_46", cat: "Hardware", desc: "APISQUEEN - Receptor RC vista frontal detallada." },
  { src: "/images/gallery/hardware/hardware_49_APISQUEEN_PAQUETE_47.jpg", title: "hardware_49_APISQUEEN_PAQUETE_47", cat: "Hardware", desc: "APISQUEEN - Cables con conectores XT60 empaquetados." },
  { src: "/images/gallery/hardware/hardware_50_APISQUEEN_PAQUETE_48.jpg", title: "hardware_50_APISQUEEN_PAQUETE_48", cat: "Hardware", desc: "APISQUEEN - Cables splitter XT60 rojos." },
  { src: "/images/gallery/hardware/hardware_51_APISQUEEN_PAQUETE_49.jpg", title: "hardware_51_APISQUEEN_PAQUETE_49", cat: "Hardware", desc: "APISQUEEN - Manual de usuario del UBEC 3A." },
  { src: "/images/gallery/hardware/hardware_52_Case_Jetson.png", title: "hardware_52_Case_Jetson", cat: "Progreso", desc: "Render 3D del case para Jetson (Diseño)." },
  { src: "/images/gallery/hardware/hardware_53_COMUNICACION.jpg", title: "hardware_53_COMUNICACION", cat: "Software", desc: "Código de comunicación LoRa en Arduino IDE." },
  { src: "/images/gallery/hardware/hardware_54_ESQUEMA_ARMADO_GENERAL_1.jpg", title: "hardware_54_ESQUEMA_ARMADO_GENERAL_1", cat: "Progreso", desc: "Pruebas de integración de componentes en mesa." },
  { src: "/images/gallery/hardware/hardware_55_ESQUEMA_SENSORES_1.jpg", title: "hardware_55_ESQUEMA_SENSORES_1", cat: "Progreso", desc: "Diagrama esquemático de conexión de sensores (Pizarra 1)." },
  { src: "/images/gallery/hardware/hardware_56_ESQUEMA_SENSORES_2.jpg", title: "hardware_56_ESQUEMA_SENSORES_2", cat: "Progreso", desc: "Diagrama esquemático de conexión de sensores (Pizarra 2)." },
  { src: "/images/gallery/hardware/hardware_57_Estacion_Soldadura.jpg", title: "hardware_57_Estacion_Soldadura", cat: "Progreso", desc: "Estación de soldadura y ensamblaje." },
  { src: "/images/gallery/hardware/hardware_58_Extention_Raspberry_pi.png", title: "hardware_58_Extention_Raspberry_pi", cat: "Hardware", desc: "Adaptador de conector para Raspberry Pi 5." },
  { src: "/images/gallery/hardware/hardware_59_G-PIO_Jetson_TK1.jpg", title: "hardware_59_G-PIO_Jetson_TK1", cat: "Hardware", desc: "Detalle de puertos GPIO en Jetson TK1." },
  { src: "/images/gallery/hardware/hardware_60_HELTEC.jpg", title: "hardware_60_HELTEC", cat: "Hardware", desc: "Módulo Heltec WiFi LoRa 32 en caja protectora." },
];

export function GallerySection() {
  const [active, setActive] = useState("Todo");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const filtered = active === "Todo" ? images : images.filter((img) => img.cat === active);

  const needsCollapse = filtered.length > INITIAL_VISIBLE;
  const visible = expanded || !needsCollapse ? filtered : filtered.slice(0, INITIAL_VISIBLE);
  const hiddenCount = filtered.length - INITIAL_VISIBLE;

  // Reset expanded when changing filter
  useEffect(() => {
    setExpanded(false);
  }, [active]);

  // Preload adjacent images when lightbox is open
  useEffect(() => {
    if (lightbox === null) return;
    const preload = (index: number) => {
      const img = new Image();
      img.src = filtered[index]?.src;
    };
    preload((lightbox + 1) % filtered.length);
    preload((lightbox - 1 + filtered.length) % filtered.length);
    // Preload 2 ahead as well
    preload((lightbox + 2) % filtered.length);
  }, [lightbox, filtered]);

  const resetZoom = () => setZoom(1);

  const goNext = useCallback(() => {
    if (lightbox === null) return;
    setZoom(1);
    setLightbox((lightbox + 1) % filtered.length);
  }, [lightbox, filtered.length]);

  const goPrev = useCallback(() => {
    if (lightbox === null) return;
    setZoom(1);
    setLightbox((lightbox - 1 + filtered.length) % filtered.length);
  }, [lightbox, filtered.length]);

  useEffect(() => {
    if (lightbox === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") { setLightbox(null); setZoom(1); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, goNext, goPrev]);

  const openLightbox = (i: number) => {
    setZoom(1);
    setLightbox(i);
  };

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
          {filters.map((f) => {
            const count = f === "Todo" ? images.length : images.filter((img) => img.cat === f).length;
            return (
              <button
                key={f}
                onClick={() => setActive(f)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  active === f
                    ? "bg-accent text-accent-foreground"
                    : "bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {f} <span className="opacity-60">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Grid with collapse */}
        <div className="relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {visible.map((img, i) => (
              <div
                key={img.src}
                className="bg-card rounded-xl border border-border overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                onClick={() => openLightbox(i)}
              >
                <div className="aspect-[4/3] bg-muted overflow-hidden">
                  <img
                    src={img.src}
                    alt={img.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-foreground text-sm truncate">{img.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{img.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Fade overlay + expand button */}
          {needsCollapse && !expanded && (
            <div className="relative mt-0">
              <div className="absolute -top-24 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
              <div className="flex justify-center pt-6">
                <button
                  onClick={() => setExpanded(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-accent-foreground font-semibold text-sm hover:bg-accent/90 transition-all shadow-lg"
                >
                  <ChevronDown className="h-4 w-4" />
                  Ver {hiddenCount} imágenes más
                </button>
              </div>
            </div>
          )}

          {needsCollapse && expanded && (
            <div className="flex justify-center pt-6">
              <button
                onClick={() => setExpanded(false)}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-card border border-border text-muted-foreground font-semibold text-sm hover:bg-muted transition-all"
              >
                <ChevronDown className="h-4 w-4 rotate-180" />
                Mostrar menos
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[60] bg-black flex items-center justify-center"
          onClick={() => { setLightbox(null); setZoom(1); }}
        >
          {/* Close */}
          <button className="absolute top-4 right-4 z-10 text-white/70 hover:text-white p-2" onClick={() => { setLightbox(null); setZoom(1); }} aria-label="Cerrar">
            <X className="h-7 w-7" />
          </button>

          {/* Zoom controls */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full px-2 py-1">
            <button onClick={(e) => { e.stopPropagation(); setZoom(Math.max(0.5, zoom - 0.25)); }} className="p-1.5 text-white/70 hover:text-white" aria-label="Zoom out">
              <ZoomOut className="h-5 w-5" />
            </button>
            <span className="text-white/80 text-xs font-medium min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={(e) => { e.stopPropagation(); setZoom(Math.min(3, zoom + 0.25)); }} className="p-1.5 text-white/70 hover:text-white" aria-label="Zoom in">
              <ZoomIn className="h-5 w-5" />
            </button>
            {zoom !== 1 && (
              <button onClick={(e) => { e.stopPropagation(); resetZoom(); }} className="p-1.5 text-white/70 hover:text-white" aria-label="Reset zoom">
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-white/50 text-sm">
            {lightbox + 1} / {filtered.length}
          </div>

          {/* Prev arrow */}
          <button
            className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-10 p-2 md:p-3 rounded-full bg-white/10 backdrop-blur-sm text-white/70 hover:text-white hover:bg-white/20 transition-all"
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            aria-label="Anterior"
          >
            <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
          </button>

          {/* Next arrow */}
          <button
            className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-10 p-2 md:p-3 rounded-full bg-white/10 backdrop-blur-sm text-white/70 hover:text-white hover:bg-white/20 transition-all"
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            aria-label="Siguiente"
          >
            <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
          </button>

          {/* Image + info */}
          <div className="max-w-4xl w-full px-14 md:px-20" onClick={(e) => e.stopPropagation()}>
            <div className="overflow-auto max-h-[75vh] flex items-center justify-center rounded-xl">
              <img
                src={filtered[lightbox]?.src}
                alt={filtered[lightbox]?.title}
                className="max-w-full max-h-[70vh] object-contain transition-transform duration-200"
                style={{ transform: `scale(${zoom})` }}
                draggable={false}
              />
            </div>
            <div className="mt-3 text-center">
              <h3 className="text-white font-bold text-lg">{filtered[lightbox]?.title}</h3>
              <p className="text-white/60 mt-1 text-sm">{filtered[lightbox]?.desc}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
