import { useEffect, useState } from "react";
import { SectionTeaser } from "./SectionTeaser";
import { FramerEmbed } from "@/components/effects/FramerEmbed";

type Preview = { src: string; title: string };

const HARDWARE_DIR = "/images/gallery/hardware/";
const gridSrc = (src: string) =>
  src.startsWith(HARDWARE_DIR) ? src.replace(HARDWARE_DIR, `${HARDWARE_DIR}thumb/`) : src;

// Published Framer.com "Depth-Blur-Carousel": a 3D coverflow — center card
// large and sharp, side cards smaller and edge-blurred, drag/wheel to
// scroll. Only needs addPropertyControls/ControlType from "framer"
// (shimmed) plus framer-motion. Falls back to the plain thumbnail grid
// this teaser used before if framer.com is unreachable.
const FRAMER_DEPTH_BLUR_CAROUSEL_URL = "https://framer.com/m/Depth-Blur-Carousel-fvJ2lB.js@GXN6LrtdSMkVOzHCU8CD";

export function GalleryTeaser() {
  const [preview, setPreview] = useState<Preview[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/public/media?kind=image&per_page=12&page=1")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { items: Array<{ url: string; title: string }> } | null) => {
        if (cancelled || !data) return;
        setPreview(data.items.map((it) => ({ src: it.url, title: it.title || "" })));
      })
      .catch(() => { /* teaser stays text-only — the full gallery still works at /galeria */ });
    return () => { cancelled = true; };
  }, []);

  return (
    <SectionTeaser
      id="galeria"
      eyebrow="Registro visual"
      title="Galería de Registro"
      description="Cientos de fotos del desarrollo: hardware, montajes, pruebas de campo y avances del prototipo."
      ctaLabel="Ver galería completa"
      to="/galeria"
      accent="gold"
    >
      {preview.length > 0 && (
        <FramerEmbed
          moduleUrl={FRAMER_DEPTH_BLUR_CAROUSEL_URL}
          componentProps={{
            // The carousel only treats a string as an image if it starts
            // with "http"/"data:" (see PremiumSmearCard's `isImage` check)
            // — anything else it renders as a raw CSS `background` value.
            // Our gallery URLs are same-origin relative paths, so resolve
            // them to absolute URLs first.
            images: preview.map((img) => new URL(gridSrc(img.src), window.location.origin).href),
            itemWidth: 340,
            itemHeight: 200,
            sideItemWidth: 230,
            sideItemHeight: 180,
            gap: 28,
            maxRotation: 55,
            perspective: 500,
            borderRadius: 16,
            scrollDamping: 100,
            blurSpread: 25,
            blurStrength: 18,
          }}
          // The component hardcodes minHeight:400/minWidth:600 on its own
          // root regardless of our container size, so match that here —
          // a shorter box just lets it overflow into whatever's below.
          style={{ width: "100%", height: 400 }}
          fallback={
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
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
      )}
    </SectionTeaser>
  );
}
