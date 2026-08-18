import { BookOpen, Cpu, Mic, Presentation, FileCode, NotebookPen, Library, type LucideIcon } from "lucide-react";

export interface DocsCategoryMeta {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

// Real categories already present in the docs data (DocumentationSection.tsx's
// `docs` array) — no invented information architecture, just a nav/description
// layer on top of what already exists.
export const DOCS_CATEGORIES: DocsCategoryMeta[] = [
  {
    id: "Investigación",
    label: "Investigación",
    icon: BookOpen,
    description: "Documento base del proyecto: problemática, justificación, revisión bibliográfica y metodología del sistema de monitoreo de manglares.",
  },
  {
    id: "Técnico",
    label: "Técnico",
    icon: FileCode,
    description: "Especificaciones técnicas del sistema: arquitectura de hardware, esquemas de conexión y notas de implementación.",
  },
  {
    id: "Bitácoras",
    label: "Bitácoras",
    icon: NotebookPen,
    description: "Registro cronológico del desarrollo — avances, pruebas y decisiones tomadas durante la construcción del prototipo.",
  },
  {
    id: "Presentaciones",
    label: "Presentaciones",
    icon: Presentation,
    description: "Material usado en presentaciones del proyecto ante jurados, ferias y convocatorias.",
  },
  {
    id: "Electrónica",
    label: "Electrónica",
    icon: Cpu,
    description: "Documentación del subsistema electrónico: sensores, microcontrolador, radio LoRa y montaje físico.",
  },
  {
    id: "Pitch",
    label: "Pitch",
    icon: Mic,
    description: "Material de presentación breve del proyecto para audiencias y convocatorias de emprendimiento.",
  },
  {
    id: "Fuentes",
    label: "Fuentes",
    icon: Library,
    description: "Bibliografía y fuentes externas sobre ecosistemas de manglar que respaldan la investigación del proyecto.",
  },
];
