import { useState } from "react";
import { ExternalLink, Activity, RefreshCw, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Constants ─────────────────────────────────────────────────────────────────

const GRAFANA_BASE    = "/grafana";
const FULL_DASH_PATH  = `${GRAFANA_BASE}/d/mango-sensors-v1/`;

const TIME_RANGES = [
  { label: "24 h", from: "now-24h"  },
  { label: "7 d",  from: "now-7d"   },
  { label: "30 d", from: "now-30d"  },
  { label: "90 d", from: "now-90d"  },
  { label: "6 m",  from: "now-180d" },
] as const;

type TimeRange = typeof TIME_RANGES[number];

// ── Helpers ───────────────────────────────────────────────────────────────────

function embedSrc(range: TimeRange, refreshKey: number): string {
  const params = new URLSearchParams({
    orgId:    "1",
    from:     range.from,
    to:       "now",
    timezone: "browser",
    theme:    "dark",
    kiosk:    "tv",
    _r:       String(refreshKey),
  });
  return `${FULL_DASH_PATH}?${params}`;
}

// ── Main component ────────────────────────────────────────────────────────────

export function GrafanaSection() {
  const [timeRange,   setTimeRange]  = useState(TIME_RANGES[0]); // default 24 h
  const [refreshKey,  setRefreshKey] = useState(0);
  const [fullscreen,  setFullscreen] = useState(false);

  const src = embedSrc(timeRange, refreshKey);

  return (
    <div className="space-y-3">

      {/* ── Header bar ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[hsl(168,72%,42%/0.2)] bg-[hsl(168,72%,42%/0.05)] px-4 py-3">

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

        {/* Refresh */}
        <button
          type="button"
          onClick={() => setRefreshKey((k) => k + 1)}
          className="p-1.5 rounded text-white/35 hover:text-white/65 border border-white/10 hover:border-white/20 transition-colors"
          title="Actualizar dashboard"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>

        {/* Toggle height */}
        <button
          type="button"
          onClick={() => setFullscreen((v) => !v)}
          className="p-1.5 rounded text-white/35 hover:text-white/65 border border-white/10 hover:border-white/20 transition-colors"
          title={fullscreen ? "Vista compacta" : "Vista expandida"}
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>

        {/* Open full dashboard */}
        <Button
          asChild
          size="sm"
          variant="outline"
          className="gap-1.5 text-white/50 border-white/15 hover:text-[hsl(168,72%,60%)] hover:border-[hsl(168,72%,42%/0.4)] text-xs"
        >
          <a href={FULL_DASH_PATH} target="_blank" rel="noopener noreferrer">
            <Activity className="h-3.5 w-3.5" />
            Dashboard completo
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
        </Button>
      </div>

      {/* ── Embedded public dashboard ─────────────────────────────── */}
      <div
        className={`relative rounded-xl border border-white/[0.08] overflow-hidden bg-[hsl(205,40%,5%)] transition-all duration-300 ${
          fullscreen ? "h-[900px]" : "h-[540px]"
        }`}
      >
        <iframe
          key={`${src}`}
          src={src}
          title="M.A.N.G.O. — Grafana Ocean Sensors"
          className="absolute inset-0 w-full h-full border-0"
          loading="lazy"
          allowFullScreen
        />
      </div>

      {/* ── Footer note ───────────────────────────────────────────── */}
      <p className="text-[11px] text-white/22 text-right">
        Dashboard público de solo lectura · datos actualizados cada 5 min ·{" "}
        <a
          href={FULL_DASH_PATH}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[hsl(168,72%,50%)] transition-colors underline underline-offset-2"
        >
          abrir en Grafana
        </a>
      </p>
    </div>
  );
}
