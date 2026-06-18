import {
  BedDouble, Play, Pause, RotateCcw, Zap, FlaskConical,
} from "lucide-react";
import { useActiveMission } from "@/hooks/useActiveMission";
import type { OperationalContext } from "@/hooks/useActiveMission";

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

interface BannerConfig {
  icon: React.ElementType;
  accentColor: string;
  borderColor: string;
  bgColor: string;
  tagText: string;
  tagColor: string;
  title: string;
  body: React.ReactNode;
}

function useConfig(context: OperationalContext, lastMissionId: string | null, lastMissionEnded: string | null): BannerConfig {
  switch (context) {
    case "field":
      return {
        icon: Zap,
        accentColor: "hsl(168,72%,42%)",
        borderColor: "border-l-[hsl(168,72%,42%)]",
        bgColor: "bg-[hsl(168,72%,42%)]/[0.06]",
        tagText: "Misión activa",
        tagColor: "text-[hsl(168,72%,55%)]",
        title: "Recolección de datos en curso",
        body: (
          <p className="text-sm text-white/55 leading-relaxed">
            El dispositivo está desplegado en campo. Los valores de{" "}
            <span className="text-white/75 font-medium">pH, temperatura y turbidez</span>{" "}
            reflejan lecturas en tiempo real. Las advertencias se calculan sobre los mismos umbrales
            mostrados en el historial.
          </p>
        ),
      };

    case "armed":
      return {
        icon: Play,
        accentColor: "hsl(38,90%,55%)",
        borderColor: "border-l-amber-400",
        bgColor: "bg-amber-400/[0.05]",
        tagText: "Dispositivo armado",
        tagColor: "text-amber-400",
        title: "Despliegue inminente",
        body: (
          <p className="text-sm text-white/55 leading-relaxed">
            El dispositivo ha completado el autodiagnóstico y está en estado <em>armed</em>.
            Las lecturas comenzarán a actualizarse una vez iniciada la misión de campo.
          </p>
        ),
      };

    case "paused":
      return {
        icon: Pause,
        accentColor: "hsl(44,96%,56%)",
        borderColor: "border-l-yellow-400",
        bgColor: "bg-yellow-400/[0.04]",
        tagText: "Misión pausada",
        tagColor: "text-yellow-400",
        title: "Recolección suspendida temporalmente",
        body: (
          <p className="text-sm text-white/55 leading-relaxed">
            La misión de campo está en pausa. Los sensores mantienen el último estado conocido
            hasta que se reanude la recolección.
          </p>
        ),
      };

    case "returning":
      return {
        icon: RotateCcw,
        accentColor: "hsl(204,70%,53%)",
        borderColor: "border-l-sky-400",
        bgColor: "bg-sky-400/[0.04]",
        tagText: "Retorno en curso",
        tagColor: "text-sky-400",
        title: "Misión finalizada — sincronizando datos",
        body: (
          <p className="text-sm text-white/55 leading-relaxed">
            El dispositivo está retornando. Los datos recolectados se sincronizan al servidor.
            Los sensores pasarán a estado <em>fuera de operación</em> al completar la sesión.
          </p>
        ),
      };

    case "standby":
    default:
      return {
        icon: BedDouble,
        accentColor: "hsl(215,20%,45%)",
        borderColor: "border-l-white/20",
        bgColor: "bg-white/[0.025]",
        tagText: "Sin misión activa",
        tagColor: "text-white/35",
        title: "Dispositivo en espera",
        body: (
          <p className="text-sm text-white/40 leading-relaxed">
            No hay ninguna misión de campo en curso. Los sensores se mostrarán operativos
            cuando se inicie una nueva misión.{" "}
            {lastMissionId && (
              <span className="text-white/28">
                Última sesión: <span className="font-mono">{lastMissionId}</span>
                {lastMissionEnded && ` — finalizada el ${fmtDate(lastMissionEnded)}`}.
              </span>
            )}
          </p>
        ),
      };
  }
}

export function DataContextBanner() {
  const { context, lastMission, isLoading } = useActiveMission();

  if (isLoading) return null;

  const config = useConfig(
    context,
    lastMission?.mission_id ?? null,
    lastMission?.ended_at ?? null,
  );
  const Icon = config.icon;

  return (
    <div
      className={`flex items-start gap-4 rounded-xl border border-white/[0.07] border-l-4 ${config.borderColor} ${config.bgColor} px-5 py-4 mb-4 transition-all duration-500`}
    >
      <div
        className="shrink-0 mt-0.5 p-2 rounded-lg"
        style={{ backgroundColor: `${config.accentColor}14` }}
      >
        <Icon className="h-4 w-4" style={{ color: config.accentColor }} />
      </div>
      <div className="space-y-1.5 min-w-0">
        <p className={`text-[11px] font-semibold uppercase tracking-widest ${config.tagColor}`}>
          {config.tagText}
        </p>
        <p className="text-sm font-medium text-white/60">{config.title}</p>
        {config.body}
      </div>
    </div>
  );
}
