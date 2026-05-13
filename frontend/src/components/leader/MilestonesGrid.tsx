import { useState } from "react";
import { Wrench, Globe, Swords, Recycle } from "lucide-react";
import ChromaGrid from "@/components/effects/ChromaGrid";
import type { ChromaItem } from "@/components/effects/ChromaGrid";
import DecryptedText from "@/components/effects/DecryptedText";
import ImmersivePanel from "./ImmersivePanel";
import { milestones } from "./leaderData";
import { useSiteValue } from "@/lib/siteContent";
import { SiteMediaVisual } from "@/components/SiteMediaVisual";

const milestoneColors: Record<string, { glow: string; accent: string; icon: typeof Wrench; logo?: string }> = {
  internacional: { glow: "rgba(56,189,248,0.25)", accent: "hsl(204 70% 53%)", icon: Globe, logo: "/images/milestones/masterpiece_logo.png" },
  inicios: { glow: "rgba(0,201,167,0.2)", accent: "hsl(168 72% 42%)", icon: Wrench, logo: "/images/milestones/sbtds_logo.png" },
  robisoft: { glow: "rgba(249,115,22,0.2)", accent: "hsl(25 95% 55%)", icon: Swords, logo: "/images/milestones/robisoft_logo.png" },
  ecolatas: { glow: "rgba(34,197,94,0.2)", accent: "hsl(142 60% 45%)", icon: Recycle, logo: "/images/gallery/leader/ecolatas_logo.png" },
};

export default function MilestonesGrid() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = milestones.find((m) => m.id === activeId);
  const colors = active ? milestoneColors[active.id] : undefined;
  const extraDescription = useSiteValue("about.milestones.description", "");

  const chromaItems: ChromaItem[] = milestones.map((m) => {
    const mc = milestoneColors[m.id];
    return {
      image: mc?.logo || "/placeholder.svg",
      title: m.title,
      subtitle: `${m.subtitle} · ${m.year}`,
      borderColor: mc?.accent || "hsl(168 72% 42%)",
      gradient: `linear-gradient(145deg, ${(mc?.accent || "hsl(168 72% 42%)").replace('hsl(', 'hsla(').replace(')', ', 0.15)')}, #000)`,
    };
  });

  return (
    <div>
      <div className="rounded-2xl border border-white/[0.06] p-6 md:p-8 bg-gradient-to-br from-white/[0.02] via-transparent to-accent/[0.03]">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-1 h-6 rounded-full bg-accent" />
          <h3 className="text-white/40 text-xs font-semibold uppercase tracking-[0.2em]">
            <DecryptedText
              text="Hitos y expansión"
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
          radius={300}
          damping={0.45}
          fadeOut={0.6}
          ease="power3.out"
          onItemClick={(index) => setActiveId(milestones[index].id)}
        />
        <div className="mt-6 space-y-4">
          {extraDescription && (
            <p className="text-white/65 text-sm leading-relaxed text-justify max-w-3xl mx-auto">
              {extraDescription}
            </p>
          )}
          <SiteMediaVisual
            fieldKey="about.milestones.media"
            className="max-w-3xl mx-auto"
            ariaLabel="Galería de hitos"
          />
        </div>
      </div>

      {active && colors && (
        <ImmersivePanel
          isOpen={!!activeId}
          onClose={() => setActiveId(null)}
          title={active.title}
          subtitle={active.subtitle}
          description={active.description}
          narrative={active.narrative}
          accentColor={colors.accent}
          media={active.media}
          headerIcon={colors.logo}
          extraContent={
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-sm">
              <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3 text-center">Importancia</h3>
              <p className="text-white/70 text-sm leading-relaxed text-justify">{active.importance}</p>
            </div>
          }
        />
      )}
    </div>
  );
}
