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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GrafanaTour } from "./GrafanaTour";

interface GrafanaPanel {
  id: string;
  title: string;
  url: string;
}

const STORAGE_KEY = "mango-grafana-panels";
const BASE_URL_KEY = "mango-grafana-base-url";

function loadPanels(): GrafanaPanel[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePanels(panels: GrafanaPanel[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(panels));
}

function loadBaseUrl(): string {
  return localStorage.getItem(BASE_URL_KEY) || "";
}

function saveBaseUrl(url: string) {
  localStorage.setItem(BASE_URL_KEY, url);
}

export function GrafanaSection() {
  const [panels, setPanels] = useState<GrafanaPanel[]>(loadPanels);
  const [baseUrl, setBaseUrl] = useState(loadBaseUrl);
  const [showConfig, setShowConfig] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const handleSaveBase = () => {
    saveBaseUrl(baseUrl);
    setShowConfig(false);
  };

  const handleAddPanel = () => {
    if (!newTitle.trim() || !newUrl.trim()) return;
    const panel: GrafanaPanel = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      url: newUrl.trim(),
    };
    const updated = [...panels, panel];
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
      {/* Interactive Tour */}
      <GrafanaTour />

      {/* Config toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowConfig(!showConfig)}
          className="text-muted-foreground hover:text-secondary-foreground gap-1.5"
        >
          <Settings2 className="h-4 w-4" />
          Configuración
          {showConfig ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
      </div>

      {/* Config section */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="bg-mango-slate border-border/20 text-secondary-foreground">
              <CardContent className="p-5 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    URL base de Grafana
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="https://your-grafana.example.com"
                      className="bg-mango-deep/60 border-border/30 text-secondary-foreground placeholder:text-muted-foreground/50 text-sm"
                    />
                    <Button size="sm" onClick={handleSaveBase} disabled={!baseUrl.trim()}>
                      Guardar
                    </Button>
                  </div>
                </div>

                <div className="border-t border-border/20 pt-4 space-y-3">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Añadir panel embebido
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-2">
                    <Input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Título del panel"
                      className="bg-mango-deep/60 border-border/30 text-secondary-foreground placeholder:text-muted-foreground/50 text-sm"
                    />
                    <Input
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="URL del iframe (ej: .../d-solo/abc123/...)"
                      className="bg-mango-deep/60 border-border/30 text-secondary-foreground placeholder:text-muted-foreground/50 text-sm"
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
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panels grid */}
      {panels.length === 0 ? (
        <Card className="bg-mango-slate border-border/20 text-secondary-foreground">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="p-4 rounded-2xl bg-mango-deep/40">
              <BarChart3 className="h-10 w-10 text-muted-foreground opacity-30" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm text-muted-foreground">No hay paneles de Grafana configurados</p>
              <p className="text-xs text-muted-foreground/60">
                Complete el tour de configuración y añada paneles embebidos de su instancia de Grafana.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {panels.map((panel) => (
            <Card key={panel.id} className="bg-mango-slate border-border/20 text-secondary-foreground overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <h3 className="text-sm font-semibold truncate">{panel.title}</h3>
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={panel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md text-muted-foreground hover:text-secondary-foreground hover:bg-mango-deep/50 transition-colors"
                    title="Abrir en Grafana"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <button
                    onClick={() => handleRemovePanel(panel.id)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Eliminar panel"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <CardContent className="px-4 pb-4 pt-0">
                <div className="relative w-full rounded-lg overflow-hidden bg-mango-deep/30" style={{ height: 350 }}>
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
