/**
 * Media storage for the site editor.
 *
 * Field values in `siteContent` are stored as compact JSON descriptors
 * (or arrays for galleries). The actual blob is kept in IndexedDB via
 * `idb-keyval` to avoid bloating localStorage. When the backend is wired
 * the descriptor gets a `remoteUrl` and that URL is preferred over the
 * local blob.
 */

import { get, set, del, keys } from "idb-keyval";
import { useEffect, useState } from "react";

export type MediaType = "image" | "video" | "model" | "doc";

export interface MediaDescriptor {
  id: string;
  type: MediaType;
  name: string;
  mime: string;
  size: number;
  storedAt: number;
  /** Alternative text used by screen readers for images / 3D / videos. */
  alt?: string;
  /** Visible caption shown under the media. */
  caption?: string;
  /** Once published the backend returns a CDN URL. Preferred when present. */
  remoteUrl?: string;
  /** True when published successfully. */
  published?: boolean;
}

export type FieldMediaValue = MediaDescriptor | MediaDescriptor[] | null;

const PREFIX = "site-media:";
const EVENT = "panel-emma::site-media-changed";
const MAX_BYTES = 50 * 1024 * 1024;

const MODEL_EXT = /\.(glb|gltf|stl|step|stp)$/i;
const VIDEO_MIME = /^video\/(mp4|webm|ogg|quicktime)$/;

export function detectType(file: File): MediaType {
  if (file.type.startsWith("image/")) return "image";
  if (VIDEO_MIME.test(file.type)) return "video";
  if (MODEL_EXT.test(file.name)) return "model";
  if (file.type.startsWith("video/")) return "video";
  return "doc";
}

export function isAcceptedFor(file: File, accept: MediaType | "any"): boolean {
  if (accept === "any") return true;
  return detectType(file) === accept;
}

export async function storeBlob(blob: Blob, name: string, type: MediaType, mime?: string): Promise<MediaDescriptor> {
  if (blob.size > MAX_BYTES) throw new Error("Archivo supera 50 MB.");
  const id = (typeof crypto !== "undefined" && "randomUUID" in crypto)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
  await set(PREFIX + id, blob);
  const desc: MediaDescriptor = {
    id,
    type,
    name,
    mime: mime ?? blob.type ?? "application/octet-stream",
    size: blob.size,
    storedAt: Date.now(),
  };
  window.dispatchEvent(new CustomEvent(EVENT));
  return desc;
}

export async function storeFile(file: File): Promise<MediaDescriptor> {
  return storeBlob(file, file.name, detectType(file), file.type);
}

export async function deleteMedia(id: string) {
  if (id.startsWith("legacy:")) return;
  await del(PREFIX + id);
  window.dispatchEvent(new CustomEvent(EVENT));
}

export async function loadBlob(id: string): Promise<Blob | null> {
  if (id.startsWith("legacy:")) return null;
  return (await get(PREFIX + id)) || null;
}

export async function listAll(): Promise<string[]> {
  const all = await keys();
  return all
    .filter((k) => typeof k === "string" && (k as string).startsWith(PREFIX))
    .map((k) => (k as string).slice(PREFIX.length));
}

/** Stable URL cache so the same blob doesn't get a new objectURL every render. */
const urlCache = new Map<string, string>();

function blobUrlFor(id: string): Promise<string | null> {
  const cached = urlCache.get(id);
  if (cached) return Promise.resolve(cached);
  return loadBlob(id).then((blob) => {
    if (!blob) return null;
    const u = URL.createObjectURL(blob);
    urlCache.set(id, u);
    return u;
  });
}

export function useResolvedSrc(d: MediaDescriptor | null | undefined): string | null {
  const id = d?.id;
  const remote = d?.remoteUrl;
  const [url, setUrl] = useState<string | null>(() => remote ?? (id ? urlCache.get(id) ?? null : null));
  useEffect(() => {
    let alive = true;
    if (!d) { setUrl(null); return; }
    if (d.remoteUrl) { setUrl(d.remoteUrl); return; }
    blobUrlFor(d.id).then((u) => { if (alive) setUrl(u); });
    const onChange = () => { if (alive) blobUrlFor(d.id).then((u) => alive && setUrl(u)); };
    window.addEventListener(EVENT, onChange);
    return () => { alive = false; window.removeEventListener(EVENT, onChange); };
  }, [d?.id, d?.remoteUrl]);
  return url;
}

/** Parse a stored field value into a descriptor (or array). Tolerates legacy data URLs. */
export function parseValue(raw: string): FieldMediaValue {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    if (Array.isArray(v)) return v as MediaDescriptor[];
    if (v && typeof v === "object" && "id" in v) return v as MediaDescriptor;
  } catch {
    /* legacy: dataURL or absolute URL stored directly */
  }
  return {
    id: "legacy:" + raw.slice(0, 24),
    type: "image",
    name: "legacy",
    mime: raw.startsWith("data:") ? raw.slice(5, raw.indexOf(";")) || "" : "",
    size: 0,
    storedAt: 0,
    remoteUrl: raw,
  };
}

export function serializeValue(v: FieldMediaValue): string {
  if (!v) return "";
  return JSON.stringify(v);
}

/** Upload-queue item used by the editor UI. */
export type QueueStatus = "queued" | "processing" | "ok" | "error";

export interface QueueItem {
  uid: string;
  file: File;
  type: MediaType;
  status: QueueStatus;
  progress: number;
  error?: string;
  descriptor?: MediaDescriptor;
}

/** Transform options applied before/around the crop. */
export interface CropTransform {
  /** Rotation in degrees applied to the source image before cropping. */
  rotation?: number;
  /** Mirror horizontally. */
  flipH?: boolean;
  /** Mirror vertically. */
  flipV?: boolean;
  /** Fine pixel offset applied to the crop window (post react-easy-crop). */
  offsetX?: number;
  offsetY?: number;
}

/** Crop helper — supports rotation, flip and fine offset on top of the area. */
export async function cropImage(
  src: string,
  area: { x: number; y: number; width: number; height: number },
  mime = "image/jpeg",
  transform: CropTransform = {},
): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });

  const rot = ((transform.rotation ?? 0) % 360 + 360) % 360;
  const rad = (rot * Math.PI) / 180;
  const flipH = transform.flipH ? -1 : 1;
  const flipV = transform.flipV ? -1 : 1;

  // Bake rotation + flip into an intermediate canvas so the crop area maps cleanly.
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const bakedW = Math.round(img.width * cos + img.height * sin);
  const bakedH = Math.round(img.width * sin + img.height * cos);

  const baked = document.createElement("canvas");
  baked.width = bakedW;
  baked.height = bakedH;
  const bctx = baked.getContext("2d");
  if (!bctx) throw new Error("Canvas no disponible.");
  bctx.translate(bakedW / 2, bakedH / 2);
  bctx.rotate(rad);
  bctx.scale(flipH, flipV);
  bctx.drawImage(img, -img.width / 2, -img.height / 2);

  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(area.width));
  out.height = Math.max(1, Math.round(area.height));
  const ctx = out.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible.");
  const sx = area.x + (transform.offsetX ?? 0);
  const sy = area.y + (transform.offsetY ?? 0);
  ctx.drawImage(baked, sx, sy, area.width, area.height, 0, 0, out.width, out.height);
  return await new Promise<Blob>((resolve, reject) => {
    out.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo recortar."))), mime, 0.92);
  });
}

export const MEDIA_EVENT = EVENT;