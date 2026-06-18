import DecryptedText from "@/components/effects/DecryptedText";
import GlareHover from "@/components/effects/GlareHover";
import SpotlightCard from "@/components/effects/SpotlightCard";
import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useSiteValue } from "@/lib/siteContent";
import { listItems as listPanelItems } from "@/lib/panelEmmaContent";
import {
  FileText,
  Download,
  Presentation,
  ClipboardList,
  Cpu,
  Lightbulb,
  Mic,
  ChevronDown,
  Search,
  X,
  FileType,
  File } from
"lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const categoryFilters = ["Todos", "Investigación", "Técnico", "Bitácoras", "Presentaciones", "Electrónica", "Pitch", "Fuentes"];

const formatIcons: Record<string, {color: string;bg: string;border: string;}> = {
  PDF: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/25" },
  XLSX: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25" },
  PPTX: { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/25" },
  DOCX: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/25" },
  MD: { color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/25" },
  TXT: { color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/25" },
  ZIP: { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/25" }
};

const formatColors: Record<string, string> = {
  PDF: "bg-red-500/20 text-red-300 border border-red-500/30",
  XLSX: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  PPTX: "bg-orange-500/20 text-orange-300 border border-orange-500/30",
  DOCX: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  MD: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
  TXT: "bg-slate-500/20 text-slate-300 border border-slate-500/30",
  ZIP: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
};

export interface Doc {
  title: string;
  desc: string;
  category: string;
  date: string;
  icon: typeof FileText;
  files: {label: string;href: string;}[];
  lang?: string;
}

export const docs: Doc[] = [
// === Investigación ===
{
  title: "RAW M.A.N.G.O",
  desc: "Documento de investigación base: problemática, justificación, revisión bibliográfica y metodología del sistema de monitoreo.",
  category: "Investigación",
  date: "2025",
  icon: FileText,
  files: [{ label: "PDF", href: "/docs/RAW_MANGO.pdf" }]
},
{
  title: "M.A.N.G.O — Documento Principal",
  desc: "Documento técnico completo del proyecto M.A.N.G.O. con investigación, diseño y especificaciones.",
  category: "Investigación",
  date: "2025",
  icon: FileText,
  files: [{ label: "DOCX", href: "/docs/M_A_N_G_O.docx" }]
},
{
  title: "M.A.N.G.O — English Version",
  desc: "Full project document translated to English for international presentation and competitions.",
  category: "Investigación",
  date: "2025",
  icon: FileText,
  files: [{ label: "PDF", href: "/docs/MANGO_English.pdf" }],
  lang: "EN"
},
{
  title: "M.A.N.G.O — Versión Español",
  desc: "Documento completo del proyecto en español con toda la investigación y especificaciones técnicas.",
  category: "Investigación",
  date: "2025",
  icon: FileText,
  files: [{ label: "PDF", href: "/docs/MANGO.pdf" }]
},
{
  title: "Informe Económico V1.0.0",
  desc: "Informe técnico SENA: servicios ecosistémicos y justificación económica del monitoreo de manglares.",
  category: "Investigación",
  date: "2025",
  icon: FileText,
  files: [{ label: "PDF", href: "/docs/Early_version_V1.0.0_MANGO_economia.pdf" }]
},
{
  title: "V1 — Datos Económicos Manuscritos",
  desc: "Datos económicos preliminares en formato manuscrito del proyecto.",
  category: "Investigación",
  date: "2025",
  icon: FileText,
  files: [{ label: "PDF", href: "/docs/V1_handwritten_economia_data.pdf" }]
},
{
  title: "V2 — Datos Económicos",
  desc: "Segunda versión de los datos económicos del proyecto.",
  category: "Investigación",
  date: "2025",
  icon: FileText,
  files: [{ label: "DOCX", href: "/docs/V2_handwritten_economia_data.docx" }]
},
// === Electrónica ===
{
  title: "M.A.N.G.O — Electrónica",
  desc: "Diseño electrónico del sistema: esquemas, sensores, comunicación LoRa y arquitectura de hardware.",
  category: "Electrónica",
  date: "2025",
  icon: Cpu,
  files: [
  { label: "PDF", href: "/docs/MANGO-ELECTRONICA.pdf" },
  { label: "PPTX", href: "/docs/MANGO-ELECTRONICA.pptx" }]

},
{
  title: "Electrónica — Presentación",
  desc: "Presentación del diseño electrónico del sistema M.A.N.G.O con diagramas y especificaciones de componentes.",
  category: "Electrónica",
  date: "2025",
  icon: Cpu,
  files: [
  { label: "PDF", href: "/docs/ELECTRONICA_PRESENTACION_MANGO.pdf" },
  { label: "PPTX", href: "/docs/ELECTRONICA_PRESENTACION_MANGO.pptx" }]

},
{
  title: "Economía — Versión M.A.N.G.O",
  desc: "Análisis económico y de viabilidad financiera del proyecto M.A.N.G.O.",
  category: "Investigación",
  date: "2025",
  icon: FileText,
  files: [
  { label: "PDF", href: "/docs/Economia_MANGO_Version.pdf" },
  { label: "PPTX", href: "/docs/Economia_MANGO_Version.pptx" }]

},
// === Pitch ===
{
  title: "Pitch M.A.N.G.O",
  desc: "Documento de pitch para presentar el proyecto ante jurados, inversores o convocatorias.",
  category: "Pitch",
  date: "2025",
  icon: Mic,
  files: [{ label: "PDF", href: "/docs/PITCH.pdf" }]
},
{
  title: "Plantilla Emprendimiento",
  desc: "Plantilla de presentación para formato de emprendimiento e innovación.",
  category: "Pitch",
  date: "2025",
  icon: Lightbulb,
  files: [{ label: "PPTX", href: "/docs/Plantilla_Emprendimiento.pptx" }]
},
{
  title: "Plantilla SENA",
  desc: "Plantilla oficial SENA para presentación institucional del proyecto productivo.",
  category: "Pitch",
  date: "2025",
  icon: Lightbulb,
  files: [{ label: "PDF", href: "/docs/PLANTILLA_SENA.pdf" }]
},
// === Bitácoras ===
{
  title: "Bitácora #1",
  desc: "GFPI-F-147 — Etapa productiva SENA. Período: Oct 1–15, 2025.",
  category: "Bitácoras",
  date: "Oct 2025",
  icon: ClipboardList,
  files: [
  { label: "PDF", href: "/docs/BITACORA_1_SEBASTIAN_SANCHEZ_CHACON.pdf" },
  { label: "XLSX", href: "/docs/BITACORA_1_SEBASTIAN_SANCHEZ_CHACON.xlsx" }]

},
{
  title: "Bitácora #2",
  desc: "GFPI-F-147 — Etapa productiva SENA. Período: Oct 16–30, 2025.",
  category: "Bitácoras",
  date: "Oct 2025",
  icon: ClipboardList,
  files: [
  { label: "PDF", href: "/docs/BITACORA_2_SEBASTIAN_SANCHEZ_CHACON.pdf" },
  { label: "XLSX", href: "/docs/BITACORA_2_SEBASTIAN_SANCHEZ_CHACON.xlsx" }]

},
{
  title: "Bitácora #3",
  desc: "GFPI-F-147 — Etapa productiva SENA.",
  category: "Bitácoras",
  date: "2025",
  icon: ClipboardList,
  files: [
  { label: "PDF", href: "/docs/BITACORA_3_SEBASTIAN_SANCHEZ_CHACON.pdf" },
  { label: "XLSX", href: "/docs/BITACORA_3_SEBASTIAN_SANCHEZ_CHACON.xlsx" }]

},
{
  title: "Bitácora #4",
  desc: "GFPI-F-147 — Etapa productiva SENA.",
  category: "Bitácoras",
  date: "2025",
  icon: ClipboardList,
  files: [
  { label: "PDF", href: "/docs/BITACORA_4_SEBASTIAN_SANCHEZ_CHACON.pdf" },
  { label: "XLSX", href: "/docs/BITACORA_4_SEBASTIAN_SANCHEZ_CHACON.xlsx" }]

},
{
  title: "Bitácora #5",
  desc: "GFPI-F-147 — Etapa productiva SENA.",
  category: "Bitácoras",
  date: "2025",
  icon: ClipboardList,
  files: [
  { label: "PDF", href: "/docs/BITACORA_5_SEBASTIAN_SANCHEZ_CHACON.pdf" },
  { label: "XLSX", href: "/docs/BITACORA_5_SEBASTIAN_SANCHEZ_CHACON.xlsx" }]

},
{
  title: "Bitácora #6",
  desc: "GFPI-F-147 — Etapa productiva SENA.",
  category: "Bitácoras",
  date: "2025",
  icon: ClipboardList,
  files: [
  { label: "PDF", href: "/docs/BITACORA_6_SEBASTIAN_SANCHEZ_CHACON.pdf" },
  { label: "XLSX", href: "/docs/BITACORA_6_SEBASTIAN_SANCHEZ_CHACON.xlsx" }]

},
// === Presentaciones ===
{
  title: "Board M.A.N.G.O",
  desc: "Presentación general del proyecto: misión, visión, logo y sistema de monitoreo autónomo.",
  category: "Presentaciones",
  date: "2025",
  icon: Presentation,
  files: [{ label: "PPTX", href: "/docs/Board_MANGO.pptx" }]
},
{
  title: "V1 — Board M.A.N.G.O",
  desc: "Primera versión de la presentación del proyecto M.A.N.G.O.",
  category: "Presentaciones",
  date: "2025",
  icon: Presentation,
  files: [{ label: "PPTX", href: "/docs/V1_MANGO.pptx" }]
},
{
  title: "SENA — Board M.A.N.G.O",
  desc: "Presentación M.A.N.G.O para SENA — Formato oficial institucional.",
  category: "Presentaciones",
  date: "2025",
  icon: Presentation,
  files: [{ label: "PPTX", href: "/docs/SENA_MANGO.pptx" }]
},
{
  title: "Última Presentación M.A.N.G.O",
  desc: "Versión más reciente de la presentación general del proyecto M.A.N.G.O.",
  category: "Presentaciones",
  date: "2025",
  icon: Presentation,
  files: [{ label: "PPTX", href: "/docs/LATEST_PRESENTATION_MANGO.pptx" }]
},
{
  title: "FS — M.A.N.G.O",
  desc: "Presentación de factibilidad y sostenibilidad del proyecto M.A.N.G.O.",
  category: "Presentaciones",
  date: "2025",
  icon: Presentation,
  files: [{ label: "PPTX", href: "/docs/FS_MANGO.pptx" }]
},
{
  title: "Ejemplo Plantilla SENA",
  desc: "Ejemplo de plantilla oficial SENA para formato de presentación de proyectos productivos.",
  category: "Presentaciones",
  date: "2025",
  icon: Presentation,
  files: [{ label: "PPTX", href: "/docs/EJEMPLO_PLANTILLA_SENA.pptx" }]
},
{
  title: "GC-F-004 — Formato PowerPoint",
  desc: "Formato oficial GC-F-004 para plantilla de presentación PowerPoint institucional.",
  category: "Presentaciones",
  date: "2025",
  icon: Presentation,
  files: [{ label: "PPTX", href: "/docs/GC-F-004_Formato_Plantilla_PowerPoint.pptx" }]
},
// === Técnico ===
{
  title: "Informe Técnico M.A.N.G.O",
  desc: "Informe completo del sistema de monitoreo acuícola: fases de desarrollo, arquitectura, seguridad, dashboard y despliegue con Proxmox.",
  category: "Técnico",
  date: "2025",
  icon: Cpu,
  files: [{ label: "MD", href: "/docs/Informe_Tecnico_MANGO.md" }]
},
{
  title: "Esquema de Hardware",
  desc: "Lista de materiales faltantes, regulación de potencia, acondicionamiento de señal y componentes críticos del sistema.",
  category: "Electrónica",
  date: "2025",
  icon: Cpu,
  files: [{ label: "MD", href: "/docs/ESQUEMA_HARDWARE.md" }]
},
{
  title: "Códigos Legacy (OLD)",
  desc: "Códigos de firmware iniciales para sensores: turbidez, temperatura PT100, pH y comunicación serial.",
  category: "Técnico",
  date: "2025",
  icon: Cpu,
  files: [{ label: "MD", href: "/docs/CODIGOS_OLD.md" }]
},
{
  title: "Aspectos Críticos por Definir",
  desc: "Preguntas y aclaraciones sobre seguridad, batería, calibración de sensores, integración con plataformas externas y más.",
  category: "Técnico",
  date: "2025",
  icon: FileText,
  files: [{ label: "TXT", href: "/docs/Aspectos_Criticos.txt" }]
},
{
  title: "Problemas y Dudas LoRa",
  desc: "Preguntas clave sobre topología de red LoRa, arquitectura de procesamiento, comunicación de datos y frecuencias.",
  category: "Técnico",
  date: "2025",
  icon: FileText,
  files: [{ label: "TXT", href: "/docs/Problemas_dudas_LoRa.txt" }]
},
{
  title: "Análisis CAD/Software",
  desc: "Tabla comparativa de AutoCAD, Fusion 360, SolidWorks y CATIA para el diseño mecánico del proyecto.",
  category: "Técnico",
  date: "2025",
  icon: FileText,
  files: [{ label: "MD", href: "/docs/Analisis_CAD_Software.md" }]
},
{
  title: "README V1 — M.A.N.G.O",
  desc: "Primera versión del README del repositorio: descripción del sistema, stack tecnológico y arquitectura.",
  category: "Investigación",
  date: "2025",
  icon: FileText,
  files: [{ label: "MD", href: "/docs/V1_README.md" }],
  lang: "EN"
},
{
  title: "Early README — v1.1.0",
  desc: "Changelog de la versión 1.1.0: reestructuración del repositorio, ARCHITECTURE.md y badges profesionales.",
  category: "Investigación",
  date: "2025",
  icon: FileText,
  files: [{ label: "MD", href: "/docs/Earley_README.md" }],
  lang: "EN"
},
{
  title: "Contexto General #2",
  desc: "Documento de contexto general del proyecto M.A.N.G.O — segunda parte.",
  category: "Investigación",
  date: "2025",
  icon: FileText,
  files: [{ label: "DOCX", href: "/docs/CONTEXTO_GENERAL_2.docx" }]
},
{
  title: "Contexto General #3",
  desc: "Documento de contexto general del proyecto M.A.N.G.O — tercera parte.",
  category: "Investigación",
  date: "2025",
  icon: FileText,
  files: [{ label: "DOCX", href: "/docs/CONTEXTO_GENERAL_3.docx" }]
},
{
  title: "Contexto General #1",
  desc: "Documento de contexto general del proyecto M.A.N.G.O — primera parte.",
  category: "Investigación",
  date: "2025",
  icon: FileText,
  files: [{ label: "DOCX", href: "/docs/CONTEXTO_GENERAL_1.docx" }]
},
{
  title: "Repositorio V1.0 — Estructura Completa",
  desc: "Estructura de directorios y código fuente completo del repositorio M.A.N.G.O v1.0.",
  category: "Técnico",
  date: "2025",
  icon: Cpu,
  files: [{ label: "TXT", href: "/docs/V1.0_MANGO.txt" }]
},
{
  title: "Esquemático V1.0.0",
  desc: "Esquema electrónico general del sistema M.A.N.G.O — diseño de circuitos y conexiones.",
  category: "Electrónica",
  date: "2025",
  icon: Cpu,
  files: [{ label: "PDF", href: "/docs/V1.0.0_Esquematico.pdf" }]
},
{
  title: "Formato Proyecto de Grado",
  desc: "Formato oficial para proyecto de grado — Tnte. Hugo Ortiz.",
  category: "Investigación",
  date: "2025",
  icon: FileText,
  files: [{ label: "DOCX", href: "/docs/FORMATO_PROYECTO_DE_GRADO_TNTE_HUGO_ORTIZ.docx" }]
},
{
  title: "Foro M.A.N.G.O",
  desc: "Documento del foro de presentación del proyecto M.A.N.G.O.",
  category: "Pitch",
  date: "2025",
  icon: Mic,
  files: [{ label: "PDF", href: "/docs/FORO_MANGO.pdf" }]
},
{
  title: "SUMERGED — Documento Base",
  desc: "Documento base de la temporada Submerged con investigación y desarrollo del proyecto.",
  category: "Investigación",
  date: "2025",
  icon: FileText,
  files: [{ label: "DOCX", href: "/docs/SUMERGED.docx" }]
},
{
  title: "Guion de Presentación",
  desc: "Guion dinámico con citas para la presentación del proyecto M.A.N.G.O ante foros y jurados.",
  category: "Pitch",
  date: "2025",
  icon: Mic,
  files: [{ label: "MD", href: "/docs/Base_presentacion_mango.md" }]
},
{
  title: "Compilación de Respuestas",
  desc: "Recopilación de análisis y respuestas de IA (Gemini, ChatGPT) sobre estructura y presentación del proyecto.",
  category: "Investigación",
  date: "2025",
  icon: FileText,
  files: [{ label: "MD", href: "/docs/Copilacion_Respuestas.md" }]
},
{
  title: "Documentación Técnica V1.0 — IDEAS",
  desc: "Documentación técnica completa: arquitectura, base de datos, roles, endpoints API y diagramas del sistema.",
  category: "Técnico",
  date: "2025",
  icon: Cpu,
  files: [{ label: "MD", href: "/docs/MANGO_V1.0_IDEAS.md" }]
},
{
  title: "Notas de Desarrollo",
  desc: "Notas internas del proceso de desarrollo: correcciones, observaciones y decisiones sobre la documentación.",
  category: "Técnico",
  date: "2025",
  icon: FileText,
  files: [{ label: "MD", href: "/docs/NOTES.md" }]
},
{
  title: "Guía Proyecto de Grado 2017",
  desc: "Fuente guía oficial para la estructura y desarrollo de proyectos de grado.",
  category: "Investigación",
  date: "2017",
  icon: FileText,
  files: [{ label: "PDF", href: "/docs/Fuente_GUIA_Parte_Proyecto_de_Grado_2017.pdf" }]
},
{
  title: "Repositorio V1.2 — Estructura Completa",
  desc: "Estructura de directorios y código fuente del repositorio M.A.N.G.O v1.2 con firmware PlatformIO.",
  category: "Técnico",
  date: "2025",
  icon: Cpu,
  files: [{ label: "TXT", href: "/docs/V1.2_MANGO.txt" }]
},
{
  title: "Esquema de Conexiones",
  desc: "Diagrama textual de conexiones entre sensores (PT100, pH, turbidez), conversores de nivel y Jetson TK1.",
  category: "Electrónica",
  date: "2025",
  icon: Cpu,
  files: [{ label: "TXT", href: "/docs/ESQUEMA_CONEXIONES.txt" }]
},
{
  title: "Flujo de Datos M.A.N.G.O",
  desc: "Diagrama del flujo de datos: captura de sensores → empaquetado → envío → receptor.",
  category: "Técnico",
  date: "2025",
  icon: FileText,
  files: [{ label: "TXT", href: "/docs/Mango_flujo_datos.txt" }]
},
// === Fuentes Bibliográficas ===
{
  title: "Informe de Gestión 2024",
  desc: "Informe de gestión institucional relacionado con ecosistemas costeros y manglares.",
  category: "Fuentes",
  date: "2024",
  icon: FileText,
  files: [{ label: "PDF", href: "/docs/fuentes/1-Informe_Gestion_2024.pdf" }]
},
{
  title: "Informe Integral Anual PICIA 2023",
  desc: "Informe integral anual del Plan de Investigación Científica en áreas marinas y costeras.",
  category: "Fuentes",
  date: "2023",
  icon: FileText,
  files: [{ label: "PDF", href: "/docs/fuentes/2-Informe_integral_anual_PICIA_2023.pdf" }]
},
{
  title: "Manejo y Conservación de Manglares en Colombia",
  desc: "Documento sobre el manejo y conservación de los ecosistemas de manglar en Colombia.",
  category: "Fuentes",
  date: "2025",
  icon: FileText,
  files: [
  { label: "PDF", href: "/docs/fuentes/3-Manejo_Conservacion_manglares_Colombia.pdf" },
  { label: "ZIP", href: "/docs/fuentes/3-Manejo_Conservacion_manglares_Colombia.zip" }]

},
{
  title: "Actualización Programa Uso Sostenible de Manglares",
  desc: "Actualización del programa para el uso sostenible, manejo y conservación de los ecosistemas de manglar en Colombia.",
  category: "Fuentes",
  date: "2025",
  icon: FileText,
  files: [
  { label: "PDF", href: "/docs/fuentes/3-Actualizacion_programa_manglares.pdf" },
  { label: "DOCX", href: "/docs/fuentes/3-Actualizacion_programa_manglares.docx" }]

},
{
  title: "Manglares de Colombia — Recuperación de Áreas Degradadas",
  desc: "Estudio sobre los manglares de Colombia y la recuperación de sus áreas degradadas.",
  category: "Fuentes",
  date: "2025",
  icon: FileText,
  files: [{ label: "PDF", href: "/docs/fuentes/4-Manglares_Colombia_recuperacion_areas_degradadas.pdf" }]
},
{
  title: "Contaminación de Manglar — Estuario del Río Mira",
  desc: "Investigación sobre la contaminación del manglar del estuario del río Mira.",
  category: "Fuentes",
  date: "2025",
  icon: FileText,
  files: [{ label: "PDF", href: "/docs/fuentes/5-Contaminacion_manglar_estuario_rio_mira.pdf" }]
},
{
  title: "Lineamientos Nacionales — Monitoreo del Manglar",
  desc: "Lineamientos nacionales para el monitoreo del manglar en Colombia.",
  category: "Fuentes",
  date: "2025",
  icon: FileText,
  files: [{ label: "PDF", href: "/docs/fuentes/6-Lineamientos_monitoreo_manglar_Colombia.pdf" }]
},
{
  title: "Revisión sobre Manglares — Características",
  desc: "Revisión bibliográfica sobre manglares y sus características principales.",
  category: "Fuentes",
  date: "2025",
  icon: FileText,
  files: [{ label: "PDF", href: "/docs/fuentes/7-Revision_manglares_caracteristicas.pdf" }]
},
{
  title: "Frenemos la Deforestación de los Manglares",
  desc: "Artículo FAO/ONU sobre la pérdida global de manglares y los esfuerzos de conservación.",
  category: "Fuentes",
  date: "2023",
  icon: FileText,
  files: [{ label: "MD", href: "/docs/fuentes/8-Frenemos_deforestacion_manglares.md" }]
},
{
  title: "Mangroves Among the Most Carbon-Rich Forests",
  desc: "Estudio científico sobre los manglares como los bosques más ricos en carbono en los trópicos.",
  category: "Fuentes",
  date: "2025",
  icon: FileText,
  files: [{ label: "PDF", href: "/docs/fuentes/9-Mangroves_carbon_rich_forests_tropics.pdf" }],
  lang: "EN"
},
{
  title: "Manglares del Caribe Colombiano",
  desc: "Artículo: Un problema por abordar — degradación de 40.000 hectáreas de manglares en el litoral Caribe.",
  category: "Fuentes",
  date: "2002",
  icon: FileText,
  files: [{ label: "MD", href: "/docs/fuentes/10-Manglares_Caribe_colombiano.md" }]
},
{
  title: "Pacífico Pierde Hectáreas de Manglar",
  desc: "Investigación U. Nacional y U. del Valle: más de mil hectáreas anuales perdidas en el Pacífico colombiano.",
  category: "Fuentes",
  date: "2021",
  icon: FileText,
  files: [{ label: "MD", href: "/docs/fuentes/11-Pacifico_pierde_hectareas_manglar.md" }]
},
{
  title: "Belleza y Beneficios de los Manglares",
  desc: "PNUMA — 5 beneficios clave de los ecosistemas de manglar: clima, biodiversidad, protección costera y más.",
  category: "Fuentes",
  date: "2023",
  icon: FileText,
  files: [{ label: "MD", href: "/docs/fuentes/12-Belleza_beneficios_manglares.md" }]
},
{
  title: "Manglares, Fuente de Vida — Colombia",
  desc: "Minambiente: importancia de los manglares como carbono azul y su restauración en Colombia.",
  category: "Fuentes",
  date: "2021",
  icon: FileText,
  files: [{ label: "MD", href: "/docs/fuentes/13-Manglares_fuente_vida_Colombia.md" }]
},
{
  title: "Hacia una Cuenta de Bosque para Colombia",
  desc: "Estudio sobre la contabilidad ambiental de bosques en Colombia.",
  category: "Fuentes",
  date: "2025",
  icon: FileText,
  files: [{ label: "PDF", href: "/docs/fuentes/14-Cuenta_bosque_Colombia.pdf" }]
},
{
  title: "¿Por qué los Manglares son Cruciales?",
  desc: "Radio Nacional — Importancia de los manglares para la conservación de especies en Colombia.",
  category: "Fuentes",
  date: "2022",
  icon: FileText,
  files: [{ label: "MD", href: "/docs/fuentes/15-Manglares_cruciales_conservacion_especies.md" }]
},
{
  title: "10 Ecosistemas para Enamorarse de Colombia",
  desc: "Minambiente — Los 91 ecosistemas de Colombia, incluyendo manglares y su importancia.",
  category: "Fuentes",
  date: "2021",
  icon: FileText,
  files: [{ label: "MD", href: "/docs/fuentes/17-10_ecosistemas_enamorarse_Colombia.md" }]
},
{
  title: "Esfuerzos Mundiales por Proteger Manglares",
  desc: "FAO — Informe sobre avances globales en la protección de manglares (2000-2020).",
  category: "Fuentes",
  date: "2023",
  icon: FileText,
  files: [{ label: "MD", href: "/docs/fuentes/18-Esfuerzos_mundiales_proteger_manglares.md" }]
},
{
  title: "Desentrañar los Secretos de los Manglares",
  desc: "FAO — Cartografía y seguimiento de manglares: extensión mundial, causas de pérdida y expansión.",
  category: "Fuentes",
  date: "2023",
  icon: FileText,
  files: [{ label: "MD", href: "/docs/fuentes/19-Desentranar_secretos_manglares.md" }]
},
{
  title: "FAO 2017 — Ecosistemas de Manglares",
  desc: "FAO — Manglares en 123 países: destrucción, degradación, amenazas actuales y medidas de protección.",
  category: "Fuentes",
  date: "2017",
  icon: FileText,
  files: [{ label: "MD", href: "/docs/fuentes/20-FAO_2017_manglares.md" }]
},
{
  title: "Los Manglares Mexicanos",
  desc: "Gobierno de México — Restauración de 5,414 hectáreas de humedales, especies de mangle y servicios ambientales.",
  category: "Fuentes",
  date: "2017",
  icon: FileText,
  files: [{ label: "MD", href: "/docs/fuentes/21-Los_manglares_mexicanos.md" }]
},
{
  title: "Ecosistema de Manglar (2016)",
  desc: "Documento académico sobre el ecosistema de manglar — caracterización y dinámica ecológica.",
  category: "Fuentes",
  date: "2016",
  icon: FileText,
  files: [{ label: "PDF", href: "/docs/fuentes/22-Ecosistema_manglar_2016.pdf" }]
},
{
  title: "Manglares 2015 — Estudio Base",
  desc: "Publicación de referencia sobre el estado de los manglares (2015).",
  category: "Fuentes",
  date: "2015",
  icon: FileText,
  files: [{ label: "PDF", href: "/docs/fuentes/23-2015_baja.pdf" }]
},
{
  title: "Estuarios y Manglares",
  desc: "Capítulo sobre estuarios y ecosistemas de manglar — dinámica costera y biodiversidad.",
  category: "Fuentes",
  date: "2025",
  icon: FileText,
  files: [{ label: "PDF", href: "/docs/fuentes/24-Estuarios_manglares.pdf" }]
},
{
  title: "Mangles de Cartagena",
  desc: "Estudio sobre los manglares de Cartagena — estado, amenazas y conservación.",
  category: "Fuentes",
  date: "2025",
  icon: FileText,
  files: [{ label: "PDF", href: "/docs/fuentes/25-Mangles_Cartagena.pdf" }]
},
{
  title: "Ecosistemas de Manglar",
  desc: "Documento sobre ecosistemas de manglar — clasificación, distribución y funciones ecológicas.",
  category: "Fuentes",
  date: "2025",
  icon: FileText,
  files: [{ label: "PDF", href: "/docs/fuentes/26-Ecosistemas_manglar.pdf" }]
},
{
  title: "GA — Manglares Colombia y Recuperación",
  desc: "Guía ambiental sobre los manglares de Colombia y la recuperación de sus áreas degradadas.",
  category: "Fuentes",
  date: "2025",
  icon: FileText,
  files: [{ label: "PDF", href: "/docs/fuentes/27-GA_Manglares_Colombia_recuperacion.pdf" }]
},
{
  title: "GA — Vulnerabilidad y Riesgo Climático del Manglar",
  desc: "Análisis de vulnerabilidad y riesgo climático del socioecosistema de manglar en Colombia.",
  category: "Fuentes",
  date: "2025",
  icon: FileText,
  files: [{ label: "PDF", href: "/docs/fuentes/28-GA_Vulnerabilidad_riesgo_manglar.pdf" }]
},
{
  title: "GA — Programa Nacional de Manglares",
  desc: "Programa Nacional de uso sostenible, manejo y conservación de los ecosistemas de manglar.",
  category: "Fuentes",
  date: "2025",
  icon: FileText,
  files: [{ label: "PDF", href: "/docs/fuentes/29-GA_Programa_nacional_manglares.pdf" }]
},
{
  title: "Restauración de Manglares en Colombia",
  desc: "Técnicas, saberes y experiencias en la restauración de los manglares en Colombia.",
  category: "Fuentes",
  date: "2025",
  icon: FileText,
  files: [{ label: "PDF", href: "/docs/fuentes/30-Restauracion_manglares_Colombia.pdf" }]
},
{
  title: "Compilación de Fuentes Oficiales",
  desc: "Tabla de contenidos APA con 30 fuentes oficiales sobre degradación de manglares en Colombia.",
  category: "Fuentes",
  date: "2025",
  icon: FileText,
  files: [{ label: "MD", href: "/docs/fuentes/fuentes_manglares_proyecto.md" }]
},
// === Investigación - Drafts ===
{
  title: "Problemática — Borradores",
  desc: "Borradores de la descripción del problema, impacto y riesgos asociados a la falta de monitoreo de manglares.",
  category: "Investigación",
  date: "2025",
  icon: FileText,
  files: [{ label: "MD", href: "/docs/PROBLEMATICA_DRAFTS.md" }]
},
{
  title: "Justificación — Borradores",
  desc: "Borrador de la justificación del proyecto: importancia de los manglares y mejora de la reforestación.",
  category: "Investigación",
  date: "2025",
  icon: FileText,
  files: [{ label: "MD", href: "/docs/JUSTIFICACION_DRAFTS.md" }]
},
{
  title: "Objetivo General — Borradores",
  desc: "Borrador del objetivo general: desarrollo de prototipo electrónico con sensores para zonas oceánicas.",
  category: "Investigación",
  date: "2025",
  icon: FileText,
  files: [{ label: "MD", href: "/docs/OBJETIVO_GENERAL_DRAFTS.md" }]
},
{
  title: "Objetivos Específicos — Borradores",
  desc: "Borradores de los objetivos específicos: sensores, circuito, pruebas de campo y análisis de datos.",
  category: "Investigación",
  date: "2025",
  icon: FileText,
  files: [{ label: "MD", href: "/docs/OBJETIVOS_ESPECIFICOS_DRAFTS.md" }]
},
{
  title: "Marco Teórico — Borradores",
  desc: "Borrador del marco teórico: ODS, electrónica, sensores y recolección de datos.",
  category: "Investigación",
  date: "2025",
  icon: FileText,
  files: [{ label: "MD", href: "/docs/MARCO_TEORICO_DRAFTS.md" }]
},
{
  title: "Conclusión — Borradores",
  desc: "Borrador de conclusiones: monitoreo en tiempo real, factores críticos, participación comunitaria y mitigación climática.",
  category: "Investigación",
  date: "2025",
  icon: FileText,
  files: [{ label: "MD", href: "/docs/CONCLUSION_DRAFTS.md" }]
},
// === Presentaciones ===
{
  title: "Problemática — Plantilla SENA",
  desc: "Presentación de la problemática del proyecto en formato oficial de plantilla SENA.",
  category: "Presentaciones",
  date: "2025",
  icon: Presentation,
  files: [{ label: "PPTX", href: "/docs/PROBLEMATICA_PLANTILLA_SENA.pptx" }]
}];


/**
 * Vista pública: SOLO se exponen PDFs para descarga abierta.
 * El resto (docx/xlsx/pptx/md/txt/zip) es información editable y queda
 * disponible únicamente desde el panel autenticado (`/dashboard`).
 */
const PUBLIC_FORMAT = "PDF";
const RESTRICTED_FORMATS = new Set(["DOCX", "DOC", "XLSX", "XLS", "PPTX", "PPT", "MD", "TXT", "ZIP", "RAR", "7Z", "CSV"]);
const staticPublicDocs: Doc[] = docs
  .map((d) => ({ ...d, files: d.files.filter((f) => f.label === PUBLIC_FORMAT) }))
  .filter((d) => d.files.length > 0);

/**
 * Extiende la lista pública con los PDFs que el super-admin haya subido al
 * panel local (`panelEmmaContent`). Se filtra estrictamente por formato PDF
 * para preservar la regla "solo PDFs son públicos".
 */
function buildPublicDocs(): Doc[] {
  const local = listPanelItems("document")
    .filter((it) => {
      const fmt = (it.format ?? "").toUpperCase();
      // PDFs siempre son públicos; los formatos editables NUNCA salen
      // a la vista pública; los desconocidos van a público (decisión de
      // producto, alineada con autoRoute).
      if (fmt === PUBLIC_FORMAT) return true;
      if (RESTRICTED_FORMATS.has(fmt)) return false;
      return true;
    })
    .map<Doc>((it) => ({
      title: it.title,
      desc: it.description,
      category: it.category,
      date: it.addedAt ? new Date(it.addedAt).toLocaleDateString() : "2025",
      icon: FileText,
      files: [{ label: PUBLIC_FORMAT, href: it.src }], // se muestra como "Descargar" — la vista pública no expone tipos.
    }));
  // Locales primero (recientes arriba)
  const seen = new Set(staticPublicDocs.map((d) => d.title));
  const dedupedLocal = local.filter((d) => !seen.has(d.title));
  return [...dedupedLocal, ...staticPublicDocs];
}

/* ─── DocCard ───────────────────────────────────────────────────────────────── */

function DocCard({ doc, index }: { doc: Doc; index: number }) {
  const Icon = doc.icon;
  const fmt = doc.files[0]?.label ?? "PDF";
  const fmtStyle = formatIcons[fmt] ?? formatIcons.PDF;

  return (
    <SpotlightCard
      className="rounded-xl h-full"
      spotlightColor="rgba(56, 189, 248, 0.10)"
    >
      <a
        href={doc.files[0]?.href}
        download
        aria-label={`Descargar ${doc.title} en PDF`}
        className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(195,70%,48%)]/60 rounded-xl"
      >
        <GlareHover
          glareColor="#38bdf8"
          glareOpacity={0.08}
          glareSize={200}
          className="group h-full bg-white/[0.03] backdrop-blur-sm rounded-xl border border-white/[0.07] p-4 hover:bg-white/[0.06] hover:border-white/[0.14] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[hsl(195,70%,48%)]/5 transition-all duration-300 cursor-pointer flex flex-col gap-3"
        >
          {/* Top row: format badge + title + lang */}
          <div className="flex items-start gap-3">
            {/* Format block */}
            <div
              className={`shrink-0 w-10 h-10 rounded-lg ${fmtStyle.bg} border ${fmtStyle.border} flex flex-col items-center justify-center gap-0.5`}
            >
              <Icon className={`h-4 w-4 ${fmtStyle.color}`} />
              <span className={`text-[8px] font-black tracking-wider ${fmtStyle.color} leading-none`}>
                {fmt}
              </span>
            </div>

            {/* Title + lang */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-start gap-1.5 flex-wrap">
                <h3 className={`font-semibold text-sm leading-snug text-white/85 group-hover:text-white transition-colors line-clamp-2`}>
                  {doc.title}
                </h3>
                {doc.lang && (
                  <span className="shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded bg-[hsl(50,90%,58%)]/15 text-[hsl(50,90%,68%)] border border-[hsl(50,90%,58%)]/20 leading-none mt-0.5">
                    {doc.lang}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-[11px] text-white/35 leading-relaxed line-clamp-2 flex-1">
            {doc.desc}
          </p>

          {/* Footer: category + date + download CTA */}
          <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-white/35 bg-white/[0.05] px-2 py-0.5 rounded-full">
                {doc.category}
              </span>
              <span className="text-[10px] text-white/20">{doc.date}</span>
            </div>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold ${fmtStyle.color} opacity-60 group-hover:opacity-100 transition-opacity`}
            >
              <Download className="h-3 w-3" />
              PDF
            </span>
          </div>
        </GlareHover>
      </a>
    </SpotlightCard>
  );
}

/* ─── DocumentationSection ──────────────────────────────────────────────────── */

export function DocumentationSection() {
  const heading = useSiteValue("doc.heading", "Documentación");
  const subheading = useSiteValue("doc.subheading", "Recursos, informes y documentos del proyecto");
  const [active, setActive] = useState("Todos");
  const [search, setSearch] = useState("");

  const [catOpen, setCatOpen] = useState(false);
  const [publicDocs, setPublicDocs] = useState<Doc[]>(() => buildPublicDocs());

  // Persistimos la preferencia "ver todos / colapsado" en localStorage para
  // que el usuario no tenga que volver a desplegar la lista en cada visita.
  const SHOW_ALL_KEY = "mango.docs.showAll";
  const [showAll, setShowAll] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try { return window.localStorage.getItem(SHOW_ALL_KEY) === "1"; } catch { return false; }
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    try { window.localStorage.setItem(SHOW_ALL_KEY, showAll ? "1" : "0"); } catch { /* quota / private mode */ }
  }, [showAll]);

  // Re-sincroniza si el super-admin sube/edita documentos en otra pestaña
  // o en la misma sesión.
  useEffect(() => {
    const refresh = () => setPublicDocs(buildPublicDocs());
    window.addEventListener("storage", refresh);
    window.addEventListener("panel-emma::content-changed", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("panel-emma::content-changed", refresh);
    };
  }, []);

  const filtered = useMemo(() => {
    let result = active === "Todos" ? publicDocs : publicDocs.filter((d) => d.category === active);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
        d.title.toLowerCase().includes(q) ||
        d.desc.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [active, publicDocs, search]);

  // Compactamos por defecto: mostramos sólo las primeras tarjetas y el
  // usuario decide si quiere desplegar el resto. Cuando hay búsqueda activa
  // o se filtra por categoría distinta de "Todos", mostramos todo para no
  // ocultar coincidencias. Nota: `filtered` proviene de `publicDocs`, que
  // **sólo** contiene PDFs (los formatos editables se filtran en
  // `buildPublicDocs`), por lo que el contador "(N más)" jamás suma
  // archivos restringidos del dashboard.
  const INITIAL_COUNT = 6;
  const isFiltering = search.trim().length > 0 || active !== "Todos";
  const canCollapse = !isFiltering && filtered.length > INITIAL_COUNT;
  const visible = canCollapse && !showAll ? filtered.slice(0, INITIAL_COUNT) : filtered;
  const hiddenCount = filtered.length - INITIAL_COUNT;

  // Sólo mostramos categorías que tengan al menos 1 PDF público; así
  // evitamos chips "fantasma" con (0) que confunden al usuario.
  const counts = categoryFilters
    .map((f) => ({
      label: f,
      count: f === "Todos" ? publicDocs.length : publicDocs.filter((d) => d.category === f).length,
    }))
    .filter((c) => c.label === "Todos" || c.count > 0);

  const featuredDownloads = [
    { label: "Documento", desc: "Investigación completa", href: "/docs/MANGO.pdf" },
    { label: "English", desc: "International version", href: "/docs/MANGO_English.pdf" },
    { label: "Pitch", desc: "Para jurados y convocatorias", href: "/docs/PITCH.pdf" },
    { label: "Bitácora", desc: "Última bitácora SENA", href: "/docs/BITACORA_6_SEBASTIAN_SANCHEZ_CHACON.pdf" },
  ];

  return (
    <section id="documentacion" className="py-20 md:py-28 bg-[hsl(210,38%,6%)] relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-[15%] w-[500px] h-[400px] bg-[hsl(168,72%,42%)] opacity-[0.06] blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-[10%] w-[400px] h-[300px] bg-[hsl(195,70%,48%)] opacity-[0.06] blur-[100px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">

        {/* ── Header ── */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold">
            <DecryptedText
              text={heading}
              speed={40}
              maxIterations={8}
              animateOn="view"
              className="text-white"
              encryptedClassName="text-accent/40"
            />
          </h2>
          <div className="mt-3 flex items-center justify-center gap-3 flex-wrap">
            <p className="text-white/45 text-sm">{subheading}</p>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-xs text-white/40">
              <File className="h-3 w-3" />
              {publicDocs.length} PDFs públicos
            </span>
          </div>
        </div>

        {/* ── Featured downloads ── */}
        <div className="max-w-3xl mx-auto mb-10">
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.15em] text-center mb-4">
            Acceso directo
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {featuredDownloads.map(({ label, desc, href }) => (
              <a
                key={label}
                href={href}
                download
                className="group relative rounded-xl border border-red-500/20 bg-red-500/[0.05] hover:bg-red-500/[0.10] hover:border-red-500/35 transition-all duration-200 p-3 flex flex-col gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50"
              >
                <div className="flex items-center justify-between">
                  <div className="h-7 w-7 rounded-lg bg-red-500/15 border border-red-500/25 flex items-center justify-center">
                    <File className="h-3.5 w-3.5 text-red-400" />
                  </div>
                  <Download className="h-3.5 w-3.5 text-red-400/40 group-hover:text-red-400 group-hover:translate-y-0.5 transition-all duration-200" />
                </div>
                <div>
                  <p className="text-xs font-bold text-red-300 leading-none">{label}</p>
                  <p className="text-[10px] text-white/30 mt-0.5 leading-tight">{desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* ── Search + Category bar ── */}
        <div className="max-w-4xl mx-auto mb-8 space-y-4">
          {/* Search */}
          <div className="relative max-w-sm mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar en la biblioteca..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-full bg-white/[0.05] border border-white/[0.09] text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-[hsl(195,70%,48%)]/35 focus:border-[hsl(195,70%,48%)]/40 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Category pills — always visible */}
          <div className="flex flex-wrap gap-1.5 justify-center">
            {counts.map(({ label, count }) => (
              <button
                key={label}
                onClick={() => setActive(label)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-150 border ${
                  active === label
                    ? "bg-[hsl(195,70%,48%)]/15 text-[hsl(195,70%,68%)] border-[hsl(195,70%,48%)]/35"
                    : "bg-transparent text-white/35 border-white/[0.08] hover:border-white/20 hover:text-white/55"
                }`}
              >
                {label}
                <span className={`ml-1.5 text-[10px] ${active === label ? "text-[hsl(195,70%,50%)]" : "text-white/20"}`}>
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* Inline status line */}
          {(search.trim() || active !== "Todos") && (
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {search.trim() && (
                <span className="text-xs text-white/35">
                  {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} para &ldquo;{search}&rdquo;
                </span>
              )}
              {active !== "Todos" && (
                <span className="inline-flex items-center gap-1 text-xs text-[hsl(195,70%,60%)] bg-[hsl(195,70%,48%)]/10 border border-[hsl(195,70%,48%)]/20 px-2 py-0.5 rounded-full">
                  {active}
                  <button
                    onClick={() => setActive("Todos")}
                    className="hover:text-white ml-0.5"
                    aria-label="Quitar filtro de categoría"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              )}
              {(search.trim() || active !== "Todos") && (
                <button
                  onClick={() => { setActive("Todos"); setSearch(""); }}
                  className="text-[11px] text-white/25 hover:text-white/50 underline transition-colors"
                >
                  Limpiar
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Document grid ── */}
        {visible.length > 0 ? (
          <div
            id="docs-grid"
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
            aria-live="polite"
          >
            {visible.map((doc, i) => (
              <DocCard key={`${doc.title}-${i}`} doc={doc} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="h-12 w-12 rounded-xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
              <Search className="h-5 w-5 text-white/20" />
            </div>
            <p className="text-sm text-white/30">Sin resultados para ese criterio</p>
          </div>
        )}

        {/* ── Show all / collapse ── */}
        {canCollapse && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => {
                setShowAll((v) => {
                  const next = !v;
                  if (!next && typeof document !== "undefined") {
                    requestAnimationFrame(() => {
                      const grid = document.getElementById("docs-grid");
                      grid?.scrollIntoView({ behavior: "smooth", block: "start" });
                    });
                  }
                  return next;
                });
              }}
              aria-expanded={showAll}
              aria-controls="docs-grid"
              aria-label={
                showAll
                  ? "Colapsar la lista de documentos públicos"
                  : `Mostrar ${hiddenCount} documentos públicos adicionales`
              }
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold text-white/50 hover:text-white/80 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/15 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(195,70%,48%)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-mango-dark"
            >
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${showAll ? "rotate-180" : ""}`}
              />
              {showAll ? "Ver menos" : `Ver todos los documentos (${hiddenCount} más)`}
            </button>
          </div>
        )}

        {/* ── Subtle footer: restricted files notice ── */}
        <div className="mt-12 text-center">
          <p className="text-[11px] text-white/20">
            Archivos editables (DOCX, XLSX, PPTX) disponibles desde el panel autenticado{" "}
            <Link
              to="/login"
              className="text-white/35 hover:text-white/60 underline underline-offset-2 transition-colors"
            >
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
