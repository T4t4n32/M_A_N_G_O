import { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, Trash2, Crop, Image as ImageIcon, Video as VideoIcon, Box, FileQuestion, GripVertical, AlertCircle, CheckCircle2, Loader2, RotateCw, RotateCcw, FlipHorizontal2, FlipVertical2 } from "lucide-react";
import {
  MediaDescriptor,
  MediaType,
  QueueItem,
  cropImage,
  detectType,
  isAcceptedFor,
  parseValue,
  serializeValue,
  storeBlob,
  storeFile,
  deleteMedia,
  useResolvedSrc,
} from "@/lib/siteMedia";
import { getValue, setValue, MediaAccept } from "@/lib/siteContent";
import { useToast } from "@/hooks/use-toast";

interface MediaFieldProps {
  fieldKey: string;
  label: string;
  accept?: MediaAccept;
  multiple?: boolean;
  aspect?: number;
  onChanged?: () => void;
}

function readArray(raw: string): MediaDescriptor[] {
  const v = parseValue(raw);
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function ItemPreview({ d, onRemove, onCrop, onDragStart, onDragOver, onDrop, draggable, onUpdateMeta }: {
  d: MediaDescriptor;
  onRemove: () => void;
  onCrop?: () => void;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: () => void;
  draggable?: boolean;
  onUpdateMeta: (patch: Partial<MediaDescriptor>) => void;
}) {
  const url = useResolvedSrc(d);
  const Icon = d.type === "image" ? ImageIcon : d.type === "video" ? VideoIcon : d.type === "model" ? Box : FileQuestion;
  const altId = `media-alt-${d.id}`;
  const capId = `media-cap-${d.id}`;
  const altLabel = d.type === "image"
    ? "Texto alternativo (descripción para lectores de pantalla)"
    : d.type === "video"
      ? "Descripción del video"
      : d.type === "model"
        ? "Descripción del modelo 3D"
        : "Texto alternativo";
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="group relative rounded-lg border border-white/10 bg-white/[0.03] overflow-hidden"
    >
      <div className="flex">
      {draggable && (
        <div className="px-1.5 flex items-center text-white/30 cursor-grab active:cursor-grabbing">
          <GripVertical className="h-3.5 w-3.5" aria-hidden />
        </div>
      )}
      <div className="w-20 h-20 shrink-0 flex items-center justify-center bg-black/30">
        {d.type === "image" && url ? (
          <img src={url} alt={d.alt || d.name} className="w-full h-full object-cover" />
        ) : d.type === "video" && url ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={url} className="w-full h-full object-cover" muted />
        ) : (
          <Icon className="h-7 w-7 text-white/40" />
        )}
      </div>
      <div className="flex-1 min-w-0 px-3 py-2 flex flex-col justify-center">
        <p className="text-xs font-medium text-white truncate">{d.name}</p>
        <p className="text-[10px] text-white/40 uppercase tracking-wide">
          {d.type} · {(d.size / 1024).toFixed(1)} KB · {d.published ? "publicado" : "local"}
        </p>
      </div>
      <div className="flex items-center gap-1 px-2">
        {onCrop && d.type === "image" && (
          <Button type="button" size="icon" variant="ghost" onClick={onCrop} aria-label="Recortar imagen"
            className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/[0.08]">
            <Crop className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button type="button" size="icon" variant="ghost" onClick={onRemove} aria-label="Quitar"
          className="h-7 w-7 text-white/60 hover:text-red-300 hover:bg-red-500/10">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      </div>
      <div className="px-3 pb-2 pt-1 space-y-1.5 border-t border-white/5">
        <div>
          <label htmlFor={altId} className="text-[10px] uppercase tracking-wide text-white/50">
            {altLabel}
          </label>
          <Textarea
            id={altId}
            value={d.alt ?? ""}
            onChange={(e) => onUpdateMeta({ alt: e.target.value })}
            placeholder={d.type === "image"
              ? "Ej: Diagrama del prototipo M.A.N.G.O mostrando los sensores"
              : "Describe el contenido para personas que no pueden verlo"}
            rows={2}
            className="mt-0.5 text-xs bg-black/30 border-white/10 text-white placeholder:text-white/30 resize-none"
          />
        </div>
        <div>
          <label htmlFor={capId} className="text-[10px] uppercase tracking-wide text-white/50">
            Leyenda visible (opcional)
          </label>
          <Input
            id={capId}
            value={d.caption ?? ""}
            onChange={(e) => onUpdateMeta({ caption: e.target.value })}
            placeholder="Texto que aparecerá bajo el medio en la página"
            className="mt-0.5 h-7 text-xs bg-black/30 border-white/10 text-white placeholder:text-white/30"
          />
        </div>
      </div>
    </div>
  );
}

function CropDialog({ src, aspect, open, onClose, onCropped }: {
  src: string;
  aspect?: number;
  open: boolean;
  onClose: () => void;
  onCropped: (b: Blob) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const areaRef = useRef<Area | null>(null);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[hsl(205,35%,8%)] border-white/10 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Editar imagen — recorte, rotación y ajuste fino</DialogTitle>
        </DialogHeader>
        <div className="relative w-full h-72 bg-black rounded-md overflow-hidden">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect ?? 4 / 3}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={(_a, pixels) => { areaRef.current = pixels; }}
          />
        </div>
        <div className="space-y-3 px-1">
          <div>
            <label className="text-[11px] text-white/60">Zoom ({zoom.toFixed(2)}×)</label>
            <Slider value={[zoom]} min={1} max={4} step={0.05} onValueChange={(v) => setZoom(v[0])} />
          </div>
          <div>
            <label className="text-[11px] text-white/60">Rotación libre ({Math.round(rotation)}°)</label>
            <Slider value={[rotation]} min={-180} max={180} step={1} onValueChange={(v) => setRotation(v[0])} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-white/60">Ajuste fino X ({offsetX}px)</label>
              <Slider value={[offsetX]} min={-200} max={200} step={1} onValueChange={(v) => setOffsetX(v[0])} />
            </div>
            <div>
              <label className="text-[11px] text-white/60">Ajuste fino Y ({offsetY}px)</label>
              <Slider value={[offsetY]} min={-200} max={200} step={1} onValueChange={(v) => setOffsetY(v[0])} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setRotation((r) => r - 90)}
              className="h-8 text-xs text-white/80 hover:bg-white/10" aria-label="Rotar 90° a la izquierda">
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> 90° izq.
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setRotation((r) => r + 90)}
              className="h-8 text-xs text-white/80 hover:bg-white/10" aria-label="Rotar 90° a la derecha">
              <RotateCw className="h-3.5 w-3.5 mr-1" /> 90° der.
            </Button>
            <Button type="button" size="sm" variant={flipH ? "secondary" : "ghost"} onClick={() => setFlipH((v) => !v)}
              className="h-8 text-xs" aria-pressed={flipH} aria-label="Voltear horizontal">
              <FlipHorizontal2 className="h-3.5 w-3.5 mr-1" /> Voltear H
            </Button>
            <Button type="button" size="sm" variant={flipV ? "secondary" : "ghost"} onClick={() => setFlipV((v) => !v)}
              className="h-8 text-xs" aria-pressed={flipV} aria-label="Voltear vertical">
              <FlipVertical2 className="h-3.5 w-3.5 mr-1" /> Voltear V
            </Button>
            <Button type="button" size="sm" variant="ghost"
              onClick={() => { setRotation(0); setFlipH(false); setFlipV(false); setOffsetX(0); setOffsetY(0); setZoom(1); }}
              className="h-8 text-xs text-white/60 hover:text-white ml-auto">
              Restablecer
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-white/70 hover:bg-white/10">Cancelar</Button>
          <Button
            onClick={async () => {
              const a = areaRef.current;
              if (!a) return;
              const b = await cropImage(src, a, "image/jpeg", { rotation, flipH, flipV, offsetX, offsetY });
              onCropped(b);
            }}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            Aplicar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MediaField({ fieldKey, label, accept = "any", multiple = false, aspect, onChanged }: MediaFieldProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<MediaDescriptor[]>(() => readArray(getValue(fieldKey, "")));
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [drag, setDrag] = useState(false);
  const [cropping, setCropping] = useState<{ src: string; targetIndex: number | null } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const persist = useCallback((next: MediaDescriptor[]) => {
    setItems(next);
    if (next.length === 0) setValue(fieldKey, "");
    else if (multiple) setValue(fieldKey, serializeValue(next));
    else setValue(fieldKey, serializeValue(next[0] ?? null));
    onChanged?.();
  }, [fieldKey, multiple, onChanged]);

  // Process queued files into descriptors
  useEffect(() => {
    const pending = queue.filter((q) => q.status === "queued");
    if (pending.length === 0) return;
    pending.forEach(async (q) => {
      setQueue((prev) => prev.map((p) => p.uid === q.uid ? { ...p, status: "processing", progress: 10 } : p));
      try {
        await new Promise((r) => setTimeout(r, 80));
        setQueue((prev) => prev.map((p) => p.uid === q.uid ? { ...p, progress: 55 } : p));
        const d = await storeFile(q.file);
        setQueue((prev) => prev.map((p) => p.uid === q.uid ? { ...p, status: "ok", progress: 100, descriptor: d } : p));
        setItems((cur) => {
          const next = multiple ? [...cur, d] : [d];
          if (next.length === 0) setValue(fieldKey, "");
          else if (multiple) setValue(fieldKey, serializeValue(next));
          else setValue(fieldKey, serializeValue(next[0]));
          onChanged?.();
          return next;
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error desconocido.";
        setQueue((prev) => prev.map((p) => p.uid === q.uid ? { ...p, status: "error", error: msg } : p));
        toast({ title: "No se pudo subir", description: `${q.file.name}: ${msg}`, variant: "destructive" });
      }
    });
  }, [queue, multiple, fieldKey, onChanged, toast]);

  const handleFiles = (list: FileList | File[]) => {
    const files = Array.from(list);
    const valid: File[] = [];
    for (const f of files) {
      if (!isAcceptedFor(f, accept)) {
        toast({ title: "Tipo no permitido", description: `${f.name} no es ${accept}.`, variant: "destructive" });
        continue;
      }
      valid.push(f);
    }
    const newQueue: QueueItem[] = valid.map((file) => ({
      uid: crypto.randomUUID(),
      file,
      type: detectType(file),
      status: "queued",
      progress: 0,
    }));
    if (!multiple && newQueue.length > 1) newQueue.splice(1);
    setQueue((q) => [...q, ...newQueue]);
  };

  const removeItem = async (idx: number) => {
    const target = items[idx];
    if (target) await deleteMedia(target.id);
    persist(items.filter((_, i) => i !== idx));
  };

  const updateMeta = (idx: number, patch: Partial<MediaDescriptor>) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    persist(next);
  };

  const startCrop = (idx: number, src: string) => setCropping({ src, targetIndex: idx });
  const onCropped = async (blob: Blob) => {
    if (!cropping) return;
    const idx = cropping.targetIndex;
    const previous = idx != null ? items[idx] : null;
    const d = await storeBlob(blob, previous?.name?.replace(/\.[^.]+$/, "_crop.jpg") ?? "crop.jpg", "image", "image/jpeg");
    if (previous) await deleteMedia(previous.id);
    const next = [...items];
    if (idx != null) next[idx] = d; else next.push(d);
    persist(next);
    setCropping(null);
  };

  // Drag-drop file zone
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  // Drag-reorder for gallery
  const dragSrc = useRef<number | null>(null);
  const reorderStart = (i: number) => { dragSrc.current = i; };
  const reorderDrop = (i: number) => {
    const src = dragSrc.current;
    if (src == null || src === i) return;
    const next = [...items];
    const [m] = next.splice(src, 1);
    next.splice(i, 0, m);
    dragSrc.current = null;
    persist(next);
  };

  const acceptAttr =
    accept === "image" ? "image/*"
    : accept === "video" ? "video/mp4,video/webm,video/*"
    : accept === "model" ? ".glb,.gltf,.stl,.step,.stp,model/gltf-binary,model/gltf+json"
    : "image/*,video/*,.glb,.gltf,.stl,.step,.stp";

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        aria-label={`Subir archivos para ${label}`}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); } }}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={`rounded-lg border-2 border-dashed transition-all px-3 py-4 text-center cursor-pointer
          ${drag ? "border-accent bg-accent/10" : "border-white/15 bg-white/[0.02] hover:bg-white/[0.04] focus-visible:border-accent focus-visible:bg-accent/5 outline-none"}`}
      >
        <Upload className="h-4 w-4 text-white/50 inline mr-2" aria-hidden />
        <span className="text-xs text-white/70">
          Arrastra o haz clic para subir {multiple ? "uno o varios archivos" : "un archivo"}
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptAttr}
          multiple={multiple}
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* Upload queue */}
      {queue.length > 0 && (
        <ul className="space-y-1.5">
          {queue.map((q) => (
            <li key={q.uid} className="rounded-md bg-white/[0.03] border border-white/10 px-2 py-1.5">
              <div className="flex items-center gap-2">
                {q.status === "ok" ? <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  : q.status === "error" ? <AlertCircle className="h-3 w-3 text-red-400" />
                  : <Loader2 className="h-3 w-3 text-white/60 animate-spin" />}
                <span className="text-[11px] text-white/70 truncate flex-1">{q.file.name}</span>
                <span className="text-[10px] text-white/40">{q.status}</span>
              </div>
              {q.status !== "ok" && q.status !== "error" && (
                <Progress value={q.progress} className="h-1 mt-1" />
              )}
              {q.error && <p className="text-[10px] text-red-300 mt-0.5">{q.error}</p>}
            </li>
          ))}
          {queue.some((q) => q.status === "ok" || q.status === "error") && (
            <li className="text-right">
              <Button type="button" size="sm" variant="ghost"
                onClick={() => setQueue((q) => q.filter((it) => it.status !== "ok" && it.status !== "error"))}
                className="h-6 text-[10px] text-white/50 hover:text-white">Limpiar cola</Button>
            </li>
          )}
        </ul>
      )}

      {/* Stored items */}
      {items.length > 0 && (
        <ul className="space-y-1.5">
          {items.map((d, i) => (
            <li key={d.id}>
              <ItemPreview
                d={d}
                draggable={multiple}
                onDragStart={() => reorderStart(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => reorderDrop(i)}
                onRemove={() => removeItem(i)}
                onUpdateMeta={(patch) => updateMeta(i, patch)}
                onCrop={d.type === "image" ? async () => {
                  const url = await new Promise<string>((resolve) => {
                    // load blob → dataURL for the cropper
                    import("@/lib/siteMedia").then(async ({ loadBlob }) => {
                      const b = await loadBlob(d.id);
                      if (!b) { resolve(d.remoteUrl ?? ""); return; }
                      const r = new FileReader();
                      r.onload = () => resolve(typeof r.result === "string" ? r.result : "");
                      r.readAsDataURL(b);
                    });
                  });
                  if (url) startCrop(i, url);
                } : undefined}
              />
            </li>
          ))}
        </ul>
      )}

      {cropping && (
        <CropDialog
          src={cropping.src}
          aspect={aspect}
          open
          onClose={() => setCropping(null)}
          onCropped={onCropped}
        />
      )}
    </div>
  );
}