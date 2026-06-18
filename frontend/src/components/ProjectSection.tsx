import { useEffect, useRef, useState, useCallback, useMemo, Suspense } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, ExternalLink, LogIn, Mail, Database,
  Play, DollarSign, MapPin, Clock, Users, ZoomIn, X,
} from "lucide-react";
import DecryptedText from "@/components/effects/DecryptedText";
import { useSiteValue } from "@/lib/siteContent";
import FloatingModel3D from "@/components/effects/FloatingModel3D";

// MANGO V2 GLB — shown as ambient rotating device in the hero
const HERO_MODEL_URL = "/api/v1/uploads/document/0b58fcfefa034d49bf6d7503678b9269.glb";

// ── Static hardware images ────────────────────────────────────────────────────
const HW = {
  flow:    "/images/gallery/hardware/hardware_136_ESQUEMA_CONEXION_SENSORES_JETSON_LORA_TX_RX.png",
  esp32:   "/images/gallery/hardware/hardware_1_1_ESP32.jpg",
  esp32b:  "/images/gallery/hardware/hardware_2_2_ESP32.jpg",
  lora:    "/images/gallery/hardware/hardware_60_HELTEC.jpg",
  lorab:   "/images/gallery/hardware/hardware_61_HELTEC_2.jpg",
  lorac:   "/images/gallery/hardware/hardware_62_HELTEC_3.jpg",
  loraCode:"/images/gallery/hardware/hardware_53_COMUNICACION.jpg",
  ph:      "/images/gallery/hardware/hardware_112_PH_1.jpg",
  phb:     "/images/gallery/hardware/hardware_113_PH_2.jpg",
  phc:     "/images/gallery/hardware/hardware_114_PH_3.jpg",
  phd:     "/images/gallery/hardware/hardware_128_Sensor_ph.png",
  temp:    "/images/gallery/hardware/hardware_70_MAX31865.jpg",
  tempb:   "/images/gallery/hardware/hardware_71_MAX31865_1.jpg",
  tempc:   "/images/gallery/hardware/hardware_72_MAX31865_2.jpg",
  tempd:   "/images/gallery/hardware/hardware_73_MAX31865_3.jpg",
  sensors: "/images/gallery/hardware/hardware_117_SENSORES_1.jpg",
  jetson:  "/images/gallery/hardware/hardware_59_G-PIO_Jetson_TK1.jpg",
  loraMount:"/images/gallery/hardware/hardware_93_MONTAJE_LORA_2.jpg",
  loraMount1:"/images/gallery/hardware/hardware_92_MONTAJE_LORA_1.jpg",
  heltec4:  "/images/gallery/hardware/hardware_63_HELTEC_4.jpg",
  phMount1: "/images/gallery/hardware/hardware_102_MONTAJE_PH_1.jpg",
  phMount2: "/images/gallery/hardware/hardware_103_MONTAJE_PH_2.jpg",
  temp4:    "/images/gallery/hardware/hardware_74_MAX31865_4.jpg",
  temp5:    "/images/gallery/hardware/hardware_75_MAX31865_5.jpg",
  tempe1:   "/images/gallery/hardware/hardware_130_TEMPERATURA_1.jpg",
} as const;

const SCHEMAS = [
  {
    src: "/images/gallery/hardware/hardware_135_ESQUEMA_COMPLETO.png",
    label: "Vista general del sistema",
    tag: "General",
    desc: "El mapa completo: todos los sensores, el procesador y el módulo de radio en una sola vista. Ideal para entender cómo encajan todas las piezas antes de entrar en detalles.",
  },
  {
    src: "/images/gallery/hardware/hardware_136_ESQUEMA_CONEXION_SENSORES_JETSON_LORA_TX_RX.png",
    label: "Sensores → Jetson → LoRa",
    tag: "Flujo de datos",
    desc: "El recorrido real de los datos: cómo los sensores entregan lecturas al procesador Jetson TK1 y este las envía por radio LoRa hacia la estación base.",
  },
  {
    src: "/images/gallery/hardware/hardware_137_ESQUEMA_MANGO.png",
    label: "Diagrama del proyecto",
    tag: "Arquitectura",
    desc: "Arquitectura conceptual del sistema M.A.N.G.O.: desde la captación en campo hasta la visualización en el dashboard web en tiempo real.",
  },
  {
    src: "/images/gallery/hardware/hardware_54_ESQUEMA_ARMADO_GENERAL_1.jpg",
    label: "Armado físico del hardware",
    tag: "Montaje",
    desc: "Distribución y montaje de los módulos dentro del chasis impermeable del prototipo. Muestra cómo se organizan los componentes en el espacio disponible.",
  },
  {
    src: "/images/gallery/hardware/hardware_55_ESQUEMA_SENSORES_1.jpg",
    label: "Conexiones de sensores — Vista 1",
    tag: "Sensores",
    desc: "Las conexiones eléctricas entre el sensor de pH, el módulo de temperatura y el microcontrolador, con los pines de señal y alimentación.",
  },
  {
    src: "/images/gallery/hardware/hardware_56_ESQUEMA_SENSORES_2.jpg",
    label: "Conexiones de sensores — Vista 2",
    tag: "Sensores",
    desc: "Vista complementaria del sistema de sensores. Detalla los pines de alimentación y señal del circuito completo de medición.",
  },
];

const COMPONENTS = [
  {
    id: "esp32", num: "01", title: "ESP32", role: "El cerebro del sistema", accent: "#00c9a7",
    images: [HW.esp32, HW.esp32b],
    desc: "El ESP32 es el microchip que controla todo el dispositivo. Lee los sensores, calcula los valores, empaqueta los datos y los envía por radio. Es pequeño, consume poca energía y funciona en ambientes de alta humedad como los manglares.",
    specs: [
      { k: "Procesador", v: "Dual-core 240 MHz" },
      { k: "Memoria",    v: "520 KB SRAM" },
      { k: "Interfaces", v: "SPI · I²C · UART · ADC" },
      { k: "Alimentación", v: "3.3 V lógica" },
    ],
  },
  {
    id: "lora", num: "02", title: "LoRa", role: "Radio de largo alcance", accent: "#38bdf8",
    images: [HW.lora, HW.lorab, HW.lorac, HW.heltec4, HW.loraMount1, HW.loraMount, HW.loraCode],
    desc: "LoRa es una tecnología de radio que transmite datos a varios kilómetros de distancia sin necesitar WiFi ni señal celular. Esto permite que el dispositivo funcione en zonas remotas sin ninguna infraestructura de comunicaciones existente.",
    specs: [
      { k: "Frecuencia",   v: "433 MHz ISM" },
      { k: "Alcance",      v: "hasta 5 km en campo" },
      { k: "Sensibilidad", v: "−148 dBm" },
      { k: "Consumo TX",   v: "< 120 mA" },
    ],
  },
  {
    id: "ph", num: "03", title: "Sensor pH", role: "Medidor de acidez del agua", accent: "#a78bfa",
    images: [HW.ph, HW.phb, HW.phc, HW.phd, HW.phMount1, HW.phMount2],
    desc: "Este sensor sumergible mide qué tan ácida o alcalina está el agua. El pH es el primer indicador de que algo está pasando en el ecosistema: contaminación por vertidos, floración excesiva de algas o cambios en la composición del agua.",
    specs: [
      { k: "Rango",      v: "0 – 14 pH" },
      { k: "Precisión",  v: "±0.01 pH" },
      { k: "Tipo",       v: "Electrodo BNC sumergible" },
      { k: "Salida",     v: "Analógica → ADC" },
    ],
  },
  {
    id: "temp", num: "04", title: "Sensor Temperatura", role: "Termómetro de alta precisión", accent: "#fbbf24",
    images: [HW.temp, HW.tempb, HW.tempc, HW.tempd, HW.temp4, HW.temp5, HW.tempe1],
    desc: "Mide la temperatura del agua con una precisión de medio grado. Cambios pequeños de temperatura pueden ser señales importantes: indican eventos térmicos que afectan a las especies del ecosistema o el inicio de fenómenos como el blanqueamiento de corales.",
    specs: [
      { k: "Sonda",      v: "PT100 RTD" },
      { k: "Rango",      v: "−200 °C a +850 °C" },
      { k: "Precisión",  v: "±0.5 °C" },
      { k: "Interfaz",   v: "SPI 4 hilos" },
    ],
  },
];

interface MediaItem { url: string; title: string; kind?: string }

