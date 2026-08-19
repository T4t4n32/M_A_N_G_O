import DecryptedText from "@/components/effects/DecryptedText";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, ChevronDown, Search as SearchIcon, Play } from "lucide-react";
import { FramerEmbed } from "@/components/effects/FramerEmbed";

// Published Framer.com "DragableCarousel": a draggable 3D carousel with
// arrows/dots navigation and autoplay (uses "gsap" for its snap animation
// — see the "gsap" entry in index.html's import map). Only needs
// addPropertyControls/ControlType from "framer" (shimmed). Falls back to
// nothing (not just null) if framer.com is unreachable — the searchable
// grid below is the real content, so a failed teaser carousel simply
// doesn't render rather than showing a placeholder.
const FRAMER_DRAGABLE_CAROUSEL_URL = "https://framer.com/m/DragableCarousel-ADAPEh.js@fXOJxTG2NAtXIGjIOPmn";

const filters = ["Todo", "Hardware", "Software", "Campo", "Progreso"];

const INITIAL_VISIBLE = 16;

type GalleryItem = { src: string; title: string; cat: string; desc: string };


const VALID_CATS = new Set(["Hardware", "Software", "Campo", "Progreso"]);

export function GallerySection() {
  const [active, setActive] = useState("Todo");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Every gallery image — hardware photos and admin uploads alike — now lives in the
  // uploaded_files table (Panel Emma manages all of it). Fetch every page and keep only
  // items tagged with one of the public gallery categories; anything else (e.g. FLL/Líder
  // media, which has its own categories) belongs to a different section, not this grid.
  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      try {
        const all: GalleryItem[] = [];
        let page = 1;
        while (true) {
          const res = await fetch(`/api/v1/public/media?kind=image&per_page=100&page=${page}`);
          if (!res.ok || cancelled) return;
          const data = await res.json() as {
            items: Array<{ url: string; title: string; category: string | null; description: string | null }>;
            total: number;
            pages: number;
          };
          if (cancelled) return;
          const mapped: GalleryItem[] = data.items
            .filter((it) => !it.category || VALID_CATS.has(it.category))
            .map((it) => ({
              src:   it.url,
              title: it.title || "Sin título",
              cat:   VALID_CATS.has(it.category ?? "") ? (it.category as string) : "Progreso",
              desc:  it.description || "",
            }));
          all.push(...mapped);
          if (page >= data.pages) break;
          page++;
        }
        if (!cancelled) setImages(all);
      } catch {
        // network error — gallery just stays empty; nothing to fall back to now
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchAll();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let result = active === "Todo" ? images : images.filter((img) => img.cat === active);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (img) =>
          img.title.toLowerCase().includes(q) ||
          img.desc.toLowerCase().includes(q) ||
          img.cat.toLowerCase().includes(q)
      );
    }
    return result;
  }, [active, search, images]);

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
      else if (e.key === "+" || e.key === "=") { e.preventDefault(); setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2))); }
      else if (e.key === "-" || e.key === "_") { e.preventDefault(); setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2))); }
      else if (e.key === "0") { e.preventDefault(); setZoom(1); }
      else if (e.key === "Home") { e.preventDefault(); setZoom(1); setLightbox(0); }
      else if (e.key === "End") { e.preventDefault(); setZoom(1); setLightbox(filtered.length - 1); }
      else if (e.key === "Tab") {
        // Trap focus within the lightbox
        const root = dialogRef.current;
        if (!root) return;
        const focusables = root.querySelectorAll<HTMLElement>(
          'button, [href], video, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, goNext, goPrev, filtered.length]);

  const dialogRef = useRef<HTMLDivElement>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);

  // Focus management: send focus into the dialog on open, restore on close.
  useEffect(() => {
    if (lightbox === null) return;
    lastTrigger.current = (document.activeElement as HTMLElement) ?? null;
    const t = window.setTimeout(() => {
      const target = dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]");
      target?.focus();
    }, 30);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      lastTrigger.current?.focus?.();
    };
  }, [lightbox]);

  const openLightbox = (i: number) => {
    setZoom(1);
    setLightbox(i);
  };

  const isVideo = (src: string) => /\.(mp4|webm|ogg|mov)(\?|$)/i.test(src);

  // Static hardware images ship a pre-generated /thumb/ WebP (~480px) for the grid;
  // dynamic API uploads have no thumb variant, so the grid falls back to their original src.
  const HARDWARE_DIR = "/images/gallery/hardware/";
  const gridSrc = (src: string) =>
    src.startsWith(HARDWARE_DIR) ? src.replace(HARDWARE_DIR, `${HARDWARE_DIR}thumb/`) : src;

  return (
    <section id="galeria" className="py-20 md:py-28 bg-[hsl(215,40%,7%)] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_30%,hsl(204_70%_53%/0.10),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_70%,hsl(168_72%_42%/0.05),transparent_50%)]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold"><DecryptedText text="Galería de Registro" speed={40} maxIterations={8} animateOn="view" className="text-white" encryptedClassName="text-accent/40" /></h2>
          <p className="mt-3 text-white/50 max-w-2xl mx-auto">
            Registro visual del desarrollo y pruebas del proyecto
          </p>
        </div>

        {/* Destacados — featured carousel over the most recent uploads */}
        {images.length > 0 && (
          <div className="max-w-4xl mx-auto mb-14">
            <FramerEmbed
              moduleUrl={FRAMER_DRAGABLE_CAROUSEL_URL}
              componentProps={{
                preset: "Soft Cover",
                images: images.slice(0, 10).map((img) => gridSrc(img.src)),
                slideWidth: 320,
                slideHeight: 240,
                gap: 20,
                borderRadius: 16,
                objectFit: "cover",
                showArrows: true,
                arrowColor: "#ffffff",
                arrowSize: 40,
                showDots: true,
                dotColor: "#00c9a7",
                dotSize: 7,
                autoplay: true,
                autoplayDelay: 3500,
                pauseOnHover: true,
                loop: true,
              }}
              style={{ width: "100%", height: 340 }}
              fallback={null}
            />
          </div>
        )}

        {/* Search bar */}
        <div className="max-w-md mx-auto mb-8">
          <label htmlFor="gallery-search" className="sr-only">Buscar imágenes</label>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              id="gallery-search"
              type="text"
              placeholder="Buscar imágenes..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setExpanded(false); }}
              className="w-full pl-10 pr-9 py-2.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-sm text-white placeholder:text-white/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(168,72%,42%)]/60 focus-visible:border-[hsl(168,72%,42%)]/60 transition-all backdrop-blur-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div role="tablist" aria-label="Filtros de galería" className="flex flex-wrap justify-center gap-2 mb-10">
          {filters.filter((f) => f === "Todo" || images.some((img) => img.cat === f)).map((f) => {
            const count = f === "Todo" ? images.length : images.filter((img) => img.cat === f).length;
            const selected = active === f;
            return (
              <button
                key={f}
                role="tab"
                aria-selected={selected}
                aria-label={`Filtrar por ${f}, ${count} elemento${count !== 1 ? "s" : ""}`}
                onClick={() => { setActive(f); setExpanded(false); }}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(210,35%,8%)] ${
                  selected
                    ? "bg-accent text-accent-foreground shadow-md"
                    : "bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.1] border border-white/10"
                }`}
              >
                {f} <span className="opacity-60">({count})</span>
              </button>
            );
          })}
        </div>

        {search.trim() && (
          <p className="text-center text-sm text-white/50 mb-6">
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} para "{search}"
          </p>
        )}

        {loading && images.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-white/20 border-t-accent rounded-full animate-spin" />
          </div>
        ) : (
        /* CSS Columns Masonry — no JS overhead */
        <div className="relative">
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4" style={{ columnFill: 'balance' }}>
            {visible.map((img, i) => (
              <div
                key={img.src}
                className="break-inside-avoid mb-4 bg-white/[0.06] rounded-xl border border-white/[0.08] overflow-hidden hover:-translate-y-1 hover:shadow-lg hover:shadow-[hsl(168_72%_42%/0.1)] transition-all duration-300 cursor-pointer group"
                onClick={() => openLightbox(i)}
              >
                <div className="overflow-hidden bg-white/[0.03]" style={{ aspectRatio: '4 / 3' }}>
                  <img
                    src={gridSrc(img.src)}
                    alt={img.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    decoding="async"
                    width={480}
                    height={360}
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-white text-sm truncate">{img.title}</h3>
                  <p className="text-xs text-white/40 mt-1 line-clamp-2">{img.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Fade overlay + expand button */}
          {needsCollapse && !expanded && (
            <div className="relative mt-0">
              <div className="absolute -top-24 left-0 right-0 h-24 bg-gradient-to-t from-[hsl(205,35%,20%)] to-transparent pointer-events-none" />
              <div className="flex justify-center pt-6">
                <button
                  onClick={() => setExpanded(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[hsl(168,72%,42%)] to-[hsl(204,70%,53%)] text-white font-semibold text-sm hover:from-[hsl(168,72%,38%)] hover:to-[hsl(204,70%,48%)] transition-all shadow-lg shadow-[hsl(168,72%,42%)]/20"
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
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/[0.08] border border-white/[0.12] text-white/70 hover:text-white hover:bg-white/[0.12] font-semibold text-sm transition-all"
              >
                <ChevronDown className="h-4 w-4 rotate-180" />
                Mostrar menos
              </button>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Lightbox — portaled to <body> so its `fixed` positioning can't be hijacked by an
          ancestor's `will-change`/`transform` (e.g. ScrollReveal's wrapper), which would
          otherwise scope it to that ancestor's box instead of the viewport. */}
      {lightbox !== null && createPortal(
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="gallery-lightbox-title"
          aria-describedby="gallery-lightbox-desc"
          className="fixed inset-0 z-[110] bg-black flex items-center justify-center"
          onClick={() => { setLightbox(null); setZoom(1); }}
        >
          {/* Close */}
          <button
            data-autofocus
            className="absolute top-4 right-4 z-10 text-white/70 hover:text-white p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            onClick={(e) => { e.stopPropagation(); setLightbox(null); setZoom(1); }}
            aria-label="Cerrar visor"
          >
            <X className="h-7 w-7" />
          </button>

          {/* Zoom controls */}
          <div
            role="toolbar"
            aria-label="Controles de zoom"
            className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full px-2 py-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setZoom(Math.max(0.5, +(zoom - 0.25).toFixed(2)))} className="p-1.5 text-white/70 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded" aria-label="Reducir zoom (tecla -)">
              <ZoomOut className="h-5 w-5" />
            </button>
            <span className="text-white/80 text-xs font-medium min-w-[3rem] text-center" aria-live="polite">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(Math.min(4, +(zoom + 0.25).toFixed(2)))} className="p-1.5 text-white/70 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded" aria-label="Aumentar zoom (tecla +)">
              <ZoomIn className="h-5 w-5" />
            </button>
            {zoom !== 1 && (
              <button onClick={resetZoom} className="p-1.5 text-white/70 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded" aria-label="Restablecer zoom (tecla 0)">
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Counter + keyboard hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-white/50 text-xs flex items-center gap-3" aria-live="polite">
            <span>{lightbox + 1} / {filtered.length}</span>
            <span className="hidden sm:inline opacity-60">← → cambiar · + − zoom · 0 reset · Esc cerrar</span>
          </div>
          <span className="sr-only" aria-live="polite">
            {lightbox + 1} / {filtered.length}
          </span>

          {/* Prev arrow */}
          <button
            className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-10 p-2 md:p-3 rounded-full bg-white/10 backdrop-blur-sm text-white/70 hover:text-white hover:bg-white/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            aria-label="Anterior"
          >
            <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
          </button>

          {/* Next arrow */}
          <button
            className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-10 p-2 md:p-3 rounded-full bg-white/10 backdrop-blur-sm text-white/70 hover:text-white hover:bg-white/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            aria-label="Siguiente"
          >
            <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
          </button>

          {/* Media + info */}
          <div className="max-w-5xl w-full px-10 md:px-16" onClick={(e) => e.stopPropagation()}>
            <div
              className="relative flex items-center justify-center rounded-xl overflow-hidden"
              style={{ height: "72vh" }}
              onWheel={(e) => {
                if (!filtered[lightbox] || isVideo(filtered[lightbox].src)) return;
                e.preventDefault();
                setZoom((z) => Math.min(4, Math.max(0.5, +(z - Math.sign(e.deltaY) * 0.15).toFixed(2))));
              }}
              onDoubleClick={() => {
                if (!filtered[lightbox] || isVideo(filtered[lightbox].src)) return;
                setZoom((z) => (z === 1 ? 2 : 1));
              }}
            >
              {filtered[lightbox] && isVideo(filtered[lightbox].src) ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video
                  src={filtered[lightbox].src}
                  controls
                  autoPlay
                  playsInline
                  className="w-auto h-full max-w-full max-h-full bg-black rounded"
                  style={{ maxHeight: "72vh" }}
                  aria-label={filtered[lightbox]?.title}
                />
              ) : (
                <img
                  src={filtered[lightbox]?.src}
                  alt={filtered[lightbox]?.title}
                  className="w-auto h-auto max-w-full max-h-full object-contain transition-transform duration-200 select-none"
                  style={{ transform: `scale(${zoom})`, maxHeight: "72vh", cursor: zoom > 1 ? "zoom-out" : "zoom-in" }}
                  draggable={false}
                />
              )}
            </div>
            <div className="mt-3 text-center">
              <h3 id="gallery-lightbox-title" className="text-white font-bold text-lg">{filtered[lightbox]?.title}</h3>
              <p id="gallery-lightbox-desc" className="text-white/60 mt-1 text-sm">{filtered[lightbox]?.desc}</p>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </section>
  );
}
