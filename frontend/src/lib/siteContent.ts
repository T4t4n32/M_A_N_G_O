/**
 * Site content registry — Panel Emma "Textos" editor.
 *
 * Allows the super-admin to override the visible texts and selected images
 * of the home sections without redeploying. Persistence is local-only
 * (localStorage) until the backend exposes /api/v1/admin/site-content.
 *
 * Public API:
 *  - SECTIONS: schema describing every editable field grouped by section
 *  - useSiteValue(key, defaultValue): reactive read used by section components
 *  - getValue / setValue / clearSection / clearAll: imperative helpers for the editor
 */

import { useEffect, useState, useCallback } from "react";

export type FieldType = "text" | "textarea" | "image" | "media";

export type MediaAccept = "image" | "video" | "model" | "any";

export interface SiteField {
  key: string;
  label: string;
  type: FieldType;
  /** Default value used when no override is stored. */
  default: string;
  /** Helper hint shown under the field in the editor. */
  hint?: string;
  /** For type="media": which file kinds are accepted. */
  accept?: MediaAccept;
  /** For type="media": allow multiple files (gallery). */
  multiple?: boolean;
  /** For type="image"/"media": preferred crop aspect ratio (width/height). */
  aspect?: number;
}

export interface SiteSection {
  id: string;
  label: string;
  description: string;
  fields: SiteField[];
}

