import { useState, useRef } from "react";
import { Trophy, Globe, Sparkles, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import DecryptedText from "@/components/effects/DecryptedText";
import ImmersivePanel from "./ImmersivePanel";
import { useCategoryMedia } from "@/lib/useCategoryMedia";
import { seasons, milestones } from "./leaderData";
import type { SeasonData, MilestoneData } from "./leaderData";

const masterpiece = seasons.find((s) => s.id === "masterpiece")!;
const submerged = seasons.find((s) => s.id === "submerged")!;
const internacional = milestones.find((m) => m.id === "internacional")!;

interface PilarConfig {
  id: string;
  name: string;
  year: string;
  icon: string;
  color: string;
  glowColor: string;
  badge: string;
  BadgeIcon: LucideIcon;
  description: string;
  /** Panel Emma category id — the card preview and panel gallery are both fetched live. */
  category: string;
  narrative: string;
  panelTitle: string;
  panelSubtitle: string;
  kind: "season" | "milestone";
  seasonRef?: SeasonData;
  milestoneRef?: MilestoneData;
}

const pilares: PilarConfig[] = [
  {
    id: "masterpiece",
    name: "MASTERPIECE",
    year: "2023–2024",
    icon: "/images/fll/masterpiece.png",
    color: "hsl(270 60% 60%)",
    glowColor: "rgba(168,85,247,0.3)",
    badge: "1er Puesto Nacional · Clasificación Mundial",
    BadgeIcon: Trophy,
    description: masterpiece.description,
    category: masterpiece.category,
    narrative: masterpiece.evolution,
    panelTitle: masterpiece.name,
    panelSubtitle: masterpiece.year,
    kind: "season",
    seasonRef: masterpiece,
  },
  {
    id: "submerged",
    name: "Submerged",
    year: "2024–2025",
    icon: "/images/fll/submerged.png",
    color: "hsl(204 70% 53%)",
    glowColor: "rgba(56,189,248,0.3)",
    badge: "Mejor Proyecto Innovación · SiembraTech",
    BadgeIcon: Sparkles,
    description: submerged.description,
    category: submerged.category,
    narrative: submerged.evolution,
    panelTitle: submerged.name,
    panelSubtitle: submerged.year,
    kind: "season",
    seasonRef: submerged,
  },
  {
    id: "internacional",
    name: "Representación Internacional",
    year: "2025",
    icon: "/images/milestones/masterpiece_logo.png",
    color: "hsl(168 72% 42%)",
    glowColor: "rgba(0,201,167,0.3)",
    badge: "Colombia en Houston, Texas · Motivate Winner",
    BadgeIcon: Globe,
    description: internacional.description,
    category: internacional.category,
    narrative: internacional.narrative,
    panelTitle: internacional.title,
    panelSubtitle: internacional.subtitle,
    kind: "milestone",
    milestoneRef: internacional,
  },
];

function PilarCard({
  pilar,
  index,
  onClick,
}: {
  pilar: PilarConfig;
  index: number;
  onClick: () => void;
}) {
  const BadgeIcon = pilar.BadgeIcon;
  const glowFaint = pilar.glowColor.replace("0.3", "0.08");
  const glowMid = pilar.glowColor.replace("0.3", "0.18");
  const glowBorder = pilar.glowColor.replace("0.3", "0.25");
  // Lightweight eager fetch just for the card thumbnail — the full gallery
  // loads inside ImmersivePanel only once the card is clicked. Small page
  // size (not 1) so a video landing first in upload order doesn't leave the
  // card without an image to show.
  const { media: previewMedia } = useCategoryMedia(pilar.category, true, 6);
  const preview = previewMedia.find((m) => m.type === "image");

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative rounded-2xl overflow-hidden border bg-white/[0.02] hover:bg-white/[0.04] active:bg-white/[0.06] transition-all duration-300 cursor-pointer text-left w-full touch-manipulation select-none"
      style={{
        borderColor: glowBorder,
        boxShadow: `0 0 28px ${glowFaint}`,
      }}
    >
      {/* Hover glow overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${glowMid}, transparent 70%)`,
        }}
        aria-hidden="true"
      />

      {/* Image preview */}
      <div className="relative h-40 sm:h-52 overflow-hidden">
        {preview ? (
          <img
            src={preview.src}
            alt={preview.alt}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(135deg, ${pilar.glowColor.replace("0.3", "0.25")}, transparent)`,
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(210_35%_8%)] via-[hsl(210_35%_8%)]/50 to-transparent" />

        {/* Large order number */}
        <div className="absolute bottom-2 left-4 select-none">
          <span
            className="text-5xl font-black leading-none"
            style={{ color: pilar.glowColor.replace("0.3", "0.3") }}
          >
            0{index + 1}
          </span>
        </div>

        {/* Year pill */}
        <div className="absolute top-3 right-3">
          <span
            className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-sm"
            style={{
              background: pilar.glowColor.replace("0.3", "0.55"),
              border: `1px solid ${pilar.glowColor.replace("0.3", "0.4")}`,
            }}
          >
            {pilar.year}
          </span>
        </div>

        {/* Season icon */}
        <div className="absolute top-3 left-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <img
              src={pilar.icon}
              alt={pilar.name}
              loading="lazy"
              decoding="async"
              className="w-7 h-7 object-contain"
            />
          </div>
        </div>
      </div>

      {/* Text content */}
      <div className="relative p-5 space-y-3">
        <h3 className="text-lg md:text-xl font-bold text-white leading-tight">
          {pilar.name}
        </h3>

        <p className="text-white/55 text-sm leading-relaxed line-clamp-2">
          {pilar.description}
        </p>

        {/* Achievement badge */}
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-semibold max-w-full"
          style={{
            background: pilar.glowColor.replace("0.3", "0.12"),
            border: `1px solid ${pilar.glowColor.replace("0.3", "0.3")}`,
            color: pilar.color,
          }}
        >
          <BadgeIcon className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{pilar.badge}</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
          <span className="text-[10px] text-white/25 font-medium uppercase tracking-wider">
            {pilar.kind === "milestone" ? "Hito Internacional" : "Temporada FLL"}
          </span>
          <span
            className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider opacity-50 group-hover:opacity-100 transition-opacity"
            style={{ color: pilar.color }}
          >
            Explorar
            <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </button>
  );
}

export default function PilaresSection() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = pilares.find((p) => p.id === activeId);

  const lastActiveRef = useRef<PilarConfig | undefined>(undefined);
  if (active) lastActiveRef.current = active;
  const panelData = active || lastActiveRef.current;

  const extraContent =
    panelData?.kind === "season" && panelData.seasonRef ? (
      <>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-sm">
          <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3 text-center">
            Rol
          </h3>
          <p className="text-white/70 text-sm leading-relaxed text-justify">
            {panelData.seasonRef.role}
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-sm">
          <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3 text-center">
            Aprendizajes
          </h3>
          <p className="text-white/70 text-sm leading-relaxed text-justify">
            {panelData.seasonRef.learnings}
          </p>
        </div>
      </>
    ) : panelData?.kind === "milestone" && panelData.milestoneRef ? (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-sm">
        <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3 text-center">
          Importancia
        </h3>
        <p className="text-white/70 text-sm leading-relaxed text-justify">
          {panelData.milestoneRef.importance}
        </p>
      </div>
    ) : null;

  return (
    <div className="mb-16">
      <div className="rounded-2xl border border-white/[0.06] p-6 md:p-8 bg-gradient-to-br from-amber-500/[0.03] via-transparent to-accent/[0.03]">
        {/* Section header */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-6 rounded-full bg-amber-400" />
          <h3 className="text-amber-400/70 text-xs font-semibold uppercase tracking-[0.2em]">
            <DecryptedText
              text="Pilares Fundamentales"
              speed={30}
              maxIterations={5}
              animateOn="view"
              className="text-amber-400/70"
              encryptedClassName="text-amber-400/20"
            />
          </h3>
        </div>
        <p className="text-white/25 text-[11px] mb-8 pl-3 uppercase tracking-widest">
          Logros que definen el camino · Orden cronológico
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {pilares.map((pilar, index) => (
            <PilarCard
              key={pilar.id}
              pilar={pilar}
              index={index}
              onClick={() => setActiveId(pilar.id)}
            />
          ))}
        </div>
      </div>

      {active && (
        <ImmersivePanel
          isOpen={!!activeId}
          onClose={() => setActiveId(null)}
          title={active.panelTitle}
          subtitle={active.panelSubtitle}
          description={active.description}
          narrative={active.narrative}
          accentColor={active.color}
          category={active.category}
          headerIcon={active.icon}
          extraContent={extraContent}
        />
      )}
    </div>
  );
}
