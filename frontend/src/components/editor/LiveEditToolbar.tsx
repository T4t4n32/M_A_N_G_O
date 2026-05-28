import { useState, useEffect, useRef } from "react";
import { Pencil, X, Upload, CheckCircle2, Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLiveEdit } from "@/contexts/LiveEditContext";
import {
  getValue,
  setValue,
  publishSiteContent,
} from "@/lib/siteContent";
import { useToast } from "@/hooks/use-toast";

/* ─── Inline edit popover ─────────────────────────────────────────── */

function EditPopover() {
  const { editTarget, closeEdit } = useLiveEdit();
  const { toast } = useToast();
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editTarget) {
      setDraft(getValue(editTarget.siteKey, ""));
      setTimeout(() => (inputRef.current as HTMLElement | null)?.focus(), 50);
    }
  }, [editTarget]);

  if (!editTarget) return null;

  const save = () => {
    setValue(editTarget.siteKey, draft);
    toast({ title: "Guardado", description: editTarget.label });
    closeEdit();
  };

  const isTextarea = editTarget.type === "textarea";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-[1px]"
        onClick={closeEdit}
      />

      {/* Popover card */}
      <div
        className="fixed z-[9999] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-xl border border-orange-400/40 bg-[hsl(205,35%,10%)] shadow-2xl shadow-black/60 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3 gap-2">
          <div>
            <p className="text-xs text-orange-400 font-mono uppercase tracking-wider">Editando campo</p>
            <p className="text-sm font-semibold text-white mt-0.5">{editTarget.label}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white/40 hover:text-white shrink-0"
            onClick={closeEdit}
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {editTarget.type === "image" || editTarget.type === "media" ? (
          <div className="space-y-3">
            <p className="text-xs text-white/60">URL de la imagen / video (o sube desde el Panel Emma):</p>
            <Input
              ref={inputRef as React.Ref<HTMLInputElement>}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="https://... o /uploads/media/..."
              className="bg-white/[0.05] border-white/10 text-white"
              onKeyDown={(e) => e.key === "Enter" && save()}
            />
          </div>
        ) : isTextarea ? (
          <Textarea
            ref={inputRef as React.Ref<HTMLTextAreaElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            className="bg-white/[0.05] border-white/10 text-white resize-none"
          />
        ) : (
          <Input
            ref={inputRef as React.Ref<HTMLInputElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="bg-white/[0.05] border-white/10 text-white"
            onKeyDown={(e) => e.key === "Enter" && save()}
          />
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={closeEdit}
            className="text-white/50 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={save}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            Guardar
          </Button>
        </div>
      </div>
    </>
  );
}

/* ─── Floating toolbar ────────────────────────────────────────────── */

export function LiveEditToolbar() {
  const { isEditMode, deactivateLiveEdit } = useLiveEdit();
  const { toast } = useToast();
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const result = await publishSiteContent();
      if (result.ok) {
        toast({ title: "Publicado", description: "Cambios en vivo en el sitio." });
      } else {
        toast({ title: "Error al publicar", description: result.message, variant: "destructive" });
      }
    } finally {
      setPublishing(false);
    }
  };

  if (!isEditMode) return null;

  return (
    <>
      {/* Fixed top bar */}
      <div className="fixed top-0 left-0 right-0 z-[9990] flex items-center justify-between gap-3 bg-orange-600 px-4 py-2 shadow-lg">
        <div className="flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-white" aria-hidden />
          <span className="text-sm font-bold text-white tracking-wide">MODO EDICIÓN EN VIVO</span>
          <span className="text-xs text-orange-200 hidden sm:inline">
            · Haz click en cualquier texto o imagen para editarlo
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={publishing}
            className="bg-white/20 hover:bg-white/30 text-white border border-white/30 h-7 text-xs"
          >
            {publishing ? (
              <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Publicando…</>
            ) : (
              <><Upload className="h-3 w-3 mr-1" />Publicar</>
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={deactivateLiveEdit}
            className="text-white/80 hover:text-white hover:bg-white/10 h-7 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Salir
          </Button>
        </div>
      </div>

      {/* Top offset so page content isn't hidden under bar */}
      <div className="h-10" aria-hidden />

      <EditPopover />
    </>
  );
}
