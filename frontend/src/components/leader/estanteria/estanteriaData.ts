import { Settings, Eye, Medal } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { seasons, milestones } from "../leaderData";

const masterpiece = seasons.find((s) => s.id === "masterpiece")!;
const submerged = seasons.find((s) => s.id === "submerged")!;
const cargoConnect = seasons.find((s) => s.id === "cargo-connect")!;
const superpowered = seasons.find((s) => s.id === "superpowered")!;
const internacional = milestones.find((m) => m.id === "internacional")!;
const inicios = milestones.find((m) => m.id === "inicios")!;
const robisoft = milestones.find((m) => m.id === "robisoft")!;
const ecolatas = milestones.find((m) => m.id === "ecolatas")!;
const reconocimientoElectronica = milestones.find((m) => m.id === "reconocimiento-electronica")!;
const reconocimientoHouston = milestones.find((m) => m.id === "reconocimiento-houston")!;

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
  visualType: "photo" | "logo" | "icon";
  /** photo: Panel Emma category id, media fetched live via useCategoryMedia. */
  category?: string;
  /** logo: real static asset path. */
  visualSrc?: string;
  /** icon: no real photo exists for these (conceptual/profile books) — a big centered lucide icon instead. */
  Icon?: LucideIcon;
}

export interface EstanteriaFloor {
  floor: number;
  label: string;
  sublabel: string;
  books: EstanteriaBook[];
}

/**
 * 3 floors, 3/3/2 books. Piso 1 (Inicios/Visión/Reconocimientos) used to
 * live outside the shelf as Drawer Cards — now real books like everything
 * else, same flip/expand mechanic. Their nested real milestones (Inicios en
 * Robótica, Copa RobiSoft, ECOLATAS, the two school recognitions) fold into
 * each book's tags instead of a separate nested-drawer UI. Piso 2
 * ("Pilares Fundamentales") and Piso 3 ("Los Comienzos en FLL") are
 * unchanged. All content is the real seasons/milestones data already used
 * elsewhere on the site — nothing invented.
 */
export const estanteriaFloors: EstanteriaFloor[] = [
  {
    floor: 1,
    label: "Sebastián Sánchez Chacón",
    sublabel: "Líder de Desarrollo — M.A.N.G.O.",
    books: [
      {
        id: "inicios",
        floor: 1,
        position: 1,
        color: "hsl(215 20% 45%)",
        glowColor: "hsl(215 20% 45% / 0.3)",
        eyebrow: "01 · TRAYECTORIA",
        title: "Inicios",
        description: "Robótica educativa desde temprana edad — Scratch + SB-TDS",
        tags: [inicios.title, robisoft.title],
        visualType: "icon",
        Icon: Settings,
      },
      {
        id: "vision",
        floor: 1,
        position: 2,
        color: "hsl(168 72% 42%)",
        glowColor: "hsl(168 72% 42% / 0.3)",
        eyebrow: "02 · TRAYECTORIA",
        title: "Visión",
        description: "Tecnología al servicio de la conservación de ecosistemas marítimos",
        tags: [ecolatas.title],
        visualType: "icon",
        Icon: Eye,
      },
      {
        id: "reconocimientos",
        floor: 1,
        position: 3,
        color: "hsl(43 96% 56%)",
        glowColor: "hsl(43 96% 56% / 0.3)",
        eyebrow: "03 · TRAYECTORIA",
        title: "Reconocimientos",
        description: "Premiación del proyecto y representación de Comfandi",
        tags: [reconocimientoElectronica.title, reconocimientoHouston.title],
        visualType: "icon",
        Icon: Medal,
      },
    ],
  },
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
