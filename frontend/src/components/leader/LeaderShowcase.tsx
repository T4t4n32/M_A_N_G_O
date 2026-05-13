import VisionHero from "./VisionHero";
import SeasonsGrid from "./SeasonsGrid";
import MilestonesGrid from "./MilestonesGrid";

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="relative flex items-center justify-center my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      </div>
      <span className="relative z-10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/20 bg-[hsl(210_35%_8%)] rounded-full border border-white/[0.06]">
        {label}
      </span>
    </div>
  );
}

export default function LeaderShowcase() {
  return (
    <div className="mb-12 space-y-2">
      <VisionHero />
      <SectionDivider label="② Temporadas" />
      <SeasonsGrid />
      <SectionDivider label="③ Hitos" />
      <MilestonesGrid />
    </div>
  );
}
