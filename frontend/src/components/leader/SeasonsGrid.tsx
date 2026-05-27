import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import DecryptedText from "@/components/effects/DecryptedText";
import ImmersivePanel from "./ImmersivePanel";
import { seasons } from "./leaderData";
import type { SeasonData } from "./leaderData";

const INITIAL_SEASONS = ["cargo-connect", "superpowered"];

export default function SeasonsGrid() {
  const [activeId, setActiveId]       = useState<string | null>(null);
  const [displayData, setDisplayData] = useState<SeasonData | null>(null);

  const visibleSeasons = seasons.filter((s) => INITIAL_SEASONS.includes(s.id));

  // Keep display data alive for the exit animation (350 ms > panel fade 250 ms)
  useEffect(() => {
    if (activeId) {
      const found = visibleSeasons.find((s) => s.id === activeId) ?? null;
      setDisplayData(found);
    } else {
      const t = setTimeout(() => setDisplayData(null), 350);
      return () => clearTimeout(t);
    }
  }, [activeId]);

  return (
    <div className="mb-12">
      <div className="rounded-2xl border border-white/[0.06] p-4 sm:p-6 bg-gradient-to-br from-white/[0.02] via-transparent to-accent/[0.03]">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-1 h-5 rounded-full bg-accent/50" />
          <h3 className="text-white/30 text-xs font-semibold uppercase tracking-[0.2em]">
            <DecryptedText
              text="Los Comienzos en FLL"
              speed={30}
              maxIterations={5}
              animateOn="view"
              className="text-white/30"
              encryptedClassName="text-accent/15"
            />
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {visibleSeasons.map((season) => (
            <button
              key={season.id}
              type="button"
              onClick={() => setActiveId(season.id)}
              className="group flex items-center gap-4 p-4 rounded-xl border border-white/[0.06]
                         bg-white/[0.02] hover:bg-white/[0.05] active:bg-white/[0.08]
                         hover:border-white/[0.14] active:border-white/[0.20]
                         transition-all duration-200 text-left w-full
                         touch-manipulation select-none"
              aria-label={`Ver temporada ${season.name}`}
            >
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border border-white/[0.08]
                           flex items-center justify-center flex-shrink-0 bg-white/10"
                style={{ boxShadow: `0 0 12px ${season.glowColor}` }}
              >
                <img
                  src={season.icon}
                  alt={season.name}
                  className="w-9 h-9 sm:w-10 sm:h-10 object-contain"
                  loading="lazy"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-white/85 font-bold text-sm sm:text-base leading-tight">
                  {season.name}
                </p>
                <p className="text-white/35 text-xs mt-0.5">{season.year}</p>
                <p className="text-white/50 text-xs leading-relaxed mt-1 line-clamp-2">
                  {season.description}
                </p>
              </div>

              <ChevronRight
                className="h-4 w-4 text-white/20 group-hover:text-accent flex-shrink-0
                           transition-colors duration-200 -mr-0.5"
              />
            </button>
          ))}
        </div>
      </div>

      {displayData && (
        <ImmersivePanel
          isOpen={!!activeId}
          onClose={() => setActiveId(null)}
          title={displayData.name}
          subtitle={displayData.year}
          description={displayData.description}
          narrative={displayData.evolution}
          accentColor={displayData.color}
          media={displayData.media}
          headerIcon={displayData.icon}
          extraContent={
            <>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-sm">
                <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3 text-center">
                  Rol
                </h3>
                <p className="text-white/70 text-sm leading-relaxed text-justify">
                  {displayData.role}
                </p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-sm">
                <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3 text-center">
                  Aprendizajes
                </h3>
                <p className="text-white/70 text-sm leading-relaxed text-justify">
                  {displayData.learnings}
                </p>
              </div>
            </>
          }
        />
      )}
    </div>
  );
}
