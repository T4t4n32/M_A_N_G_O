import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Cpu, Code2, Waves, TrendingUp, ArrowRight, type LucideIcon } from "lucide-react";

// Inspired by the published Framer "Feature Flipper" component — a row of
// panels that widens the one under the pointer while the rest compress —
// rebuilt natively instead of embedded. That published module ships with
// hardcoded, off-brand content (an "AI Agent" panel with the OpenAI logo,
// generic SaaS copy) with no addPropertyControls to swap it out, which
// can't be reconciled with a real-data ocean-monitoring site. Reproducing
// just the interaction with framer-motion (already a project dependency)
// keeps full control over source and content per MANGO.md's component
// philosophy, and lets every icon/label/photo below be real M.A.N.G.O.
// gallery content instead of placeholder marketing copy. This is now the
// main visual of the gallery teaser — full-bleed, at the source
// component's own 420px design height — instead of a secondary strip
// under a carousel.

type CategoryId = "Hardware" | "Software" | "Campo" | "Progreso";

interface CategoryCard {
  id: CategoryId;
  icon: LucideIcon;
  desc: string;
}

// Copy written from the actual contents of each category (checked against
// /api/v1/public/media?category=... before writing these) — not invented.
const CATEGORY_CARDS: CategoryCard[] = [
  { id: "Hardware", icon: Cpu, desc: "Sensores, microcontroladores y componentes del prototipo." },
  { id: "Software", icon: Code2, desc: "Código, diagramas y pruebas del sistema de comunicación LoRa." },
  { id: "Campo", icon: Waves, desc: "Despliegues y pruebas del prototipo en el embalse." },
  { id: "Progreso", icon: TrendingUp, desc: "Diseños 3D, ensambles y avances del desarrollo." },
];

interface Snapshot {
  total: number;
  photo: string | null;
}

const HARDWARE_DIR = "/images/gallery/hardware/";
const gridSrc = (src: string) =>
  src.startsWith(HARDWARE_DIR) ? src.replace(HARDWARE_DIR, `${HARDWARE_DIR}thumb/`) : src;

/** Small always-visible affordance so a panel reads as clickable even
 *  before anyone hovers it — not just on the hover-revealed detail. */
function ViewPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 self-start text-[11px] font-semibold text-amber-300 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full border border-amber-300/25">
      {label} <ArrowRight className="h-3 w-3" />
    </span>
  );
}

export function GalleryFeatureFlipper() {
  const navigate = useNavigate();
  const [snapshots, setSnapshots] = useState<Partial<Record<CategoryId, Snapshot>>>({});
  const [active, setActive] = useState<number | null>(null);

  // One real cover photo + real count per category — same public endpoint
  // and same category taxonomy the full /galeria page already uses.
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      CATEGORY_CARDS.map((card) =>
        fetch(`/api/v1/public/media?kind=image&category=${encodeURIComponent(card.id)}&per_page=1`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data: { items: Array<{ url: string }>; total: number } | null): [CategoryId, Snapshot] => [
            card.id,
            { total: data?.total ?? 0, photo: data?.items?.[0]?.url ?? null },
          ])
          .catch((): [CategoryId, Snapshot] => [card.id, { total: 0, photo: null }]),
      ),
    ).then((entries) => {
      if (cancelled) return;
      setSnapshots(Object.fromEntries(entries) as Record<CategoryId, Snapshot>);
    });
    return () => { cancelled = true; };
  }, []);

  // Deep-links into /galeria pre-filtered to this category — mirrors the
  // pattern already wired for the documentation teaser's category cards.
  const goToCategory = (category: CategoryId) => {
    navigate(`/galeria?categoria=${encodeURIComponent(category)}`);
    window.scrollTo({ top: 0 });
  };

  if (Object.keys(snapshots).length === 0) return null;

  return (
    <div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-[11px] font-semibold text-amber-400/80 uppercase tracking-[0.15em]">
          Elige por dónde empezar
        </p>
      </div>

      {/* Full-bleed, like the rest of this section — breaks out of the
          centered column so the panels read as the section's main event. */}
      <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen mt-4">
        {/* Desktop/tablet — hover-expandable panel row at the source
            component's own intrinsic height (420px). */}
        <div className="hidden md:flex gap-1.5 h-[420px] px-4" onMouseLeave={() => setActive(null)}>
          {CATEGORY_CARDS.map((card, i) => {
            const snap = snapshots[card.id];
            const isActive = active === i;
            const Icon = card.icon;
            return (
              <motion.button
                key={card.id}
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                onClick={() => goToCategory(card.id)}
                animate={{ flexGrow: isActive ? 3.6 : 1 }}
                transition={{ duration: 0.6, ease: [0.44, 0, 0.56, 1] }}
                className="group relative min-w-0 overflow-hidden border border-white/10 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:z-10"
                style={{
                  flexBasis: 0,
                  flexShrink: 1,
                  backgroundImage: snap?.photo ? `url(${gridSrc(snap.photo)})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundColor: "rgba(255,255,255,0.04)",
                }}
                aria-label={`Ver fotos de ${card.id}`}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10 transition-opacity group-hover:from-black/80" />
                <div className="relative h-full flex flex-col justify-between p-5">
                  <Icon className="h-7 w-7 text-amber-300 shrink-0" />
                  <div>
                    <h3 className="font-serif font-bold text-white text-2xl whitespace-nowrap">{card.id}</h3>
                    <motion.div
                      initial={false}
                      animate={{ opacity: isActive ? 1 : 0, height: isActive ? "auto" : 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="mt-2 text-sm text-white/75 leading-relaxed max-w-[260px]">{card.desc}</p>
                    </motion.div>
                    <div className="mt-3">
                      <ViewPill label={snap ? `${snap.total} fotos` : "Ver fotos"} />
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Mobile — no hover, so a plain tap-to-jump grid instead of the flip */}
        <div className="grid grid-cols-2 gap-1.5 px-4 md:hidden">
          {CATEGORY_CARDS.map((card) => {
            const snap = snapshots[card.id];
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => goToCategory(card.id)}
                className="relative h-40 overflow-hidden border border-white/10 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                style={{
                  backgroundImage: snap?.photo ? `url(${gridSrc(snap.photo)})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundColor: "rgba(255,255,255,0.04)",
                }}
                aria-label={`Ver fotos de ${card.id}`}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="relative h-full flex flex-col justify-between p-3">
                  <Icon className="h-5 w-5 text-amber-300" />
                  <div>
                    <h3 className="font-serif font-bold text-white text-base">{card.id}</h3>
                    <div className="mt-1.5">
                      <ViewPill label={snap ? `${snap.total} fotos` : "Ver fotos"} />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
