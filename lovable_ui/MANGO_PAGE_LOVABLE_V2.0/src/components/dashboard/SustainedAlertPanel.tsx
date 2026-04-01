import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Clock, ShieldAlert, ShieldCheck, AlertTriangle, ChevronDown, ChevronUp, Timer, TrendingDown, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { AlertLevel } from "@/types/dashboard";
import type { SustainedSystemAlert, SustainedViolation } from "@/hooks/useSustainedAlerts";

const LEVEL_CONFIG: Record<AlertLevel, {
  icon: React.ElementType;
  bg: string;
  border: string;
  text: string;
  badgeBg: string;
}> = {
  normal: {
    icon: ShieldCheck,
    bg: "bg-[hsl(var(--alert-normal)/0.1)]",
    border: "border-[hsl(var(--alert-normal)/0.3)]",
    text: "text-[hsl(var(--alert-normal))]",
    badgeBg: "bg-[hsl(var(--alert-normal)/0.15)] text-[hsl(var(--alert-normal))]",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-[hsl(var(--alert-warning)/0.1)]",
    border: "border-[hsl(var(--alert-warning)/0.3)]",
    text: "text-[hsl(var(--alert-warning))]",
    badgeBg: "bg-[hsl(var(--alert-warning)/0.15)] text-[hsl(var(--alert-warning))]",
  },
  critical: {
    icon: ShieldAlert,
    bg: "bg-[hsl(var(--alert-critical)/0.1)]",
    border: "border-[hsl(var(--alert-critical)/0.3)]",
    text: "text-[hsl(var(--alert-critical))]",
    badgeBg: "bg-[hsl(var(--alert-critical)/0.15)] text-[hsl(var(--alert-critical))]",
  },
};

function formatDuration(minutes: number): string {
  if (minutes >= 1440) return `${Math.round(minutes / 1440)}d`;
  if (minutes >= 60) return `${Math.round(minutes / 60)}h`;
  return `${minutes}min`;
}

function ViolationRow({ v }: { v: SustainedViolation }) {
  const severity = v.rule.severity;
  const config = LEVEL_CONFIG[severity];
  const SIcon = config.icon;
  const TrendIcon = v.rule.direction === "below" ? TrendingDown : TrendingUp;
  const pct = Math.round(v.actualRatio * 100);

  return (
    <div className={`flex items-start gap-2 rounded-lg px-3 py-2.5 ${config.bg}`}>
      <SIcon className={`h-4 w-4 mt-0.5 shrink-0 ${config.text}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-xs font-semibold ${config.text}`}>
            {v.rule.label}
          </p>
          <Badge className="bg-muted/20 text-muted-foreground border-0 text-[10px] gap-1">
            <Timer className="h-2.5 w-2.5" />
            {formatDuration(v.rule.durationMinutes)}
          </Badge>
          <Badge className="bg-muted/20 text-muted-foreground border-0 text-[10px] gap-1">
            <TrendIcon className="h-2.5 w-2.5" />
            {v.rule.direction === "below" ? "< " : "> "}{v.rule.threshold}{v.rule.unit}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">{v.rule.explanation}</p>
        <div className="flex items-center gap-3 mt-1.5">
          {/* Violation ratio bar */}
          <div className="flex-1 h-1.5 bg-muted/20 rounded-full overflow-hidden max-w-[120px]">
            <div
              className={`h-full rounded-full transition-all ${
                severity === "critical"
                  ? "bg-[hsl(var(--alert-critical))]"
                  : "bg-[hsl(var(--alert-warning))]"
              }`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">
            {pct}% de lecturas ({v.violatingReadings}/{v.totalReadings}) fuera de rango
          </span>
        </div>
      </div>
    </div>
  );
}

interface SustainedAlertPanelProps {
  alert: SustainedSystemAlert;
}

export function SustainedAlertPanel({ alert }: SustainedAlertPanelProps) {
  const [expanded, setExpanded] = useState(alert.level !== "normal");
  const config = LEVEL_CONFIG[alert.level];
  const Icon = config.icon;
  const triggered = alert.violations.filter((v) => v.triggered);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Alert
        className={`${config.bg} ${config.border} border cursor-pointer`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Icon className={`h-5 w-5 ${config.text}`} />
              <Clock className={`h-2.5 w-2.5 absolute -bottom-0.5 -right-0.5 ${config.text}`} />
            </div>
            <div>
              <AlertTitle className={`text-sm font-semibold ${config.text}`}>
                {alert.title}
              </AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground mt-0.5">
                {alert.message}
              </AlertDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {alert.criticalCount > 0 && (
              <Badge className={LEVEL_CONFIG.critical.badgeBg + " border-0 text-[10px]"}>
                {alert.criticalCount} crítica{alert.criticalCount > 1 ? "s" : ""}
              </Badge>
            )}
            {alert.warningCount > 0 && (
              <Badge className={LEVEL_CONFIG.warning.badgeBg + " border-0 text-[10px]"}>
                {alert.warningCount} advertencia{alert.warningCount > 1 ? "s" : ""}
              </Badge>
            )}
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        <AnimatePresence>
          {expanded && triggered.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-border/30 space-y-2">
                {triggered.map((v) => (
                  <ViolationRow key={v.rule.id} v={v} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Alert>
    </motion.div>
  );
}
