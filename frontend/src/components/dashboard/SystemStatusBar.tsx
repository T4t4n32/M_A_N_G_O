import { useState } from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle, Clock, ChevronDown, ChevronUp, Timer, TrendingDown, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import type { SystemAlert, AlertLevel } from "@/types/dashboard";
import type { SustainedSystemAlert, SustainedViolation } from "@/hooks/useSustainedAlerts";
import { SENSOR_THRESHOLDS } from "@/lib/sensorThresholds";

// ── Shared level config ──────────────────────────────────────────────────────
const LEVEL: Record<AlertLevel, { icon: React.ElementType; pill: string; text: string; bg: string; border: string }> = {
  normal:   { icon: ShieldCheck,  pill: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", text: "text-emerald-300", bg: "bg-emerald-500/[0.07]", border: "border-emerald-500/20" },
  warning:  { icon: AlertTriangle, pill: "bg-amber-500/15 text-amber-300 border-amber-500/30",       text: "text-amber-300",   bg: "bg-amber-500/[0.07]",   border: "border-amber-500/20" },
  critical: { icon: ShieldAlert,   pill: "bg-red-500/15 text-red-300 border-red-500/30",             text: "text-red-300",     bg: "bg-red-500/[0.07]",     border: "border-red-500/20" },
};

function formatDuration(minutes: number): string {
  if (minutes >= 1440) return `${Math.round(minutes / 1440)}d`;
  if (minutes >= 60)   return `${Math.round(minutes / 60)}h`;
  return `${minutes}min`;
}

// ── Instant alerts expanded content ─────────────────────────────────────────
function InstantDetail({ alert }: { alert: SystemAlert }) {
  const active = alert.sensorAlerts.filter((a) => a.level !== "normal");
  if (active.length === 0) return null;
  return (
    <div className="space-y-1.5">
      {active.map((sa) => {
        const cfg = LEVEL[sa.level];
        const Icon = cfg.icon;
        const thr = SENSOR_THRESHOLDS[sa.type];
        return (
          <div key={sa.type} className={`flex items-start gap-2.5 rounded-lg px-3 py-2 ${cfg.bg} border ${cfg.border}`}>
            <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${cfg.text}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold ${cfg.text}`}>
                {thr.label}
                {sa.value !== undefined && (
                  <span className="font-mono ml-1.5">{sa.value.toFixed(2)}{thr.unit}</span>
                )}
              </p>
              <p className="text-[11px] text-white/45 mt-0.5">{sa.message}</p>
              <p className="text-[10px] text-white/30 mt-1">
                Óptimo {thr.optimalLow}–{thr.optimalHigh}{thr.unit} · Crítico &lt;{thr.criticalLow} / &gt;{thr.criticalHigh}{thr.unit}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Sustained alerts expanded content ───────────────────────────────────────
function SustainedDetail({ alert }: { alert: SustainedSystemAlert }) {
  const triggered = alert.violations.filter((v) => v.triggered);
  if (triggered.length === 0) return null;
  return (
    <div className="space-y-1.5">
      {triggered.map((v) => {
        const cfg = LEVEL[v.rule.severity];
        const Icon = cfg.icon;
        const TrendIcon = v.rule.direction === "below" ? TrendingDown : TrendingUp;
        const pct = Math.round(v.actualRatio * 100);
        return (
          <div key={v.rule.id} className={`flex items-start gap-2.5 rounded-lg px-3 py-2 ${cfg.bg} border ${cfg.border}`}>
            <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${cfg.text}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`text-xs font-semibold ${cfg.text}`}>{v.rule.label}</p>
                <Badge className="bg-white/[0.06] text-white/40 border-0 text-[10px] gap-1">
                  <Timer className="h-2.5 w-2.5" />{formatDuration(v.rule.durationMinutes)}
                </Badge>
                <Badge className="bg-white/[0.06] text-white/40 border-0 text-[10px] gap-1">
                  <TrendIcon className="h-2.5 w-2.5" />
                  {v.rule.direction === "below" ? "< " : "> "}{v.rule.threshold}{v.rule.unit}
                </Badge>
              </div>
              <p className="text-[11px] text-white/45 mt-0.5">{v.rule.explanation}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden max-w-[100px]">
                  <div
                    className={`h-full rounded-full ${v.rule.severity === "critical" ? "bg-red-400" : "bg-amber-400"}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-white/30">{pct}% fuera de rango</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main SystemStatusBar ─────────────────────────────────────────────────────
interface Props {
  systemAlert: SystemAlert;
  sustainedAlert: SustainedSystemAlert;
}

export function SystemStatusBar({ systemAlert, sustainedAlert }: Props) {
  const [open, setOpen] = useState<null | "instant" | "sustained">(null);

  const worstLevel = (
    systemAlert.level === "critical" || sustainedAlert.level === "critical"
      ? "critical"
      : systemAlert.level === "warning" || sustainedAlert.level === "warning"
        ? "warning"
        : "normal"
  ) as AlertLevel;

  const InstantIcon = LEVEL[systemAlert.level].icon;
  const SustainedIcon = LEVEL[sustainedAlert.level].icon;

  const hasInstantDetail  = systemAlert.sensorAlerts.some((a) => a.level !== "normal");
  const hasSustainedDetail = sustainedAlert.violations.some((v) => v.triggered);

  const toggle = (panel: "instant" | "sustained") =>
    setOpen((prev) => (prev === panel ? null : panel));

  return (
    <div className="sticky top-0 z-50 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 bg-[hsl(205,35%,8%)] border-b border-white/[0.05] backdrop-blur-md">
      <div className="max-w-7xl mx-auto space-y-2">
      {/* Compact status bar */}
      <div className={`flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border px-3 py-2.5 ${LEVEL[worstLevel].bg} ${LEVEL[worstLevel].border}`}>

        {/* Instant alert pill */}
        <button
          type="button"
          onClick={() => hasInstantDetail && toggle("instant")}
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors flex-1 text-left ${
            LEVEL[systemAlert.level].pill
          } ${hasInstantDetail ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
        >
          <InstantIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">{systemAlert.title}</span>
          {systemAlert.criticalCount > 0 && (
            <Badge className="bg-red-500/20 text-red-300 border-0 text-[10px]">{systemAlert.criticalCount}×</Badge>
          )}
          {systemAlert.warningCount > 0 && (
            <Badge className="bg-amber-500/20 text-amber-300 border-0 text-[10px]">{systemAlert.warningCount}×</Badge>
          )}
          {hasInstantDetail && (
            open === "instant" ? <ChevronUp className="h-3 w-3 opacity-60" /> : <ChevronDown className="h-3 w-3 opacity-60" />
          )}
        </button>

        {/* Divider */}
        <div className="hidden sm:block h-5 w-px bg-white/10" />

        {/* Sustained alert pill */}
        <button
          type="button"
          onClick={() => hasSustainedDetail && toggle("sustained")}
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors flex-1 text-left ${
            LEVEL[sustainedAlert.level].pill
          } ${hasSustainedDetail ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
        >
          <div className="relative shrink-0">
            <SustainedIcon className="h-3.5 w-3.5" />
            <Clock className="h-2 w-2 absolute -bottom-0.5 -right-0.5 opacity-70" />
          </div>
          <span className="flex-1">{sustainedAlert.title}</span>
          {sustainedAlert.criticalCount > 0 && (
            <Badge className="bg-red-500/20 text-red-300 border-0 text-[10px]">{sustainedAlert.criticalCount}×</Badge>
          )}
          {sustainedAlert.warningCount > 0 && (
            <Badge className="bg-amber-500/20 text-amber-300 border-0 text-[10px]">{sustainedAlert.warningCount}×</Badge>
          )}
          {hasSustainedDetail && (
            open === "sustained" ? <ChevronUp className="h-3 w-3 opacity-60" /> : <ChevronDown className="h-3 w-3 opacity-60" />
          )}
        </button>
      </div>

      {/* Expandable details */}
      <AnimatePresence>
        {open === "instant" && hasInstantDetail && (
          <motion.div
            key="instant-detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="pt-1">
              <InstantDetail alert={systemAlert} />
            </div>
          </motion.div>
        )}
        {open === "sustained" && hasSustainedDetail && (
          <motion.div
            key="sustained-detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="pt-1">
              <SustainedDetail alert={sustainedAlert} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