export const SECTIONS: SiteSection[] = [
  {
    id: "hero",
    label: "Inicio (Hero)",
    description: "Encabezado principal de la página de inicio.",
    fields: [
      { key: "hero.eyebrow", label: "Etiqueta superior", type: "text",
        default: "Conservación de Manglares · Tecnología Autónoma" },
      { key: "hero.titleLine", label: "Título — primera línea", type: "text",
        default: "Monitoreo Autónomo de" },
      { key: "hero.description", label: "Descripción", type: "textarea",
        default: "Sistema institucional de monitoreo ambiental en tiempo real para la protección de manglares y ecosistemas marítimos. Tecnología al servicio de la conservación." },
      { key: "hero.cta1", label: "Botón principal", type: "text", default: "Conoce el Proyecto" },
      { key: "hero.cta2", label: "Botón secundario", type: "text", default: "Contacto Institucional" },
    ],
  },
  {
    id: "project",
    label: "Proyecto",
    description: "Sección 'El Proyecto' con sus 6 pestañas.",
    fields: [
      { key: "project.heading", label: "Título de sección", type: "text", default: "El Proyecto" },
      { key: "project.subheading", label: "Subtítulo", type: "text",
        default: "Conoce en detalle el sistema de monitoreo ambiental M.A.N.G.O" },
      { key: "project.queEs.label", label: "Pestaña 1 · etiqueta", type: "text", default: "¿Qué es?" },
      { key: "project.queEs.title", label: "Pestaña 1 · título", type: "text", default: "¿Qué es M.A.N.G.O?" },
      { key: "project.queEs.text", label: "Pestaña 1 · descripción", type: "textarea",
        default: "M.A.N.G.O es un sistema de monitoreo ambiental autónomo diseñado para medir y registrar en tiempo real las condiciones de los ecosistemas de manglar. Combina sensores avanzados, conectividad IoT y análisis de datos para ofrecer información precisa a instituciones de investigación y conservación." },
      { key: "project.queEs.image", label: "Pestaña 1 · imagen (reemplaza el visual 3D)", type: "image",
        default: "", hint: "Si subes una imagen, reemplazará el modelo 3D de esta pestaña." },
      { key: "project.queEs.media", label: "Pestaña 1 · medios (imagen / video / modelo 3D / galería)", type: "media",
        accept: "any", multiple: true, default: "",
        hint: "Acepta imágenes, video (mp4/webm) y modelos 3D (.glb/.gltf/.stl/.step). Si subes una imagen única se puede recortar." },
      { key: "project.componentes.label", label: "Pestaña 2 · etiqueta", type: "text", default: "Componentes" },
      { key: "project.componentes.title", label: "Pestaña 2 · título", type: "text", default: "Componentes del Sistema" },
      { key: "project.componentes.text", label: "Pestaña 2 · descripción", type: "textarea",
        default: "El sistema integra sensores de temperatura, pH, salinidad, turbidez y nivel de agua. Cuenta con una unidad de procesamiento central basada en microcontroladores, módulos de comunicación inalámbrica y una plataforma web para visualización de datos." },
      { key: "project.componentes.media", label: "Pestaña 2 · medios", type: "media",
        accept: "any", multiple: true, default: "",
        hint: "Imágenes, video o modelo 3D para ilustrar los componentes." },
      { key: "project.metodologia.label", label: "Pestaña 3 · etiqueta", type: "text", default: "Metodología" },
      { key: "project.metodologia.title", label: "Pestaña 3 · título", type: "text", default: "Metodología de Desarrollo" },
      { key: "project.metodologia.text", label: "Pestaña 3 · descripción", type: "textarea",
        default: "Se emplea una metodología de prototipado iterativo, comenzando con investigación de campo en ecosistemas de manglar, seguida de diseño electrónico, programación de firmware, pruebas de laboratorio y validación en campo." },
      { key: "project.metodologia.media", label: "Pestaña 3 · medios", type: "media",
        accept: "any", multiple: true, default: "" },
      { key: "project.funciones.label", label: "Pestaña 4 · etiqueta", type: "text", default: "Funciones" },
      { key: "project.funciones.title", label: "Pestaña 4 · título", type: "text", default: "Funciones Principales" },
      { key: "project.funciones.text", label: "Pestaña 4 · descripción", type: "textarea",
        default: "Mapeo y registro periódico de las condiciones ambientales del manglar, alertas automáticas ante parámetros fuera de rango, generación de reportes con datos históricos y exportación de información para análisis científico avanzado." },
      { key: "project.funciones.media", label: "Pestaña 4 · medios", type: "media",
        accept: "any", multiple: true, default: "" },
      { key: "project.impacto.label", label: "Pestaña 5 · etiqueta", type: "text", default: "Impacto" },
      { key: "project.impacto.title", label: "Pestaña 5 · título", type: "text", default: "Impacto Ambiental" },
      { key: "project.impacto.text", label: "Pestaña 5 · descripción", type: "textarea",
        default: "M.A.N.G.O permite la detección temprana de degradación ambiental, apoya la toma de decisiones para políticas de conservación, y genera datos confiables para investigaciones sobre cambio climático y salud de ecosistemas costeros." },
      { key: "project.impacto.media", label: "Pestaña 5 · medios", type: "media",
        accept: "any", multiple: true, default: "" },
      { key: "project.acceso.label", label: "Pestaña 6 · etiqueta", type: "text", default: "Acceso" },
      { key: "project.acceso.title", label: "Pestaña 6 · título", type: "text", default: "Acceso al Sistema" },
      { key: "project.acceso.text", label: "Pestaña 6 · descripción", type: "textarea",
        default: "El acceso a la plataforma de datos está restringido a instituciones autorizadas vinculadas a proyectos de investigación ambiental. Se requieren credenciales institucionales para consultar información en tiempo real y datos históricos." },
      { key: "project.acceso.media", label: "Pestaña 6 · medios", type: "media",
        accept: "any", multiple: true, default: "" },
    ],
  },
  {
    id: "about",
    label: "Sobre el proyecto",
    description: "Sección 'Sobre' — encabezados y bloque CALIBOTS.",
    fields: [
      { key: "about.heading", label: "Título de sección", type: "text", default: "Sobre el Proyecto" },
      { key: "about.subheading", label: "Subtítulo", type: "text", default: "Las personas e historia detrás de M.A.N.G.O" },
      { key: "about.calibots.eyebrow", label: "Bloque CALIBOTS · etiqueta", type: "text", default: "Lo más reciente de CALIBOTS" },
      { key: "about.calibots.title", label: "Bloque CALIBOTS · título", type: "text", default: "UNEARTHED" },
      { key: "about.calibots.subtitle", label: "Bloque CALIBOTS · temporada", type: "text", default: "FIRST LEGO League — Temporada 2024-2025" },
      { key: "about.calibots.text", label: "Bloque CALIBOTS · descripción", type: "textarea",
        default: "Con nuevas propuestas y la misma pasión, el equipo trae una visión renovada que desafía los límites de lo que se ha hecho hasta ahora." },
      { key: "about.contributors.title", label: "Contribuyentes · título", type: "text", default: "Contribuyentes Clave" },
      { key: "about.leader.photo", label: "Foto del Desarrollador Principal", type: "media",
        accept: "image", multiple: false, aspect: 3 / 4, default: "",
        hint: "Si subes una imagen reemplazará la foto de Sebastián. Puedes recortarla con el botón de tijeras (relación 3:4)." },
      { key: "about.calibots.media", label: "Bloque CALIBOTS · media (imagen / video / 3D)", type: "media",
        accept: "any", multiple: false, default: "",
        hint: "Si subes algo se mostrará bajo el bloque de CALIBOTS." },
      { key: "about.contributors.media", label: "Contribuyentes · galería opcional", type: "media",
        accept: "any", multiple: true, default: "",
        hint: "Imágenes, videos o modelos 3D que aparecerán como carrusel debajo de los contribuyentes." },
      // Subsecciones del bloque "Líder" (VisionHero / Temporadas / Hitos / Pilares)
      { key: "about.vision.description", label: "Visión y Liderazgo · descripción adicional", type: "textarea",
        default: "",
        hint: "Texto opcional que se mostrará bajo la foto del Desarrollador Principal." },
      { key: "about.vision.media", label: "Visión y Liderazgo · galería de medios", type: "media",
        accept: "any", multiple: true, default: "",
        hint: "Imágenes, videos o 3D para acompañar a Sebastián. Editor con recorte, rotar, voltear y ajuste fino." },
      { key: "about.seasons.description", label: "Temporadas · descripción adicional", type: "textarea", default: "" },
      { key: "about.seasons.media", label: "Temporadas · galería de medios", type: "media",
        accept: "any", multiple: true, default: "" },
      { key: "about.milestones.description", label: "Hitos · descripción adicional", type: "textarea", default: "" },
      { key: "about.milestones.media", label: "Hitos · galería de medios", type: "media",
        accept: "any", multiple: true, default: "" },
      { key: "about.pillars.description", label: "Pilares Fundamentales · descripción adicional", type: "textarea", default: "",
        hint: "Texto opcional que aparecerá bajo las tarjetas de Yamileth y Héctor Ignacio." },
      { key: "about.pillars.media", label: "Pilares Fundamentales · galería de medios", type: "media",
        accept: "any", multiple: true, default: "" },
    ],
  },
  {
    id: "documentation",
    label: "Documentación",
    description: "Encabezado de la sección de documentos.",
    fields: [
      { key: "doc.heading", label: "Título de sección", type: "text", default: "Documentación" },
      { key: "doc.subheading", label: "Subtítulo (puedes incluir libremente el conteo de archivos)", type: "text",
        default: "Recursos, informes y documentos del proyecto" },
    ],
  },
  {
    id: "contact",
    label: "Contacto",
    description: "Encabezado de la sección de contacto.",
    fields: [
      { key: "contact.heading", label: "Título de sección", type: "text", default: "Contacto" },
      { key: "contact.subheading", label: "Subtítulo", type: "text", default: "¿Estás interesado en aprender más? Escríbenos" },
      { key: "contact.info.title", label: "Bloque info · título", type: "text", default: "Información de Contacto" },
      { key: "contact.social.title", label: "Bloque redes · título", type: "text", default: "Síguenos" },
      { key: "contact.illustration", label: "Ilustración / video / 3D del bloque de info", type: "media",
        accept: "any", multiple: false, default: "",
        hint: "Se muestra encima de los datos de contacto si está presente." },
    ],
  },
  {
    id: "footer",
    label: "Pie de página",
    description: "Textos del footer.",
    fields: [
      { key: "footer.tagline", label: "Descripción del proyecto", type: "textarea",
        default: "Sistema de Monitoreo Autónomo de Niveles y Gestión Oceánica para la protección de ecosistemas de manglar." },
      { key: "footer.institutions.text", label: "Bloque instituciones · texto", type: "textarea",
        default: "Acceso autorizado exclusivo para instituciones vinculadas a proyectos de investigación ambiental." },
      { key: "footer.copyright", label: "Línea de copyright (sin año)", type: "text", default: "M.A.N.G.O — Todos los derechos reservados" },
      { key: "footer.legal", label: "Línea legal", type: "text", default: "Proyecto de investigación con fines académicos y de conservación" },
    ],
  },
  {
    id: "seo",
    label: "SEO y metadatos",
    description: "Title, description, OpenGraph, Twitter Card, canonical y robots.",
    fields: [
      { key: "seo.title", label: "Title (≤60 caracteres)", type: "text",
        default: "M.A.N.G.O — Monitoreo Ambiental de Manglares" },
      { key: "seo.description", label: "Meta description (≤160 caracteres)", type: "textarea",
        default: "Sistema autónomo de monitoreo ambiental en tiempo real para la protección de ecosistemas de manglar. Sensores de pH, temperatura y turbidez." },
      { key: "seo.canonical", label: "URL canónica", type: "text", default: "https://mango-project.org" },
      { key: "seo.robots", label: "Robots", type: "text", default: "index, follow",
        hint: "Ej.: 'index, follow' o 'noindex, nofollow' para entornos privados." },
      { key: "seo.og.title", label: "OpenGraph · título", type: "text",
        default: "M.A.N.G.O — Monitoreo Ambiental de Manglares" },
      { key: "seo.og.description", label: "OpenGraph · descripción", type: "textarea",
        default: "Sistema institucional de monitoreo ambiental en tiempo real para la protección de manglares y ecosistemas marítimos." },
      { key: "seo.og.image", label: "OpenGraph · imagen (1200×630)", type: "media",
        accept: "image", aspect: 1200 / 630, default: "",
        hint: "Imagen mostrada al compartir en redes." },
      { key: "seo.twitter.card", label: "Twitter card", type: "text", default: "summary_large_image",
        hint: "summary o summary_large_image" },
      { key: "seo.twitter.image", label: "Twitter · imagen", type: "media",
        accept: "image", aspect: 1200 / 630, default: "" },
    ],
  },
];

