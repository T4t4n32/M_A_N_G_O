import { useState, useRef } from "react";
import { ChevronRight } from "lucide-react";
import DecryptedText from "@/components/effects/DecryptedText";
import ImmersivePanel from "./ImmersivePanel";
import { seasons } from "./leaderData";
import type { SeasonData } from "./leaderData";

const INITIAL_SEASONS = ["cargo-connect", "superpowered"];

export default function SeasonsGrid() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const visibleSeasons = seasons.filter((s) => INITIAL_SEASONS.includes(s.id));
  const active = visibleSeasons.find((s) => s.id === activeId);

  // Keep last active data alive so exit animation can complete
  const lastActiveRef = useRef<SeasonData | undefined>(undefined);
  if (active) lastActiveRef.current = active;
  const panelData = active || lastActiveRef.current;

  return (
    <div className="mb-16">
      <div className="rounded-2xl border border-white/[0.06] p-5 md:p-6 bg-gradient-to-br from-white/[0.02] via-transparent to-accent/[0.03]">
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

        <div className="grid sm:grid-cols-2 gap-3">
          {visibleSeasons.map((season) => (
            <button
              key={season.id}
              onClick={() => setActiveId(season.id)}
              className="group flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-300 text-left w-full"
            >
              <div
                className="w-12 h-12 rounded-xl overflow-hidden border border-white/[0.08] flex items-center justify-center flex-shrink-0 bg-white/10"
                style={{ boxShadow: `0 0 12px ${season.glowColor}` }}
              >
                <img
                  src={season.icon}
                  alt={season.name}
                  className="w-9 h-9 object-contain"
                  loading="lazy"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-white/80 font-bold text-sm leading-tight">{season.name}</p>
                <p className="text-white/35 text-xs mb-1">{season.year}</p>
                <p className="text-white/45 text-xs leading-relaxed line-clamp-2">
                  {season.description}
                </p>
              </div>

              <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-accent flex-shrink-0 transition-colors duration-200" />
            </button>
          ))}
        </div>
      </div>

      {panelData && (
        <ImmersivePanel
          isOpen={!!activeId}
          onClose={() => setActiveId(null)}
          title={panelData.name}
          subtitle={panelData.year}
          description={panelData.description}
          narrative={panelData.evolution}
          accentColor={panelData.color}
          media={panelData.media}
          headerIcon={panelData.icon}
          extraContent={
            <>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-sm">
                <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3 text-center">
                  Rol
                </h3>
                <p className="text-white/70 text-sm leading-relaxed text-justify">{panelData.role}</p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-sm">
                <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3 text-center">
                  Aprendizajes
                </h3>
                <p className="text-white/70 text-sm leading-relaxed text-justify">
                  {panelData.learnings}
                </p>
              </div>
            </>
          }
        />
      )}
    </div>
  );
}
