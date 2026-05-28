/**
 * Content registry for the Super-Admin Panel (Panel Emma).
 *
 * Provides:
 *  - A curated sample of items currently published on the public site
 *    (enough to show the operator what the gallery already contains
 *     without bundling thousands of records).
 *  - localStorage-backed CRUD for items uploaded from the panel,
 *    until the backend exposes /api/v1/admin/* endpoints.
 *
 * NOTE: This is a local-only persistence layer. Items added here live
 * in the browser of whoever opens the panel and never reach the public
 * site. When the backend is ready, swap `loadLocal` / `saveLocal` for
 * real API calls.
 */

export type PanelKind = "image" | "video" | "document";

export interface PanelItem {
  id: string;
  kind: PanelKind;
  title: string;
  description: string;
  category: string;
  /** Public URL on the site OR data URL for locally added files. */
  src: string;
  /** True for items already deployed; false for locally added drafts. */
  existing: boolean;
  /** Optional file format label (PDF, MD, MP4, JPG…) */
  format?: string;
  /** Bytes — only set for locally added files. */
  size?: number;
  /** ISO timestamp of when it was added in the panel. */
  addedAt?: string;
}

export const IMAGE_CATEGORIES = [
  "Hardware",
  "Software",
  "Campo",
  "Progreso",
  "Competencias",
  "Líder",
] as const;

export const VIDEO_CATEGORIES = [
  "Competencias",
  "Líder",
  "Demostración",
] as const;

export const DOC_CATEGORIES = [
  "Investigación",
  "Técnico",
  "Bitácoras",
  "Presentaciones",
  "Electrónica",
  "Pitch",
  "Fuentes",
] as const;

/** Curated subset of currently-published images (one per category sample). */
const EXISTING_IMAGES: PanelItem[] = [
  { id: "img-hw-1", kind: "image", title: "Cerebro del Sistema: ESP32", description: "Microcontrolador principal del sistema M.A.N.G.O.", category: "Hardware", src: "/images/gallery/hardware/hardware_1_1_ESP32.jpg", existing: true, format: "JPG" },
  { id: "img-hw-2", kind: "image", title: "Heltec LoRa en Case", description: "Módulo Heltec WiFi LoRa 32 en caja protectora.", category: "Hardware", src: "/images/gallery/hardware/hardware_60_HELTEC.jpg", existing: true, format: "JPG" },
  { id: "img-hw-3", kind: "image", title: "Thruster Brushless Submarino", description: "Thruster brushless con hélice para operación subacuática.", category: "Hardware", src: "/images/gallery/hardware/hardware_21_APISQUEEN_PAQUETE_19.jpg", existing: true, format: "JPG" },
  { id: "img-sw-1", kind: "image", title: "Código LoRa en Arduino IDE", description: "Código de comunicación LoRa en Arduino IDE.", category: "Software", src: "/images/gallery/hardware/hardware_53_COMUNICACION.jpg", existing: true, format: "JPG" },
  { id: "img-pg-1", kind: "image", title: "Estación de Soldadura", description: "Estación de soldadura y ensamblaje del proyecto.", category: "Progreso", src: "/images/gallery/hardware/hardware_57_Estacion_Soldadura.jpg", existing: true, format: "JPG" },
  { id: "img-pg-2", kind: "image", title: "Prueba de Comunicación LoRa", description: "Pruebas de comunicación LoRa con Arduino IDE en PC.", category: "Progreso", src: "/images/gallery/hardware/hardware_93_MONTAJE_LORA_2.jpg", existing: true, format: "JPG" },
  { id: "img-pg-3", kind: "image", title: "Calibración de pH con Multímetro", description: "Calibración del sensor pH con multímetro en mesa de trabajo.", category: "Progreso", src: "/images/gallery/hardware/hardware_102_MONTAJE_PH_1.jpg", existing: true, format: "JPG" },
];

const EXISTING_VIDEOS: PanelItem[] = [];

/** Curated subset of currently-published documents (representative per category). */
const EXISTING_DOCS: PanelItem[] = [
  { id: "doc-1", kind: "document", title: "M.A.N.G.O — Documento Principal", description: "Documento técnico completo del proyecto con investigación, diseño y especificaciones.", category: "Investigación", src: "/docs/M_A_N_G_O.docx", existing: true, format: "DOCX" },
  { id: "doc-2", kind: "document", title: "M.A.N.G.O — Versión Español (PDF)", description: "Documento completo del proyecto en español.", category: "Investigación", src: "/docs/MANGO.pdf", existing: true, format: "PDF" },
  { id: "doc-3", kind: "document", title: "M.A.N.G.O — English Version", description: "Full project document translated to English.", category: "Investigación", src: "/docs/MANGO_English.pdf", existing: true, format: "PDF" },
  { id: "doc-4", kind: "document", title: "Informe Técnico M.A.N.G.O", description: "Fases de desarrollo, arquitectura, seguridad, dashboard y despliegue con Proxmox.", category: "Técnico", src: "/docs/Informe_Tecnico_MANGO.md", existing: true, format: "MD" },
  { id: "doc-5", kind: "document", title: "Bitácora #1", description: "GFPI-F-147 — Etapa productiva SENA (Oct 1–15, 2025).", category: "Bitácoras", src: "/docs/BITACORA_1_SEBASTIAN_SANCHEZ_CHACON.pdf", existing: true, format: "PDF" },
  { id: "doc-6", kind: "document", title: "Board M.A.N.G.O", description: "Presentación general del proyecto.", category: "Presentaciones", src: "/docs/Board_MANGO.pptx", existing: true, format: "PPTX" },
  { id: "doc-7", kind: "document", title: "Esquema de Hardware", description: "Lista de materiales, regulación de potencia y componentes críticos.", category: "Electrónica", src: "/docs/ESQUEMA_HARDWARE.md", existing: true, format: "MD" },
  { id: "doc-8", kind: "document", title: "Pitch M.A.N.G.O", description: "Documento de pitch para presentar el proyecto ante jurados.", category: "Pitch", src: "/docs/PITCH.pdf", existing: true, format: "PDF" },
];