const STORAGE_KEY = "panel-emma::site-content";
const PUBLISH_META_KEY = "panel-emma::site-content-meta";
const EVENT_NAME = "panel-emma::site-content-changed";

type Store = Record<string, string>;

function load(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch { return {}; }
}

function save(store: Store) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function getValue(key: string, fallback = ""): string {
  const v = load()[key];
  return typeof v === "string" && v.length > 0 ? v : fallback;
}

export function setValue(key: string, value: string) {
  const store = load();
  if (!value) delete store[key];
  else store[key] = value;
  save(store);
}

export function clearSection(sectionId: string) {
  const store = load();
  const section = SECTIONS.find((s) => s.id === sectionId);
  if (!section) return;
  for (const f of section.fields) delete store[f.key];
  save(store);
}

export function clearAll() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

/* ───────────────── Publish meta + remote sync ───────────────── */

export interface PublishMeta {
  lastPublishedAt: number | null;
  lastError: string | null;
}

function loadMeta(): PublishMeta {
  if (typeof window === "undefined") return { lastPublishedAt: null, lastError: null };
  try {
    const raw = localStorage.getItem(PUBLISH_META_KEY);
    if (!raw) return { lastPublishedAt: null, lastError: null };
    return JSON.parse(raw) as PublishMeta;
  } catch { return { lastPublishedAt: null, lastError: null }; }
}

