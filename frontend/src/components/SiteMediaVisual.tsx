/**
 * Public-site renderer for media stored via the Panel Emma editor.
 * Reads a `siteContent` field key and renders the descriptor(s) as
 * image / video / 3D / mini-gallery. Returns null when the field is empty
 * so the surrounding layout stays unaffected.
 */

import { Suspense, lazy, useState } from "react";
import { ChevronLeft, ChevronRight, Box as BoxIcon } from "lucide-react";
import { useSiteValue } from "@/lib/siteContent";
import { MediaDescriptor, parseValue, useResolvedSrc } from "@/lib/siteMedia";

const ModelViewer = lazy(() => import("@/components/effects/ModelViewer"));

function MediaPiece({ d }: { d: MediaDescriptor }) {
  const url = useResolvedSrc(d);
  const altText = d.alt?.trim() || d.name;
  if (!url) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/40 p-4 text-center">
        <BoxIcon className="h-10 w-10" />
        <span className="text-xs">{d.name}</span>
      </div>
    );
  }
  if (d.type === "image") {
    return <img src={url} alt={altText} className="w-full h-full object-cover" />;
  }
  if (d.type === "video") {
    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <video
        src={url}
        controls
        playsInline
        aria-label={altText}
        className="w-full h-full object-cover bg-black"
      />
    );
  }
  if (d.type === "model") {
    if (/\.(glb|gltf)$/i.test(d.name)) {
      return (
        <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-white/30 text-xs">Cargando 3D…</div>}>
          <ModelViewer
            url={url}
            name={d.name}
            description={altText}
            autoRotate
            autoRotateSpeed={0.35}
            enableHoverRotation
            environmentPreset="forest"
          />
        </Suspense>
      );
    }
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/60 p-4 text-center">
        <BoxIcon className="h-10 w-10 text-white/40" />
        <p className="text-sm font-medium text-white">{d.name}</p>
        {d.alt && <p className="text-xs text-white/50 max-w-xs">{d.alt}</p>}
        <a href={url} download={d.name} className="text-xs text-accent underline">Descargar modelo</a>
      </div>
    );
  }
  return null;
}

export function SiteMediaVisual({
  fieldKey,
  className = "",
  ariaLabel,
}: {
  fieldKey: string;
  className?: string;
  ariaLabel?: string;
}) {
  const raw = useSiteValue(fieldKey, "");
  const v = parseValue(raw);
  const items: MediaDescriptor[] = !v ? [] : Array.isArray(v) ? v : [v];
  const [idx, setIdx] = useState(0);
  if (items.length === 0) return null;
  const cur = items[Math.min(idx, items.length - 1)];
  return (
    <figure
      aria-label={ariaLabel ?? cur.name}
      className={`relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] ${className}`}
    >
      <MediaPiece d={cur} />
      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setIdx((i) => (i - 1 + items.length) % items.length)}
            aria-label="Medio anterior"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white/80 backdrop-blur"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIdx((i) => (i + 1) % items.length)}
            aria-label="Medio siguiente"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white/80 backdrop-blur"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Mostrar medio ${i + 1} de ${items.length}`}
                aria-current={i === idx}
                onClick={() => setIdx(i)}
                className={`h-1.5 w-4 rounded-full transition-colors ${i === idx ? "bg-white" : "bg-white/30 hover:bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
      {cur.caption && (
        <figcaption className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-3 pt-6 pb-2 text-xs text-white/90">
          {cur.caption}
        </figcaption>
      )}
    </figure>
  );
}