const STORAGE_KEYS: Record<PanelKind, string> = {
  image: "panel-emma::images",
  video: "panel-emma::videos",
  document: "panel-emma::docs",
};

const HIDDEN_KEYS: Record<PanelKind, string> = {
  image: "panel-emma::hidden-images",
  video: "panel-emma::hidden-videos",
  document: "panel-emma::hidden-docs",
};

const EXISTING_OVERRIDES_KEYS: Record<PanelKind, string> = {
  image: "panel-emma::overrides-images",
  video: "panel-emma::overrides-videos",
  document: "panel-emma::overrides-docs",
};

function loadLocal(kind: PanelKind): PanelItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[kind]);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PanelItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocal(kind: PanelKind, items: PanelItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS[kind], JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("panel-emma::content-changed", { detail: { kind } }));
}

function loadHidden(kind: PanelKind): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HIDDEN_KEYS[kind]);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch { return []; }
}

function saveHidden(kind: PanelKind, ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(HIDDEN_KEYS[kind], JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent("panel-emma::content-changed", { detail: { kind } }));
}

type Override = Partial<Pick<PanelItem, "title" | "description" | "category">>;

function loadOverrides(kind: PanelKind): Record<string, Override> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(EXISTING_OVERRIDES_KEYS[kind]);
    return raw ? (JSON.parse(raw) as Record<string, Override>) : {};
  } catch { return {}; }
}

function saveOverrides(kind: PanelKind, map: Record<string, Override>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(EXISTING_OVERRIDES_KEYS[kind], JSON.stringify(map));
  window.dispatchEvent(new CustomEvent("panel-emma::content-changed", { detail: { kind } }));
}

export function listItems(kind: PanelKind): PanelItem[] {
  const baseline =
    kind === "image" ? EXISTING_IMAGES :
    kind === "video" ? EXISTING_VIDEOS :
    EXISTING_DOCS;
  const hidden = new Set(loadHidden(kind));
  const overrides = loadOverrides(kind);
  const merged = [...loadLocal(kind), ...baseline]
    .filter((it) => !hidden.has(it.id))
    .map((it) => (overrides[it.id] ? { ...it, ...overrides[it.id] } : it));
  return merged;
}