function saveMeta(m: PublishMeta) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PUBLISH_META_KEY, JSON.stringify(m));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function getPublishMeta(): PublishMeta { return loadMeta(); }

/**
 * Publish content to the FastAPI backend.
 * Endpoint contract (to implement server-side):
 *   PUT /api/v1/admin/site-content   body: { content: Record<string,string>, updatedAt: number }
 *   GET /api/v1/admin/site-content
 *   GET /api/v1/site-content                       (public hydrate)
 * Returns { ok, status, message }. When the endpoint is missing (404 / network error)
 * the local copy stays intact and `ok=false` with a descriptive message is returned.
 */
export async function publishSiteContent(): Promise<{ ok: boolean; status: number; message: string }> {
  const content = load();
  const body = JSON.stringify({ content, updatedAt: Date.now() });
  try {
    const res = await fetch("/api/v1/admin/site-content", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body,
    });
    if (res.ok) {
      saveMeta({ lastPublishedAt: Date.now(), lastError: null });
      return { ok: true, status: res.status, message: "Publicado correctamente." };
    }
    let serverMsg = "";
    try {
      const ct = res.headers.get("content-type") ?? "";
      if (ct.includes("application/json")) {
        const j = await res.json();
        serverMsg = j?.message || j?.error || "";
      }
    } catch { /* ignore */ }
    const message =
      res.status === 404
        ? "Ruta no encontrada en el backend (404). Los cambios siguen guardados localmente."
        : res.status === 401 || res.status === 403
        ? "No autorizado para publicar."
        : (serverMsg || `Error HTTP ${res.status} al publicar.`);
    saveMeta({ lastPublishedAt: loadMeta().lastPublishedAt, lastError: message });
    return { ok: false, status: res.status, message };
  } catch (err) {
    const message =
      err instanceof Error
        ? `No se pudo conectar al backend: ${err.message}. Los cambios siguen guardados localmente.`
        : "Error de red al publicar.";
    saveMeta({ lastPublishedAt: loadMeta().lastPublishedAt, lastError: message });
    return { ok: false, status: 0, message };
  }
}

