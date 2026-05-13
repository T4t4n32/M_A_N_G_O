import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CloudUpload, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { getPublishMeta, publishSiteContent, hydrateFromBackend } from "@/lib/siteContent";
import { useToast } from "@/hooks/use-toast";
import { handleApiError } from "@/lib/errorHandler";

function relative(t: number) {
  const diff = Date.now() - t;
  const m = Math.round(diff / 60000);
  if (m < 1) return "hace instantes";
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  return new Date(t).toLocaleDateString();
}

export function PublishBar() {
  const { toast } = useToast();
  const [meta, setMeta] = useState(getPublishMeta());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const refresh = () => setMeta(getPublishMeta());
    window.addEventListener("panel-emma::site-content-changed", refresh);
    return () => window.removeEventListener("panel-emma::site-content-changed", refresh);
  }, []);

  const onPublish = async () => {
    setBusy(true);
    try {
      const r = await publishSiteContent();
      setMeta(getPublishMeta());
      toast({
        title: r.ok ? "Publicado" : "No se pudo publicar",
        description: r.message,
        variant: r.ok ? undefined : "destructive",
      });
    } catch (err) {
      // Captura cualquier excepción no contemplada (red caída, etc.)
      handleApiError(err, { context: "publish-site-content" });
    } finally {
      setBusy(false);
    }
  };

  const onPull = async () => {
    setBusy(true);
    try {
      const ok = await hydrateFromBackend();
      toast({
        title: ok ? "Sincronizado" : "Sin cambios remotos",
        description: ok
          ? "Se cargaron los textos del backend."
          : "El backend no respondió. Se mantienen los textos locales.",
      });
    } catch (err) {
      handleApiError(err, { context: "hydrate-site-content" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-accent/30 bg-accent/[0.06] p-3 flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {meta.lastError ? (
          <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
        ) : meta.lastPublishedAt ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
        ) : (
          <CloudUpload className="h-4 w-4 text-accent shrink-0" />
        )}
        <div className="text-xs text-white/80 leading-tight min-w-0">
          <p className="font-semibold text-white">
            {meta.lastError
              ? "Cambios sin publicar (último intento falló)"
              : meta.lastPublishedAt
              ? `Publicado ${relative(meta.lastPublishedAt)}`
              : "Cambios solo locales — pulsa Publicar"}
          </p>
          <p className="text-[11px] text-white/50 truncate">
            {meta.lastError ?? "PUT /api/v1/admin/site-content"}
          </p>
        </div>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={onPull} disabled={busy}
        className="h-8 text-xs text-white/70 hover:text-white hover:bg-white/[0.08]">
        Recargar del backend
      </Button>
      <Button type="button" size="sm" onClick={onPublish} disabled={busy}
        className="h-8 text-xs bg-accent hover:bg-accent/90 text-accent-foreground">
        {busy ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <CloudUpload className="h-3 w-3 mr-1.5" />}
        Publicar cambios
      </Button>
    </div>
  );
}