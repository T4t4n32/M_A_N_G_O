import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import DecryptedText from "@/components/effects/DecryptedText";
import { FramerEmbed } from "@/components/effects/FramerEmbed";
import { Button } from "@/components/ui/button";

type Preview = { src: string; title: string };

const HARDWARE_DIR = "/images/gallery/hardware/";
const gridSrc = (src: string) =>
  src.startsWith(HARDWARE_DIR) ? src.replace(HARDWARE_DIR, `${HARDWARE_DIR}thumb/`) : src;

// Deliberately small — this is a teaser, not the gallery. Showing only a
// handful of the real photos (never padded or faked) is what makes the
// section a hook toward /galeria rather than a substitute for it.
const PREVIEW_COUNT = 10;

// Published Framer.com "Depth-Blur-Carousel": a 3D coverflow — center card
// large and sharp, side cards smaller and edge-blurred, drag/wheel to
// scroll. Only needs addPropertyControls/ControlType from "framer"
// (shimmed) plus framer-motion. Falls back to the plain thumbnail grid
// this teaser used before if framer.com is unreachable.
const FRAMER_DEPTH_BLUR_CAROUSEL_URL = "https://framer.com/m/Depth-Blur-Carousel-fvJ2lB.js@GXN6LrtdSMkVOzHCU8CD";

export function GalleryTeaser() {
  const navigate = useNavigate();
  const [preview, setPreview] = useState<Preview[]>([]);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/v1/public/media?kind=image&per_page=${PREVIEW_COUNT}&page=1`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { items: Array<{ url: string; title: string }>; total?: number } | null) => {
        if (cancelled || !data) return;
        setPreview(data.items.map((it) => ({ src: it.url, title: it.title || "" })));
        if (typeof data.total === "number") setTotal(data.total);
      })
      .catch(() => { /* teaser stays text-only — the full gallery still works at /galeria */ });
    return () => { cancelled = true; };
  }, []);

  return (
    // Unlike every other landing-page section, this one isn't boxed in a
    // bordered card — the whole point of the gallery teaser is to feel like
    // an open window rather than another contained block, so the carousel
    // below breaks out to the full viewport width.
    <section id="galeria" className="relative py-16 md:py-20 overflow-hidden" style={{ background: "hsl(213,40%,7%)" }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-8 right-[8%] w-[420px] h-[320px] bg-[hsl(45,90%,55%)] opacity-[0.05] blur-[130px] rounded-full" />
        <div className="absolute bottom-0 left-[12%] w-[360px] h-[260px] bg-[hsl(168,72%,42%)] opacity-[0.04] blur-[110px] rounded-full" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400">
          Registro visual
        </span>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl md:text-3xl font-bold">
            <DecryptedText
              text="Galería de Registro"
              speed={40}
              maxIterations={8}
              animateOn="view"
              className="text-white"
              encryptedClassName="text-amber-400/40"
            />
          </h2>
          {total !== null && total > preview.length && (
            <span className="text-xs text-white/40 pb-1">
              Mostrando {preview.length} de {total} fotos
            </span>
          )}
        </div>
        <p className="mt-3 text-white/55 max-w-2xl">
          Cientos de fotos del desarrollo: hardware, montajes, pruebas de campo y avances del prototipo.
        </p>
      </div>

      {preview.length > 0 && (
        <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen mt-8">
          {/* Edge-masked rather than hard-clipped: the outer cards dissolve
              into the section background instead of cutting off, so the
              carousel reads as a slice of something larger, not the whole
              of it — that's what should pull a visitor toward /galeria. */}
          <div
            style={{
              WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)",
              maskImage: "linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)",
            }}
          >
            <FramerEmbed
              moduleUrl={FRAMER_DEPTH_BLUR_CAROUSEL_URL}
              componentProps={{
                // The carousel only treats a string as an image if it starts
                // with "http"/"data:" (see PremiumSmearCard's `isImage` check)
                // — anything else it renders as a raw CSS `background` value.
                // Our gallery URLs are same-origin relative paths, so resolve
                // them to absolute URLs first.
                images: preview.map((img) => new URL(gridSrc(img.src), window.location.origin).href),
                itemWidth: 380,
                itemHeight: 230,
                sideItemWidth: 260,
                sideItemHeight: 200,
                gap: 32,
                maxRotation: 55,
                perspective: 600,
                borderRadius: 16,
                scrollDamping: 100,
                blurSpread: 25,
                blurStrength: 18,
              }}
              // The component hardcodes minHeight:400/minWidth:600 on its own
              // root regardless of our container size, so match that here —
              // a shorter box just lets it overflow into whatever's below.
              style={{ width: "100%", height: 440 }}
              fallback={
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {preview.map((img) => (
                    <div
                      key={img.src}
                      className="aspect-square rounded-lg overflow-hidden bg-white/[0.04] border border-white/[0.08]"
                    >
                      <img
                        src={gridSrc(img.src)}
                        alt={img.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              }
            />
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative mt-9">
        <Button
          onClick={() => navigate("/galeria")}
          className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-6 font-semibold gap-2"
        >
          Ver galería completa <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}
