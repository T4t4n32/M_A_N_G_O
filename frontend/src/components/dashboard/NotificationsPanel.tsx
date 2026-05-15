import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, BellOff, CheckCircle2, XCircle, AlertTriangle, ShieldAlert,
  Wrench, MessageSquare, ChevronDown, ChevronUp, Signal, Clock,
  Smartphone, Info, RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAlertHistory } from "@/hooks/useAlertHistory";
import type { AlertEvent, MaintenanceAlert } from "@/types/dashboard";

// ─── helpers ────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "hace unos segundos";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} d`;
}

function sensorLabel(type: string): string {
  return { ph: "pH", temperature: "Temperatura", turbidity: "Turbidez" }[type] ?? type;
}

function levelLabel(level: string): string {
  return level === "critical" ? "Crítico" : level === "warning" ? "Advertencia" : level;
}

// ─── sub-components ─────────────────────────────────────────────────────────

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-white/[0.04] border border-white/10 px-3 py-3 min-w-[72px]">
      <span className="text-xl font-bold text-white tabular-nums">{value}</span>
      <span className="text-[10px] text-white/50 text-center leading-tight mt-0.5">{label}</span>
    </div>
  );
}

function MaintenanceRow({ alert }: { alert: MaintenanceAlert }) {
  const isCritical = alert.level === "critical";
  const Icon = alert.type === "calibration_due" ? Wrench
    : alert.type === "station_offline" ? Signal
    : alert.type === "no_contacts" ? Smartphone
    : AlertTriangle;

  return (
    <div className={`flex items-start gap-3 rounded-xl px-4 py-3 border ${
      isCritical
        ? "bg-[hsl(var(--alert-critical)/0.08)] border-[hsl(var(--alert-critical)/0.25)]"
        : "bg-[hsl(var(--alert-warning)/0.08)] border-[hsl(var(--alert-warning)/0.25)]"
    }`}>
      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${
        isCritical ? "text-[hsl(var(--alert-critical))]" : "text-[hsl(var(--alert-warning))]"
      }`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/80 leading-snug">{alert.message}</p>
      </div>
      <Badge className={`shrink-0 text-[9px] px-1.5 border-0 ${
        isCritical
          ? "bg-[hsl(var(--alert-critical)/0.2)] text-[hsl(var(--alert-critical))]"
          : "bg-[hsl(var(--alert-warning)/0.2)] text-[hsl(var(--alert-warning))]"
      }`}>
        {isCritical ? "Crítico" : "Atención"}
      </Badge>
    </div>
  );
}

function EventRow({ event }: { event: AlertEvent }) {
  const ok = event.sms_sent;
  const isWarning = event.alert_level === "warning";
  const isCritical = event.alert_level === "critical";

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/[0.06] last:border-0">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-[hsl(var(--alert-normal))]" />
      ) : (
        <XCircle className="h-4 w-4 shrink-0 text-[hsl(var(--alert-critical))]" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-semibold uppercase tracking-wide ${
            isCritical ? "text-[hsl(var(--alert-critical))]"
              : isWarning ? "text-[hsl(var(--alert-warning))]"
              : "text-white/50"
          }`}>
            {levelLabel(event.alert_level)}
          </span>
          <span className="text-xs text-white/70 font-medium">
            {sensorLabel(event.sensor_type)}
            {event.value !== null && (
              <span className="font-mono ml-1 text-white/50">
                {event.value.toFixed(2)}
              </span>
            )}
          </span>
        </div>
        <p className="text-[11px] text-white/40 mt-0.5 truncate">
          {ok ? `SMS enviado — ${timeAgo(event.sms_sent_at)}` : `Error de envío — ${event.sms_error ?? "desconocido"}`}
        </p>
      </div>
      <span className="text-[10px] text-white/30 shrink-0">{timeAgo(event.created_at)}</span>
    </div>
  );
}

