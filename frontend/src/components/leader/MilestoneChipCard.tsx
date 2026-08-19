import type { LucideIcon } from "lucide-react";
import { Wrench, Swords, Recycle, Award, Trophy } from "lucide-react";
import { useCategoryMedia } from "@/lib/useCategoryMedia";
import type { MilestoneData } from "./leaderData";

export interface ChipMilestoneColor {
  glow: string;
  accent: string;
  border: string;
  Icon: LucideIcon;
  logo?: string;
}

export const chipMilestoneColors: Record<string, ChipMilestoneColor> = {
  inicios: {
    glow: "rgba(0,201,167,0.22)",
    accent: "hsl(168 72% 42%)",
    border: "rgba(0,201,167,0.3)",
    Icon: Wrench,
    logo: "/images/milestones/sbtds_logo.png",
  },
  robisoft: {
    glow: "rgba(249,115,22,0.22)",
    accent: "hsl(25 95% 55%)",
    border: "rgba(249,115,22,0.3)",
    Icon: Swords,
    logo: "/images/milestones/robisoft_logo.png",
  },
  ecolatas: {
    glow: "rgba(34,197,94,0.22)",
    accent: "hsl(142 60% 45%)",
    border: "rgba(34,197,94,0.3)",
    Icon: Recycle,
    logo: "/images/gallery/leader/ecolatas_logo.png",
  },
  "reconocimiento-electronica": {
    glow: "rgba(250,204,21,0.22)",
    accent: "hsl(43 96% 56%)",
    border: "rgba(250,204,21,0.3)",
    Icon: Award,
  },
  "reconocimiento-houston": {
    glow: "rgba(56,189,248,0.22)",
    accent: "hsl(204 70% 53%)",
    border: "rgba(56,189,248,0.3)",
    Icon: Trophy,
  },
};

/**
 * Small clickable preview for a single milestone — thumbnail (if Panel Emma
 * has media tagged for it) + title/year/description, opens the full
 * ImmersivePanel on click. Shared between the About page's DrawerCard
 * (Formación/Inicios/Visión/Reconocimientos content) — extracted from the
 * old VisionHero so both call sites reuse the same component instead of
 * duplicating it.
 */
export function MilestoneChipCard({
  milestone,
  colors,
  onClick,
  fullWidth = false,
}: {
  milestone: MilestoneData;
  colors: ChipMilestoneColor;
  onClick: () => void;
  fullWidth?: boolean;
}) {
  // Lightweight eager fetch just for the chip thumbnail — the full gallery
  // loads inside ImmersivePanel only once the chip is clicked.
  const { media: previewMedia } = useCategoryMedia(milestone.category, true, 6);
  const preview = previewMedia.find((m) => m.type === "image");
  const Icon = colors.Icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative rounded-xl overflow-hidden text-left cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-100 touch-manipulation select-none ${fullWidth ? "w-full" : ""}`}
      style={{
        border: `1px solid ${colors.border}`,
        background: colors.glow.replace("0.22", "0.05"),
        boxShadow: `0 0 18px ${colors.glow.replace("0.22", "0.08")}`,
      }}
    >
      {preview && (
        <div className="relative h-28 overflow-hidden">
          <img
            src={preview.src}
            alt={preview.alt}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(210_35%_8%)] via-[hsl(210_35%_8%)]/30 to-transparent" />
        </div>
      )}
      <div className="p-3 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <div
            className="p-1 rounded-md flex-shrink-0"
            style={{ background: colors.glow.replace("0.22", "0.25") }}
          >
            <Icon className="h-3 w-3" style={{ color: colors.accent }} />
          </div>
          <div className="min-w-0">
            <p className="text-white/90 text-xs font-semibold leading-tight truncate">{milestone.title}</p>
            <p className="text-white/40 text-[10px]">{milestone.year}</p>
          </div>
        </div>
        <p className="text-white/55 text-[11px] leading-relaxed line-clamp-2">{milestone.description}</p>
        <span
          className="inline-flex items-center gap-0.5 text-[10px] font-semibold uppercase tracking-wider opacity-60 group-hover:opacity-100 transition-opacity"
          style={{ color: colors.accent }}
        >
          Ver detalles →
        </span>
      </div>
    </button>
  );
}
