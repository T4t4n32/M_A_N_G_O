// Catálogo de documentos del proyecto M.A.N.G.O.
//
// Protocolo Legal: la vista pública de documentación (ruta /documentacion, el
// teaser del landing y las descargas directas en /docs/*) fue retirada como
// medida de contención. Este listado ahora solo alimenta el panel autenticado
// (Dashboard, Archivos, RestrictedDocsPanel); no se renderiza en el sitio
// público.
import { FileText, Presentation, ClipboardList, Cpu, Lightbulb, Mic } from "lucide-react";

export interface Doc {
  title: string;
  desc: string;
  category: string;
  date: string;
  icon: typeof FileText;
  files: { label: string; href: string }[];
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
