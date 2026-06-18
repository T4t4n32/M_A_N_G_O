import { FlaskConical } from "lucide-react";

export function DataContextBanner() {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-white/[0.07] border-l-4 border-l-[hsl(168,72%,42%)] bg-white/[0.03] px-5 py-4 mb-4">
      <div className="shrink-0 mt-0.5 p-2 rounded-lg bg-[hsl(168,72%,42%)]/[0.09]">
        <FlaskConical className="h-4 w-4 text-[hsl(168,72%,55%)]" />
      </div>
      <div className="space-y-1.5 min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[hsl(168,72%,55%)]">
          Último registro disponible
        </p>
        <p className="text-sm text-white/50 leading-relaxed">
          Los valores de <span className="text-white/70 font-medium">pH, temperatura y turbidez</span> mostrados
          corresponden al último estado capturado. Son el resultado de las sesiones de validación realizadas
          para verificar el funcionamiento integral de la plataforma: historial, alertas, paneles Grafana y
          registro de misiones.
        </p>
        <p className="text-[11px] text-white/28 pt-0.5">
          El dispositivo no se encuentra actualmente en operación activa de campo.
        </p>
      </div>
    </div>
  );
}
