import { useEffect, useRef, useState, useCallback, useMemo, Suspense } from "react";
import {
  ChevronLeft, ChevronRight, ExternalLink, LogIn, Mail, Database,
  Play, DollarSign, MapPin, Clock, Users,
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

// ── Schema Carousel — compact, annotated ─────────────────────────────────────
function SchemaCarousel() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const prev = () => setIdx(i => (i - 1 + SCHEMAS.length) % SCHEMAS.length);
  const next = () => setIdx(i => (i + 1) % SCHEMAS.length);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setIdx(i => (i + 1) % SCHEMAS.length), 6000);
    return () => clearInterval(id);
  }, [paused]);

  const s = SCHEMAS[idx];
  return (
    <div className="max-w-2xl mx-auto">
      {/* Image area */}
      <div className="relative rounded-2xl overflow-hidden bg-[hsl(210,32%,10%)] border border-white/[0.09]"
        style={{ aspectRatio: "4/3" }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}>
        {SCHEMAS.map((sc, i) => (
          <img key={sc.src} src={sc.src} alt={sc.label}
            className="absolute inset-0 w-full h-full object-contain p-5 transition-opacity duration-500"
            style={{ opacity: i === idx ? 1 : 0 }}
            loading={i === 0 ? "eager" : "lazy"} />
        ))}
        {/* Tag pill */}
        <span className="absolute top-3 left-3 font-mono text-[9px] px-2.5 py-1 rounded-full border"
          style={{ color: "#00c9a7", borderColor: "#00c9a740", background: "#00c9a712" }}>
          {s.tag}
        </span>
        {/* Open full */}
        <a href={s.src} target="_blank" rel="noopener noreferrer"
          className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-black/70 transition-all"
          title="Ver plano completo">
          <ExternalLink className="h-3 w-3" />
        </a>
        {/* Arrows */}
        <button type="button" onClick={prev} aria-label="Anterior"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/55 border border-white/10 flex items-center justify-center text-white/70 hover:bg-black/80 transition-all">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button type="button" onClick={next} aria-label="Siguiente"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/55 border border-white/10 flex items-center justify-center text-white/70 hover:bg-black/80 transition-all">
          <ChevronRight className="h-4 w-4" />
        </button>
        {/* Counter */}
        <span className="absolute bottom-3 right-4 font-mono text-[10px] text-white/50">
          {idx + 1} / {SCHEMAS.length}
        </span>
      </div>

      {/* Annotation below image */}
      <div className="mt-5 text-center px-2">
        <p className="text-white font-semibold text-sm mb-2">{s.label}</p>
        <p className="text-white/55 text-sm leading-relaxed">{s.desc}</p>
      </div>

      {/* Numbered tab navigation */}
      <div className="flex gap-1.5 mt-5 justify-center flex-wrap">
        {SCHEMAS.map((sc, i) => (
          <button key={i} type="button" onClick={() => setIdx(i)}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition-all border"
            style={i === idx
              ? { borderColor: "#00c9a740", background: "#00c9a712", color: "#00c9a7" }
              : { borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.35)" }}>
            {String(i + 1).padStart(2, "0")} {sc.tag}
          </button>
        ))}
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

// ── Main component ────────────────────────────────────────────────────────────
export function ProjectSection() {
  const heading      = useSiteValue("project.heading", "El Proyecto");
  const [campoImgs,   setCampoImgs]   = useState<MediaItem[]>([]);
  const [campoVids,   setCampoVids]   = useState<MediaItem[]>([]);
  const [pruebasVids, setPruebasVids] = useState<MediaItem[]>([]);
  const [heroIdx,     setHeroIdx]     = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);

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

  // Hero slideshow
  useEffect(() => {
    if (heroImgs.length < 2) return;
    const id = setInterval(() => setHeroIdx(i => (i + 1) % heroImgs.length), 4500);
    return () => clearInterval(id);
  }, [heroImgs.length]);

  const nudge = useCallback((dir: 1 | -1) => {
    stripRef.current?.scrollBy({ left: dir * (stripRef.current.clientWidth * 0.75), behavior: "smooth" });
  }, []);

  return (
    <section id="proyecto" className="bg-[hsl(210,35%,8%)]">

      {/* ── 01 HERO ─────────────────────────────────────────────────────── */}
      <div className="relative min-h-[88vh] flex flex-col justify-end overflow-hidden">
        {heroImgs.map((img, i) => (
          <img key={img.url} src={img.url} alt="" aria-hidden
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
            style={{ opacity: i === heroIdx ? 1 : 0 }}
            loading={i === 0 ? "eager" : "lazy"} />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(210,38%,5%)] via-[hsl(210,38%,6%)]/65 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(210,38%,5%)]/85 via-transparent to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 lg:px-8 pb-20">
          <p className="font-mono text-[hsl(168,72%,55%)] text-xs tracking-[0.35em] uppercase mb-5 text-center">
            01 — El Dispositivo
          </p>

          {/* Two-column on desktop: text left (3/5), floating 3D model right (2/5) */}
          <div className="lg:grid lg:grid-cols-5 lg:items-end lg:gap-4">

            {/* Text column */}
            <div className="lg:col-span-3">
              <h2 className="text-[4rem] sm:text-[7rem] md:text-[9rem] font-black tracking-tight text-white leading-none mb-6">
                <DecryptedText text={heading} speed={22} maxIterations={7} animateOn="view"
                  className="text-white" encryptedClassName="text-[hsl(168,72%,42%)]/40" />
              </h2>
              <p className="text-xl text-white/80 max-w-lg font-light leading-relaxed">
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
              className="hidden lg:block lg:col-span-2 pointer-events-auto"
              style={{ height: "460px" }}
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

          {/* Schemas */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-white/[0.06]" />
              <p className="text-white/60 text-[11px] font-mono uppercase tracking-widest">Esquemas del sistema</p>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </div>
            <p className="text-center text-white/60 text-xs mb-8">Haz clic en la imagen o en las pestañas para explorar cómo está conectado el sistema</p>
            <SchemaCarousel />
          </div>

        </div>
      </div>

      {/* ── 04 COMUNICACIÓN ─────────────────────────────────────────────── */}
      <div className="py-20 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="font-mono text-[hsl(168,72%,55%)] text-xs tracking-[0.35em] uppercase mb-3 text-center">04 — Comunicación</p>
          <h3 className="text-3xl font-bold text-white mb-10">Del agua hasta tu pantalla</h3>
          <div className="flex items-start gap-3 overflow-x-auto pb-4" style={{ scrollbarWidth: "none" }}>
            {[
              { label: "Sensores",         sub: "En el agua",       img: HW.ph,        color: "#00c9a7" },
              { label: "Procesador",        sub: "Calcula los datos", img: HW.jetson,    color: "#38bdf8" },
              { label: "Radio LoRa",        sub: "Envía sin WiFi",   img: HW.lora,      color: "#a78bfa" },
              { label: "Estación Base",     sub: "Recibe la señal",  img: null,          color: "#fbbf24" },
              { label: "Panel web",         sub: "Datos en vivo",    img: null,          color: "#f472b6" },
            ].map((node, i, arr) => (
              <div key={node.label} className="flex items-center gap-2 flex-shrink-0">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 flex items-center justify-center bg-white/[0.05]"
                    style={{ borderColor: node.color + "55", boxShadow: `0 0 18px ${node.color}1a` }}>
                    {node.img ? <img src={node.img} alt={node.label} className="w-full h-full object-cover" loading="lazy" />
                      : <Database className="h-7 w-7 opacity-40" style={{ color: node.color }} />}
                  </div>
                  <div className="text-center">
                    <p className="text-white text-xs font-semibold">{node.label}</p>
                    <p className="text-white/65 text-[10px] font-mono">{node.sub}</p>
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <div className="flex items-center gap-1 pb-6 flex-shrink-0">
                    <div className="h-px w-6 sm:w-8 bg-white/15" />
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="text-white/25">
                      <path d="M7 0L10 3L7 6M0 3h10" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 05A ENSAYOS TÉCNICOS ────────────────────────────────────────── */}
      <div className="py-20 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-full bg-[hsl(168,72%,42%)]/15 border border-[hsl(168,72%,42%)]/30 font-mono text-[11px] text-[hsl(168,72%,55%)] uppercase tracking-widest">05A</span>
            <span className="text-white/60 font-mono text-xs uppercase tracking-widest">Fase 1</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-2">Antes de ir al agua</h3>
          <p className="text-white/65 text-base mb-8 max-w-xl text-justify">Antes de desplegar el dispositivo en campo, cada componente se prueba por separado: que la radio transmita a la distancia esperada, que los sensores entreguen lecturas correctas y que el sistema no falle bajo condiciones adversas.</p>
          {pruebasVids.length > 0
            ? <VideoPlayer videos={pruebasVids} label="Ensayos técnicos" />
            : <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-10 text-center text-white/30 font-mono text-sm">Cargando videos...</div>}
        </div>
      </div>

      {/* ── 05B PRUEBAS DE CAMPO ────────────────────────────────────────── */}
      <div className="py-20 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-full bg-[hsl(204,70%,53%)]/15 border border-[hsl(204,70%,53%)]/30 font-mono text-[11px] text-[hsl(204,70%,65%)] uppercase tracking-widest">05B</span>
            <span className="text-white/60 font-mono text-xs uppercase tracking-widest">Fase 2</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-3xl font-bold text-white mb-1">El dispositivo en agua real</h3>
              <p className="text-white/65 text-base max-w-md">Cada despliegue en lagunas y embalses reales nos enseñó algo nuevo sobre cómo mejorar el sistema.</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button type="button" onClick={() => nudge(-1)} aria-label="Anterior"
                className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-all">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => nudge(1)} aria-label="Siguiente"
                className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-all">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div ref={stripRef} className="flex gap-3 overflow-x-auto px-6 lg:px-8 pb-2 snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: "none" }}>
          {campoImgs.length === 0
            ? Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="flex-shrink-0 snap-start rounded-2xl bg-white/[0.04] border border-white/[0.05] animate-pulse" style={{ width: "17rem", height: "17rem" }} />
              ))
            : campoImgs.map((img, i) => (
                <div key={img.url} className="flex-shrink-0 snap-start rounded-2xl overflow-hidden relative group" style={{ width: "17rem", height: "17rem" }}>
                  <img src={img.url} alt={img.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="absolute top-3 left-3 font-mono text-[10px] text-white/65 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded">{String(i+1).padStart(2,"0")}</span>
                  <p className="absolute bottom-3 left-3 right-3 text-white text-xs font-medium truncate opacity-0 group-hover:opacity-100 transition-opacity">{img.title}</p>
                </div>
              ))
          }
        </div>

        {campoImgs.length > 0 && (
          <p className="mt-3 px-6 lg:px-8 max-w-7xl mx-auto font-mono text-xs text-white/50">{campoImgs.length} registros documentados</p>
        )}

        {campoVids.length > 0 && (
          <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-10">
            <p className="text-white/55 text-sm font-medium mb-5">El dispositivo en acción</p>
            <VideoPlayer videos={campoVids} label="Pruebas de campo" />
          </div>
        )}
      </div>

      {/* ── 06 LOS DATOS ────────────────────────────────────────────────── */}
      <div className="py-20 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="font-mono text-[hsl(168,72%,55%)] text-xs tracking-[0.35em] uppercase mb-3 text-center">06 — Qué Medimos</p>
          <h3 className="text-3xl font-bold text-white mb-10">Tres números que lo dicen todo</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: "pH del Agua",  end: 7.4, dec: 1, suffix: "",    unit: "pH",  desc: "Qué tan ácida o alcalina está el agua. Un pH bajo o alto fuera del rango normal puede indicar contaminación, exceso de algas o estrés en el ecosistema.", color: "#00c9a7" },
              { label: "Temperatura",  end: 24,  dec: 0, suffix: "°C",  unit: "°C",  desc: "La temperatura del agua en superficie. Cambios bruscos afectan a las especies que viven en el ecosistema y pueden señalar fenómenos térmicos anómalos.",       color: "#38bdf8" },
              { label: "Turbidez",     end: 12,  dec: 0, suffix: " NTU",unit: "NTU", desc: "Qué tan turbia o clara está el agua. Cuanto más turbia, más sedimentos, partículas o algas contiene — una señal directa de alteración del ecosistema.",           color: "#fbbf24" },
            ].map(m => (
              <div key={m.label} className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-6 hover:border-white/15 transition-colors">
                <p className="font-mono text-[11px] uppercase tracking-widest mb-5" style={{ color: m.color }}>{m.label}</p>
                <div className="text-5xl font-black text-white font-mono leading-none mb-1">
                  <Counter end={m.end} decimals={m.dec} suffix={m.suffix} />
                </div>
                <p className="font-mono text-[10px] text-white/55 mb-4">{m.unit} · referencia</p>
                <p className="text-white/65 text-sm leading-relaxed text-justify">{m.desc}</p>
                <div className="mt-4 h-px" style={{ background: `linear-gradient(to right, ${m.color}50, transparent)` }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 07 ACCESO ───────────────────────────────────────────────────── */}
      <div className="py-16 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="font-mono text-[hsl(168,72%,55%)] text-xs tracking-[0.35em] uppercase mb-6 text-center">07 — Acceso al Panel</p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-white/60 text-sm leading-relaxed max-w-xs">El panel de datos en tiempo real está disponible para instituciones de investigación y organizaciones vinculadas al proyecto. Si formas parte de una, puedes solicitar acceso.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="https://youtube.com/playlist?list=PLihEHjHiZwltNIlYLmrEdUG3jRNTNPq0M" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-500/[0.08] border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/15 transition-colors whitespace-nowrap">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
              </svg>
              Videos en YouTube
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
            <a href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[hsl(168,72%,42%)]/10 border border-[hsl(168,72%,42%)]/25 text-[hsl(168,72%,60%)] text-sm font-medium hover:bg-[hsl(168,72%,42%)]/18 transition-colors whitespace-nowrap">
              <LogIn className="h-3.5 w-3.5" />Acceder al sistema
            </a>
            <a href="#contacto"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.05] border border-white/10 text-white/60 text-sm font-medium hover:bg-white/[0.09] hover:text-white/80 transition-colors whitespace-nowrap">
              <Mail className="h-3.5 w-3.5" />Solicitar acceso
            </a>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
