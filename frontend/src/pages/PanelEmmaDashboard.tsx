import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  logout,
  listServerUploads,
  deleteServerUpload,
  patchServerUpload,
  uploadFile,
  type UploadedFileRecord,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Image as ImageIcon,
  Video,
  FolderOpen,
  Upload,
  Trash2,
  LogOut,
  ShieldCheck,
  Loader2,
  Leaf,
  Sparkles,
  CheckCircle2,
  Lock,
  Search,
  ExternalLink,
  Pencil,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  GripVertical,
  XCircle,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PanelItem, PanelKind, categoriesFor } from "@/lib/panelEmmaContent";
import { Progress } from "@/components/ui/progress";

/* ─────────────────────── API record → PanelItem ─────────────── */

function recordToPanelItem(r: UploadedFileRecord): PanelItem {
  const ext = r.original_name.split(".").pop()?.toUpperCase() ?? "";
  return {
    id: String(r.id),
    kind: r.kind,
    title: r.title,
    description: r.description ?? "",
    category: r.category ?? "Sin categoría",
    src: r.url,
    existing: true,
    format: ext,
    size: r.size,
    addedAt: r.uploaded_at,
  };
}

/* ─────────────────────────── Header ─────────────────────────── */

function PanelHeader({
  userName,
  onLogout,
}: {
  userName?: string;
  onLogout: () => void;
}) {
  return (
    <header className="bg-white/[0.04] backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-3 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">Panel Super-Admin</h1>
            <p className="text-[11px] text-white/40 hidden sm:block">Gestión de contenido M.A.N.G.O</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {userName && (
            <span className="text-xs text-white/50 hidden sm:inline truncate max-w-[180px]">{userName}</span>
          )}
          <a
            href="/archivos"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full border border-teal-500/30 text-teal-300 bg-teal-500/[0.08] hover:bg-teal-500/[0.14] transition-colors"
          >
            <Leaf className="h-3.5 w-3.5" />
            /archivos
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border border-accent/40 text-accent bg-accent/10">
            super-admin
          </span>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-white/50 hover:text-white hover:bg-white/[0.08]">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Salir</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[hsl(205,35%,12%)] border-white/10 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">¿Cerrar sesión?</AlertDialogTitle>
                <AlertDialogDescription className="text-white/60">
                  Saldrás de la consola de super-administración.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={onLogout}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Cerrar sesión
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────── Upload form ─────────────────────────── */

const KIND_SIZE_LABELS: Record<PanelKind, string> = {
  image: "200 MB",
  video: "2 GB",
  document: "500 MB",
};

// Persist the last selected category per kind so it survives tab switches
// (Radix UI Tabs unmounts inactive content, resetting React state).
function usePersistedCategory(kind: PanelKind): [string, (c: string) => void] {
  const cats = categoriesFor(kind);
  const storageKey = `panel-emma::cat-${kind}`;
  const [category, setCategory] = useState<string>(() => {
    if (typeof window === "undefined") return cats[0];
    const saved = localStorage.getItem(storageKey);
    return saved && cats.includes(saved) ? saved : cats[0];
  });
  const setAndPersist = useCallback((c: string) => {
    setCategory(c);
    localStorage.setItem(storageKey, c);
  }, [storageKey]);
  return [category, setAndPersist];
}

function UploadForm({
  kind,
  accept,
  onAdded,
}: {
  kind: PanelKind;
  accept: string;
  onAdded: () => void;
}) {
  const { toast } = useToast();
  const cats = categoriesFor(kind);
  type Status = "queued" | "processing" | "ok" | "error";
  type PendingItem = { file: File; title: string; status: Status; progress: number; error?: string };
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [category, setCategory] = usePersistedCategory(kind);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const acceptsFile = useCallback(
    (f: File) => {
      if (!accept) return true;
      const tokens = accept.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
      const name = f.name.toLowerCase();
      const type = f.type.toLowerCase();
      return tokens.some((tok) => {
        if (tok.startsWith(".")) return name.endsWith(tok);
        if (tok.endsWith("/*")) return type.startsWith(tok.slice(0, -1));
        return type === tok;
      });
    },
    [accept],
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const accepted: PendingItem[] = [];
      const rejected: string[] = [];
      Array.from(files).forEach((f) => {
        if (acceptsFile(f))
          accepted.push({ file: f, title: f.name.replace(/\.[^.]+$/, ""), status: "queued", progress: 0 });
        else rejected.push(f.name);
      });
      if (rejected.length) {
        toast({
          title: rejected.length === 1 ? "Tipo de archivo no admitido" : `${rejected.length} archivos descartados`,
          description: rejected.slice(0, 3).join(", ") + (rejected.length > 3 ? "…" : ""),
          variant: "destructive",
        });
      }
      if (accepted.length) setPending((prev) => [...prev, ...accepted]);
    },
    [acceptsFile, toast],
  );

  const reset = () => {
    setPending([]);
    setDescription("");
    setCategory(cats[0]); // also persists to localStorage via setAndPersist
    const input = document.getElementById(`file-input-${kind}`) as HTMLInputElement | null;
    if (input) input.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const queue = pending.filter((p) => p.status !== "ok");
    if (queue.length === 0) {
      toast({ title: "Faltan archivos", description: "Selecciona o arrastra al menos un archivo.", variant: "destructive" });
      return;
    }
    if (queue.some((p) => !p.title.trim())) {
      toast({ title: "Faltan nombres", description: "Cada archivo necesita un nombre.", variant: "destructive" });
      return;
    }
    setBusy(true);
    let ok = 0;
    let failed = 0;
    try {
      for (let i = 0; i < pending.length; i++) {
        const p = pending[i];
        if (p.status === "ok") continue;
        setPending((prev) =>
          prev.map((x, j) => (j === i ? { ...x, status: "processing", progress: 0, error: undefined } : x)),
        );
        try {
          await uploadFile(
            p.file,
            {
              kind,
              title: p.title.trim() || p.file.name,
              category,
              description: description.trim(),
            },
            (pct) => setPending((prev) => prev.map((x, j) => (j === i ? { ...x, progress: pct } : x))),
          );
          setPending((prev) => prev.map((x, j) => (j === i ? { ...x, status: "ok", progress: 100 } : x)));
          ok += 1;
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Error desconocido.";
          setPending((prev) => prev.map((x, j) => (j === i ? { ...x, status: "error", error: msg } : x)));
          failed += 1;
        }
      }
      if (ok > 0) {
        toast({
          title: ok === 1 ? "Archivo subido" : `${ok} archivos subidos`,
          description: `Categoría: ${category}.${failed ? ` ${failed} fallidos.` : ""}`,
        });
      }
      if (failed > 0) {
        toast({
          title: "Algunos archivos no se pudieron subir",
          description: "Revisa los archivos en rojo e intenta de nuevo.",
          variant: "destructive",
        });
      }
      setPending((prev) => prev.filter((x) => x.status === "error"));
      onAdded();
    } finally {
      setBusy(false);
    }
  };

  const openPicker = () => {
    const input = document.getElementById(`file-input-${kind}`) as HTMLInputElement | null;
    input?.click();
  };

  const moveItem = (from: number, to: number) => {
    setPending((prev) => {
      if (from === to || from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev;
      const copy = prev.slice();
      const [it] = copy.splice(from, 1);
      copy.splice(to, 0, it);
      return copy;
    });
  };

  const statusLabel: Record<Status, string> = {
    queued: "En cola",
    processing: "Procesando",
    ok: "Listo",
    error: "Error",
  };

  return (
    <form
      onSubmit={handleSubmit}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer?.files ?? null);
      }}
      className={`rounded-xl border bg-white/[0.03] p-5 space-y-4 transition-colors ${
        dragOver ? "border-accent bg-accent/[0.06] ring-2 ring-accent/40" : "border-white/10"
      }`}
    >
      <div className="flex items-center gap-2 text-white/80">
        <Sparkles className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold">Añadir archivos</h3>
        <span className="text-[11px] text-white/40 ml-auto hidden sm:inline">
          Máx {KIND_SIZE_LABELS[kind]} por archivo
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2 sm:col-span-2">
          <span className="text-xs text-white/60 block">Archivos</span>
          <div
            role="button"
            tabIndex={0}
            onClick={openPicker}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPicker(); }
            }}
            className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
              dragOver
                ? "border-accent bg-accent/10 text-accent"
                : "border-white/15 bg-white/[0.02] text-white/60 hover:border-accent/50 hover:text-white"
            }`}
          >
            <Upload className="h-5 w-5" />
            <span className="text-xs text-center">
              <span className="font-semibold">Haz clic</span> para elegir, o arrastra y suelta archivos aquí
            </span>
            {accept && (
              <span className="text-[10px] text-white/40 text-center max-w-xs">
                {accept}
              </span>
            )}
          </div>
          <Input
            id={`file-input-${kind}`}
            type="file"
            accept={accept || undefined}
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          />
          {pending.length > 0 && (
            <ul className="mt-2 space-y-1.5 rounded-md border border-white/10 bg-black/20 p-2">
              {pending.map((p, idx) => {
                const isOver = overIdx === idx && dragIdx !== null && dragIdx !== idx;
                const statusColor =
                  p.status === "ok" ? "text-emerald-300"
                  : p.status === "error" ? "text-destructive"
                  : p.status === "processing" ? "text-accent"
                  : "text-white/40";
                return (
                  <li
                    key={`${p.file.name}-${idx}`}
                    draggable={!busy}
                    onDragStart={(e) => { setDragIdx(idx); e.dataTransfer.effectAllowed = "move"; }}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setOverIdx(idx); }}
                    onDragLeave={(e) => { e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (dragIdx !== null) moveItem(dragIdx, idx);
                      setDragIdx(null);
                      setOverIdx(null);
                    }}
                    onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
                    className={`rounded-md p-2 transition-colors ${
                      isOver ? "bg-accent/20 ring-1 ring-accent/50" : "bg-transparent"
                    } ${dragIdx === idx ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        title="Arrastrar para reordenar"
                        onKeyDown={(e) => {
                          if (e.key === "ArrowUp") { e.preventDefault(); moveItem(idx, Math.max(0, idx - 1)); }
                          if (e.key === "ArrowDown") { e.preventDefault(); moveItem(idx, Math.min(pending.length - 1, idx + 1)); }
                        }}
                        className="h-7 w-5 flex items-center justify-center text-white/40 hover:text-white cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded"
                      >
                        <GripVertical className="h-4 w-4" />
                      </button>
                      <span className="text-[10px] font-mono text-white/40 w-5 text-right">{idx + 1}.</span>
                      <Input
                        value={p.title}
                        onChange={(e) => {
                          const v = e.target.value;
                          setPending((prev) => prev.map((x, i) => (i === idx ? { ...x, title: v } : x)));
                        }}
                        aria-label={`Nombre para ${p.file.name}`}
                        disabled={busy && p.status === "processing"}
                        className="bg-white/[0.04] border-white/10 text-white h-8 text-xs flex-1"
                      />
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider ${statusColor}`}>
                        {p.status === "ok" && <CheckCircle2 className="h-3 w-3" />}
                        {p.status === "error" && <XCircle className="h-3 w-3" />}
                        {p.status === "processing" && <Loader2 className="h-3 w-3 animate-spin" />}
                        {statusLabel[p.status]}
                      </span>
                      <span className="text-[10px] text-white/40 hidden sm:inline">
                        {(p.file.size / 1024).toFixed(1)} KB
                      </span>
                      <button
                        type="button"
                        onClick={() => setPending((prev) => prev.filter((_, i) => i !== idx))}
                        disabled={busy && p.status === "processing"}
                        aria-label={`Quitar ${p.file.name}`}
                        className="h-7 w-7 rounded-md text-white/50 hover:text-white hover:bg-white/[0.08] flex items-center justify-center disabled:opacity-30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {(p.status === "processing" || p.status === "ok" || p.status === "error") && (
                      <div className="mt-1.5 pl-12 pr-1">
                        <Progress
                          value={p.status === "ok" ? 100 : p.status === "error" ? 100 : p.progress}
                          className={`h-1 ${p.status === "error" ? "[&>div]:bg-destructive" : p.status === "ok" ? "[&>div]:bg-emerald-500" : "[&>div]:bg-accent"}`}
                        />
                        {p.status === "error" && p.error && (
                          <p className="mt-1 text-[10px] text-destructive">{p.error}</p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`category-${kind}`} className="text-xs text-white/60">Categoría</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id={`category-${kind}`} className="bg-white/[0.04] border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[hsl(205,35%,12%)] border-white/10 text-white">
              {cats.map((c) => (
                <SelectItem key={c} value={c} className="focus:bg-white/[0.08] focus:text-white">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`desc-${kind}`} className="text-xs text-white/60">
            Descripción <span className="text-white/30">(aplica a todos los archivos en cola)</span>
          </Label>
          <Textarea
            id={`desc-${kind}`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción opcional para la galería pública."
            className="bg-white/[0.04] border-white/10 text-white min-h-[70px] text-sm"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          onClick={reset}
          disabled={busy}
          className="text-white/60 hover:text-white hover:bg-white/[0.08]"
        >
          Limpiar
        </Button>
        <Button
          type="submit"
          disabled={busy || pending.filter((p) => p.status !== "ok").length === 0}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
          {busy
            ? "Subiendo…"
            : (() => {
                const remaining = pending.filter((p) => p.status !== "ok").length;
                return remaining > 1 ? `Subir ${remaining} archivos` : "Subir archivo";
              })()}
        </Button>
      </div>
    </form>
  );
}

/* ─────────────────── Badges / Card actions ─────────────────── */

function ItemBadge({ existing }: { existing: boolean }) {
  return existing ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border border-emerald-500/40 text-emerald-300 bg-emerald-500/10">
      <CheckCircle2 className="h-2.5 w-2.5" /> Publicado
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border border-accent/40 text-accent bg-accent/10">
      <Sparkles className="h-2.5 w-2.5" /> Local
    </span>
  );
}

function CardActions({
  item,
  onEdit,
  onDelete,
  className = "",
}: {
  item: PanelItem;
  onEdit?: (item: PanelItem) => void;
  onDelete?: (item: PanelItem) => void;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {onEdit && (
        <button
          onClick={() => onEdit(item)}
          aria-label="Editar"
          className="h-7 w-7 rounded-full bg-black/60 hover:bg-accent hover:text-accent-foreground text-white flex items-center justify-center transition"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
      {onDelete && (
        <button
          onClick={() => onDelete(item)}
          aria-label="Eliminar"
          className="h-7 w-7 rounded-full bg-black/60 hover:bg-destructive text-white flex items-center justify-center transition"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────── Cards ─────────────────────────── */

function ImageCard({
  item,
  onEdit,
  onDelete,
}: {
  item: PanelItem;
  onEdit?: (item: PanelItem) => void;
  onDelete?: (item: PanelItem) => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="group mb-3 break-inside-avoid rounded-xl overflow-hidden bg-white/[0.04] border border-white/10 flex flex-col">
      <div className="relative bg-black/40 overflow-hidden">
        {imgError ? (
          <div className="w-full h-32 flex flex-col items-center justify-center gap-2 text-white/30">
            <ImageIcon className="h-8 w-8" />
            <span className="text-[10px]">Vista previa no disponible</span>
            <a
              href={item.src}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-accent underline"
            >
              Abrir archivo
            </a>
          </div>
        ) : (
          <img
            src={item.src}
            alt={item.title}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-auto block group-hover:scale-[1.02] transition-transform duration-500"
          />
        )}
        <div className="absolute top-2 left-2"><ItemBadge existing={item.existing} /></div>
        <CardActions
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
        />
      </div>
      <div className="p-3 flex flex-col gap-1">
        <h4 className="text-sm font-semibold text-white leading-tight">{item.title}</h4>
        {item.description && <p className="text-xs text-white/60 leading-relaxed line-clamp-3">{item.description}</p>}
        <div className="mt-1 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-white/40">
          <span>{item.category}</span>
          {item.format && <span className="font-mono">{item.format}</span>}
        </div>
      </div>
    </div>
  );
}

function VideoCard({
  item,
  onEdit,
  onDelete,
}: {
  item: PanelItem;
  onEdit?: (item: PanelItem) => void;
  onDelete?: (item: PanelItem) => void;
}) {
  return (
    <div className="group rounded-xl overflow-hidden bg-white/[0.04] border border-white/10 flex flex-col">
      <div className="relative aspect-video bg-black/60">
        <video src={item.src} controls preload="metadata" className="w-full h-full" />
        <div className="absolute top-2 left-2 pointer-events-none"><ItemBadge existing={item.existing} /></div>
        <CardActions item={item} onEdit={onEdit} onDelete={onDelete} className="absolute top-2 right-2" />
      </div>
      <div className="p-3 flex-1 flex flex-col gap-1">
        <h4 className="text-sm font-semibold text-white leading-tight">{item.title}</h4>
        {item.description && <p className="text-xs text-white/60 leading-relaxed line-clamp-2">{item.description}</p>}
        <div className="mt-auto pt-2 flex items-center justify-between text-[10px] text-white/40">
          <span>{item.category}</span>
          {item.format && <span className="font-mono">{item.format}</span>}
        </div>
      </div>
    </div>
  );
}

function FileRow({
  item,
  onEdit,
  onDelete,
}: {
  item: PanelItem;
  onEdit?: (item: PanelItem) => void;
  onDelete?: (item: PanelItem) => void;
}) {
  return (
    <div className="group rounded-lg bg-white/[0.04] border border-white/10 p-3 flex items-start gap-3 hover:bg-white/[0.06] transition">
      <div className="h-10 w-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
        <FileText className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <h4 className="text-sm font-semibold text-white leading-tight">{item.title}</h4>
          <ItemBadge existing={item.existing} />
          {item.format && (
            <span className="text-[10px] font-mono text-white/50 bg-black/30 rounded px-1.5 py-0.5">
              {item.format}
            </span>
          )}
        </div>
        {item.description && <p className="text-xs text-white/60 leading-relaxed mt-1 line-clamp-2">{item.description}</p>}
        <div className="mt-1.5 flex items-center gap-3 text-[10px] text-white/40">
          <span>{item.category}</span>
          {item.size != null && <span>{(item.size / 1024).toFixed(1)} KB</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <a
          href={item.src}
          target="_blank"
          rel="noreferrer"
          className="h-8 w-8 rounded-md bg-white/[0.04] border border-white/10 hover:bg-white/[0.10] text-white/70 flex items-center justify-center"
          aria-label="Abrir archivo"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        {onEdit && (
          <button
            onClick={() => onEdit(item)}
            aria-label="Editar"
            className="h-8 w-8 rounded-md bg-white/[0.04] border border-white/10 hover:bg-accent hover:border-accent hover:text-accent-foreground text-white/70 flex items-center justify-center"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(item)}
            aria-label="Eliminar"
            className="h-8 w-8 rounded-md bg-white/[0.04] border border-white/10 hover:bg-destructive hover:border-destructive text-white/70 hover:text-white flex items-center justify-center"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── Edit dialog ─────────────────────────── */

function EditDialog({
  item,
  open,
  onClose,
  onSaved,
  onSave,
}: {
  item: PanelItem | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  onSave?: (item: PanelItem, patch: { title: string; description: string; category: string }) => Promise<void>;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setDescription(item.description ?? "");
      const cats = categoriesFor(item.kind);
      // Keep existing category if valid; otherwise default to first option
      const validCat = cats.includes(item.category) ? item.category : cats[0];
      setCategory(validCat);
    }
  }, [item]);

  if (!item) return null;
  const cats = categoriesFor(item.kind);

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Falta el nombre", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const patch = { title: title.trim(), description: description.trim(), category };
      if (onSave) await onSave(item, patch);
      toast({ title: "Cambios guardados", description: `Categoría: ${category}` });
      onSaved();
      onClose();
    } catch (err) {
      toast({
        title: "No se pudo guardar",
        description: err instanceof Error ? err.message : "Error desconocido.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[hsl(205,35%,12%)] border-white/10 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Pencil className="h-4 w-4 text-accent" />
            Editar elemento
          </DialogTitle>
          <DialogDescription className="text-white/50 text-xs">
            Los cambios se guardan en el servidor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-title" className="text-xs text-white/60">Nombre</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white/[0.04] border-white/10 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-cat" className="text-xs text-white/60">Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="edit-cat" className="bg-white/[0.04] border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[hsl(205,35%,12%)] border-white/10 text-white">
                {cats.map((c) => (
                  <SelectItem key={c} value={c} className="focus:bg-white/[0.08] focus:text-white">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-desc" className="text-xs text-white/60">Descripción</Label>
            <Textarea
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-white/[0.04] border-white/10 text-white min-h-[90px] text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving} className="text-white/60 hover:text-white hover:bg-white/[0.08]">
            Cancelar
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Guardando…</> : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────── Section ─────────────────────────── */

function ContentSection({
  kind,
  accept,
  layout,
  emptyIcon: EmptyIcon,
  emptyLabel,
}: {
  kind: PanelKind;
  accept: string;
  layout: "image-grid" | "video-grid" | "file-list";
  emptyIcon: typeof ImageIcon;
  emptyLabel: string;
}) {
  const cats = categoriesFor(kind);
  const [items, setItems] = useState<PanelItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("Todas");
  const [query, setQuery] = useState("");
  const sortKey = `panel-emma::sort-${kind}`;
  const [sort, setSort] = useState<"newest" | "oldest">(() => {
    if (typeof window === "undefined") return "newest";
    const saved = localStorage.getItem(sortKey);
    return saved === "oldest" ? "oldest" : "newest";
  });
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(sortKey, sort);
  }, [sort, sortKey]);
  const [editing, setEditing] = useState<PanelItem | null>(null);
  const { toast } = useToast();

  const refresh = useCallback(async () => {
    setLoadingItems(true);
    setLoadError(null);
    try {
      const { items: records } = await listServerUploads(kind as "image" | "video" | "document");
      setItems(records.map(recordToPanelItem));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido al cargar archivos.";
      setLoadError(msg);
      toast({ title: "Error al cargar", description: msg, variant: "destructive" });
    } finally {
      setLoadingItems(false);
    }
  }, [kind, toast]);

  useEffect(() => { void refresh(); }, [refresh]);

  const handleDelete = useCallback(async (it: PanelItem) => {
    try {
      await deleteServerUpload(Number(it.id));
      void refresh();
    } catch (err) {
      toast({
        title: "No se pudo eliminar",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    }
  }, [refresh, toast]);

  const handleSaveEdit = useCallback(async (
    it: PanelItem,
    patch: { title: string; description: string; category: string },
  ) => {
    await patchServerUpload(Number(it.id), patch);
    void refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const base = items.filter((it) => {
      if (filter !== "Todas" && it.category !== filter) return false;
      if (query && !`${it.title} ${it.description}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
    const rankFor = (it: PanelItem) =>
      it.addedAt ? new Date(it.addedAt).getTime() : 0;
    return [...base].sort((a, b) =>
      sort === "newest" ? rankFor(b) - rankFor(a) : rankFor(a) - rankFor(b),
    );
  }, [items, filter, query, sort]);

  return (
    <div className="space-y-5">
      <UploadForm kind={kind} accept={accept} onAdded={refresh} />

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">
              {kind === "image" ? "Imágenes subidas" : kind === "video" ? "Videos subidos" : "Archivos subidos"}
            </h3>
            <p className="text-[11px] text-white/40 mt-0.5">
              {loadingItems ? "Cargando…" : `${items.length} archivos en el servidor`}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar…"
                className="bg-white/[0.04] border-white/10 text-white pl-8 h-9 w-full sm:w-48"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="bg-white/[0.04] border-white/10 text-white h-9 w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[hsl(205,35%,12%)] border-white/10 text-white">
                <SelectItem value="Todas" className="focus:bg-white/[0.08] focus:text-white">Todas las categorías</SelectItem>
                <SelectItem value="Sin categoría" className="focus:bg-white/[0.08] focus:text-white">Sin categoría</SelectItem>
                {cats.map((c) => (
                  <SelectItem key={c} value={c} className="focus:bg-white/[0.08] focus:text-white">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as "newest" | "oldest")}>
              <SelectTrigger className="bg-white/[0.04] border-white/10 text-white h-9 w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[hsl(205,35%,12%)] border-white/10 text-white">
                <SelectItem value="newest" className="focus:bg-white/[0.08] focus:text-white">
                  <span className="inline-flex items-center gap-2">
                    <ArrowDownWideNarrow className="h-3.5 w-3.5" /> Más nuevos primero
                  </span>
                </SelectItem>
                <SelectItem value="oldest" className="focus:bg-white/[0.08] focus:text-white">
                  <span className="inline-flex items-center gap-2">
                    <ArrowUpWideNarrow className="h-3.5 w-3.5" /> Más antiguos primero
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loadError ? (
          <div className="text-center py-10">
            <XCircle className="h-8 w-8 mx-auto mb-2 text-destructive opacity-70" />
            <p className="text-sm text-white/60 mb-3">{loadError}</p>
            <button
              onClick={() => void refresh()}
              className="text-xs text-accent underline hover:no-underline"
            >
              Reintentar
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-white/40 text-sm">
            {loadingItems ? (
              <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin opacity-50" />
            ) : (
              <EmptyIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            )}
            {loadingItems ? "Cargando archivos…" : emptyLabel}
          </div>
        ) : layout === "image-grid" ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 [column-fill:_balance]">
            {filtered.map((it) => (
              <ImageCard key={it.id} item={it} onEdit={setEditing} onDelete={handleDelete} />
            ))}
          </div>
        ) : layout === "video-grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((it) => (
              <VideoCard key={it.id} item={it} onEdit={setEditing} onDelete={handleDelete} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((it) => (
              <FileRow key={it.id} item={it} onEdit={setEditing} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      <EditDialog
        item={editing}
        open={editing !== null}
        onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); void refresh(); }}
        onSave={handleSaveEdit}
      />
    </div>
  );
}