/** Hydrate from the public endpoint. Silent failure → keeps local data. */
export async function hydrateFromBackend(): Promise<boolean> {
  try {
    const res = await fetch("/api/v1/site-content", { credentials: "include" });
    if (!res.ok) return false;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("application/json")) return false;
    const data = await res.json();
    const remote = data?.content;
    if (remote && typeof remote === "object") {
      // Merge remote on top of local for any keys not yet edited locally
      const local = load();
      const merged: Store = { ...remote, ...local };
      save(merged);
      return true;
    }
    return false;
  } catch { return false; }
}

export function hasSectionOverrides(sectionId: string): boolean {
  const store = load();
  const section = SECTIONS.find((s) => s.id === sectionId);
  if (!section) return false;
  return section.fields.some((f) => typeof store[f.key] === "string" && store[f.key].length > 0);
}

/** React hook: subscribes to changes and returns the live value. */
export function useSiteValue(key: string, fallback = ""): string {
  const read = useCallback(() => getValue(key, fallback), [key, fallback]);
  const [value, setLocal] = useState<string>(read);
  useEffect(() => {
    const update = () => setLocal(read());
    update();
    window.addEventListener(EVENT_NAME, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(EVENT_NAME, update);
      window.removeEventListener("storage", update);
    };
  }, [read]);
  return value;
}
