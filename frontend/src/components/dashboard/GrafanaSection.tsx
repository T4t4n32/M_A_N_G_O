import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ExternalLink,
  Settings2,
  Plus,
  Trash2,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Local Grafana is always available at this path via nginx proxy.
// Users do not need to configure a base URL — it is fixed for this deployment.
const LOCAL_GRAFANA = "/grafana/";
const STORAGE_KEY   = "mango-grafana-panels";

interface GrafanaPanel {
  id: string;
  title: string;
  url: string;
}

function loadPanels(): GrafanaPanel[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GrafanaPanel[]) : [];
  } catch {
    return [];
  }
}

function savePanels(panels: GrafanaPanel[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(panels));
}

export function GrafanaSection() {
  const [panels, setPanels] = useState<GrafanaPanel[]>(loadPanels);
  const [showConfig, setShowConfig] = useState(false);
  const [newTitle, setNewTitle]     = useState("");
  const [newUrl, setNewUrl]         = useState("");

  const handleAddPanel = () => {
    if (!newTitle.trim() || !newUrl.trim()) return;
    const updated = [
      ...panels,
      { id: crypto.randomUUID(), title: newTitle.trim(), url: newUrl.trim() },
    ];
    setPanels(updated);
    savePanels(updated);
    setNewTitle("");
    setNewUrl("");
  };

  const handleRemovePanel = (id: string) => {
    const updated = panels.filter((p) => p.id !== id);
    setPanels(updated);
    savePanels(updated);
  };

  return (
    <div className="space-y-4">

      {/* ── Status bar: Grafana is live ────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-[hsl(168,72%,42%/0.2)] bg-[hsl(168,72%,42%/0.06)] px-4 py-3">
        <div className="flex items-center gap-2.5 flex-1">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(168,72%,42%)] opacity-60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[hsl(168,72%,42%)]" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[hsl(168,72%,60%)]">Grafana disponible</p>
            <p className="text-[11px] text-white/40">
              Instancia local activa en{" "}
              <code className="font-mono text-white/60">/grafana/</code>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            asChild
            size="sm"
            className="gap-1.5 bg-[hsl(168,72%,42%/0.15)] hover:bg-[hsl(168,72%,42%/0.25)] text-[hsl(168,72%,60%)] border border-[hsl(168,72%,42%/0.3)] text-xs"
            variant="outline"
          >
            <a href={LOCAL_GRAFANA} target="_blank" rel="noopener noreferrer">
              <Activity className="h-3.5 w-3.5" />
              Abrir Grafana
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowConfig((v) => !v)}
            className="text-white/40 hover:text-white/70 gap-1 text-xs"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Paneles embebidos
            {showConfig ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* ── Embed panel config (collapsible) ──────────────────────────── */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <Card className="bg-[hsl(205,35%,11%)] border-white/[0.08] text-white/80">
              <CardContent className="p-4 space-y-3">
                <p className="text-xs text-white/40 leading-relaxed">
                  Añade paneles embebidos copiando la URL de un panel de Grafana (
                  <span className="font-mono text-white/60">Share → Embed → src="…"</span>
                  ). La URL debe empezar por{" "}
                  <code className="font-mono text-[hsl(168,72%,55%)]">/grafana/d-solo/…</code>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-2">
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Nombre del panel"
                    className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/25 text-sm"
                  />
                  <Input
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="/grafana/d-solo/…"
                    className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/25 text-sm font-mono"
                  />
                  <Button
                    size="sm"
                    onClick={handleAddPanel}
                    disabled={!newTitle.trim() || !newUrl.trim()}
                    className="gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Añadir
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Embedded panels grid ──────────────────────────────────────── */}
      {panels.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] flex flex-col items-center justify-center py-12 gap-3">
          <BarChart3 className="h-8 w-8 text-white/15" />
          <p className="text-sm text-white/35">No hay paneles embebidos configurados</p>
          <p className="text-xs text-white/25">
            Abre Grafana, crea tus dashboards, y pega las URLs de embebido arriba.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {panels.map((panel) => (
            <Card
              key={panel.id}
              className="bg-[hsl(205,35%,11%)] border-white/[0.08] text-white/80 overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <h3 className="text-sm font-semibold truncate text-white/80">{panel.title}</h3>
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={panel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md text-white/35 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
                    title="Abrir en Grafana"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <button
                    onClick={() => handleRemovePanel(panel.id)}
                    className="p-1.5 rounded-md text-white/35 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Eliminar panel"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <CardContent className="px-4 pb-4 pt-0">
                <div
                  className="relative w-full rounded-lg overflow-hidden bg-black/20"
                  style={{ height: 350 }}
                >
                  <iframe
                    src={panel.url}
                    title={panel.title}
                    className="absolute inset-0 w-full h-full border-0"
                    loading="lazy"
                    sandbox="allow-scripts allow-same-origin allow-popups"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
