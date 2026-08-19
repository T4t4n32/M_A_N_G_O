import { Settings, Eye, Medal } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const YOUTUBE_CHANNEL = "https://youtube.com/@tatan_32?si=PV-gF7wt1bdklHtR";

export interface PersonaCardData {
  id: "inicios" | "vision" | "reconocimientos";
  color: string;
  Icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel: string;
}

/**
 * The ex-"Piso 1" content, now Drawer Card data rendered inside the shelf
 * (Estanteria). "Formación" was dropped — its only real function (the
 * YouTube channel link) already exists as the "Ver Canal" button in the
 * Personas bio above, so the card was a pure duplicate.
 */
export const personasCards: PersonaCardData[] = [
  {
    id: "inicios",
    color: "hsl(215 20% 45%)",
    Icon: Settings,
    title: "Inicios",
    description: "Robótica educativa desde temprana edad — Scratch + SB-TDS",
    ctaLabel: "EXPLORAR",
  },
  {
    id: "vision",
    color: "hsl(168 72% 42%)",
    Icon: Eye,
    title: "Visión",
    description: "Tecnología al servicio de la conservación de ecosistemas marítimos",
    ctaLabel: "EXPLORAR",
  },
  {
    id: "reconocimientos",
    color: "hsl(43 96% 56%)",
    Icon: Medal,
    title: "Reconocimientos",
    description: "Premiación del proyecto y representación de Comfandi",
    ctaLabel: "EXPLORAR",
  },
];

/** Real dated milestones nested inside each card's drawer. */
export const milestoneIdsByCard: Record<string, string[]> = {
  inicios: ["inicios", "robisoft"],
  vision: ["ecolatas"],
  reconocimientos: ["reconocimiento-electronica", "reconocimiento-houston"],
};