/* ─────────────────────────── Page ─────────────────────────── */

const IMAGE_ACCEPT = "image/*,.heic,.heif,.tiff,.tif";
const VIDEO_ACCEPT = "video/*,.mkv,.avi,.mov,.m4v,.3gp,.wmv,.flv";
// Empty = no restriction on the file picker, accepts all
const FILE_ACCEPT = "";

export default function PanelEmmaDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isLoading, isAuthenticated, role } = useAuth(false);

  const handleLogout = useCallback(async () => {
    try { await logout(); } catch { /* ignore */ }
    queryClient.clear();
    navigate("/panel-emma", { replace: true });
  }, [navigate, queryClient]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(205,35%,8%)] flex items-center justify-center gap-3">
        <Leaf className="h-8 w-8 text-accent animate-pulse" />
        <Loader2 className="h-5 w-5 text-white/40 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || role !== "admin") {
    return <Navigate to="/panel-emma" replace />;
  }

  return (
    <div className="min-h-screen bg-[hsl(205,35%,6%)]">
      <PanelHeader
        userName={user?.name ?? user?.email}
        onLogout={handleLogout}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="rounded-xl border border-accent/20 bg-accent/[0.04] p-4">
          <div className="flex gap-3">
            <ShieldCheck className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div className="text-sm text-white/70 leading-relaxed">
              <p className="font-semibold text-white mb-1">Consola de gestión de contenido</p>
              <p className="text-xs">
                Sube imágenes, videos y archivos. Todo el contenido se guarda en el servidor
                y queda disponible de inmediato.
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="images" className="w-full">
          <TabsList className="bg-white/[0.04] border border-white/10 grid grid-cols-3 w-full h-auto p-1">
            <TabsTrigger value="images" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-white/60 gap-1.5 py-2">
              <ImageIcon className="h-4 w-4" /> Imágenes
            </TabsTrigger>
            <TabsTrigger value="videos" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-white/60 gap-1.5 py-2">
              <Video className="h-4 w-4" /> Videos
            </TabsTrigger>
            <TabsTrigger value="files" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-white/60 gap-1.5 py-2">
              <FolderOpen className="h-4 w-4" /> Archivos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="images" className="mt-5">
            <ContentSection
              kind="image"
              accept={IMAGE_ACCEPT}
              layout="image-grid"
              emptyIcon={ImageIcon}
              emptyLabel="No hay imágenes subidas todavía."
            />
          </TabsContent>

          <TabsContent value="videos" className="mt-5">
            <ContentSection
              kind="video"
              accept={VIDEO_ACCEPT}
              layout="video-grid"
              emptyIcon={Video}
              emptyLabel="No hay videos subidos todavía."
            />
          </TabsContent>

          <TabsContent value="files" className="mt-5">
            <div className="mb-4 rounded-lg border border-teal-500/25 bg-teal-500/[0.06] p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Leaf className="h-4 w-4 text-teal-400 shrink-0" />
                <p className="text-xs text-teal-100/80 leading-relaxed">
                  Los PDFs subidos aquí aparecen automáticamente en la Biblioteca de Archivos pública.
                </p>
              </div>
              <a
                href="/archivos"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-teal-300 hover:text-teal-200 border border-teal-500/25 rounded-lg px-2.5 py-1 bg-teal-500/[0.08] hover:bg-teal-500/[0.14] transition-colors"
              >
                Ver biblioteca
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <ContentSection
              kind="document"
              accept={FILE_ACCEPT}
              layout="file-list"
              emptyIcon={FolderOpen}
              emptyLabel="No hay archivos subidos todavía."
            />
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-center gap-2 text-[11px] text-white/30 pt-2">
          <Lock className="h-3 w-3" />
          <span>Acceso restringido · super-admin</span>
        </div>
      </main>
    </div>
  );
}
