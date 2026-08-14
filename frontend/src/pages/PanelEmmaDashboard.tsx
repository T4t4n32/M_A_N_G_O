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
  SelectGroup,
  SelectLabel,
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
  LayoutGrid,
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
import { PanelItem, PanelKind, categoriesFor, categoryLabel, MEDIA_SECTIONS, autoRoute } from "@/lib/panelEmmaContent";
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

/* ─────────────────────── Category <Select> options ─────────────── */

/** Documents keep a flat category list; images/videos are grouped by real site section. */
function CategorySelectItems({ kind }: { kind: PanelKind }) {
  if (kind === "document") {
    return (
      <>
        {categoriesFor(kind).map((c) => (
          <SelectItem key={c} value={c} className="focus:bg-white/[0.08] focus:text-white">
            {c}
          </SelectItem>
        ))}
      </>
    );
  }
  return (
    <>
      {MEDIA_SECTIONS.map((section) => (
        <SelectGroup key={section.group}>
          <SelectLabel className="text-white/40">{section.group}</SelectLabel>
          {section.categories.map((c) => (
            <SelectItem key={c.id} value={c.id} className="focus:bg-white/[0.08] focus:text-white">
              {c.label}
            </SelectItem>
          ))}
        </SelectGroup>
      ))}
    </>
  );
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

const PAGE_SIZE = 48;

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
              <CategorySelectItems kind={kind} />
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
          <span>{categoryLabel(item.category)}</span>
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
          <span>{categoryLabel(item.category)}</span>
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
          <span>{categoryLabel(item.category)}</span>
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
                <CategorySelectItems kind={item.kind} />
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
  const [items, setItems] = useState<PanelItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
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
    setCurrentPage(1);
    try {
      const { items: records, total, pages = 1 } = await listServerUploads(
        kind as "image" | "video" | "document",
        1,
        PAGE_SIZE,
      );
      setItems(records.map(recordToPanelItem));
      setTotalCount(total);
      setTotalPages(pages);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido al cargar archivos.";
      setLoadError(msg);
      toast({ title: "Error al cargar", description: msg, variant: "destructive" });
    } finally {
      setLoadingItems(false);
    }
  }, [kind, toast]);

  const loadMore = useCallback(async () => {
    const nextPage = currentPage + 1;
    setLoadingMore(true);
    try {
      const { items: records, pages = 1 } = await listServerUploads(
        kind as "image" | "video" | "document",
        nextPage,
        PAGE_SIZE,
      );
      setItems((prev) => [...prev, ...records.map(recordToPanelItem)]);
      setCurrentPage(nextPage);
      setTotalPages(pages);
    } catch (err) {
      toast({
        title: "Error al cargar más",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setLoadingMore(false);
    }
  }, [currentPage, kind, toast]);

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
              {loadingItems ? "Cargando…" : `${items.length} cargados · ${totalCount} en servidor`}
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
                <CategorySelectItems kind={kind} />
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

        {/* Load more */}
        {!loadingItems && currentPage < totalPages && (
          <div className="flex justify-center pt-4">
            <button
              onClick={() => void loadMore()}
              disabled={loadingMore}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/[0.06] border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/[0.10] disabled:opacity-50 transition-all"
            >
              {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
              {loadingMore ? "Cargando…" : `Cargar más (${totalCount - items.length} restantes)`}
            </button>
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

/* ─────────────────────── Sections browser (review workflow) ─────────────────────── */

/**
 * Lets the operator go through the site section by section — exactly the
 * "photo by photo, video by video" review workflow: pick a section (mirrors
 * the real site structure), see every image/video already published there,
 * and keep/edit/delete each one or upload new ones straight into it.
 */
function SectionUploadForm({ category, onAdded }: { category: string; onAdded: () => void }) {
  const { toast } = useToast();
  type Status = "queued" | "processing" | "ok" | "error";
  type PendingItem = { file: File; title: string; kind: PanelKind; status: Status; progress: number; error?: string };
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const accepted: PendingItem[] = Array.from(files)
      .map((f) => {
        const route = autoRoute(f);
        if (route.kind === "document") return null; // sections only take images/videos
        return { file: f, title: f.name.replace(/\.[^.]+$/, ""), kind: route.kind, status: "queued" as Status, progress: 0 };
      })
      .filter((x): x is PendingItem => x !== null);
    const rejected = files.length - accepted.length;
    if (rejected > 0) {
      toast({
        title: `${rejected} archivo${rejected > 1 ? "s" : ""} descartado${rejected > 1 ? "s" : ""}`,
        description: "Esta sección solo admite imágenes y videos.",
        variant: "destructive",
      });
    }
    if (accepted.length) setPending((prev) => [...prev, ...accepted]);
  }, [toast]);

  const reset = () => {
    setPending([]);
    setDescription("");
    const input = document.getElementById(`section-file-input-${category}`) as HTMLInputElement | null;
    if (input) input.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const queue = pending.filter((p) => p.status !== "ok");
    if (queue.length === 0) {
      toast({ title: "Faltan archivos", description: "Selecciona o arrastra al menos un archivo.", variant: "destructive" });
      return;
    }
    setBusy(true);
    let ok = 0;
    let failed = 0;
    try {
      for (let i = 0; i < pending.length; i++) {
        const p = pending[i];
        if (p.status === "ok") continue;
        setPending((prev) => prev.map((x, j) => (j === i ? { ...x, status: "processing", progress: 0, error: undefined } : x)));
        try {
          await uploadFile(
            p.file,
            { kind: p.kind, title: p.title.trim() || p.file.name, category, description: description.trim() },
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
      if (ok > 0) toast({ title: ok === 1 ? "Archivo subido" : `${ok} archivos subidos`, description: `Sección: ${categoryLabel(category)}.${failed ? ` ${failed} fallidos.` : ""}` });
      if (failed > 0) toast({ title: "Algunos archivos no se pudieron subir", description: "Revisa los archivos en rojo e intenta de nuevo.", variant: "destructive" });
      setPending((prev) => prev.filter((x) => x.status === "error"));
      onAdded();
    } finally {
      setBusy(false);
    }
  };

  const openPicker = () => (document.getElementById(`section-file-input-${category}`) as HTMLInputElement | null)?.click();
  const statusLabel: Record<Status, string> = { queued: "En cola", processing: "Procesando", ok: "Listo", error: "Error" };

  return (
    <form
      onSubmit={handleSubmit}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={(e) => { if (e.currentTarget.contains(e.relatedTarget as Node)) return; setDragOver(false); }}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer?.files ?? null); }}
      className={`rounded-xl border bg-white/[0.03] p-5 space-y-4 transition-colors ${dragOver ? "border-accent bg-accent/[0.06] ring-2 ring-accent/40" : "border-white/10"}`}
    >
      <div className="flex items-center gap-2 text-white/80">
        <Sparkles className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold">Añadir a "{categoryLabel(category)}"</h3>
      </div>
      <div
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPicker(); } }}
        className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${dragOver ? "border-accent bg-accent/10 text-accent" : "border-white/15 bg-white/[0.02] text-white/60 hover:border-accent/50 hover:text-white"}`}
      >
        <Upload className="h-5 w-5" />
        <span className="text-xs text-center">
          <span className="font-semibold">Haz clic</span> para elegir, o arrastra fotos/videos aquí
        </span>
      </div>
      <Input id={`section-file-input-${category}`} type="file" accept={`${IMAGE_ACCEPT},${VIDEO_ACCEPT}`} multiple onChange={(e) => handleFiles(e.target.files)} className="hidden" aria-hidden="true" tabIndex={-1} />
      {pending.length > 0 && (
        <ul className="space-y-1.5 rounded-md border border-white/10 bg-black/20 p-2">
          {pending.map((p, idx) => {
            const statusColor = p.status === "ok" ? "text-emerald-300" : p.status === "error" ? "text-destructive" : p.status === "processing" ? "text-accent" : "text-white/40";
            return (
              <li key={`${p.file.name}-${idx}`} className="rounded-md p-2">
                <div className="flex items-center gap-2">
                  {p.kind === "video" ? <Video className="h-3.5 w-3.5 text-white/40 shrink-0" /> : <ImageIcon className="h-3.5 w-3.5 text-white/40 shrink-0" />}
                  <Input
                    value={p.title}
                    onChange={(e) => { const v = e.target.value; setPending((prev) => prev.map((x, i) => (i === idx ? { ...x, title: v } : x))); }}
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
                  <button type="button" onClick={() => setPending((prev) => prev.filter((_, i) => i !== idx))} disabled={busy && p.status === "processing"} aria-label={`Quitar ${p.file.name}`} className="h-7 w-7 rounded-md text-white/50 hover:text-white hover:bg-white/[0.08] flex items-center justify-center disabled:opacity-30">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {(p.status === "processing" || p.status === "ok" || p.status === "error") && (
                  <div className="mt-1.5 pl-6 pr-1">
                    <Progress value={p.status === "ok" ? 100 : p.status === "error" ? 100 : p.progress} className={`h-1 ${p.status === "error" ? "[&>div]:bg-destructive" : p.status === "ok" ? "[&>div]:bg-emerald-500" : "[&>div]:bg-accent"}`} />
                    {p.status === "error" && p.error && <p className="mt-1 text-[10px] text-destructive">{p.error}</p>}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <div className="space-y-2">
        <Label htmlFor={`section-desc-${category}`} className="text-xs text-white/60">Descripción <span className="text-white/30">(aplica a todos)</span></Label>
        <Textarea id={`section-desc-${category}`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción opcional." className="bg-white/[0.04] border-white/10 text-white min-h-[60px] text-sm" />
      </div>
      <div className="flex items-center justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={reset} disabled={busy} className="text-white/60 hover:text-white hover:bg-white/[0.08]">Limpiar</Button>
        <Button type="submit" disabled={busy || pending.filter((p) => p.status !== "ok").length === 0} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
          {busy ? "Subiendo…" : (() => { const n = pending.filter((p) => p.status !== "ok").length; return n > 1 ? `Subir ${n} archivos` : "Subir archivo"; })()}
        </Button>
      </div>
    </form>
  );
}

function SectionsBrowser() {
  const { toast } = useToast();
  const flatCategories = MEDIA_SECTIONS.flatMap((s) => s.categories);
  const [activeCategory, setActiveCategory] = useState<string>(flatCategories[0].id);
  const [items, setItems] = useState<PanelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PanelItem | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { items: records } = await listServerUploads(undefined, 1, 200, activeCategory);
      setItems(records.map(recordToPanelItem));
    } catch (err) {
      toast({ title: "Error al cargar", description: err instanceof Error ? err.message : "Error desconocido", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [activeCategory, toast]);

  useEffect(() => { void refresh(); }, [refresh]);

  const handleDelete = useCallback(async (it: PanelItem) => {
    try {
      await deleteServerUpload(Number(it.id));
      void refresh();
    } catch (err) {
      toast({ title: "No se pudo eliminar", description: err instanceof Error ? err.message : "Error desconocido", variant: "destructive" });
    }
  }, [refresh, toast]);

  const handleSaveEdit = useCallback(async (it: PanelItem, patch: { title: string; description: string; category: string }) => {
    await patchServerUpload(Number(it.id), patch);
    void refresh();
  }, [refresh]);

  return (
    <div className="grid md:grid-cols-[220px_1fr] gap-5">
      {/* Section picker */}
      <nav className="space-y-4">
        {MEDIA_SECTIONS.map((section) => (
          <div key={section.group}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30 mb-1.5 px-1">{section.group}</p>
            <div className="space-y-1">
              {section.categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCategory(c.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    activeCategory === c.id
                      ? "bg-accent text-accent-foreground"
                      : "text-white/60 hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Selected section content */}
      <div className="space-y-5 min-w-0">
        <SectionUploadForm category={activeCategory} onAdded={refresh} />

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">{categoryLabel(activeCategory)}</h3>
            <p className="text-[11px] text-white/40">{loading ? "Cargando…" : `${items.length} elemento${items.length !== 1 ? "s" : ""}`}</p>
          </div>

          {loading ? (
            <div className="text-center py-10"><Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin opacity-50 text-white/40" /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-10 text-white/40 text-sm">
              <LayoutGrid className="h-8 w-8 mx-auto mb-2 opacity-50" />
              Aún no hay fotos ni videos en esta sección.
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-3 [column-fill:_balance]">
              {items.map((it) => (
                <div key={it.id} className="mb-3 break-inside-avoid">
                  {it.kind === "video"
                    ? <VideoCard item={it} onEdit={setEditing} onDelete={handleDelete} />
                    : <ImageCard item={it} onEdit={setEditing} onDelete={handleDelete} />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <EditDialog item={editing} open={editing !== null} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void refresh(); }} onSave={handleSaveEdit} />
    </div>
  );
}

/* ─────────────────────── All-content library view ─────────────────────── */

function AllLibrarySection() {
  const { toast } = useToast();
  const [images, setImages] = useState<PanelItem[]>([]);
  const [videos, setVideos] = useState<PanelItem[]>([]);
  const [docs, setDocs] = useState<PanelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "video" | "document">("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<PanelItem | null>(null);

  const [totalImages, setTotalImages] = useState(0);
  const [totalVideos, setTotalVideos] = useState(0);
  const [totalDocs, setTotalDocs] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [imgRes, vidRes, docRes] = await Promise.all([
        listServerUploads("image",    1, PAGE_SIZE),
        listServerUploads("video",    1, 50),
        listServerUploads("document", 1, 100),
      ]);
      setImages(imgRes.items.map(recordToPanelItem));
      setVideos(vidRes.items.map(recordToPanelItem));
      setDocs(docRes.items.map(recordToPanelItem));
      setTotalImages(imgRes.total);
      setTotalVideos(vidRes.total);
      setTotalDocs(docRes.total);
    } catch (err) {
      toast({ title: "Error al cargar", description: err instanceof Error ? err.message : "Error desconocido", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void refresh(); }, [refresh]);

  const handleDelete = useCallback(async (it: PanelItem) => {
    try {
      await deleteServerUpload(Number(it.id));
      void refresh();
    } catch (err) {
      toast({ title: "No se pudo eliminar", description: err instanceof Error ? err.message : "Error desconocido", variant: "destructive" });
    }
  }, [refresh, toast]);

  const handleSaveEdit = useCallback(async (it: PanelItem, patch: { title: string; description: string; category: string }) => {
    await patchServerUpload(Number(it.id), patch);
    void refresh();
  }, [refresh]);

  const allItems = useMemo(() => {
    const combined = [...images, ...videos, ...docs];
    return combined.filter((it) => {
      if (typeFilter !== "all" && it.kind !== typeFilter) return false;
      if (query && !`${it.title} ${it.description} ${it.category}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [images, videos, docs, typeFilter, query]);

  const typeLabel: Record<string, string> = { image: "Imagen", video: "Video", document: "Archivo" };
  const typeColor: Record<string, string> = {
    image: "text-sky-300 border-sky-500/40 bg-sky-500/[0.08]",
    video: "text-purple-300 border-purple-500/40 bg-purple-500/[0.08]",
    document: "text-amber-300 border-amber-500/40 bg-amber-500/[0.08]",
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {([["image", totalImages, ImageIcon, "text-sky-300", "border-sky-500/20 bg-sky-500/[0.06]"],
           ["video", totalVideos, Video, "text-purple-300", "border-purple-500/20 bg-purple-500/[0.06]"],
           ["document", totalDocs, FileText, "text-amber-300", "border-amber-500/20 bg-amber-500/[0.06]"]] as const).map(([kind, count, Icon, textColor, bg]) => (
          <button
            key={kind}
            type="button"
            onClick={() => setTypeFilter(typeFilter === kind ? "all" : kind)}
            className={`rounded-xl border p-3 flex items-center gap-3 transition-all ${bg} ${typeFilter === kind ? "ring-2 ring-white/20" : "opacity-70 hover:opacity-100"}`}
          >
            <Icon className={`h-5 w-5 ${textColor} shrink-0`} />
            <div className="text-left">
              <p className={`text-lg font-bold ${textColor} leading-none`}>{loading ? "—" : count}</p>
              <p className="text-[11px] text-white/50 mt-0.5">{kind === "image" ? "Imágenes" : kind === "video" ? "Videos" : "Archivos"}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <p className="text-sm font-semibold text-white flex-1">
            {loading ? "Cargando…" : `${allItems.length} elemento${allItems.length !== 1 ? "s" : ""}`}
            {typeFilter !== "all" && <span className="ml-2 text-white/40 font-normal">· filtrado por {typeLabel[typeFilter]}</span>}
          </p>
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar…"
              className="bg-white/[0.04] border-white/10 text-white pl-8 h-9 w-full sm:w-52"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-white/30" />
            <p className="text-sm text-white/40">Cargando librería…</p>
          </div>
        ) : allItems.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            <LayoutGrid className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">{query || typeFilter !== "all" ? "Sin resultados para ese filtro." : "No hay contenido subido todavía."}</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 [column-fill:_balance]">
            {allItems.map((it) => {
              if (it.kind === "image") {
                return (
                  <div key={it.id} className="mb-3 break-inside-avoid">
                    <ImageCard item={it} onEdit={setEditing} onDelete={handleDelete} />
                  </div>
                );
              }
              if (it.kind === "video") {
                return (
                  <div key={it.id} className="mb-3 break-inside-avoid">
                    <VideoCard item={it} onEdit={setEditing} onDelete={handleDelete} />
                  </div>
                );
              }
              return (
                <div key={it.id} className="mb-3 break-inside-avoid">
                  <div className="group rounded-xl bg-white/[0.04] border border-white/10 p-3 flex items-start gap-3 hover:bg-white/[0.06] transition">
                    <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-white leading-tight truncate">{it.title}</h4>
                      {it.description && <p className="text-xs text-white/50 mt-0.5 line-clamp-2">{it.description}</p>}
                      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${typeColor[it.kind]}`}>{it.format ?? "FILE"}</span>
                        <span className="text-[10px] text-white/40">{categoryLabel(it.category)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <a href={it.src} target="_blank" rel="noreferrer" className="h-7 w-7 rounded-md bg-white/[0.04] border border-white/10 hover:bg-white/10 text-white/60 flex items-center justify-center" aria-label="Abrir">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button onClick={() => setEditing(it)} className="h-7 w-7 rounded-md bg-white/[0.04] border border-white/10 hover:bg-accent hover:border-accent hover:text-accent-foreground text-white/60 flex items-center justify-center" aria-label="Editar">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(it)} className="h-7 w-7 rounded-md bg-white/[0.04] border border-white/10 hover:bg-destructive hover:border-destructive text-white/60 hover:text-white flex items-center justify-center" aria-label="Eliminar">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
              <p className="font-semibold text-white mb-1">Librería de medios — M.A.N.G.O</p>
              <p className="text-xs">
                Sube cualquier contenido audiovisual: imágenes, videos, documentos, evidencias de campo.
                Todo queda almacenado en el servidor y visible en la pestaña <strong className="text-white/80">Todos</strong>.
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="sections" className="w-full">
          <TabsList className="bg-white/[0.04] border border-white/10 grid grid-cols-5 w-full h-auto p-1">
            <TabsTrigger value="sections" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-white/60 gap-1.5 py-2">
              <FolderOpen className="h-4 w-4" /> Secciones
            </TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-white/60 gap-1.5 py-2">
              <LayoutGrid className="h-4 w-4" /> Todos
            </TabsTrigger>
            <TabsTrigger value="images" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-white/60 gap-1.5 py-2">
              <ImageIcon className="h-4 w-4" /> Imágenes
            </TabsTrigger>
            <TabsTrigger value="videos" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-white/60 gap-1.5 py-2">
              <Video className="h-4 w-4" /> Videos
            </TabsTrigger>
            <TabsTrigger value="files" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-white/60 gap-1.5 py-2">
              <FileText className="h-4 w-4" /> Documentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sections" className="mt-5">
            <SectionsBrowser />
          </TabsContent>

          <TabsContent value="all" className="mt-5">
            <AllLibrarySection />
          </TabsContent>

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
            <div className="mb-4 rounded-xl border border-teal-500/25 bg-teal-500/[0.06] p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <Leaf className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-teal-200">
                      Sube documentos de cualquier tipo — hasta 500 MB por archivo
                    </p>
                    <p className="text-[11px] text-teal-100/60 leading-relaxed">
                      Los PDFs aparecen automáticamente en la sección pública. El resto (DOCX, XLSX, PPTX, etc.) queda disponible solo desde el panel autenticado.
                    </p>
                  </div>
                </div>
                <a
                  href="/archivos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-teal-300 hover:text-teal-200 border border-teal-500/25 rounded-lg px-2.5 py-1 bg-teal-500/[0.08] hover:bg-teal-500/[0.14] transition-colors"
                >
                  Ver pública
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              {/* Accepted format chips */}
              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-teal-500/15">
                {[
                  { label: "PDF", color: "text-red-300 border-red-500/30 bg-red-500/10" },
                  { label: "DOCX", color: "text-blue-300 border-blue-500/30 bg-blue-500/10" },
                  { label: "XLSX", color: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10" },
                  { label: "PPTX", color: "text-orange-300 border-orange-500/30 bg-orange-500/10" },
                  { label: "TXT", color: "text-slate-300 border-slate-500/30 bg-slate-500/10" },
                  { label: "MD", color: "text-purple-300 border-purple-500/30 bg-purple-500/10" },
                  { label: "ZIP", color: "text-yellow-300 border-yellow-500/30 bg-yellow-500/10" },
                  { label: "+ más", color: "text-white/40 border-white/15 bg-white/[0.04]" },
                ].map(({ label, color }) => (
                  <span
                    key={label}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${color}`}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <ContentSection
              kind="document"
              accept={FILE_ACCEPT}
              layout="file-list"
              emptyIcon={FolderOpen}
              emptyLabel="No hay documentos subidos todavía."
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