export function addItem(item: Omit<PanelItem, "id" | "existing" | "addedAt">): PanelItem {
  const newItem: PanelItem = {
    ...item,
    id: `${item.kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    existing: false,
    addedAt: new Date().toISOString(),
  };
  const all = loadLocal(item.kind);
  saveLocal(item.kind, [newItem, ...all]);
  return newItem;
}

export function removeLocalItem(kind: PanelKind, id: string) {
  const all = loadLocal(kind);
  if (all.some((i) => i.id === id)) {
    saveLocal(kind, all.filter((i) => i.id !== id));
    return;
  }
  // Existing item: hide it (soft-delete locally).
  const hidden = loadHidden(kind);
  if (!hidden.includes(id)) saveHidden(kind, [...hidden, id]);
}

export function updateItem(
  kind: PanelKind,
  id: string,
  patch: { title?: string; description?: string; category?: string },
) {
  const all = loadLocal(kind);
  const idx = all.findIndex((i) => i.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...patch };
    saveLocal(kind, all);
    return;
  }
  // Existing item: store an override so the UI reflects the edit.
  const overrides = loadOverrides(kind);
  overrides[id] = { ...(overrides[id] ?? {}), ...patch };
  saveOverrides(kind, overrides);
}

export function hasOverrides(kind: PanelKind): boolean {
  return loadHidden(kind).length > 0 || Object.keys(loadOverrides(kind)).length > 0;
}

export function clearOverrides(kind: PanelKind) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(HIDDEN_KEYS[kind]);
  localStorage.removeItem(EXISTING_OVERRIDES_KEYS[kind]);
}

export function categoriesFor(kind: PanelKind): readonly string[] {
  if (kind === "image") return IMAGE_CATEGORIES;
  if (kind === "video") return VIDEO_CATEGORIES;
  return DOC_CATEGORIES;
}

/** Read a File as a data URL with a max size guard. */
export function readFileAsDataURL(file: File, maxBytes = 2 * 1024 * 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > maxBytes) {
      reject(new Error(`El archivo supera el límite local de ${(maxBytes / 1024 / 1024).toFixed(1)} MB.`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
}

export interface UploadResult {
  id: number;
  url: string;
  filename: string;
}

/**
 * Upload a file to the backend and return the server URL.
 * Uses XMLHttpRequest so upload progress can be tracked.
 */
export function uploadFileToBackend(
  file: File,
  kind: PanelKind,
  onProgress?: (pct: number) => void,
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);

    let endpoint: string;
    if (kind === "image") {
      form.append("type", "image");
      endpoint = "/api/v1/admin/media";
    } else if (kind === "video") {
      form.append("type", "video");
      endpoint = "/api/v1/admin/media";
    } else {
      endpoint = "/api/v1/admin/docs";
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);
    xhr.withCredentials = true;

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 90));
      };
    }

    xhr.onload = () => {
      if (xhr.status === 201) {
        onProgress?.(100);
        try {
          resolve(JSON.parse(xhr.responseText) as UploadResult);
        } catch {
          reject(new Error("Respuesta inválida del servidor."));
        }
      } else {
        let msg = `Error del servidor (${xhr.status})`;
        try {
          const body = JSON.parse(xhr.responseText);
          if (body?.error) msg = body.error;
        } catch { /* ignore */ }
        reject(new Error(msg));
      }
    };

    xhr.onerror = () => reject(new Error("Error de red al subir el archivo."));
    xhr.send(form);
  });
}

export function inferFormat(file: File): string {
  const ext = file.name.split(".").pop()?.toUpperCase();
  return ext || file.type.split("/")[1]?.toUpperCase() || "FILE";
}

/* ─────────────── Smart auto-routing (super-admin) ─────────────── */

/**
 * Resultado del enrutamiento automático para una subida desde el
 * super-admin. Indica a qué *kind* pertenece y a qué audiencia se publica:
 *  - `public`    → visible en la sección Documentación pública (PDFs).
 *  - `restricted`→ visible solo en el dashboard autenticado
 *                  (DOCX/XLSX/PPTX/MD/TXT/ZIP y otros editables).
 *  - `gallery`   → imágenes/videos para galerías.
 */
export type Audience = "public" | "restricted" | "gallery";

export interface AutoRoute {
  kind: PanelKind;
  audience: Audience;
  /** Categoría sugerida (puede ser sobreescrita por el operador). */
  suggestedCategory: string;
  /** Etiqueta humana de destino para confirmación visual. */
  destinationLabel: string;
}

const PUBLIC_DOC_EXTS = ["pdf"];
const RESTRICTED_DOC_EXTS = ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "md", "txt", "csv", "zip", "rar", "7z"];
const IMAGE_EXTS = ["jpg", "jpeg", "png", "webp", "gif", "avif", "svg", "bmp"];
const VIDEO_EXTS = ["mp4", "webm", "mov", "m4v", "ogv", "avi", "mkv"];

function extOf(file: File): string {
  const m = file.name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : "";
}

/**
 * Decide cómo enrutar un archivo al panel super-admin a partir de su
 * extensión y MIME type. Si no se reconoce, cae a "documento restringido"
 * para que el operador no pierda el archivo.
 */
export function autoRoute(file: File): AutoRoute {
  const ext = extOf(file);
  const mime = (file.type || "").toLowerCase();

  if (mime.startsWith("image/") || IMAGE_EXTS.includes(ext)) {
    return {
      kind: "image",
      audience: "gallery",
      suggestedCategory: IMAGE_CATEGORIES[0],
      destinationLabel: "Galería pública (Imágenes)",
    };
  }
  if (mime.startsWith("video/") || VIDEO_EXTS.includes(ext)) {
    return {
      kind: "video",
      audience: "gallery",
      suggestedCategory: VIDEO_CATEGORIES[0],
      destinationLabel: "Galería pública (Videos)",
    };
  }
  if (ext === "pdf" || mime === "application/pdf" || PUBLIC_DOC_EXTS.includes(ext)) {
    return {
      kind: "document",
      audience: "public",
      suggestedCategory: "Investigación",
      destinationLabel: "Documentación pública (PDF)",
    };
  }
  if (RESTRICTED_DOC_EXTS.includes(ext)) {
    return {
      kind: "document",
      audience: "restricted",
      suggestedCategory: "Investigación",
      destinationLabel: "Documentos restringidos (dashboard)",
    };
  }
  // Fallback: por decisión de producto, los formatos no reconocidos se
  // publican como documentación pública (junto con los PDFs). El operador
  // siempre puede mover el archivo después desde el panel.
  return {
    kind: "document",
    audience: "public",
    suggestedCategory: "Investigación",
    destinationLabel: "Documentación pública (formato no reconocido)",
  };
}