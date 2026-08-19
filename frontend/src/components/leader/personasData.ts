import { GraduationCap, Settings, Eye, Medal } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const YOUTUBE_CHANNEL = "https://youtube.com/@tatan_32?si=PV-gF7wt1bdklHtR";

export interface PersonaCardData {
  id: "formacion" | "inicios" | "vision" | "reconocimientos";
  color: string;
  Icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel: string;
  /** External link (Formación → YouTube channel) instead of opening a drawer. */
  externalHref?: string;
}

/**
 * The ex-"Piso 1" content — Formación/Inicios/Visión/Reconocimientos — now
 * lives here as Drawer Card data for the Personas section instead of shelf
 * books. Colors/icons/copy match the spec exactly where given; "Inicios"
 * moves from the accent teal it accidentally shared with "Visión" to its
 * own slate tone (the spec's color choice, and a real differentiation).
 */
export const personasCards: PersonaCardData[] = [
  {
    id: "formacion",
    color: "hsl(0 55% 38%)",
    Icon: GraduationCap,
    title: "Formación",
    description: "Comfandi El Prado · Técnico en Electrónica (SENA)",
    ctaLabel: "VER CANAL",
    externalHref: YOUTUBE_CHANNEL,
  },
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
