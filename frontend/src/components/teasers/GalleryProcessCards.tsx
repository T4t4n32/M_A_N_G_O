import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Cpu, Waves, ArrowUpRight, type LucideIcon } from "lucide-react";

// Two-card glassmorphic layout for the gallery teaser: rounded-[32px] cards,
// a real cover photo, liquid-glass badge + circular action button.
//
// On desktop the row also reproduces the published Framer "Feature Flipper"
// component's own interaction: the panel under the pointer widens while the
// other compresses, using the same 0.8s / cubic-bezier(.44,0,.56,1) tween
// and the same 3:1 expanded:collapsed ratio found in that component's
// bundle (https://framer.com/m/Feature-Flipper-vq8lGG.js@DDpRc1RwPkQtlMT9sAII).
// That module's own content (an "AI Agent" panel with the OpenAI logo,
// generic SaaS copy) is hardcoded with no addPropertyControls to override —
// see the git history for the earlier investigation — so the *motion* is
// reproduced with framer-motion (already a project dependency) rather than
// embedding the module, while every label/photo/description stays real
// M.A.N.G.O. gallery content. Expanding a panel now also reveals a short
// description, matching that source component's expand-to-reveal-detail
// behavior. Mobile has no hover, so it keeps a static tap-to-jump grid.
//
// "Proceso" and "Campo" are the two real story beats of the gallery, not
// arbitrary labels: the backend's four real categories (Hardware, Software,
// Campo, Progreso — see GallerySection.tsx's VALID_CATS) split naturally
// into "built indoors" (Hardware + Software + Progreso) vs. "tested in the
// water" (Campo). GallerySection's filter has a matching "Proceso" branch
// (active !== "Campo") so this card's link actually shows that whole group,
// not just a sliver of it.

type CardId = "Proceso" | "Campo";

interface ProcessCard {
  id: CardId;
  badge: string;
  desc: string;
  icon: LucideIcon;
  /** Real backend category used only to fetch this card's cover photo. */
  coverCategory: "Progreso" | "Campo";
}

// Descriptions written from the actual contents of each grouping (checked
// against /api/v1/public/media?category=... before writing these).
const CARDS: ProcessCard[] = [
  {
    id: "Proceso",
    badge: "Hardware y software",
    desc: "Sensores, microcontroladores, código LoRa y diseños 3D — todo lo que se construye antes de salir al agua.",
    icon: Cpu,
    coverCategory: "Progreso",
  },
  {
    id: "Campo",
    badge: "Pruebas en el embalse",
    desc: "Despliegues reales del prototipo: sensores en el agua, recepción de datos por LoRa y pruebas de navegación.",
    icon: Waves,
    coverCategory: "Campo",
  },
];

const FLIP_TRANSITION = { duration: 0.8, ease: [0.44, 0, 0.56, 1] as const };

export function GalleryProcessCards() {
  const navigate = useNavigate();
  const [covers, setCovers] = useState<Partial<Record<CardId, string>>>({});
  const [active, setActive] = useState<CardId | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      CARDS.map((card) =>
        fetch(`/api/v1/public/media?kind=image&category=${card.coverCategory}&per_page=1`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data: { items: Array<{ url: string }> } | null): [CardId, string | null] => [
            card.id,
            data?.items?.[0]?.url ?? null,
          ])
          .catch((): [CardId, string | null] => [card.id, null]),
      ),
    ).then((entries) => {
      if (cancelled) return;
      const map: Partial<Record<CardId, string>> = {};
      entries.forEach(([id, url]) => { if (url) map[id] = url; });
      setCovers(map);
    });
    return () => { cancelled = true; };
  }, []);

  const goToCategory = (card: ProcessCard) => {
    navigate(`/galeria?categoria=${encodeURIComponent(card.id)}`);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Desktop/tablet — hover-expandable panel row (mouse only) */}
      <div className="hidden md:flex gap-6 md:gap-8 h-[420px]" onMouseLeave={() => setActive(null)}>
        {CARDS.map((card) => {
          const cover = covers[card.id];
          const isActive = active === card.id;
          const Icon = card.icon;
          return (
            <motion.button
              key={card.id}
              type="button"
              onMouseEnter={() => setActive(card.id)}
              onFocus={() => setActive(card.id)}
              onBlur={() => setActive(null)}
              onClick={() => goToCategory(card)}
              aria-label={`Ver fotos de ${card.id}`}
              aria-expanded={isActive}
              animate={{ flexGrow: isActive ? 3 : 1 }}
              transition={FLIP_TRANSITION}
              className="group relative min-w-0 overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(213,40%,7%)] focus-visible:z-10"
              style={{ flexBasis: 0, flexShrink: 1 }}
            >
              {cover && (
                <img
                  src={cover}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

              <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-8">
                <div className="flex items-start justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-md whitespace-nowrap">
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {card.badge}
                  </span>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-md transition-all group-hover:scale-105 group-hover:bg-white/30">
                    <ArrowUpRight className="h-4 w-4 text-white" />
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white whitespace-nowrap">{card.id}</h3>
                  <motion.div
                    initial={false}
                    animate={{ opacity: isActive ? 1 : 0, height: isActive ? "auto" : 0 }}
                    transition={{ duration: 0.35 }}
                    className="overflow-hidden"
                  >
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-white/75">{card.desc}</p>
                  </motion.div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Mobile — no hover, so a plain tap-to-jump grid instead of the flip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
        {CARDS.map((card) => {
          const cover = covers[card.id];
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => goToCategory(card)}
              aria-label={`Ver fotos de ${card.id}`}
              className="group relative aspect-[4/3] w-full overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {cover && (
                <img
                  src={cover}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-between p-5">
                <div className="flex items-start justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
                    <Icon className="h-3 w-3 shrink-0" />
                    {card.badge}
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                    <ArrowUpRight className="h-3.5 w-3.5 text-white" />
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{card.id}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-white/70">{card.desc}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