// ── Schema Viewer — editorial featured+thumbnails ────────────────────────────
function SchemaViewer() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setActive(i => (i + 1) % SCHEMAS.length), 5500);
    return () => clearInterval(id);
  }, [paused]);

  const s = SCHEMAS[active];

  return (
    <div>
      <div className="flex items-center gap-4 mb-5">
        <div className="h-px flex-1 bg-white/[0.06]" />
        <p className="text-white/35 font-mono text-[11px] uppercase tracking-widest">Esquemas reales del hardware</p>
        <div className="h-px flex-1 bg-white/[0.06]" />
      </div>
      <p className="text-center text-white/45 text-sm mb-8 max-w-xl mx-auto">
        Los diagramas muestran cómo están físicamente conectados los componentes — la evidencia de que el flujo anterior es real.
      </p>

      <div className="grid lg:grid-cols-5 gap-4">

        {/* Featured image — 3 cols */}
        <div className="lg:col-span-3">
          <div className="relative rounded-2xl overflow-hidden bg-[hsl(210,36%,6%)] border border-white/[0.07] group" style={{ aspectRatio: "4/3" }}>
            {SCHEMAS.map((sc, i) => (
              <img key={sc.src} src={sc.src} alt={sc.label}
                className="absolute inset-0 w-full h-full object-contain p-5 transition-opacity duration-500"
                style={{ opacity: i === active ? 1 : 0 }}
                loading={i === 0 ? "eager" : "lazy"} />
            ))}

            {/* Info overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/90 via-black/50 to-transparent translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
              <span className="font-mono text-[10px] uppercase tracking-widest block mb-1.5" style={{ color: "#00c9a7" }}>{s.tag}</span>
              <h4 className="text-white font-bold text-sm mb-1.5 leading-snug">{s.label}</h4>
              <p className="text-white/60 text-xs leading-relaxed">{s.desc}</p>
            </div>

            {/* Counter */}
            <div className="absolute top-3 left-3 font-mono text-[10px] px-2.5 py-1 rounded-full"
              style={{ background: "#00c9a710", border: "1px solid #00c9a730", color: "#00c9a7" }}>
              {active + 1} / {SCHEMAS.length}
            </div>

            {/* Open full resolution */}
            <a href={s.src} target="_blank" rel="noopener noreferrer"
              className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-black/55 border border-white/10 flex items-center justify-center text-white/35 hover:text-white hover:border-white/25 transition-all"
              title="Ver imagen completa">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Thumbnail list — 2 cols */}
        <div className="lg:col-span-2 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible" style={{ scrollbarWidth: "none" }}>
          {SCHEMAS.map((sc, i) => (
            <button key={i} type="button"
              onClick={() => { setActive(i); setPaused(true); }}
              className={`group flex-shrink-0 lg:flex-shrink flex gap-3 items-center rounded-xl border p-2.5 text-left transition-all duration-200 w-28 lg:w-auto ${
                active === i
                  ? "border-[hsl(168,72%,42%)]/45 bg-[hsl(168,72%,42%)]/[0.08]"
                  : "border-white/[0.06] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
              }`}
            >
              <div className={`relative flex-shrink-0 overflow-hidden rounded-lg bg-black/40 ${active === i ? "ring-1 ring-[hsl(168,72%,42%)]/55" : ""}`}
                style={{ width: "56px", aspectRatio: "4/3" }}>
                <img src={sc.src} alt={sc.label} className="w-full h-full object-contain" loading="lazy" />
              </div>
              <div className="flex-1 min-w-0 hidden lg:block">
                <p className="font-mono text-[9px] uppercase tracking-widest mb-0.5 truncate"
                  style={{ color: active === i ? "#00c9a7" : "rgba(255,255,255,0.28)" }}>{sc.tag}</p>
                <p className={`text-xs font-medium line-clamp-2 leading-snug ${active === i ? "text-white" : "text-white/55"}`}>{sc.label}</p>
              </div>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}

// ── Interactive component showcase ────────────────────────────────────────────
function ComponentShowcase() {
  const [activeId, setActiveId] = useState(COMPONENTS[0].id);
  const [imgIdx, setImgIdx] = useState(0);
  const c = COMPONENTS.find(x => x.id === activeId) ?? COMPONENTS[0];

  const select = (id: string) => { setActiveId(id); setImgIdx(0); };

  return (
    <div>
      {/* Tab selector */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {COMPONENTS.map(comp => (
          <button key={comp.id} type="button" onClick={() => select(comp.id)}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border"
            style={comp.id === activeId
              ? { borderColor: comp.accent + "50", background: comp.accent + "12", color: "white", boxShadow: `0 2px 0 0 ${comp.accent}` }
              : { borderColor: "rgba(255,255,255,0.07)", background: "transparent", color: "rgba(255,255,255,0.4)" }}>
            <span className="font-mono text-[10px]" style={{ color: comp.id === activeId ? comp.accent : "rgba(255,255,255,0.50)" }}>
              {comp.num}
            </span>
            {comp.title}
          </button>
        ))}
      </div>

      {/* Showcase layout */}
      <div className="grid md:grid-cols-5 gap-8 items-center">
        {/* Photo — 3/5 */}
        <div className="md:col-span-3 relative rounded-2xl overflow-hidden bg-black border border-white/[0.07]" style={{ aspectRatio: "4/3" }}>
          <div className="absolute top-0 inset-x-0 h-0.5" style={{ background: c.accent }} />
          {c.images.map((src, i) => (
            <img key={src} src={src} alt={c.title}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
              style={{ opacity: i === imgIdx ? 1 : 0 }}
              loading={i === 0 ? "eager" : "lazy"} />
          ))}
          {c.images.length > 1 && (
            <div className="absolute bottom-3 inset-x-0 flex gap-2 justify-center">
              {c.images.map((_, i) => (
                <button key={i} type="button" onClick={() => setImgIdx(i)}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{ width: i === imgIdx ? "20px" : "6px", background: i === imgIdx ? c.accent : "rgba(255,255,255,0.3)" }} />
              ))}
            </div>
          )}
        </div>

        {/* Info — 2/5 */}
        <div className="md:col-span-2">
          <p className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: c.accent }}>{c.role}</p>
          <h4 className="text-white text-2xl font-bold mb-4">{c.title}</h4>
          <p className="text-white/65 text-sm leading-relaxed mb-7 text-justify">{c.desc}</p>
          <div className="space-y-0">
            {c.specs.map((sp, i) => (
              <div key={sp.k} className={`flex items-center justify-between py-2.5 ${i < c.specs.length - 1 ? "border-b border-white/[0.06]" : ""}`}>
                <span className="text-white/60 text-xs font-mono uppercase tracking-wide">{sp.k}</span>
                <span className="text-white text-xs font-semibold">{sp.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Component mini-gallery card ───────────────────────────────────────────────
function ComponentCard({ title, role, desc, images, accent }: {
  title: string; role: string; desc: string; images: string[]; accent: string;
}) {
  const [idx, setIdx] = useState(0);
  return (
    <div className="rounded-2xl overflow-hidden bg-white/[0.04] border border-white/[0.08] flex flex-col group hover:border-white/20 transition-colors">
      <div className="relative bg-black overflow-hidden" style={{ aspectRatio: "4/3" }}>
        {images.map((src, i) => (
          <img key={src} src={src} alt={title}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
            style={{ opacity: i === idx ? 1 : 0 }}
            loading="lazy" />
        ))}
        {images.length > 1 && (
          <>
            <button type="button" onClick={() => setIdx(i => (i - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/80 hover:bg-black/80 transition-all" aria-label="Anterior">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={() => setIdx(i => (i + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/80 hover:bg-black/80 transition-all" aria-label="Siguiente">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <span className="absolute bottom-2 right-2 font-mono text-[10px] text-white/50 bg-black/50 px-1.5 py-0.5 rounded">
              {idx + 1}/{images.length}
            </span>
          </>
        )}
        <div className="absolute bottom-0 inset-x-0 h-0.5" style={{ background: accent }} />
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <p className="font-mono text-[10px] uppercase tracking-widest mb-1.5" style={{ color: accent }}>{role}</p>
        <h4 className="text-white font-bold text-sm mb-2">{title}</h4>
        <p className="text-white/65 text-sm leading-relaxed flex-1">{desc}</p>
      </div>
    </div>
  );
}

// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ end, decimals = 0, suffix = "" }: { end: number; decimals?: number; suffix?: string }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        let cur = 0;
        const step = end / 50;
        const id = setInterval(() => {
          cur = Math.min(cur + step, end);
          setN(cur);
          if (cur >= end) clearInterval(id);
        }, 20);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [end]);
  return <span ref={ref}>{decimals > 0 ? n.toFixed(decimals) : Math.round(n)}{suffix}</span>;
}

// ── Video player with playlist ────────────────────────────────────────────────
function VideoPlayer({ videos, label }: { videos: MediaItem[]; label: string }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = videos[activeIdx];
  if (!active) return null;
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: "16/9" }}>
        <video key={active.url} src={active.url} muted autoPlay playsInline controls loop
          className="w-full h-full object-contain bg-black" />
      </div>
      {videos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {videos.map((v, i) => (
            <button key={v.url} type="button" onClick={() => setActiveIdx(i)}
              className={`flex-shrink-0 w-36 rounded-xl overflow-hidden border transition-colors text-left group ${i === activeIdx ? "border-[hsl(168,72%,42%)] bg-[hsl(168,72%,42%)]/10" : "border-white/10 bg-white/[0.03] hover:border-white/20"}`}>
              <div className="aspect-video bg-black/50 flex items-center justify-center relative">
                <Play className={`h-5 w-5 ${i === activeIdx ? "text-[hsl(168,72%,55%)]" : "text-white/55 group-hover:text-white/80"}`} />
                {i === activeIdx && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[hsl(168,72%,42%)] animate-pulse" />}
              </div>
              <p className="px-2 py-1.5 text-[10px] font-medium text-white/65 truncate">{v.title}</p>
            </button>
          ))}
        </div>
      )}
      <p className="font-mono text-[10px] text-white/55 uppercase tracking-widest">{label} · {videos.length} registros</p>
    </div>
  );
}

// ── FieldMissionCard ─────────────────────────────────────────────────────────
interface MissionCardProps {
  missionId: string; code: string; title: string; location: string;
  accentColor: string; description: string;
  videos: MediaItem[]; images: MediaItem[];
  offsetClass: string;
}

// ── FieldArchivePanel — full-viewport split-screen photo viewer ───────────────
// Left: featured image at natural AR. Right: scrollable thumbnail strip.
// Desktop: side-by-side. Mobile: stacked (image top, thumbnails bottom).
function FieldArchivePanel({
  images, accentColor, title, subtitle, description, isOpen, onClose,
}: {
  images: MediaItem[];
  accentColor: string;
  title: string;
  subtitle: string;
  description: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const thumbsRef = useRef<HTMLDivElement>(null);

  // Reset index, scroll lock, keyboard nav
  useEffect(() => {
    if (!isOpen) return;
    setIdx(0);
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape")      onClose();
      if (e.key === "ArrowRight")  setIdx(i => Math.min(i + 1, images.length - 1));
      if (e.key === "ArrowLeft")   setIdx(i => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, images.length]);

  // Keep active thumbnail visible in the sidebar
  useEffect(() => {
    const el = thumbsRef.current?.querySelector<HTMLElement>(`[data-idx="${idx}"]`);
    el?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [idx]);

  if (!images.length) return null;
  const active = images[idx];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-0 z-[150] flex flex-col"
          style={{ background: "hsl(212,32%,4%)" }}
        >
          {/* ── Header ──────────────────────────────────────────────── */}
          <div
            className="shrink-0 flex items-center gap-3 px-4 md:px-6 h-12 border-b"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            {/* Mission badge */}
            <span
              className="font-mono text-[10px] uppercase tracking-[0.22em] px-2.5 py-0.5 rounded-sm shrink-0"
              style={{ background: `${accentColor}1c`, color: accentColor }}
            >
              {subtitle}
            </span>

            {/* Title */}
            <span className="text-white/90 font-semibold text-sm shrink-0">{title}</span>

            {/* Separator + description (desktop only) */}
            <span className="hidden md:block w-px h-3.5 shrink-0 bg-white/10" />
            <span className="hidden md:block text-white/28 text-xs truncate min-w-0 leading-relaxed">
              {description}
            </span>

            {/* Spacer */}
            <div className="ml-auto flex items-center gap-4 shrink-0">
              {/* Counter */}
              <span className="font-mono text-[11px] tabular-nums select-none"
                style={{ color: `${accentColor}65` }}>
                {String(idx + 1).padStart(3, "0")}&thinsp;/&thinsp;{String(images.length).padStart(3, "0")}
              </span>

              {/* Close */}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center border border-white/[0.08] text-white/35 hover:text-white hover:border-white/22 transition-colors focus:outline-none"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ── Body ─────────────────────────────────────────────────── */}
          <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">

            {/* Featured image ─────────────────────────────────────────── */}
            <div className="flex-1 min-h-0 relative flex items-center justify-center p-5 md:p-8 lg:p-12">
              <AnimatePresence mode="wait">
                <motion.img
                  key={active.url}
                  src={active.url}
                  alt={active.title}
                  initial={{ opacity: 0, scale: 0.972 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.018 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  className="max-w-full max-h-full object-contain rounded-lg select-none"
                  style={{ boxShadow: `0 16px 100px ${accentColor}16` }}
                  draggable={false}
                />
              </AnimatePresence>

              {/* Prev arrow */}
              {idx > 0 && (
                <button
                  onClick={() => setIdx(i => i - 1)}
                  className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center border border-white/[0.08] text-white/30 hover:text-white hover:border-white/20 transition-all focus:outline-none"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}

              {/* Next arrow */}
              {idx < images.length - 1 && (
                <button
                  onClick={() => setIdx(i => i + 1)}
                  className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center border border-white/[0.08] text-white/30 hover:text-white hover:border-white/20 transition-all focus:outline-none"
                  aria-label="Foto siguiente"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}

              {/* Caption */}
              {active.title && (
                <p
                  className="absolute bottom-3 left-0 right-0 text-center px-10 font-mono text-[9px] uppercase tracking-[0.22em] pointer-events-none select-none"
                  style={{ color: "rgba(255,255,255,0.18)" }}
                >
                  {active.title}
                </p>
              )}
            </div>

            {/* Thumbnail sidebar ───────────────────────────────────────── */}
            <div
              className="shrink-0 flex flex-col overflow-hidden border-t md:border-t-0 md:border-l max-h-[32vh] md:max-h-none md:w-60 lg:w-72"
              style={{ borderColor: "rgba(255,255,255,0.05)" }}
            >
              {/* Sidebar label */}
              <div
                className="shrink-0 flex items-center justify-between px-3 py-2"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              >
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/18 select-none">
                  {images.length} fotografías
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] select-none"
                  style={{ color: `${accentColor}45` }}>
                  ←  →
                </span>
              </div>

              {/* Scrollable thumbnail grid */}
              <div
                ref={thumbsRef}
                className="overflow-y-auto overflow-x-hidden flex-1"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: `${accentColor}28 transparent`,
                }}
              >
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: "repeat(auto-fill, minmax(68px, 1fr))",
                    gap: "1.5px",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  {images.map((img, i) => (
                    <button
                      key={img.url}
                      data-idx={i}
                      type="button"
                      onClick={() => setIdx(i)}
                      className="relative overflow-hidden focus:outline-none group"
                      style={{ aspectRatio: "1/1" }}
                      aria-label={`Foto ${i + 1}`}
                      aria-pressed={i === idx}
                    >
                      <img
                        src={img.url} alt=""
                        className="w-full h-full object-cover transition-all duration-250"
                        style={{
                          filter: i === idx
                            ? "brightness(1) grayscale(0)"
                            : "brightness(0.32) grayscale(0.4)",
                          transform: i === idx ? "scale(1.05)" : "scale(1)",
                        }}
                        loading="lazy"
                      />
                      {/* Selected border */}
                      {i === idx && (
                        <div className="absolute inset-0 pointer-events-none"
                          style={{ boxShadow: `inset 0 0 0 2px ${accentColor}` }} />
                      )}
                      {/* Hover: show frame number */}
                      <span
                        className="absolute bottom-0.5 right-0.5 font-mono leading-none opacity-0 group-hover:opacity-100 transition-opacity bg-black/65 px-1 py-0.5 rounded-sm"
                        style={{ fontSize: "7px", color: i === idx ? accentColor : "rgba(255,255,255,0.4)" }}
                      >
                        {String(i + 1).padStart(3, "0")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ── PhotoDossier — trigger strip that opens FieldArchivePanel ─────────────────
function PhotoDossier({
  images, accentColor, title, subtitle, description,
}: {
  images: MediaItem[];
  accentColor: string;
  title: string;
  subtitle: string;
  description: string;
}) {
  const [panelOpen,    setPanelOpen]    = useState(false);
  const [panelMounted, setPanelMounted] = useState(false);

  const openPanel  = () => { setPanelMounted(true); setPanelOpen(true); };
  const closePanel = useCallback(() => {
    setPanelOpen(false);
    setTimeout(() => setPanelMounted(false), 280);
  }, []);

  if (images.length === 0) return null;

  // 5 evenly-spaced previews for the filmstrip
  const previews = [0, 1, 2, 3, 4].map(k =>
    images[Math.min(Math.floor(k * images.length / 5), images.length - 1)]
  );

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        className="w-full group relative rounded-xl overflow-hidden focus:outline-none transition-all duration-300"
        style={{ border: "1px solid rgba(255,255,255,0.06)" }}
        aria-label="Abrir galería fotográfica"
      >
        {/* Preview strip */}
        <div className="flex overflow-hidden" style={{ height: "76px" }}>
          {previews.map((img, k) => (
            <div key={k} className="flex-1 overflow-hidden">
              <img src={img.url} alt="" aria-hidden="true"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                style={{ filter: "brightness(0.42)" }}
                loading="lazy"
              />
            </div>
          ))}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(90deg, rgba(7,13,20,0.92) 0%, rgba(7,13,20,0.20) 28%, rgba(7,13,20,0.20) 72%, rgba(7,13,20,0.92) 100%)" }}
          />
        </div>

        {/* Label overlay */}
        <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.28em] mb-0.5"
              style={{ color: `${accentColor}80` }}>
              Archivo fotográfico
            </p>
            <p className="font-bold text-white text-sm">{images.length} registros</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/38 group-hover:text-white/65 transition-colors">
              ver galería
            </span>
            <div className="w-7 h-7 rounded-full flex items-center justify-center border transition-all duration-300 group-hover:scale-110"
              style={{ borderColor: `${accentColor}38`, background: `${accentColor}12` }}>
              <ZoomIn className="h-3.5 w-3.5" style={{ color: accentColor }} />
            </div>
          </div>
        </div>

        {/* Hover: accent inset ring */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ boxShadow: `inset 0 0 0 1px ${accentColor}25` }}
        />
      </button>

      {panelMounted && (
        <FieldArchivePanel
          isOpen={panelOpen}
          onClose={closePanel}
          images={images}
          accentColor={accentColor}
          title={title}
          subtitle={subtitle}
          description={description}
        />
      )}
    </>
  );
}

// Sub-section divider label — only rendered when a card has both media types
function SubLabel({ label, accentColor }: { label: string; accentColor: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${accentColor}28, transparent)` }} />
      <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.22em]">{label}</span>
      <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}28)` }} />
    </div>
  );
}

function FieldMissionCard({
  missionId, code, title, location, accentColor, description,
  videos, images, offsetClass,
}: MissionCardProps) {
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);
  const safeVideoIdx = videos.length > 0 ? Math.min(activeVideoIdx, videos.length - 1) : 0;
  const activeVideo  = videos[safeVideoIdx];

  const hasVideos = videos.length > 0;
  const hasImages = images.length > 0;
  const hasBoth   = hasVideos && hasImages;
  const loading   = !hasVideos && !hasImages;

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-white/[0.07] hover:border-white/[0.15] transition-colors duration-500 ${offsetClass}`}
      style={{ background: "linear-gradient(160deg, hsl(210,38%,7.5%), hsl(210,38%,5.5%))" }}
    >
      {/* Color identity overlay */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
        style={{ background: `radial-gradient(ellipse 90% 55% at 0% 0%, ${accentColor}10, transparent 68%)` }} />
      {/* Accent bar */}
      <div className="h-[3px]"
        style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}55 45%, transparent 82%)` }} />

      {/* Watermark number */}
      <div className="absolute -bottom-5 -right-2 font-black leading-none select-none pointer-events-none"
        style={{ fontSize: "9.5rem", color: accentColor, opacity: 0.045, lineHeight: 1 }}
        aria-hidden="true">
        {missionId}
      </div>

      <div className="relative p-5 lg:p-6">

        {/* ── Card header ── */}
        <div className="mb-5">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-2.5 py-0.5 rounded-sm font-mono text-[10px] uppercase tracking-[0.2em] border"
              style={{ color: accentColor, borderColor: `${accentColor}45`, backgroundColor: `${accentColor}12` }}>
              {code}
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[hsl(168,72%,50%)]">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "hsl(168,72%,48%)" }} />
              Completado
            </span>
          </div>
          <h4 className="text-[1.35rem] font-black text-white leading-tight mb-1.5">{title}</h4>
          <p className="font-mono text-[10px] text-white/35 uppercase tracking-[0.18em] flex items-center gap-1.5">
            <MapPin className="h-3 w-3 shrink-0" style={{ color: accentColor, opacity: 0.7 }} />
            {location}
          </p>
        </div>

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] animate-pulse mb-5"
            style={{ height: "200px" }} />
        )}

        {/* ══ VIDEO SUB-SECTION ══
             The <video> element has no fixed container height — it expands to its
             intrinsic aspect ratio (width: 100%; display: block; height: auto).
             No black bars, no stretching, no cropping. */}
        {hasVideos && (
          <div className="mb-5">
            {hasBoth && <SubLabel label={`Video · ${videos.length}`} accentColor={accentColor} />}

            {/* Main video — natural aspect ratio */}
            <div className="rounded-xl overflow-hidden bg-black mb-2.5"
              style={{ minHeight: "140px" }}>
              <video
                key={activeVideo.url}
                src={activeVideo.url}
                muted autoPlay playsInline controls loop
                style={{ width: "100%", display: "block" }}
              />
            </div>

            {/* Video thumbnail strip */}
            {videos.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
                {videos.map((v, i) => (
                  <button
                    key={v.url}
                    type="button"
                    onClick={() => setActiveVideoIdx(i)}
                    className="flex-shrink-0 rounded-md overflow-hidden border transition-all duration-200"
                    style={{
                      width: "2.75rem", height: "2.75rem",
                      borderColor: i === safeVideoIdx ? accentColor : "rgba(255,255,255,0.1)",
                      opacity: i === safeVideoIdx ? 1 : 0.42,
                    }}
                    aria-label={v.title}
                  >
                    <div className="w-full h-full flex items-center justify-center"
                      style={{ background: "hsl(210,38%,6%)" }}>
                      <Play className="h-3.5 w-3.5"
                        style={{ color: i === safeVideoIdx ? accentColor : "rgba(255,255,255,0.45)" }} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ IMAGE SUB-SECTION — PhotoWall contact sheet ══ */}
        {hasImages && (
          <div className="mb-5">
            {hasBoth && <SubLabel label={`Fotografías · ${images.length}`} accentColor={accentColor} />}
            <PhotoDossier
              images={images}
              accentColor={accentColor}
              title={title}
              subtitle={code}
              description={description}
            />
          </div>
        )}

        {/* ── Description ── */}
        <p className="text-white/60 text-sm leading-relaxed">{description}</p>

        {/* ── Footer ── */}
        <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-3">
          <span className="font-mono text-[10px] text-white/28 uppercase tracking-wider shrink-0">
            {loading
              ? "Cargando…"
              : `${videos.length + images.length} registros`}
          </span>
          <div className="flex-1 h-px"
            style={{ background: `linear-gradient(90deg, ${accentColor}35, transparent)` }} />
        </div>
      </div>
    </div>
  );
}

// ── Pre-computed waveform paths for the section 06 signal monitor ─────────────
const SENSOR_CHANNELS = (() => {
  const W = 1400, H = 76, mid = H / 2;
  return [
    { id: "ph",  label: "pH",  desc: "Acidez",      end: 7.4, dec: 1, suf: "",  color: "#00c9a7", amp: 18, freq: 3, dur: "5.5s", delay: "0s"    },
    { id: "tmp", label: "°C",  desc: "Temperatura", end: 24,  dec: 0, suf: "°", color: "#38bdf8", amp: 12, freq: 5, dur: "3.8s", delay: "-1.4s"  },
    { id: "ntu", label: "NTU", desc: "Turbidez",    end: 12,  dec: 0, suf: "",  color: "#fbbf24", amp: 26, freq: 2, dur: "7s",   delay: "-2.8s"  },
  ].map(ch => {
    const pts: string[] = [];
    for (let x = 0; x <= W * 2; x += 8) {
      const t = (x / W) * Math.PI * 2 * ch.freq;
      const y = mid + Math.sin(t) * ch.amp;
      pts.push(x === 0 ? `M${x},${y.toFixed(1)}` : `L${x},${y.toFixed(1)}`);
    }
    return { ...ch, W, H, wavePath: pts.join(" ") };
  });
})();

// ── Main component ────────────────────────────────────────────────────────────
export function ProjectSection() {
  const heading      = useSiteValue("project.heading", "M.A.N.G.O.");
  const [campoImgs,   setCampoImgs]   = useState<MediaItem[]>([]);
  const [campoVids,   setCampoVids]   = useState<MediaItem[]>([]);
  const [pruebasVids, setPruebasVids] = useState<MediaItem[]>([]);
  const [heroIdx,     setHeroIdx]     = useState(0);
  const [videoActive, setVideoActive] = useState(false);
  const stripRef    = useRef<HTMLDivElement>(null);
  const section07Ref = useRef<HTMLDivElement>(null);

  // Parallel fetch — all 6 pages at once
  useEffect(() => {
    let dead = false;
    Promise.all(
      [1,2,3,4,5,6].map(p =>
        fetch(`/api/v1/public/media?per_page=100&page=${p}`)
          .then(r => r.ok ? r.json() : { items: [] })
          .catch(() => ({ items: [] }))
      )
    ).then(pages => {
      if (dead) return;
      const cI: MediaItem[] = [], cV: MediaItem[] = [], pV: MediaItem[] = [];
      for (const d of pages) {
        for (const item of (d.items ?? [])) {
          if (!item.url?.startsWith("/api/v1/uploads/")) continue;
          if (item.kind === "image" && item.category === "Campo")   cI.push(item);
          if (item.kind === "video" && item.category === "Campo")   cV.push(item);
          if (item.kind === "video" && item.category === "Pruebas") pV.push(item);
        }
      }
      setCampoImgs(cI);
      setCampoVids(cV.reverse());
      setPruebasVids(pV.reverse());
    });
    return () => { dead = true; };
  }, []);

  // Hero image subset
  const heroImgs = useMemo(() => {
    if (!campoImgs.length) return [];
    const step = Math.max(1, Math.floor(campoImgs.length / 8));
    return campoImgs.filter((_, i) => i % step === 0).slice(0, 8);
  }, [campoImgs]);

  // Video redistribution across the three field missions:
  // - First 3 campo vids → Rozo (Mission 03)
  // - Index 3 to (length-3) → Lago Calima (Mission 02)
  // - Last 2 campo vids appended to pruebasVids → Test de Componentes (Mission 01)
  const rozoVids = useMemo(() => {
    const safeMax = Math.max(0, campoVids.length - 2);
    return campoVids.slice(0, Math.min(3, safeMax));
  }, [campoVids]);
  const calimaVids = useMemo(() => {
    const end = campoVids.length - 2;
    return end > 3 ? campoVids.slice(3, end) : [];
  }, [campoVids]);
  const compTestVids = useMemo(() => [
    ...pruebasVids,
    ...(campoVids.length >= 2 ? campoVids.slice(-2) : []),
  ], [pruebasVids, campoVids]);

  // Hero slideshow
  useEffect(() => {
    if (heroImgs.length < 2) return;
    const id = setInterval(() => setHeroIdx(i => (i + 1) % heroImgs.length), 4500);
    return () => clearInterval(id);
  }, [heroImgs.length]);

  const nudge = useCallback((dir: 1 | -1) => {
    stripRef.current?.scrollBy({ left: dir * (stripRef.current.clientWidth * 0.75), behavior: "smooth" });
  }, []);

  // Autoplay video when section 07 enters viewport
  useEffect(() => {
    const el = section07Ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVideoActive(true); obs.disconnect(); } },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="proyecto" className="bg-[hsl(210,35%,8%)]">

      {/* ── 01 HERO ─────────────────────────────────────────────────────── */}
      <div className="relative min-h-screen flex flex-col justify-center overflow-hidden">
        {heroImgs.map((img, i) => (
          <img key={img.url} src={img.url} alt="" aria-hidden
            className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000"
            style={{ opacity: i === heroIdx ? 1 : 0 }}
            loading={i === 0 ? "eager" : "lazy"} />
        ))}
        {/* Uniform base — ensures text stays readable regardless of image tone or crop */}
        <div className="absolute inset-0 bg-[hsl(210,38%,5%)]/52" />
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(210,38%,5%)] via-transparent to-[hsl(210,38%,5%)]/35" />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(210,38%,5%)]/75 via-transparent to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 lg:px-8 py-24 lg:py-28">
          <p className="font-mono text-[hsl(168,72%,55%)] text-xs tracking-[0.35em] uppercase mb-7 text-center">
            01 — El Dispositivo
          </p>

          {/* Two-column on desktop: text left (3/5), floating 3D model right (2/5) */}
          <div className="lg:grid lg:grid-cols-5 lg:items-center lg:gap-8">

            {/* Text column */}
            <div className="lg:col-span-3">
              <h2 className="font-black tracking-tight text-white leading-none mb-7"
                style={{ fontSize: "clamp(3rem, 7.5vw, 6.5rem)" }}>
                <DecryptedText text={heading} speed={22} maxIterations={7} animateOn="view"
                  className="text-white" encryptedClassName="text-[hsl(168,72%,42%)]/40" />
              </h2>
              <p className="text-lg lg:text-xl text-white/75 max-w-lg font-light leading-relaxed">
                Un dispositivo impermeable y autónomo que mide la acidez, la temperatura y la turbidez del agua — las tres señales clave para saber si un ecosistema acuático está sano o en peligro — sin que nadie tenga que estar presente.
              </p>
              {heroImgs.length > 1 && (
                <div className="flex gap-2 mt-8">
                  {heroImgs.map((_, i) => (
                    <button key={i} type="button" onClick={() => setHeroIdx(i)} aria-label={`Imagen ${i+1}`}
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ width: i === heroIdx ? "28px" : "8px", background: i === heroIdx ? "hsl(168,72%,52%)" : "rgba(255,255,255,0.3)" }} />
                  ))}
                </div>
              )}
            </div>

            {/* 3D model column — desktop only, transparent canvas floats over the hero photo */}
            <div
              className="hidden lg:flex lg:col-span-2 items-center justify-center pointer-events-auto"
              style={{ height: "500px" }}
              aria-hidden="true"
            >
              <Suspense fallback={null}>
                <FloatingModel3D
                  url={HERO_MODEL_URL}
                  speed={1.6}
                  style={{ width: "100%", height: "100%" }}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {/* ── 02 EL PROBLEMA ──────────────────────────────────────────────── */}
      <div className="py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-16">
            <p className="font-mono text-[hsl(168,72%,55%)] text-xs tracking-[0.4em] uppercase mb-4 text-center">02 — El Problema</p>
            <h3 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
              Los ecosistemas cambian<br />
              <span className="text-[hsl(168,72%,52%)]">más rápido de lo que podemos verlos</span>
            </h3>
            <p className="text-white/70 text-lg leading-relaxed max-w-2xl mx-auto text-center">
              Los manglares son bosques que crecen en la costa, entre el mar y la tierra. Son el hogar de miles de especies, protegen los litorales de las tormentas y absorben dióxido de carbono. Pero están desapareciendo — y no lo detectamos a tiempo porque nadie está midiendo constantemente lo que le pasa al agua que los alimenta.
            </p>
          </div>

          {/* Manglar illustration + sensor readouts */}
          <div className="grid lg:grid-cols-5 gap-10 items-center mb-20">

            {/* Left: sensor offline displays */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <p className="font-mono text-white/60 text-[10px] uppercase tracking-widest mb-2">Sin monitoreo — datos ausentes</p>
              {[
                { label: "pH del agua",    unit: "pH",  color: "#00c9a7", desc: "Acidez del agua — indica contaminación o estrés" },
                { label: "Temperatura",    unit: "°C",  color: "#38bdf8", desc: "Temperatura del agua — detecta anomalías térmicas" },
                { label: "Turbidez",       unit: "NTU", color: "#fbbf24", desc: "Claridad del agua — sube con algas o sedimentos" },
              ].map(s => (
                <div key={s.label} className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-4 flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: s.color + "12", border: `1px solid ${s.color}25` }}>
                    <span className="font-black text-base" style={{ color: s.color + "80" }}>{s.unit}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                      <span className="font-mono text-[9px] text-red-400/70 uppercase tracking-widest">Sin señal</span>
                    </div>
                    <p className="text-white font-semibold text-sm">{s.label}</p>
                    <p className="font-mono text-white/55 text-xs">{s.desc}</p>
                  </div>
                  <div className="font-mono text-2xl font-black text-white/35 flex-shrink-0">—</div>
                </div>
              ))}
              <div className="mt-2 rounded-xl bg-red-500/[0.06] border border-red-500/15 p-3 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                <p className="text-red-400/80 text-xs font-mono">Sistema desconectado — sin datos en tiempo real</p>
              </div>
            </div>

            {/* Right: Manglar SVG */}
            <div className="lg:col-span-3">
              <svg viewBox="0 0 520 310" className="w-full" aria-hidden>
                <defs>
                  <linearGradient id="pg-sky2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(215,42%,7%)" />
                    <stop offset="100%" stopColor="hsl(200,48%,11%)" />
                  </linearGradient>
                  <linearGradient id="pg-water2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(197,55%,13%)" />
                    <stop offset="100%" stopColor="hsl(210,50%,5%)" />
                  </linearGradient>
                  <linearGradient id="pg-mud" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(30,20%,12%)" />
                    <stop offset="100%" stopColor="hsl(30,18%,8%)" />
                  </linearGradient>
                </defs>

                {/* Sky */}
                <rect width="520" height="310" fill="url(#pg-sky2)" rx="16" />

                {/* Stars */}
                {[[45,22],[80,15],[130,30],[200,12],[330,18],[390,28],[460,14],[490,35]].map(([x,y],i) => (
                  <circle key={i} cx={x} cy={y} r="1.2" fill="white" opacity="0.35" />
                ))}

                {/* Water body */}
                <rect x="0" y="185" width="520" height="125" fill="url(#pg-water2)" rx="0" />

                {/* Mud / sediment at bottom */}
                <rect x="0" y="285" width="520" height="25" fill="url(#pg-mud)" rx="0" />

                {/* Water surface wave */}
                <path d="M0,186 Q65,182 130,186 Q195,190 260,186 Q325,182 390,186 Q455,190 520,186"
                  fill="none" stroke="hsl(197,60%,38%)" strokeWidth="1.5" opacity="0.55" />

                {/* Water shimmer lines */}
                <path d="M30,205 Q80,202 130,205" stroke="#38bdf8" fill="none" strokeWidth="0.7" opacity="0.1" />
                <path d="M180,218 Q240,214 300,218" stroke="#38bdf8" fill="none" strokeWidth="0.7" opacity="0.1" />
                <path d="M360,208 Q410,205 460,208" stroke="#38bdf8" fill="none" strokeWidth="0.7" opacity="0.1" />
                <path d="M60,230 Q110,227 160,230" stroke="#38bdf8" fill="none" strokeWidth="0.5" opacity="0.07" />
                <path d="M310,240 Q360,237 410,240" stroke="#38bdf8" fill="none" strokeWidth="0.5" opacity="0.07" />

                {/* ── TREE 1 (left, x=105) ── */}
                {/* Prop roots - the signature mangrove feature */}
                <path d="M105,168 Q78,180 62,186" stroke="#2a5a2a" fill="none" strokeWidth="3" strokeLinecap="round" />
                <path d="M105,172 Q73,183 54,186" stroke="#245224" fill="none" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M105,165 Q132,178 148,186" stroke="#2a5a2a" fill="none" strokeWidth="3" strokeLinecap="round" />
                <path d="M105,170 Q136,182 155,186" stroke="#245224" fill="none" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M105,158 Q82,172 66,186" stroke="#1e471e" fill="none" strokeWidth="2" strokeLinecap="round" />
                <path d="M105,158 Q128,172 144,186" stroke="#1e471e" fill="none" strokeWidth="2" strokeLinecap="round" />
                {/* Small secondary roots */}
                <path d="M85,175 Q72,181 64,186" stroke="#1a401a" fill="none" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M125,175 Q138,181 146,186" stroke="#1a401a" fill="none" strokeWidth="1.2" strokeLinecap="round" />
                {/* Trunk */}
                <line x1="105" y1="168" x2="105" y2="78" stroke="#2a5a2a" strokeWidth="6" strokeLinecap="round" />
                {/* Branches */}
                <line x1="105" y1="95" x2="76" y2="65" stroke="#2a5a2a" strokeWidth="3.5" strokeLinecap="round" />
                <line x1="105" y1="92" x2="134" y2="62" stroke="#2a5a2a" strokeWidth="3.5" strokeLinecap="round" />
                <line x1="105" y1="85" x2="105" y2="55" stroke="#2a5a2a" strokeWidth="3" strokeLinecap="round" />
                <line x1="76" y1="65" x2="58" y2="45" stroke="#245224" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="134" y1="62" x2="152" y2="42" stroke="#245224" strokeWidth="2.5" strokeLinecap="round" />
                {/* Foliage */}
                <ellipse cx="76" cy="52" rx="24" ry="15" fill="#1a4a1a" opacity="0.95" />
                <ellipse cx="105" cy="44" rx="28" ry="17" fill="#1e5420" opacity="0.95" />
                <ellipse cx="134" cy="50" rx="24" ry="15" fill="#1a4a1a" opacity="0.95" />
                <ellipse cx="58" cy="42" rx="16" ry="10" fill="#163c16" opacity="0.9" />
                <ellipse cx="152" cy="40" rx="16" ry="10" fill="#163c16" opacity="0.9" />
                {/* Foliage highlights */}
                <ellipse cx="102" cy="41" rx="13" ry="7" fill="#286228" opacity="0.55" />
                <ellipse cx="76" cy="49" rx="10" ry="6" fill="#255225" opacity="0.45" />

                {/* ── TREE 2 (center, x=275, tallest) ── */}
                {/* Prop roots - wider spread */}
                <path d="M275,158 Q242,173 222,186" stroke="#2a5a2a" fill="none" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M275,163 Q247,177 230,186" stroke="#245224" fill="none" strokeWidth="3" strokeLinecap="round" />
                <path d="M275,168 Q258,180 248,186" stroke="#1e471e" fill="none" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M275,158 Q308,173 328,186" stroke="#2a5a2a" fill="none" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M275,163 Q303,177 320,186" stroke="#245224" fill="none" strokeWidth="3" strokeLinecap="round" />
                <path d="M275,168 Q292,180 302,186" stroke="#1e471e" fill="none" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M275,150 Q238,167 214,186" stroke="#1a401a" fill="none" strokeWidth="2" strokeLinecap="round" />
                <path d="M275,150 Q312,167 336,186" stroke="#1a401a" fill="none" strokeWidth="2" strokeLinecap="round" />
                {/* Sub-roots */}
                <path d="M248,172 Q236,180 228,186" stroke="#163416" fill="none" strokeWidth="1.3" strokeLinecap="round" />
                <path d="M302,172 Q314,180 322,186" stroke="#163416" fill="none" strokeWidth="1.3" strokeLinecap="round" />
                {/* Trunk */}
                <line x1="275" y1="158" x2="275" y2="45" stroke="#2a5a2a" strokeWidth="8" strokeLinecap="round" />
                {/* Branches */}
                <line x1="275" y1="68" x2="238" y2="35" stroke="#2a5a2a" strokeWidth="5" strokeLinecap="round" />
                <line x1="275" y1="65" x2="312" y2="32" stroke="#2a5a2a" strokeWidth="5" strokeLinecap="round" />
                <line x1="275" y1="58" x2="275" y2="22" stroke="#2a5a2a" strokeWidth="4.5" strokeLinecap="round" />
                <line x1="238" y1="35" x2="215" y2="14" stroke="#245224" strokeWidth="3.5" strokeLinecap="round" />
                <line x1="312" y1="32" x2="335" y2="11" stroke="#245224" strokeWidth="3.5" strokeLinecap="round" />
                <line x1="275" y1="22" x2="255" y2="5" stroke="#1e471e" strokeWidth="3" strokeLinecap="round" />
                <line x1="275" y1="22" x2="295" y2="5" stroke="#1e471e" strokeWidth="3" strokeLinecap="round" />
                {/* Foliage */}
                <ellipse cx="238" cy="22" rx="30" ry="19" fill="#1e5420" opacity="0.95" />
                <ellipse cx="275" cy="10" rx="34" ry="21" fill="#1a4a1a" opacity="0.95" />
                <ellipse cx="312" cy="20" rx="30" ry="19" fill="#1e5420" opacity="0.95" />
                <ellipse cx="215" cy="12" rx="20" ry="12" fill="#163c16" opacity="0.9" />
                <ellipse cx="335" cy="10" rx="20" ry="12" fill="#163c16" opacity="0.9" />
                <ellipse cx="255" cy="4" rx="16" ry="10" fill="#1a4a1a" opacity="0.9" />
                <ellipse cx="295" cy="4" rx="16" ry="10" fill="#1a4a1a" opacity="0.9" />
                {/* Highlights */}
                <ellipse cx="272" cy="7" rx="16" ry="9" fill="#2e6e2e" opacity="0.5" />
                <ellipse cx="238" cy="19" rx="13" ry="7" fill="#286228" opacity="0.45" />
                <ellipse cx="312" cy="17" rx="13" ry="7" fill="#286228" opacity="0.45" />

                {/* ── TREE 3 (right, x=430) ── */}
                {/* Prop roots */}
                <path d="M430,170 Q405,181 390,186" stroke="#2a5a2a" fill="none" strokeWidth="3" strokeLinecap="round" />
                <path d="M430,174 Q402,184 386,186" stroke="#245224" fill="none" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M430,168 Q455,180 468,186" stroke="#2a5a2a" fill="none" strokeWidth="3" strokeLinecap="round" />
                <path d="M430,172 Q458,183 472,186" stroke="#245224" fill="none" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M430,162 Q408,175 394,186" stroke="#1a401a" fill="none" strokeWidth="2" strokeLinecap="round" />
                <path d="M430,162 Q452,175 466,186" stroke="#1a401a" fill="none" strokeWidth="2" strokeLinecap="round" />
                {/* Trunk */}
                <line x1="430" y1="170" x2="430" y2="82" stroke="#2a5a2a" strokeWidth="6" strokeLinecap="round" />
                {/* Branches */}
                <line x1="430" y1="100" x2="402" y2="70" stroke="#2a5a2a" strokeWidth="3.5" strokeLinecap="round" />
                <line x1="430" y1="97" x2="458" y2="67" stroke="#2a5a2a" strokeWidth="3.5" strokeLinecap="round" />
                <line x1="430" y1="90" x2="430" y2="58" stroke="#2a5a2a" strokeWidth="3" strokeLinecap="round" />
                {/* Foliage */}
                <ellipse cx="402" cy="58" rx="24" ry="15" fill="#1a4a1a" opacity="0.95" />
                <ellipse cx="430" cy="47" rx="28" ry="17" fill="#1e5420" opacity="0.95" />
                <ellipse cx="458" cy="55" rx="24" ry="15" fill="#1a4a1a" opacity="0.95" />
                <ellipse cx="430" cy="44" rx="12" ry="7" fill="#2e6e2e" opacity="0.5" />

                {/* ── SENSORS (underwater, offline) ── */}

                {/* pH sensor — left zone (x=155) */}
                <line x1="155" y1="186" x2="155" y2="210" stroke="#00c9a7" strokeWidth="1" strokeDasharray="4,3" opacity="0.5" />
                <line x1="155" y1="218" x2="155" y2="252" stroke="#00c9a7" strokeWidth="1" strokeDasharray="4,3" opacity="0.2" />
                <circle cx="155" cy="262" r="18" fill="hsl(210,42%,9%)" stroke="#00c9a7" strokeWidth="1.5" opacity="0.75" />
                <text x="155" y="258" textAnchor="middle" fill="#00c9a7" fontSize="7.5" fontFamily="monospace" opacity="0.8">pH</text>
                <text x="155" y="270" textAnchor="middle" fill="#00c9a7" fontSize="10" fontFamily="monospace" fontWeight="bold" opacity="0.4">---</text>
                <circle cx="167" cy="249" r="3.5" fill="#ef4444">
                  <animate attributeName="opacity" values="1;0.15;1" dur="1.5s" repeatCount="indefinite" />
                </circle>

                {/* Temp sensor — center (x=275) */}
                <line x1="275" y1="186" x2="275" y2="215" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4,3" opacity="0.5" />
                <line x1="275" y1="223" x2="275" y2="258" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4,3" opacity="0.2" />
                <circle cx="275" cy="268" r="18" fill="hsl(210,42%,9%)" stroke="#38bdf8" strokeWidth="1.5" opacity="0.75" />
                <text x="275" y="264" textAnchor="middle" fill="#38bdf8" fontSize="7.5" fontFamily="monospace" opacity="0.8">°C</text>
                <text x="275" y="276" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold" opacity="0.4">---</text>
                <circle cx="287" cy="255" r="3.5" fill="#ef4444">
                  <animate attributeName="opacity" values="1;0.15;1" dur="1.5s" begin="0.5s" repeatCount="indefinite" />
                </circle>

                {/* Turbidez sensor — right (x=390) */}
                <line x1="390" y1="186" x2="390" y2="208" stroke="#fbbf24" strokeWidth="1" strokeDasharray="4,3" opacity="0.5" />
                <line x1="390" y1="216" x2="390" y2="250" stroke="#fbbf24" strokeWidth="1" strokeDasharray="4,3" opacity="0.2" />
                <circle cx="390" cy="260" r="18" fill="hsl(210,42%,9%)" stroke="#fbbf24" strokeWidth="1.5" opacity="0.75" />
                <text x="390" y="256" textAnchor="middle" fill="#fbbf24" fontSize="6" fontFamily="monospace" opacity="0.8">NTU</text>
                <text x="390" y="268" textAnchor="middle" fill="#fbbf24" fontSize="10" fontFamily="monospace" fontWeight="bold" opacity="0.4">---</text>
                <circle cx="402" cy="247" r="3.5" fill="#ef4444">
                  <animate attributeName="opacity" values="1;0.15;1" dur="1.5s" begin="1s" repeatCount="indefinite" />
                </circle>

                {/* "SIN MONITOREO" label */}
                <rect x="165" y="290" width="190" height="14" rx="7" fill="hsl(0,65%,45%)" fillOpacity="0.1" stroke="hsl(0,65%,45%)" strokeOpacity="0.25" strokeWidth="0.8" />
                <circle cx="178" cy="297" r="3" fill="#ef4444">
                  <animate attributeName="opacity" values="1;0.2;1" dur="1.2s" repeatCount="indefinite" />
                </circle>
                <text x="266" y="301" textAnchor="middle" fill="hsl(0,70%,62%)" fontSize="9" fontFamily="monospace" letterSpacing="1.5" opacity="0.75">SIN MONITOREO</text>
              </svg>
            </div>
          </div>

          {/* Problem cards — redesigned */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                Icon: DollarSign,
                stat: "$5.000+",
                statLabel: "por equipo de análisis",
                title: "Instrumentos inaccesibles",
                desc: "Un kit profesional de análisis de agua puede costar más de $5.000 USD. La mayoría de organizaciones ambientales y comunidades locales no tiene acceso a estos recursos.",
                color: "#fbbf24",
                bg: "hsl(45,80%,12%)",
              },
              {
                Icon: MapPin,
                stat: "+4 hs",
                statLabel: "de viaje por visita",
                title: "Lugares difíciles de alcanzar",
                desc: "Muchos manglares y zonas costeras están en áreas remotas. Llegar requiere horas de viaje, embarcaciones y logística especializada — lo que hace que las visitas sean escasas y costosas.",
                color: "#f472b6",
                bg: "hsl(330,60%,10%)",
              },
              {
                Icon: Clock,
                stat: "0 datos",
                statLabel: "entre visitas periódicas",
                title: "Vacíos de información",
                desc: "Sin sensores instalados de forma permanente, el monitoreo solo ocurre en los momentos de visita. Los cambios críticos — floraciones de algas, acidificación súbita, calentamiento — suceden sin ser registrados.",
                color: "#a78bfa",
                bg: "hsl(265,50%,10%)",
              },
              {
                Icon: Users,
                stat: "3+ expertos",
                statLabel: "por salida de campo",
                title: "Demasiados recursos humanos",
                desc: "Cada medición tradicional requiere biólogos, técnicos ambientales y personal de campo. La escasez de estos profesionales limita directamente cuánto y con qué frecuencia se puede medir.",
                color: "#38bdf8",
                bg: "hsl(200,55%,9%)",
              },
            ].map(({ Icon, stat, statLabel, title, desc, color, bg }) => (
              <div key={title}
                className="rounded-2xl border border-white/[0.08] overflow-hidden flex flex-col hover:border-white/20 transition-all duration-300 group"
                style={{ background: bg }}>
                {/* Top accent line */}
                <div className="h-0.5 w-full" style={{ background: `linear-gradient(to right, ${color}80, ${color}20)` }} />
                <div className="p-6 flex flex-col flex-1">
                  {/* Icon + Stat */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: color + "15", border: `1px solid ${color}30` }}>
                      <Icon className="h-6 w-6" style={{ color }} />
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-black text-xl leading-none" style={{ color }}>{stat}</div>
                      <div className="font-mono text-[9px] text-white/55 uppercase tracking-wide mt-0.5">{statLabel}</div>
                    </div>
                  </div>
                  {/* Title */}
                  <h4 className="text-white font-bold text-base mb-3 leading-snug">{title}</h4>
                  {/* Description */}
                  <p className="text-white/60 text-sm leading-relaxed text-justify flex-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 03 HARDWARE ─────────────────────────────────────────────────── */}
      <div className="py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-14">
            <p className="font-mono text-[hsl(168,72%,55%)] text-xs tracking-[0.35em] uppercase mb-3 text-center">03 — Los Componentes</p>
            <h3 className="text-4xl md:text-5xl font-black text-white mb-4">Así está construido</h3>
            <p className="text-white/60 text-base max-w-xl mx-auto">
              Cada pieza fue seleccionada para resistir la humedad, funcionar sin conexión a internet y operar de forma autónoma durante días sin intervención humana. Todo ensamblado a mano.
            </p>
          </div>

          {/* 3-layer mental model */}
          <div className="grid grid-cols-3 gap-4 mb-16">
            {[
              { num: "01", tag: "1. Captura",       title: "Sensores",       sub: "Acidez · Temperatura · Turbidez",  color: "#00c9a7", icon: (
                <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
                  <circle cx="16" cy="16" r="7" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 4v4M16 24v4M4 16h4M24 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="16" cy="16" r="2.5" fill="currentColor"/>
                </svg>
              )},
              { num: "02", tag: "2. Procesamiento", title: "Procesador",     sub: "Lee, calcula y empaqueta los datos",   color: "#38bdf8", icon: (
                <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
                  <rect x="8" y="8" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2"/>
                  <rect x="12" y="12" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.4"/>
                  <path d="M4 12h4M4 16h4M4 20h4M24 12h4M24 16h4M24 20h4M12 4v4M16 4v4M20 4v4M12 24v4M16 24v4M20 24v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              )},
              { num: "03", tag: "3. Transmisión",  title: "Radio LoRa",     sub: "Sin WiFi ni red celular",      color: "#a78bfa", icon: (
                <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
                  <path d="M16 20a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M9 9a10 10 0 0 0 0 14M23 9a10 10 0 0 1 0 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M5 5a16 16 0 0 0 0 22M27 5a16 16 0 0 1 0 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.45"/>
                </svg>
              )},
            ].map((layer, i, arr) => (
              <div key={layer.tag} className="relative">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 hover:border-white/15 transition-colors h-full"
                  style={{ borderTopColor: layer.color + "50" }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: layer.color + "12", color: layer.color }}>
                      {layer.icon}
                    </div>
                    <span className="font-mono text-[9px] text-white/50 mt-1">{layer.num}</span>
                  </div>
                  <p className="font-mono text-[10px] uppercase tracking-widest mb-1.5" style={{ color: layer.color }}>{layer.tag}</p>
                  <h4 className="text-white font-bold text-base mb-1">{layer.title}</h4>
                  <p className="text-white/65 text-xs font-mono">{layer.sub}</p>
                </div>
                {i < arr.length - 1 && (
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 flex items-center">
                    <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
                      <path d="M1 6h16M12 1l6 5-6 5" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Component showcase */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px flex-1 bg-white/[0.06]" />
              <p className="text-white/60 text-[11px] font-mono uppercase tracking-widest">Componentes</p>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </div>
            <ComponentShowcase />
          </div>

        </div>
      </div>

      {/* ── 04 COMUNICACIÓN Y ESQUEMAS ──────────────────────────────────── */}
      <div className="border-t border-white/[0.06] relative overflow-hidden">
        <style>{`
          @keyframes data-flow {
            0%   { left: -6px; opacity: 0; }
            20%  { opacity: 1; }
            80%  { opacity: 1; }
            100% { left: calc(100% + 6px); opacity: 0; }
          }
        `}</style>

        {/* Dot-grid texture */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.032) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        {/* Ambient glows */}
        <div className="absolute top-20 left-[12%] w-[480px] h-[480px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(0,201,167,0.06), transparent 60%)" }} />
        <div className="absolute bottom-20 right-[8%] w-[380px] h-[380px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(167,139,250,0.05), transparent 60%)" }} />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-28">

          {/* ── Header ── */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-3 mb-5">
              <div className="h-px w-14 bg-[hsl(168,72%,42%)]/30" />
              <span className="font-mono text-[hsl(168,72%,55%)] text-xs tracking-[0.35em] uppercase">04 — Comunicación</span>
              <div className="h-px w-14 bg-[hsl(168,72%,42%)]/30" />
            </div>
            <h3
              className="font-black text-white leading-[0.92] mb-6"
              style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)" }}
            >
              Del agua<br />
              <span style={{
                background: "linear-gradient(135deg, #00c9a7 0%, #38bdf8 45%, #a78bfa 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                hasta tu pantalla
              </span>
            </h3>
            <p className="text-white/55 text-lg max-w-2xl mx-auto leading-relaxed">
              Cada lectura que toman los sensores viaja de forma automática — sin cables ni personas — hasta el panel web donde los investigadores pueden verla en tiempo real.
            </p>
          </div>

          {/* ── Signal Pipeline ── */}
          <div className="flex flex-col lg:flex-row items-stretch gap-0 mb-24">
            {([
              {
                step: "01", label: "Sensores",      sub: "Tres sondas sumergibles",
                desc: "Miden la acidez (pH), temperatura y turbidez del agua cada pocos minutos, de forma continua.",
                img: HW.ph,     color: "#00c9a7",
              },
              {
                step: "02", label: "Procesador",    sub: "ESP32 + Jetson TK1",
                desc: "Recibe las lecturas, las convierte en paquetes de datos y las entrega al módulo de radio.",
                img: HW.jetson, color: "#38bdf8",
              },
              {
                step: "03", label: "Radio LoRa",    sub: "Transmisión sin internet",
                desc: "Envía los paquetes a kilómetros de distancia usando una banda de radio libre. Sin WiFi, sin celular.",
                img: HW.lora,   color: "#a78bfa",
              },
              {
                step: "04", label: "Estación Base", sub: "Nodo receptor",
                desc: "Recibe la señal LoRa y la sube automáticamente al servidor a través de internet.",
                img: null,      color: "#fbbf24",
              },
              {
                step: "05", label: "Panel web",     sub: "Datos en vivo",
                desc: "Investigadores ven todas las lecturas en tiempo real desde cualquier dispositivo, en cualquier lugar.",
                img: null,      color: "#f472b6",
              },
            ] as const).flatMap((node, i, arr) => {
              const out = [];

              // Mobile vertical arrow before each node (except first)
              if (i > 0) {
                out.push(
                  <div key={`marr-${i}`} aria-hidden className="lg:hidden flex justify-center py-2">
                    <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
                      <path d="M7 0v11M1 7l6 9 6-9" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                );
              }

              // Node card
              out.push(
                <div
                  key={node.label}
                  className="relative flex-1 min-w-0 rounded-2xl border overflow-hidden bg-[hsl(210,35%,7%)] hover:bg-[hsl(210,32%,9%)] transition-all duration-500 group"
                  style={{ borderColor: node.color + "22", boxShadow: `0 4px 32px ${node.color}05` }}
                >
                  {/* Color identity overlay */}
                  <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
                    style={{ background: `radial-gradient(ellipse 120% 55% at 0% 0%, ${node.color}0b, transparent 65%)` }} />
                  {/* Colored top accent */}
                  <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${node.color}95, ${node.color}12)` }} />

                  {/* Image / icon area */}
                  <div className="relative overflow-hidden bg-black" style={{ height: "148px" }}>
                    {node.img ? (
                      <>
                        <img src={node.img as string} alt={node.label} loading="lazy"
                          className="w-full h-full object-cover opacity-55 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(210,35%,7%)] via-[hsl(210,35%,7%)]/15 to-transparent" />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"
                        style={{ background: `radial-gradient(ellipse at center, ${node.color}0a, transparent 70%)` }}>
                        <Database className="h-10 w-10 opacity-18" style={{ color: node.color }} />
                      </div>
                    )}

                    {/* Step badge */}
                    <div className="absolute top-3 left-3 rounded font-mono text-[10px] font-bold px-2 py-0.5"
                      style={{ background: node.color + "18", border: `1px solid ${node.color}32`, color: node.color }}>
                      {node.step}
                    </div>

                    {/* Glowing dot at bottom center — visual "output" of the node */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2.5 h-2.5 rounded-full"
                      style={{ background: node.color, boxShadow: `0 0 14px 5px ${node.color}55` }} />
                  </div>

                  {/* Text */}
                  <div className="p-5">
                    <p className="font-mono text-[9px] uppercase tracking-widest mb-1.5" style={{ color: node.color + "a0" }}>{node.sub}</p>
                    <h4 className="text-white font-bold text-[15px] mb-2 leading-snug">{node.label}</h4>
                    <p className="text-white/48 text-xs leading-relaxed">{node.desc}</p>
                  </div>
                </div>
              );

              // Desktop animated connector (after each node except last)
              if (i < arr.length - 1) {
                out.push(
                  <div key={`conn-${i}`} className="hidden lg:flex items-center w-10 flex-shrink-0">
                    <div className="relative w-full" style={{ height: "1px", background: "rgba(255,255,255,0.06)" }}>
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                        style={{
                          background: node.color,
                          boxShadow: `0 0 10px 4px ${node.color}55`,
                          animation: `data-flow 2.2s ${i * 0.55}s linear infinite`,
                        }}
                      />
                    </div>
                  </div>
                );
              }

              return out;
            })}
          </div>

          {/* ── Technical Schemas — integrated below the pipeline ── */}
          <SchemaViewer />

        </div>
      </div>

      {/* ── 05 VALIDACIÓN DE CAMPO ──────────────────────────────────────── */}
      <div className="relative py-24 border-t border-white/[0.06] overflow-hidden">

        {/* Dot-grid field texture */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, rgba(0,201,167,0.055) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

        {/* Survey baseline — subtle horizontal axis evoking field measurement */}
        <div className="absolute w-full pointer-events-none" style={{ top: "54%", height: "1px" }} aria-hidden="true">
          <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent 5%, rgba(0,201,167,0.08) 30%, rgba(56,189,248,0.08) 70%, transparent 95%)" }} />
        </div>

        {/* Ambient glows */}
        <div className="absolute top-0 -left-60 w-[520px] h-[520px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(0,201,167,0.04), transparent 70%)" }} />
        <div className="absolute bottom-0 -right-60 w-[420px] h-[420px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(56,189,248,0.04), transparent 70%)" }} />

        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          {/* Section header */}
          <div className="text-center mb-16 lg:mb-20">
            <p className="font-mono text-[hsl(168,72%,55%)] text-xs tracking-[0.35em] uppercase mb-5 text-center">
              05 — Validación · Pruebas de Campo
            </p>
            <h3 className="font-black text-white leading-[0.9] mb-5"
              style={{ fontSize: "clamp(2.8rem, 6.5vw, 5rem)" }}>
              El sistema<br />
              <span style={{
                background: "linear-gradient(125deg, #00c9a7 0%, #38bdf8 55%, #fbbf24 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>puesto a prueba</span>
            </h3>
            <p className="text-white/50 text-base max-w-2xl mx-auto leading-relaxed">
              Tres escenarios reales donde el dispositivo fue validado — desde las primeras pruebas de propulsión en laboratorio hasta los despliegues en cuerpos de agua de Valle del Cauca.
            </p>
          </div>

          {/* Three mission cards — staggered vertically on desktop */}
          <div className="grid md:grid-cols-3 gap-5 lg:gap-7 items-start">

            <FieldMissionCard
              missionId="01"
              code="TEST-COMP"
              title="Pruebas de Componentes"
              location="Laboratorio CALIBOTS"
              accentColor="#00c9a7"
              description="Validación técnica antes del primer despliegue: comunicación LoRa, respuesta de sensores, firmware y propulsión — cada subsistema probado individualmente en condiciones controladas."
              videos={compTestVids}
              images={[]}
              offsetClass=""
            />

            <FieldMissionCard
              missionId="02"
              code="CAMPO-CALIMA"
              title="Lago Calima"
              location="Valle del Cauca · Colombia"
              accentColor="#38bdf8"
              description="Primera salida a agua real. pH, temperatura y turbidez medidos simultáneamente en el embalse del Lago Calima — primera vez en condiciones de campo."
              videos={calimaVids}
              images={campoImgs}
              offsetClass="md:mt-14"
            />

            <FieldMissionCard
              missionId="03"
              code="CAMPO-ROZO"
              title="Prueba en Rozo"
              location="Rozo, Valle del Cauca · Colombia"
              accentColor="#fbbf24"
              description="Segunda salida de campo. Registro en video del despliegue del dispositivo en ecosistema acuático local — documentando la operación en condiciones reales."
              videos={rozoVids}
              images={[]}
              offsetClass="md:mt-7"
            />

          </div>
        </div>
      </div>

      {/* ── 06 LOS DATOS ────────────────────────────────────────────────── */}
      <div className="relative py-28 border-t border-white/[0.06] overflow-hidden">
        <style>{`
          @keyframes wave-scroll {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
        `}</style>

        {/* Ambient glows */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(0,201,167,0.05), transparent)" }} />
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse 50% 50% at 0% 100%, rgba(56,189,248,0.03), transparent)" }} />
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse 50% 50% at 100% 100%, rgba(251,191,36,0.03), transparent)" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-3 mb-5">
              <div className="h-px w-14 bg-[hsl(168,72%,42%)]/30" />
              <span className="font-mono text-[hsl(168,72%,55%)] text-xs tracking-[0.35em] uppercase">06 — Qué Medimos</span>
              <div className="h-px w-14 bg-[hsl(168,72%,42%)]/30" />
            </div>
            <h3
              className="font-black text-white leading-[0.9] mb-5"
              style={{ fontSize: "clamp(2.8rem, 6.5vw, 5rem)" }}
            >
              Tres señales.<br />
              <span style={{
                background: "linear-gradient(125deg, #00c9a7 0%, #38bdf8 55%, #fbbf24 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>Un ecosistema.</span>
            </h3>
            <p className="text-white/50 text-base max-w-xl mx-auto leading-relaxed">
              pH, temperatura y turbidez son las tres variables que determinan si un cuerpo de agua está sano o en crisis — y son exactamente lo que M.A.N.G.O. registra de forma continua y autónoma.
            </p>
          </div>

          {/* ── Signal Monitor ── */}
          <div
            className="rounded-2xl overflow-hidden mb-14"
            style={{ background: "hsl(212,32%,4%)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            {/* Monitor header bar */}
            <div
              className="flex items-center gap-3 px-5 py-3 border-b"
              style={{ borderColor: "rgba(255,255,255,0.05)" }}
            >
              <span className="w-2 h-2 rounded-full"
                style={{ background: "#00c9a7", boxShadow: "0 0 8px 3px #00c9a755" }} />
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/28">
                MANGO Sensor Array · Señal activa
              </span>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400/40" />
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(0,201,167,0.55)" }} />
              </div>
            </div>

            {/* Sensor channels */}
            {SENSOR_CHANNELS.map((ch, idx, arr) => (
              <div
                key={ch.id}
                className={idx < arr.length - 1 ? "border-b" : ""}
                style={{ borderColor: "rgba(255,255,255,0.04)" }}
              >
                <div className="flex items-stretch">

                  {/* Left: channel label */}
                  <div
                    className="w-20 sm:w-28 flex-shrink-0 flex flex-col justify-center items-center gap-0.5 py-5 px-3 border-r"
                    style={{ borderColor: "rgba(255,255,255,0.04)" }}
                  >
                    <span className="font-mono font-black text-xl leading-none" style={{ color: ch.color }}>
                      {ch.label}
                    </span>
                    <span
                      className="font-mono text-[9px] uppercase tracking-widest mt-0.5"
                      style={{ color: `${ch.color}55` }}
                    >
                      {ch.desc}
                    </span>
                  </div>

                  {/* Center: animated waveform */}
                  <div className="flex-1 relative overflow-hidden" style={{ height: `${ch.H}px` }}>
                    {/* Subtle grid */}
                    <div className="absolute inset-0 flex flex-col justify-around pointer-events-none" aria-hidden>
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-full h-px" style={{ background: "rgba(255,255,255,0.02)" }} />
                      ))}
                    </div>
                    {/* Axis midline */}
                    <div
                      className="absolute left-0 right-0 h-px pointer-events-none"
                      style={{ top: "50%", background: `${ch.color}10` }}
                    />

                    {/* Scrolling wave */}
                    <svg
                      width={ch.W * 2}
                      height={ch.H}
                      className="absolute top-0 left-0"
                      aria-hidden
                      style={{
                        animationName: "wave-scroll",
                        animationDuration: ch.dur,
                        animationDelay: ch.delay,
                        animationTimingFunction: "linear",
                        animationIterationCount: "infinite",
                      }}
                    >
                      <defs>
                        <linearGradient id={`wfill-${ch.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={ch.color} stopOpacity="0.1" />
                          <stop offset="100%" stopColor={ch.color} stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d={`${ch.wavePath} L${ch.W * 2},${ch.H} L0,${ch.H} Z`}
                        fill={`url(#wfill-${ch.id})`}
                      />
                      <path
                        d={ch.wavePath}
                        stroke={ch.color}
                        strokeWidth="1.5"
                        fill="none"
                        strokeLinecap="round"
                        opacity="0.8"
                      />
                    </svg>

                    {/* Right vignette */}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-20 pointer-events-none"
                      style={{ background: `linear-gradient(90deg, transparent, hsl(212,32%,4%))` }}
                    />
                    {/* Cursor line */}
                    <div
                      className="absolute top-3 bottom-3 w-px pointer-events-none"
                      style={{ right: "72px", background: `linear-gradient(180deg, transparent, ${ch.color}40, transparent)` }}
                    />
                    {/* Live dot */}
                    <div
                      className="absolute top-1/2 pointer-events-none"
                      style={{
                        right: "68px",
                        transform: "translateY(-50%)",
                        width: "7px",
                        height: "7px",
                        borderRadius: "50%",
                        background: ch.color,
                        boxShadow: `0 0 10px 4px ${ch.color}50`,
                      }}
                    />
                  </div>

                  {/* Right: value readout */}
                  <div
                    className="w-24 sm:w-32 flex-shrink-0 flex flex-col justify-center items-end px-4 border-l"
                    style={{ borderColor: "rgba(255,255,255,0.04)" }}
                  >
                    <div
                      className="font-mono font-black tabular-nums leading-none"
                      style={{ color: ch.color, fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)" }}
                    >
                      <Counter end={ch.end} decimals={ch.dec} suffix={ch.suf} />
                    </div>
                    <span
                      className="font-mono text-[9px] mt-1 uppercase tracking-widest"
                      style={{ color: `${ch.color}50` }}
                    >
                      {ch.label}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Ecological context ── */}
          <div className="grid sm:grid-cols-3 gap-4 items-start">
            {[
              {
                sensor: "pH",
                color: "#00c9a7",
                headline: "El primer signo de alarma",
                body: "Mide la acidez del agua. Un rango entre 6.5 y 8.5 es favorable para la vida acuática. Fuera de ese margen el ecosistema empieza a degradarse: floración de algas, muerte de peces, contaminación química visible.",
                lo: "Ácido", ok: "Óptimo 6.5 – 8.5", hi: "Alcalino",
                pos: 0.52,
              },
              {
                sensor: "Temperatura",
                color: "#38bdf8",
                headline: "El termómetro de todo",
                body: "La temperatura controla cuánto oxígeno disuelve el agua, qué especies pueden sobrevivir y cuándo migran o se reproducen. Un aumento de tan solo 2 °C puede desencadenar el blanqueamiento de corales o extinciones locales.",
                lo: "Frío", ok: "Óptimo 18 – 28 °C", hi: "Caliente",
                pos: 0.48,
              },
              {
                sensor: "Turbidez",
                color: "#fbbf24",
                headline: "La visibilidad del agua",
                body: "Cuanta más turbidez, más partículas suspendidas bloquean la luz solar. Sin luz no hay fotosíntesis, y sin fotosíntesis el oxígeno desaparece del fondo — creando zonas muertas donde nada puede vivir.",
                lo: "Clara", ok: "Tolerable < 25 NTU", hi: "Turbia",
                pos: 0.20,
              },
            ].map(s => (
              <div
                key={s.sensor}
                className="group relative rounded-2xl overflow-hidden border border-white/[0.07] hover:border-white/[0.14] transition-colors duration-300"
                style={{ background: "linear-gradient(170deg, hsl(210,38%,7%), hsl(210,38%,5%))" }}
              >
                {/* Color identity overlay */}
                <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
                  style={{ background: `radial-gradient(ellipse 100% 60% at 0% 0%, ${s.color}0e, transparent 70%)` }} />
                <div className="h-[3px]"
                  style={{ background: `linear-gradient(90deg, ${s.color}, ${s.color}20 70%, transparent)` }} />
                <div className="p-6">
                  {/* Sensor badge */}
                  <div className="flex items-center gap-2 mb-5">
                    <span
                      className="font-mono font-black text-xs px-2.5 py-1 rounded-md"
                      style={{ background: `${s.color}14`, color: s.color, border: `1px solid ${s.color}28` }}
                    >
                      {s.sensor}
                    </span>
                    <div className="flex-1 h-px" style={{ background: `${s.color}18` }} />
                  </div>
                  <h4 className="text-white font-bold text-[1.05rem] leading-snug mb-3">{s.headline}</h4>
                  <p className="text-white/60 text-sm leading-relaxed mb-6">{s.body}</p>
                  {/* Range indicator */}
                  <div>
                    <div
                      className="flex justify-between font-mono text-[9px] uppercase tracking-widest mb-2"
                      style={{ color: "rgba(255,255,255,0.22)" }}
                    >
                      <span>{s.lo}</span>
                      <span style={{ color: `${s.color}70` }}>{s.ok}</span>
                      <span>{s.hi}</span>
                    </div>
                    <div className="relative h-1.5 rounded-full bg-white/[0.05]">
                      <div
                        className="absolute inset-y-0 left-[22%] right-[22%] rounded-full"
                        style={{ background: `linear-gradient(90deg, ${s.color}12, ${s.color}45, ${s.color}12)` }}
                      />
                      <div
                        className="absolute top-1/2 w-3 h-3 rounded-full border-2"
                        style={{
                          left: `${s.pos * 100}%`,
                          transform: "translate(-50%, -50%)",
                          borderColor: s.color,
                          background: "hsl(210,38%,5%)",
                          boxShadow: `0 0 8px 3px ${s.color}45`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 07 ACCESO ───────────────────────────────────────────────────── */}
      <div ref={section07Ref} className="relative py-28 border-t border-white/[0.06] overflow-hidden">
        <style>{`
          @keyframes node-pulse {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.45; }
          }
          @keyframes access-flow {
            0%   { left: -5px; opacity: 0; }
            20%  { opacity: 1; }
            80%  { opacity: 1; }
            100% { left: calc(100% + 5px); opacity: 0; }
          }
        `}</style>

        {/* Ambient */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse 70% 60% at 50% 65%, rgba(0,201,167,0.05), transparent)" }} />
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse 45% 55% at 4% 70%, rgba(0,201,167,0.04), transparent)" }} />
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse 45% 55% at 96% 70%, rgba(167,139,250,0.04), transparent)" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">

          {/* ── Header ── */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-5">
              <div className="h-px w-14 bg-[hsl(168,72%,42%)]/30" />
              <span className="font-mono text-[hsl(168,72%,55%)] text-xs tracking-[0.35em] uppercase">07 — Acceso al Panel</span>
              <div className="h-px w-14 bg-[hsl(168,72%,42%)]/30" />
            </div>
            <h3
              className="font-black text-white leading-[0.9] mb-5"
              style={{ fontSize: "clamp(2.8rem, 6.5vw, 5rem)" }}
            >
              El sistema<br />
              <span style={{
                background: "linear-gradient(125deg, #00c9a7 0%, #38bdf8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>está activo.</span>
            </h3>
            <div className="flex items-center justify-center gap-2 mb-5">
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  background: "#00c9a7",
                  boxShadow: "0 0 8px 3px #00c9a755",
                  animation: "node-pulse 2s ease-in-out infinite",
                }}
              />
              <span className="font-mono text-[11px] text-white/35 uppercase tracking-widest">
                Señal en vivo · Valle del Cauca · Colombia
              </span>
            </div>
            <p className="text-white/50 text-base max-w-lg mx-auto leading-relaxed">
              Los investigadores y organizaciones vinculadas al proyecto tienen acceso al panel de datos. El canal de YouTube documenta cada etapa del desarrollo.
            </p>
          </div>

          {/* ── Three-element composition: card | video | card ── */}
          <div className="flex flex-col lg:flex-row items-stretch gap-2 mb-14">

            {/* ── LEFT: Access card — compact ── */}
            <a
              href="/login"
              className="group flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 flex-shrink-0 lg:w-36 xl:w-40"
              style={{
                background: "linear-gradient(160deg, hsl(168,42%,8%), hsl(168,32%,5%))",
                borderColor: "rgba(0,201,167,0.22)",
                boxShadow: "0 0 40px rgba(0,201,167,0.07)",
              }}
            >
              <div className="h-[3px]"
                style={{ background: "linear-gradient(90deg, #00c9a7, #38bdf8 60%, transparent)" }} />
              <div className="flex flex-col gap-5 p-6 flex-1">
                {/* Status */}
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: "#00c9a7", animation: "node-pulse 1.5s ease-in-out infinite" }} />
                  <span className="font-mono text-[10px] uppercase tracking-widest"
                    style={{ color: "rgba(0,201,167,0.65)" }}>Panel activo</span>
                </div>
                {/* Icon + Title */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(0,201,167,0.1)", border: "1px solid rgba(0,201,167,0.25)", boxShadow: "0 0 20px rgba(0,201,167,0.1)" }}>
                    <LogIn className="w-5 h-5" style={{ color: "#00c9a7" }} />
                  </div>
                  <h4 className="text-white font-black text-xl leading-tight">
                    Acceder<br />al sistema
                  </h4>
                </div>
                {/* Description */}
                <p className="text-white/65 text-sm leading-relaxed flex-1">
                  Datos en tiempo real de los tres sensores, historial de misiones y visualizaciones georreferenciadas.
                </p>
                {/* CTA */}
                <span
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 group-hover:shadow-[0_0_22px_rgba(0,201,167,0.22)]"
                  style={{
                    background: "rgba(0,201,167,0.12)",
                    border: "1px solid rgba(0,201,167,0.35)",
                    color: "#00c9a7",
                  }}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Entrar al panel
                </span>
              </div>
            </a>

            {/* ── LEFT connector ── */}
            <div className="hidden lg:flex items-center flex-shrink-0 w-5">
              <div className="relative w-full h-px" style={{ background: "rgba(0,201,167,0.15)" }}>
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                  style={{
                    background: "#00c9a7",
                    boxShadow: "0 0 8px 4px rgba(0,201,167,0.45)",
                    animation: "access-flow 2.8s linear infinite",
                  }}
                />
              </div>
            </div>

            {/* ── CENTER: Pitch video + channel CTA — DOMINANT ── */}
            <div className="flex-1 flex flex-col items-center min-w-0">

              {/* Pitch label */}
              <div className="flex items-center gap-2 mb-3 w-full max-w-[300px] justify-center">
                <div className="h-px flex-1" style={{ background: "rgba(0,201,167,0.22)" }} />
                <span className="font-mono text-[9px] uppercase tracking-[0.28em]"
                  style={{ color: "rgba(0,201,167,0.45)" }}>
                  M.A.N.G.O. · Pitch
                </span>
                <div className="h-px flex-1" style={{ background: "rgba(0,201,167,0.22)" }} />
              </div>

              {/* Video — 9:16 portrait with broadcast marks */}
              <div className="w-full max-w-[300px]">
                <div
                  className="relative rounded-2xl overflow-hidden w-full"
                  style={{
                    aspectRatio: "9/16",
                    border: "1px solid rgba(0,201,167,0.2)",
                    boxShadow: "0 0 72px rgba(0,201,167,0.16), 0 32px 80px rgba(0,0,0,0.65)",
                  }}
                >
                  <iframe
                    key={videoActive ? "active" : "idle"}
                    src={videoActive
                      ? "https://www.youtube.com/embed/Z6yhP-sv_x0?rel=0&modestbranding=1&color=white&autoplay=1"
                      : "https://www.youtube.com/embed/Z6yhP-sv_x0?rel=0&modestbranding=1&color=white"}
                    title="M.A.N.G.O. — Presentación del proyecto"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                    className="absolute inset-0 w-full h-full border-0"
                  />
                  {/* Corner registration marks */}
                  <div className="absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 pointer-events-none"
                    style={{ borderColor: "rgba(0,201,167,0.6)" }} />
                  <div className="absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2 pointer-events-none"
                    style={{ borderColor: "rgba(0,201,167,0.6)" }} />
                  <div className="absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2 pointer-events-none"
                    style={{ borderColor: "rgba(0,201,167,0.6)" }} />
                  <div className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 pointer-events-none"
                    style={{ borderColor: "rgba(0,201,167,0.6)" }} />
                  {/* REC badge */}
                  <div
                    className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-0.5 rounded-full pointer-events-none"
                    style={{ background: "rgba(0,0,0,0.68)", backdropFilter: "blur(6px)" }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"
                      style={{ animation: "node-pulse 1s ease-in-out infinite" }} />
                    <span className="font-mono text-[8px] uppercase tracking-widest text-white/55">Rec</span>
                  </div>
                </div>

                {/* Channel CTA — elevated invitation */}
                <a
                  href="https://youtube.com/playlist?list=PLihEHjHiZwltNIlYLmrEdUG3jRNTNPq0M"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block mt-4 p-5 rounded-xl border transition-all duration-300 hover:border-red-500/40 hover:bg-red-500/[0.09]"
                  style={{ background: "rgba(239,68,68,0.07)", borderColor: "rgba(239,68,68,0.20)", boxShadow: "0 4px 24px rgba(239,68,68,0.06)" }}
                >
                  <div className="flex items-center gap-3 mb-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-105"
                      style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.28)" }}
                    >
                      <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[9px] uppercase tracking-widest text-red-400/60 mb-0.5">Canal oficial</p>
                      <p className="text-white font-bold text-base group-hover:text-white transition-colors leading-tight">
                        Ver todos los videos
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-red-400/40 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </div>
                  <p className="text-white/40 text-xs leading-relaxed">
                    Cada prueba, cada salida de campo y cada mejora — documentado en video desde el día uno.
                  </p>
                </a>
              </div>
            </div>

            {/* ── RIGHT connector ── */}
            <div className="hidden lg:flex items-center flex-shrink-0 w-5">
              <div className="relative w-full h-px" style={{ background: "rgba(167,139,250,0.15)" }}>
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                  style={{
                    background: "#a78bfa",
                    boxShadow: "0 0 8px 4px rgba(167,139,250,0.45)",
                    animation: "access-flow 2.8s 1.4s linear infinite",
                  }}
                />
              </div>
            </div>

            {/* ── RIGHT: Request card — compact ── */}
            <a
              href="#contacto"
              className="group flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 flex-shrink-0 lg:w-36 xl:w-40"
              style={{
                background: "linear-gradient(160deg, hsl(265,35%,8%), hsl(265,25%,5%))",
                borderColor: "rgba(167,139,250,0.18)",
              }}
            >
              <div className="h-[3px]"
                style={{ background: "linear-gradient(90deg, #a78bfa, #a78bfa20 60%, transparent)" }} />
              <div className="flex flex-col gap-5 p-6 flex-1">
                {/* Label */}
                <span className="font-mono text-[10px] uppercase tracking-widest"
                  style={{ color: "rgba(167,139,250,0.65)" }}>
                  Investigadores · Instituciones
                </span>
                {/* Icon + Title */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(167,139,250,0.09)", border: "1px solid rgba(167,139,250,0.25)", boxShadow: "0 0 20px rgba(167,139,250,0.08)" }}>
                    <Mail className="w-5 h-5" style={{ color: "#a78bfa" }} />
                  </div>
                  <h4 className="text-white font-black text-xl leading-tight">
                    Solicitar<br />acceso
                  </h4>
                </div>
                {/* Description */}
                <p className="text-white/65 text-sm leading-relaxed flex-1">
                  Disponible para instituciones de investigación y organizaciones de monitoreo ambiental.
                </p>
                {/* CTA */}
                <span
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 group-hover:shadow-[0_0_22px_rgba(167,139,250,0.18)]"
                  style={{
                    background: "rgba(167,139,250,0.09)",
                    border: "1px solid rgba(167,139,250,0.30)",
                    color: "#a78bfa",
                  }}
                >
                  <Mail className="w-3.5 h-3.5" />
                  Ir a contacto
                </span>
              </div>
            </a>

          </div>

          {/* ── Closing note ── */}
          <div className="text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/18">
              Los datos del panel son reales y continuos — sin simulaciones, sin demos.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
