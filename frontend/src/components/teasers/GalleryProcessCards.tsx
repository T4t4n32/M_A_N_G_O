import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cpu, Waves, ArrowUpRight, type LucideIcon } from "lucide-react";

// Two-card glassmorphic grid replacing the earlier hover-flip panel row —
// rounder, softer, no width-flip mechanic, per the UI/UX brief: liquid-glass
// badges/buttons over a full-bleed photo, static aspect-ratio cards instead
// of an expand-on-hover interaction.
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
  icon: LucideIcon;
  /** Real backend category used only to fetch this card's cover photo. */
  coverCategory: "Progreso" | "Campo";
}

const CARDS: ProcessCard[] = [
  { id: "Proceso", badge: "Hardware y software", icon: Cpu, coverCategory: "Progreso" },
  { id: "Campo", badge: "Pruebas en el embalse", icon: Waves, coverCategory: "Campo" },
];

export function GalleryProcessCards() {
  const navigate = useNavigate();
  const [covers, setCovers] = useState<Partial<Record<CardId, string>>>({});

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {CARDS.map((card) => {
          const cover = covers[card.id];
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => goToCategory(card)}
              aria-label={`Ver fotos de ${card.id}`}
              className="group relative aspect-[4/3] w-full overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(213,40%,7%)]"
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-8">
                <div className="flex items-start justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-md">
                    <Icon className="h-3.5 w-3.5" />
                    {card.badge}
                  </span>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-md transition-all group-hover:scale-105 group-hover:bg-white/30">
                    <ArrowUpRight className="h-4 w-4 text-white" />
                  </span>
                </div>

                <h3 className="text-2xl md:text-3xl font-bold text-white">{card.id}</h3>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
