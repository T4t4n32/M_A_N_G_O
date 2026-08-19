import { seasons, milestones } from "../leaderData";

const masterpiece = seasons.find((s) => s.id === "masterpiece")!;
const submerged = seasons.find((s) => s.id === "submerged")!;
const cargoConnect = seasons.find((s) => s.id === "cargo-connect")!;
const superpowered = seasons.find((s) => s.id === "superpowered")!;
const internacional = milestones.find((m) => m.id === "internacional")!;

export interface EstanteriaBook {
  id: string;
  floor: number;
  position: number;
  /** Solid cover color — the same accent each item already carries elsewhere on the site. */
  color: string;
  glowColor: string;
  eyebrow: string;
  title: string;
  description: string;
  tags?: string[];
  badge?: string;
  ctaLabel?: string;
  visualType: "photo" | "logo";
  /** photo: Panel Emma category id, media fetched live via useCategoryMedia. */
  category?: string;
  /** logo: real static asset path. */
  visualSrc?: string;
}

export interface EstanteriaFloor {
  floor: number;
  label: string;
  sublabel: string;
  books: EstanteriaBook[];
}

/**
 * Piso 2 — "Pilares Fundamentales" and Piso 3 — "Los Comienzos en FLL".
 * Content is the real seasons/milestones data already live elsewhere on
 * this page (PilaresSection/SeasonsGrid before this rebuild) — colors,
 * descriptions and categories are the established ones, not re-invented.
 * "Representación Internacional"'s description was reported as visually
 * clipped by CSS in the old card; this is the real, un-clamped text from
 * leaderData.ts.
 */
export const estanteriaFloors: EstanteriaFloor[] = [
  {
    floor: 2,
    label: "Pilares Fundamentales",
    sublabel: "Logros que definen el camino · Orden cronológico",
    books: [
      {
        id: "masterpiece",
        floor: 2,
        position: 1,
        color: "hsl(270 60% 60%)",
        glowColor: "rgba(168,85,247,0.3)",
        eyebrow: "01 · TEMPORADA FLL",
        title: "Masterpiece",
        description: masterpiece.description,
        tags: ["1er Puesto Nacional", "Clasificación Mundial"],
        badge: masterpiece.year,
        ctaLabel: "EXPLORAR",
        visualType: "photo",
        category: masterpiece.category,
      },
      {
        id: "submerged",
        floor: 2,
        position: 2,
        color: "hsl(204 70% 53%)",
        glowColor: "rgba(56,189,248,0.3)",
        eyebrow: "02 · TEMPORADA FLL",
        title: "Submerged",
        description: submerged.description,
        tags: ["Mejor Proyecto Innovación", "SiembraTech"],
        badge: submerged.year,
        ctaLabel: "EXPLORAR",
        visualType: "photo",
        category: submerged.category,
      },
      {
        id: "internacional",
        floor: 2,
        position: 3,
        color: "hsl(168 72% 42%)",
        glowColor: "rgba(0,201,167,0.3)",
        eyebrow: "03 · HITO INTERNACIONAL",
        title: "Representación Internacional",
        description: internacional.description,
        tags: ["Colombia en Houston, Texas", "Motivate Winner"],
        badge: internacional.year,
        ctaLabel: "EXPLORAR",
        visualType: "photo",
        category: internacional.category,
      },
    ],
  },
  {
    floor: 3,
    label: "Los Comienzos en FLL",
    sublabel: "",
    books: [
      {
        id: "cargo-connect",
        floor: 3,
        position: 1,
        color: "hsl(142 60% 45%)",
        glowColor: "rgba(34,197,94,0.3)",
        eyebrow: "LOS COMIENZOS EN FLL",
        title: cargoConnect.name,
        description: cargoConnect.description,
        badge: cargoConnect.year,
        visualType: "logo",
        visualSrc: cargoConnect.icon,
      },
      {
        id: "superpowered",
        floor: 3,
        position: 2,
        color: "hsl(25 95% 55%)",
        glowColor: "rgba(249,115,22,0.3)",
        eyebrow: "LOS COMIENZOS EN FLL",
        title: superpowered.name,
        description: superpowered.description,
        badge: superpowered.year,
        visualType: "logo",
        visualSrc: superpowered.icon,
      },
    ],
  },
];
