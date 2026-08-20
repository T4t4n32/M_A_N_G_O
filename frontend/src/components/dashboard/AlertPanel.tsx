import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { SystemAlert } from "@/types/dashboard";
import { SENSOR_THRESHOLDS } from "@/lib/sensorThresholds";
import { ALERT_LEVEL_STYLES } from "@/lib/alertLevelStyles";

interface AlertPanelProps {
  alert: SystemAlert;
}

export function AlertPanel({ alert }: AlertPanelProps) {
  const [expanded, setExpanded] = useState(alert.level !== "normal");
  const config = ALERT_LEVEL_STYLES[alert.level];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Alert className={`${config.bg} ${config.border} border cursor-pointer`} onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Icon className={`h-5 w-5 ${config.text}`} />
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
              <Badge className={ALERT_LEVEL_STYLES.critical.badgeBg + " border-0 text-[10px]"}>
                {alert.criticalCount} crítico{alert.criticalCount > 1 ? "s" : ""}
              </Badge>
            )}
            {alert.warningCount > 0 && (
              <Badge className={ALERT_LEVEL_STYLES.warning.badgeBg + " border-0 text-[10px]"}>
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
          {expanded && (alert.warningCount > 0 || alert.criticalCount > 0) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-border/30 space-y-2">
                {alert.sensorAlerts
                  .filter((a) => a.level !== "normal")
                  .map((sa) => {
                    const sConfig = ALERT_LEVEL_STYLES[sa.level];
                    const SIcon = sConfig.icon;
                    const threshold = SENSOR_THRESHOLDS[sa.type];
                    return (
                      <div
                        key={sa.type}
                        className={`flex items-start gap-2 rounded-lg px-3 py-2 ${sConfig.bg}`}
                      >
                        <SIcon className={`h-4 w-4 mt-0.5 shrink-0 ${sConfig.text}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold ${sConfig.text}`}>
                            {threshold.label}
                            {sa.value !== undefined && (
                              <span className="font-mono ml-1">
                                {sa.value.toFixed(2)}{threshold.unit}
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{sa.message}</p>
                          <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                            <span>Óptimo: {threshold.optimalLow}–{threshold.optimalHigh}{threshold.unit}</span>
                            <span>Aceptable: {threshold.warningLow}–{threshold.warningHigh}{threshold.unit}</span>
                            <span>Crítico: &lt;{threshold.criticalLow} / &gt;{threshold.criticalHigh}{threshold.unit}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Alert>
    </motion.div>
  );
}
