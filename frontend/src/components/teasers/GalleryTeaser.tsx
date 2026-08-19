import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import DecryptedText from "@/components/effects/DecryptedText";
import { FramerEmbed } from "@/components/effects/FramerEmbed";
import { GalleryFeatureFlipper } from "./GalleryFeatureFlipper";
import { Button } from "@/components/ui/button";

// Published Framer.com "ScrollRevealText": splits text into words/characters/
// lines and reveals each unit (opacity + color-mix + optional blur/3D) as the
// element scrolls through the viewport. Only needs react/react-jsx-runtime
// plus addPropertyControls/ControlType/useIsStaticRenderer from "framer"
// (shimmed) — no framer-motion or gsap. Falls back to the plain static
// paragraph if framer.com is unreachable.
const FRAMER_SCROLL_REVEAL_TEXT_URL = "https://framer.com/m/ScrollRevealText-vXBxyx.js@ymLCSaN7wX7cJKeayNed";

export function GalleryTeaser() {
  const navigate = useNavigate();
  const [total, setTotal] = useState<number | null>(null);

  // Just the real total now — GalleryFeatureFlipper below is the visual
  // (and fetches its own per-category covers), so this teaser no longer
  // needs a preview array of photo URLs, only the honest count for the
  // header badge and the closing CTA's copy.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/v1/public/media?kind=image&per_page=1&page=1`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { total?: number } | null) => {
        if (cancelled || !data || typeof data.total !== "number") return;
        setTotal(data.total);
      })
      .catch(() => { /* teaser stays text-only — the full gallery still works at /galeria */ });
    return () => { cancelled = true; };
  }, []);

  const goToGallery = () => {
    navigate("/galeria");
    window.scrollTo({ top: 0 });
  };

  return (
    // Unlike every other landing-page section, this one isn't boxed in a
    // bordered card — the whole point of the gallery teaser is to feel like
    // an open window rather than another contained block, so the category
    // flipper below breaks out to the full viewport width.
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
          {total !== null && (
            <span className="text-xs text-white/40 pb-1">{total} fotos reales del desarrollo</span>
          )}
        </div>
        <div className="mt-3 max-w-2xl">
          <FramerEmbed
            moduleUrl={FRAMER_SCROLL_REVEAL_TEXT_URL}
            componentProps={{
              text: "Elige una categoría y descubre el prototipo M.A.N.G.O. en imágenes reales: hardware, código, pruebas en el embalse y cada avance del desarrollo.",
              preset: "Soft Words",
              htmlTag: "p",
              font: {
                fontFamily: '"Source Sans 3", ui-sans-serif, system-ui, sans-serif',
                fontWeight: 400,
                fontSize: "16px",
                lineHeight: "1.6em",
                letterSpacing: "0em",
              },
              colorRevealed: "rgba(255,255,255,0.55)",
              colorHidden: "rgba(255,255,255,0.12)",
              trigger: "Scroll",
              offsetStart: 85,
              offsetEnd: 40,
            }}
            style={{ height: "auto" }}
            fallback={
              <p className="text-white/55">
                Elige una categoría y descubre el prototipo M.A.N.G.O. en imágenes reales: hardware, código, pruebas en el embalse y cada avance del desarrollo.
              </p>
            }
          />
        </div>
      </div>

      <div className="mt-8">
        <GalleryFeatureFlipper />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative mt-10 flex justify-center">
        <Button
          onClick={goToGallery}
          size="lg"
          className="group bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-8 py-6 text-base font-semibold gap-2 shadow-lg shadow-amber-400/10 hover:shadow-amber-400/20 transition-shadow"
        >
          {total !== null ? `Ver las ${total} fotos de la galería` : "Ver galería completa"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </section>
  );
}
