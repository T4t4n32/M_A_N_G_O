/**
 * GrafanaSection — embeds the live Grafana sensor dashboards.
 *
 * Backend requirements (already set in compose.vps.yml):
 *   GF_SECURITY_ALLOW_EMBEDDING=true   → removes X-Frame-Options: deny
 *   GF_AUTH_ANONYMOUS_ENABLED=true     → panels load without login
 *   GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer  → read-only anonymous access
 *
 * Nginx /grafana/ proxy strips Grafana's deny header and passes SAMEORIGIN,
 * which is satisfied because both the page and iframes are on integramosoe.com.
 */

import { useState } from "react";
import {
  ExternalLink, Activity, Settings2, Plus, Trash2,
  ChevronDown, ChevronUp, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

// ── Constants ────────────────────────────────────────────────────────────────

const DASHBOARD_UID  = "mango-sensors-v1";
const GRAFANA_BASE   = "/grafana";
const DASHBOARD_PATH = `${GRAFANA_BASE}/d/${DASHBOARD_UID}/`;
const CUSTOM_PANELS_KEY = "mango-grafana-custom-panels";

// Built-in sensor panels — provisioned from grafana/dashboards/mango_sensors.json
const BUILTIN_PANELS = [
  { id: 1, title: "pH",          color: "#c084fc" },
  { id: 2, title: "Temperatura", color: "#f97316" },
  { id: 3, title: "Turbidez",    color: "#38bdf8" },
] as const;

const TIME_RANGES = [
  { label: "7 d",  from: "now-7d"   },
  { label: "30 d", from: "now-30d"  },
  { label: "90 d", from: "now-90d"  },
  { label: "6 m",  from: "now-180d" },
] as const;

const REFRESH_OPTIONS = [
  { label: "Off",   value: "" },
  { label: "30 s",  value: "30s" },
  { label: "1 min", value: "1m" },
  { label: "5 min", value: "5m" },
] as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

function panelSrc(panelId: number, from: string, refresh: string) {
  const params = new URLSearchParams({
    panelId: String(panelId),
    orgId:   "1",
    theme:   "dark",
    from,
    to:      "now",
    ...(refresh ? { refresh } : {}),
  });
  return `${GRAFANA_BASE}/d-solo/${DASHBOARD_UID}/?${params}`;
}

// ── Custom panels (localStorage) ─────────────────────────────────────────────

interface CustomPanel { id: string; title: string; url: string }

function loadCustom(): CustomPanel[] {
  try { return JSON.parse(localStorage.getItem(CUSTOM_PANELS_KEY) ?? "[]"); }
  catch { return []; }
}
function saveCustom(p: CustomPanel[]) {
  localStorage.setItem(CUSTOM_PANELS_KEY, JSON.stringify(p));
}

// ── PanelFrame ───────────────────────────────────────────────────────────────

function PanelFrame({
  title, src, accentColor, onRemove,
}: {
  title: string;
  src: string;
  accentColor?: string;
  onRemove?: () => void;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] overflow-hidden bg-[hsl(205,40%,7%)] flex flex-col">
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]"
        style={{ borderLeftColor: accentColor, borderLeftWidth: accentColor ? 3 : 0 }}
      >
        <span className="text-xs font-semibold text-white/70 truncate">{title}</span>
        <div className="flex items-center gap-1 shrink-0">
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded text-white/30 hover:text-white/70 transition-colors"
            title="Abrir panel en Grafana"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="p-1 rounded text-white/30 hover:text-red-400 transition-colors"
              title="Eliminar panel"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      <div className="relative w-full" style={{ height: 260 }}>
        <iframe
          key={src}
          src={src}
          title={title}
          className="absolute inset-0 w-full h-full border-0"
          loading="lazy"
          allowFullScreen
        />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function GrafanaSection() {
  const [timeRange, setTimeRange]   = useState(TIME_RANGES[3]); // 6 m — shows seed data
  const [refresh,   setRefresh]     = useState(REFRESH_OPTIONS[0]);
  const [showAdd,   setShowAdd]     = useState(false);
  const [custom,    setCustom]      = useState<CustomPanel[]>(loadCustom);
  const [newTitle,  setNewTitle]    = useState("");
  const [newUrl,    setNewUrl]      = useState("");

  const handleAddCustom = () => {
    if (!newTitle.trim() || !newUrl.trim()) return;
    const updated = [...custom, { id: crypto.randomUUID(), title: newTitle.trim(), url: newUrl.trim() }];
    setCustom(updated);
    saveCustom(updated);
    setNewTitle("");
    setNewUrl("");
  };

  const handleRemoveCustom = (id: string) => {
    const updated = custom.filter((p) => p.id !== id);
    setCustom(updated);
    saveCustom(updated);
  };

  return (
    <div className="space-y-4">

      {/* ── Header bar ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[hsl(168,72%,42%/0.2)] bg-[hsl(168,72%,42%/0.05)] px-4 py-3">

        {/* Header label */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(168,72%,42%)]" />
          </span>
          <p className="text-xs font-semibold text-[hsl(168,72%,60%)] truncate">
            Grafana — M.A.N.G.O. Ocean Sensors
          </p>
        </div>

        {/* Time range buttons */}
        <div className="flex items-center gap-1" role="group" aria-label="Rango de tiempo">
          {TIME_RANGES.map((r) => (
            <button
              key={r.label}
              type="button"
              onClick={() => setTimeRange(r)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-all ${
                timeRange.from === r.from
                  ? "bg-[hsl(168,72%,42%/0.2)] text-[hsl(168,72%,60%)] border-[hsl(168,72%,42%/0.4)]"
                  : "text-white/40 border-white/10 hover:text-white/70 bg-transparent"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Refresh selector */}
        <div className="flex items-center gap-1" role="group" aria-label="Intervalo de refresco">
          <RefreshCw className="h-3 w-3 text-white/30" />
          {REFRESH_OPTIONS.map((r) => (
            <button
              key={r.label}
              type="button"
              onClick={() => setRefresh(r)}
              className={`px-2 py-1 rounded text-[11px] border transition-all ${
                refresh.value === r.value
                  ? "bg-white/[0.08] text-white/80 border-white/20"
                  : "text-white/30 border-transparent hover:text-white/60"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Open full dashboard */}
        <Button
          asChild
          size="sm"
          variant="outline"
          className="gap-1.5 text-white/50 border-white/15 hover:text-[hsl(168,72%,60%)] hover:border-[hsl(168,72%,42%/0.4)] text-xs"
        >
          <a href={DASHBOARD_PATH} target="_blank" rel="noopener noreferrer">
            <Activity className="h-3.5 w-3.5" />
            Dashboard completo
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
        </Button>
      </div>

      {/* ── Built-in sensor panels ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {BUILTIN_PANELS.map((p) => (
          <PanelFrame
            key={`${p.id}-${timeRange.from}-${refresh.value}`}
            title={p.title}
            src={panelSrc(p.id, timeRange.from, refresh.value)}
            accentColor={p.color}
          />
        ))}
      </div>

      {/* ── Custom panels ──────────────────────────────────────────── */}
      {custom.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {custom.map((p) => (
            <PanelFrame
              key={p.id}
              title={p.title}
              src={p.url}
              onRemove={() => handleRemoveCustom(p.id)}
            />
          ))}
        </div>
      )}

      {/* ── Add custom panel (collapsed) ───────────────────────────── */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/55 transition-colors"
        >
          <Settings2 className="h-3.5 w-3.5" />
          Añadir panel personalizado
          {showAdd ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-3">
                <p className="text-[11px] text-white/40">
                  Copia la URL de embed desde Grafana: abre un panel → <em>Share</em> → <em>Embed</em> → copia el valor del atributo{" "}
                  <code className="font-mono text-white/60">src</code>. Debe empezar por{" "}
                  <code className="font-mono text-[hsl(168,72%,50%)]">/grafana/d-solo/…</code>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-2">
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Nombre del panel"
                    className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/25 text-sm h-8"
                  />
                  <Input
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="/grafana/d-solo/…?panelId=…"
                    className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/25 text-sm h-8 font-mono"
                  />
                  <Button
                    size="sm"
                    onClick={handleAddCustom}
                    disabled={!newTitle.trim() || !newUrl.trim()}
                    className="h-8 gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Añadir
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
