import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  UploadCloud,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Globe,
  Lock,
  Wand2,
} from "lucide-react";
import {
  addItem,
  autoRoute,
  inferFormat,
  uploadFileToBackend,
  type AutoRoute,
} from "@/lib/panelEmmaContent";
import { handleApiError } from "@/lib/errorHandler";
import { useToast } from "@/hooks/use-toast";

/**
 * Subida automática multi-formato para el super-admin.
 *
 * El operador arrastra cualquier archivo y el componente decide solo dónde
 * publicarlo (galería de imágenes, videos, documentación pública o
 * documentos restringidos del dashboard) usando `autoRoute`.
 *
 * Acepta cualquier extensión y ofrece confirmación visual del destino
 * antes de persistir, manteniendo la regla de seguridad: los formatos
 * editables (DOCX/XLSX/PPTX/MD/TXT/ZIP) NUNCA acaban en la sección pública.
 */

type Status = "queued" | "processing" | "ok" | "error";

interface PendingItem {
  file: File;
  title: string;
  status: Status;
  progress: number;
  error?: string;
  route: AutoRoute;
}


function audienceBadge(route: AutoRoute) {
  if (route.audience === "public") {
    return { Icon: Globe, color: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30", label: "Público" };
  }
  if (route.audience === "restricted") {
    return { Icon: Lock, color: "text-amber-300 bg-amber-500/10 border-amber-500/30", label: "Restringido" };
  }
  return { Icon: ImageIcon, color: "text-sky-300 bg-sky-500/10 border-sky-500/30", label: "Galería" };
}

function kindIcon(route: AutoRoute) {
  if (route.kind === "image") return ImageIcon;
  if (route.kind === "video") return VideoIcon;
  return FileText;
}

export function SmartUploadForm({ onAdded }: { onAdded?: () => void }) {
  const { toast } = useToast();
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const items: PendingItem[] = Array.from(files).map((f) => ({
      file: f,
      title: f.name.replace(/\.[^.]+$/, ""),
      status: "queued",
      progress: 0,
      route: autoRoute(f),
    }));
    setPending((prev) => [...prev, ...items]);
  }, []);

  const removeAt = (idx: number) =>
    setPending((prev) => prev.filter((_, i) => i !== idx));

  const summary = useMemo(() => {
    const buckets = { public: 0, restricted: 0, gallery: 0 };
    pending.forEach((p) => { buckets[p.route.audience] += 1; });
    return buckets;
  }, [pending]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending.length === 0) {
      toast({ title: "Sin archivos", description: "Arrastra o selecciona al menos un archivo.", variant: "destructive" });
      return;
    }
    setBusy(true);
    let ok = 0;
    let failed = 0;
    try {
      for (let i = 0; i < pending.length; i++) {
        const p = pending[i];
        if (p.status === "ok") continue;
        setPending((prev) => prev.map((x, j) =>
          j === i ? { ...x, status: "processing", progress: 0, error: undefined } : x,
        ));
        try {
          const result = await uploadFileToBackend(p.file, p.route.kind, (pct) =>
            setPending((prev) => prev.map((x, j) => (j === i ? { ...x, progress: pct } : x))),
          );
          addItem({
            kind: p.route.kind,
            title: p.title.trim() || p.file.name,
            description: description.trim(),
            category: p.route.suggestedCategory,
            src: result.url,
            format: inferFormat(p.file),
            size: p.file.size,
          });
          setPending((prev) => prev.map((x, j) => (j === i ? { ...x, status: "ok", progress: 100 } : x)));
          ok += 1;
        } catch (err) {
          // Centraliza el log técnico (no es ApiError pero seguimos la misma vía).
          handleApiError(err, { context: "smart-upload", silent: true });
          const msg = err instanceof Error ? err.message : "Error desconocido";
          setPending((prev) => prev.map((x, j) => (j === i ? { ...x, status: "error", error: msg } : x)));
          failed += 1;
        }
      }
      if (ok > 0) {
        toast({
          title: ok === 1 ? "Archivo enrutado" : `${ok} archivos enrutados`,
          description: `Público: ${summary.public} · Restringido: ${summary.restricted} · Galería: ${summary.gallery}` +
            (failed ? ` · ${failed} fallidos.` : ""),
        });
      }
      if (failed > 0) {
        toast({
          title: "Algunos archivos fallaron",
          description: "Revisa los archivos en rojo y vuelve a intentarlo.",
          variant: "destructive",
        });
      }
      // Mantener solo los que fallaron para reintento.
      setPending((prev) => prev.filter((x) => x.status === "error"));
      onAdded?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-labelledby="smart-upload-title">
      <div className="rounded-lg border border-accent/30 bg-accent/[0.06] p-3 flex gap-3">
        <Wand2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
        <div className="text-xs text-white/80 leading-relaxed">
          <p id="smart-upload-title" className="font-semibold text-white mb-0.5">
            Subida inteligente — clasificación automática
          </p>
          <p>
            Arrastra cualquier archivo. Los <strong className="text-emerald-300">PDF</strong> van a
            la documentación pública (Inicio). Los <strong className="text-amber-300">DOCX, XLSX, PPTX, MD, TXT, ZIP</strong>
            {" "}quedan restringidos al dashboard. Las imágenes y videos van a las galerías.
          </p>
        </div>
      </div>

      <label
        htmlFor="smart-upload-input"
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-sm cursor-pointer transition ${
          dragOver
            ? "border-accent bg-accent/[0.08] text-white"
            : "border-white/15 bg-white/[0.02] text-white/60 hover:border-white/30 hover:text-white"
        }`}
      >
        <UploadCloud className="h-7 w-7" aria-hidden />
        <span className="font-medium">Suelta archivos o haz click para seleccionar</span>
        <span className="text-[11px] text-white/40">
          Acepta cualquier formato. Imágenes 15 MB · Videos 500 MB · Docs 20 MB.
        </span>
        <input
          id="smart-upload-input"
          type="file"
          multiple
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
          aria-label="Seleccionar archivos para subir"
        />
      </label>

      <div className="grid sm:grid-cols-3 gap-2 text-[11px]">
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/[0.06] px-2 py-1.5 text-emerald-200 flex items-center gap-1.5">
          <Globe className="h-3 w-3" /> Público (PDF): <strong>{summary.public}</strong>
        </div>
        <div className="rounded-md border border-amber-500/30 bg-amber-500/[0.06] px-2 py-1.5 text-amber-200 flex items-center gap-1.5">
          <Lock className="h-3 w-3" /> Restringido: <strong>{summary.restricted}</strong>
        </div>
        <div className="rounded-md border border-sky-500/30 bg-sky-500/[0.06] px-2 py-1.5 text-sky-200 flex items-center gap-1.5">
          <ImageIcon className="h-3 w-3" /> Galería: <strong>{summary.gallery}</strong>
        </div>
      </div>

      {pending.length > 0 && (
        <ul className="space-y-2" aria-label="Archivos en cola">
          {pending.map((p, idx) => {
            const Icon = kindIcon(p.route);
            const badge = audienceBadge(p.route);
            return (
              <li
                key={`${p.file.name}-${idx}`}
                className="rounded-lg border border-white/10 bg-white/[0.03] p-3 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <Icon className="h-5 w-5 text-white/60 shrink-0" aria-hidden />
                <div className="flex-1 min-w-0">
                  <Input
                    value={p.title}
                    onChange={(e) =>
                      setPending((prev) => prev.map((x, j) => (j === idx ? { ...x, title: e.target.value } : x)))
                    }
                    aria-label={`Nombre para ${p.file.name}`}
                    className="bg-white/[0.04] border-white/10 text-white text-sm h-8"
                  />
                  <div className="flex items-center gap-2 flex-wrap mt-1.5 text-[11px] text-white/50">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${badge.color}`}>
                      <badge.Icon className="h-3 w-3" /> {badge.label}
                    </span>
                    <span>→ {p.route.destinationLabel}</span>
                    <span className="text-white/30">· {(p.file.size / 1024).toFixed(0)} KB</span>
                  </div>
                  {p.status === "processing" && <Progress value={p.progress} className="h-1 mt-1.5" />}
                  {p.status === "error" && p.error && (
                    <p className="text-[11px] text-red-300 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {p.error}
                    </p>
                  )}
                  {p.status === "ok" && (
                    <p className="text-[11px] text-emerald-300 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Subido al servidor
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAt(idx)}
                  aria-label={`Quitar ${p.file.name} de la cola`}
                  className="h-7 w-7 text-white/40 hover:text-white"
                  disabled={busy}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descripción común (opcional) — se aplicará a todos los archivos de esta tanda."
        aria-label="Descripción común"
        className="bg-white/[0.04] border-white/10 text-white min-h-[60px] text-sm"
      />

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={busy || pending.length === 0}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          {busy ? (
            <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Procesando…</>
          ) : (
            <><UploadCloud className="h-4 w-4 mr-1.5" /> Enrutar y publicar ({pending.length})</>
          )}
        </Button>
      </div>
    </form>
  );
}