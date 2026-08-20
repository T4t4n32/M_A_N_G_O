import { AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react";
import type { AlertLevel } from "@/types/dashboard";

export interface AlertLevelStyle {
  icon: React.ElementType;
  bg: string;
  border: string;
  text: string;
  badgeBg: string;
}

/** Icon + `--alert-*` token classes shared by every alert level renderer. */
export const ALERT_LEVEL_STYLES: Record<AlertLevel, AlertLevelStyle> = {
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
