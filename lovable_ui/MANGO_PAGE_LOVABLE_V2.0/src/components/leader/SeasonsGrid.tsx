import { useState } from "react";
import ChromaGrid from "@/components/effects/ChromaGrid";
import type { ChromaItem } from "@/components/effects/ChromaGrid";
import DecryptedText from "@/components/effects/DecryptedText";
import ImmersivePanel from "./ImmersivePanel";
import { seasons } from "./leaderData";

export default function SeasonsGrid() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = seasons.find((s) => s.id === activeId);

  const chromaItems: ChromaItem[] = seasons.map((s) => ({
    image: s.icon,
    title: s.name,
    subtitle: s.year,
    borderColor: s.color,
    gradient: `linear-gradient(145deg, ${s.color.replace('hsl(', 'hsla(').replace(')', ', 0.15)')}, #000)`,
  }));

  return (
    <div className="mb-16">
      <div className="rounded-2xl border border-white/[0.06] p-6 md:p-8 bg-gradient-to-br from-white/[0.02] via-transparent to-accent/[0.03]">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-1 h-6 rounded-full bg-accent" />
          <h3 className="text-white/40 text-xs font-semibold uppercase tracking-[0.2em]">
            <DecryptedText
              text="Temporadas que construyeron el camino"
              speed={30}
              maxIterations={5}
              animateOn="view"
              className="text-white/40"
              encryptedClassName="text-accent/20"
            />
          </h3>
        </div>

        <ChromaGrid
          items={chromaItems}
          columns={4}
          radius={250}
          damping={0.45}
          fadeOut={0.6}
          ease="power3.out"
          onItemClick={(index) => setActiveId(seasons[index].id)}
        />
      </div>

      {active && (
        <ImmersivePanel
          isOpen={!!activeId}
          onClose={() => setActiveId(null)}
          title={active.name}
          subtitle={active.year}
          description={active.description}
          narrative={active.evolution}
          accentColor={active.color}
          media={active.media}
          headerIcon={active.icon}
          extraContent={
            <>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-sm">
                <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3 text-center">Rol</h3>
                <p className="text-white/70 text-sm leading-relaxed text-justify">{active.role}</p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-sm">
                <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3 text-center">Aprendizajes</h3>
                <p className="text-white/70 text-sm leading-relaxed text-justify">{active.learnings}</p>
              </div>
            </>
          }
        />
      )}
    </div>
  );
}