function RemoteSmsSection() {
  const commands = [
    { cmd: "STATUS", desc: "Recibe las lecturas actuales de los 3 sensores" },
    { cmd: "SILENCIAR 2H", desc: "Pausa las alertas SMS por 2 horas" },
    { cmd: "REANUDAR", desc: "Reactiva las alertas SMS inmediatamente" },
    { cmd: "AYUDA", desc: "Lista todos los comandos disponibles" },
  ];

  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Smartphone className="h-4 w-4 text-[hsl(168,72%,42%)]" />
        <p className="text-xs font-semibold text-white/80">Control remoto por SMS</p>
        <Badge className="text-[9px] bg-[hsl(168,72%,42%/0.15)] text-[hsl(168,72%,50%)] border-0 ml-1">
          Exclusivo
        </Badge>
      </div>
      <p className="text-[11px] text-white/50 leading-relaxed">
        El modem Huawei E3372H puede recibir mensajes. Envía comandos al número SIM
        del dispositivo y obtienes respuesta aunque no haya internet — funciona solo con cobertura LTE.
      </p>
      <div className="space-y-1.5">
        {commands.map(({ cmd, desc }) => (
          <div key={cmd} className="flex items-center gap-3 rounded-lg bg-white/[0.04] px-3 py-2">
            <code className="text-[11px] font-mono text-[hsl(168,72%,55%)] shrink-0 min-w-[100px]">
              {cmd}
            </code>
            <span className="text-[11px] text-white/50">{desc}</span>
          </div>
        ))}
      </div>
      <div className="flex items-start gap-2 rounded-lg bg-[hsl(204,70%,53%/0.08)] border border-[hsl(204,70%,53%/0.2)] px-3 py-2 mt-2">
        <Info className="h-3.5 w-3.5 text-[hsl(204,70%,60%)] mt-0.5 shrink-0" />
        <p className="text-[11px] text-white/50">
          El número SIM está en el archivo <code className="font-mono text-white/70">.env</code> del
          dispositivo Jetson. Solo los contactos registrados en el panel admin pueden enviar comandos.
        </p>
      </div>
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export function NotificationsPanel() {
  const [expanded, setExpanded] = useState(false);
  const { data, isLoading, error, refetch } = useAlertHistory();

  const hasMaintenance = (data?.maintenance_alerts ?? []).length > 0;
  const hasRecentSms = data?.last_sms !== null;
  const lastSmsTime = data?.last_sms?.sms_sent_at ?? null;
  const diffH = lastSmsTime
    ? (Date.now() - new Date(lastSmsTime).getTime()) / 3_600_000
    : null;
  const smsRecent = diffH !== null && diffH < 6;

  // Derive header-level status
  const headerLevel: "normal" | "warning" | "critical" =
    (data?.maintenance_alerts ?? []).some((m) => m.level === "critical")
      ? "critical"
      : hasMaintenance
        ? "warning"
        : "normal";

  const headerColors = {
    normal:   { bg: "bg-[hsl(var(--alert-normal)/0.08)]",   border: "border-[hsl(var(--alert-normal)/0.25)]",   text: "text-[hsl(var(--alert-normal))]" },
    warning:  { bg: "bg-[hsl(var(--alert-warning)/0.08)]",  border: "border-[hsl(var(--alert-warning)/0.25)]",  text: "text-[hsl(var(--alert-warning))]" },
    critical: { bg: "bg-[hsl(var(--alert-critical)/0.08)]", border: "border-[hsl(var(--alert-critical)/0.25)]", text: "text-[hsl(var(--alert-critical))]" },
  }[headerLevel];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* ── Header / summary bar ── */}
      <div
        className={`rounded-xl border px-4 py-3 cursor-pointer select-none transition-colors ${headerColors.bg} ${headerColors.border}`}
        onClick={() => setExpanded((v) => !v)}
        role="button"
        aria-expanded={expanded}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {hasMaintenance ? (
              <AlertTriangle className={`h-5 w-5 shrink-0 ${headerColors.text}`} />
            ) : (
              <Bell className="h-5 w-5 shrink-0 text-white/50" />
            )}
            <div>
              <p className={`text-sm font-semibold ${hasMaintenance ? headerColors.text : "text-white/80"}`}>
                Notificaciones y Mantenimiento
              </p>
              <p className="text-[11px] text-white/40 mt-0.5">
                {isLoading
                  ? "Cargando..."
                  : error
                    ? "No se pudo cargar el estado"
                    : hasMaintenance
                      ? `${data.maintenance_alerts.length} elemento${data.maintenance_alerts.length > 1 ? "s" : ""} requiere${data.maintenance_alerts.length > 1 ? "n" : ""} atención`
                      : "Sistema de notificaciones operativo"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Last SMS badge */}
            {!isLoading && !error && (
              smsRecent ? (
                <div className="flex items-center gap-1.5 rounded-full bg-[hsl(var(--alert-warning)/0.12)] border border-[hsl(var(--alert-warning)/0.3)] px-2.5 py-1">
                  <MessageSquare className="h-3 w-3 text-[hsl(var(--alert-warning))]" />
                  <span className="text-[10px] text-[hsl(var(--alert-warning))] font-medium">
                    SMS {timeAgo(lastSmsTime)}
                  </span>
                </div>
              ) : hasRecentSms ? (
                <div className="flex items-center gap-1.5 rounded-full bg-white/[0.05] border border-white/10 px-2.5 py-1">
                  <MessageSquare className="h-3 w-3 text-white/30" />
                  <span className="text-[10px] text-white/30">{timeAgo(lastSmsTime)}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 rounded-full bg-white/[0.05] border border-white/10 px-2.5 py-1">
                  <BellOff className="h-3 w-3 text-white/25" />
                  <span className="text-[10px] text-white/25">Sin alertas enviadas</span>
                </div>
              )
            )}
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-white/30" />
            ) : (
              <ChevronDown className="h-4 w-4 text-white/30" />
            )}
          </div>
        </div>
      </div>

      {/* ── Expanded content ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-4 pt-1">

              {/* Stats row */}
              {data && (
                <div className="flex gap-2 flex-wrap">
                  <StatCard
                    value={
                      data.last_sms?.sms_sent_at
                        ? timeAgo(data.last_sms.sms_sent_at)
                        : "—"
                    }
                    label="Último SMS"
                  />
                  <StatCard value={data.stats.sent_today} label="Enviados hoy" />
                  <StatCard value={data.stats.active_rules} label="Reglas activas" />
                  <StatCard value={data.stats.active_contacts} label="Contactos" />
                </div>
              )}

              {/* Maintenance alerts */}
              {(data?.maintenance_alerts ?? []).length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 flex items-center gap-1.5">
                    <Wrench className="h-3 w-3" /> Mantenimiento del dispositivo
                  </p>
                  {data!.maintenance_alerts.map((m, i) => (
                    <MaintenanceRow key={i} alert={m} />
                  ))}
                </div>
              )}

              {/* Recent SMS history */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> Historial de mensajes
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); refetch(); }}
                    className="text-[10px] text-white/30 hover:text-white/60 flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="h-2.5 w-2.5" /> Actualizar
                  </button>
                </div>

                {isLoading && (
                  <div className="rounded-xl bg-white/[0.03] border border-white/10 px-4 py-6 text-center">
                    <p className="text-xs text-white/30">Cargando historial...</p>
                  </div>
                )}

                {error && (
                  <div className="rounded-xl bg-white/[0.03] border border-white/10 px-4 py-4 text-center">
                    <p className="text-xs text-white/30">
                      No se pudo cargar el historial — el backend puede estar iniciando
                    </p>
                  </div>
                )}

                {!isLoading && !error && (data?.recent_events ?? []).length === 0 && (
                  <div className="rounded-xl bg-white/[0.03] border border-white/10 px-4 py-6 text-center">
                    <BellOff className="h-6 w-6 text-white/15 mx-auto mb-2" />
                    <p className="text-xs text-white/30">No se han enviado alertas aún</p>
                    <p className="text-[11px] text-white/20 mt-1">
                      Los mensajes aparecerán aquí cuando los sensores superen los umbrales configurados
                    </p>
                  </div>
                )}

                {!isLoading && !error && (data?.recent_events ?? []).length > 0 && (
                  <div className="rounded-xl bg-white/[0.03] border border-white/10 px-4 divide-y divide-white/[0.06]">
                    {data!.recent_events.map((ev) => (
                      <EventRow key={ev.id} event={ev} />
                    ))}
                  </div>
                )}
              </div>

              {/* Remote SMS feature */}
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 flex items-center gap-1.5">
                  <Signal className="h-3 w-3" /> Control remoto por SMS
                </p>
                <RemoteSmsSection />
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
