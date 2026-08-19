import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { hslAlpha } from "@/lib/color";
import ImmersivePanel from "./ImmersivePanel";
import { MilestoneChipCard, chipMilestoneColors } from "./MilestoneChipCard";
import { milestones } from "./leaderData";
import type { PersonaCardData } from "./personasData";

interface DrawerCardProps {
  card: PersonaCardData;
  /** Milestone ids nested inside this card's drawer. */
  milestoneIds?: string[];
}

/**
 * "Foto de fondo" (a colored panel with a big centered icon — these items
 * don't have real uploaded photos, they're conceptual/profile cards) +
 * label. Click opens a Drawer with the full description and the real dated
 * milestones nested underneath (Inicios → Inicios+RobiSoft, Visión →
 * ECOLATAS, Reconocimientos → the two school recognitions), each still
 * opening the full ImmersivePanel on its own click.
 */
export function DrawerCard({ card, milestoneIds = [] }: DrawerCardProps) {
  const [open, setOpen] = useState(false);
  const [activeMilestoneId, setActiveMilestoneId] = useState<string | null>(null);
  const Icon = card.Icon;
  const nested = milestoneIds.map((id) => milestones.find((m) => m.id === id)!).filter(Boolean);
  const activeMilestone = nested.find((m) => m.id === activeMilestoneId) ?? null;
  const activeColors = activeMilestoneId ? chipMilestoneColors[activeMilestoneId] : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative flex flex-col items-center justify-center text-center gap-2.5 h-40 rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer w-full"
        style={{ borderColor: hslAlpha(card.color, 0.2), background: `linear-gradient(160deg, ${hslAlpha(card.color, 0.13)}, hsl(210,35%,9%))` }}
      >
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${hslAlpha(card.color, 0.19)}, transparent 70%)` }}
          aria-hidden="true"
        />
        <div className="relative p-3 rounded-xl" style={{ background: hslAlpha(card.color, 0.13), color: card.color }}>
          <Icon className="h-6 w-6" />
        </div>
        <p className="relative text-white/90 text-sm font-bold uppercase tracking-wider">{card.title}</p>
        <span
          className="relative inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider opacity-70 group-hover:opacity-100 transition-opacity"
          style={{ color: card.color }}
        >
          {card.ctaLabel}
        </span>
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="bg-[hsl(210,32%,10%)] border-white/10 text-white">
          <div className="mx-auto w-full max-w-2xl">
            <DrawerHeader className="text-left">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="p-2 rounded-lg" style={{ background: hslAlpha(card.color, 0.13), color: card.color }}>
                  <Icon className="h-4 w-4" />
                </div>
                <DrawerTitle className="text-white text-xl">{card.title}</DrawerTitle>
              </div>
              <DrawerDescription className="text-white/60 text-sm leading-relaxed">
                {card.description}
              </DrawerDescription>
            </DrawerHeader>

            {nested.length > 0 && (
              <div className="px-4 pb-2 grid sm:grid-cols-2 gap-4">
                {nested.map((m) => (
                  <MilestoneChipCard
                    key={m.id}
                    milestone={m}
                    colors={chipMilestoneColors[m.id]}
                    onClick={() => setActiveMilestoneId(m.id)}
                  />
                ))}
              </div>
            )}

            <div className="p-4 pt-2">
              <DrawerClose asChild>
                <Button variant="outline" className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white/80">
                  Cerrar
                </Button>
              </DrawerClose>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {activeMilestone && activeColors && (
        <ImmersivePanel
          isOpen={!!activeMilestoneId}
          onClose={() => setActiveMilestoneId(null)}
          title={activeMilestone.title}
          subtitle={activeMilestone.subtitle}
          description={activeMilestone.description}
          narrative={activeMilestone.narrative}
          accentColor={activeColors.accent}
          category={activeMilestone.category}
          headerIcon={activeColors.logo}
          extraContent={
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-sm">
              <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3 text-center">
                Importancia
              </h3>
              <p className="text-white/70 text-sm leading-relaxed text-justify">{activeMilestone.importance}</p>
            </div>
          }
        />
      )}
    </>
  );
}
