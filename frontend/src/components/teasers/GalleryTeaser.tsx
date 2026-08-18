import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SectionTeaser } from "./SectionTeaser";

type Preview = { src: string; title: string };

const HARDWARE_DIR = "/images/gallery/hardware/";
const gridSrc = (src: string) =>
  src.startsWith(HARDWARE_DIR) ? src.replace(HARDWARE_DIR, `${HARDWARE_DIR}thumb/`) : src;

export function GalleryTeaser() {
  const navigate = useNavigate();
  const [preview, setPreview] = useState<Preview[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/public/media?kind=image&per_page=6&page=1")
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
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {preview.map((img) => (
            <button
              key={img.src}
              onClick={() => navigate("/galeria")}
              className="aspect-square rounded-lg overflow-hidden bg-white/[0.04] border border-white/[0.08] hover:border-accent/40 transition-colors"
            >
              <img
                src={gridSrc(img.src)}
                alt={img.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </SectionTeaser>
  );
}
