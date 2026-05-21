import { useQuery } from "@tanstack/react-query";
import { Server, Cpu, Wifi, WifiOff, RefreshCw, Radio } from "lucide-react";
import { WsTerminal } from "@/components/dashboard/WsTerminal";
import { getHealth, getJetsonStatus } from "@/lib/api";
import type { HealthResponse } from "@/types/dashboard";

function UptimeStr({ seconds }: { seconds?: number }) {
  if (!seconds) return <span className="text-white/25">—</span>;
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return <span>{d}d {h}h {m}m</span>;
  if (h > 0) return <span>{h}h {m}m</span>;
  return <span>{m}m</span>;
}

function StatusBadge({ online, loading }: { online: boolean; loading: boolean }) {
  if (loading) {
    return (
      <span className="flex items-center gap-1.5 text-[10px] font-semibold text-white/40">
        <RefreshCw className="h-3 w-3 animate-spin" />
        Verificando
      </span>
    );
  }
  return (
    <span className={`flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase ${
      online ? "text-emerald-400" : "text-white/30"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        online ? "bg-emerald-400 shadow-[0_0_6px_theme(colors.emerald.400)]" : "bg-white/20"
      }`} />
      {online ? "En línea" : "Sin señal"}
    </span>
  );
}

function DeviceCard({
  name,
  label,
  description,
  icon: Icon,
  accentColor,
  online,
  loading,
  uptime,
  extra,
}: {
  name: string;
  label: string;
  description: string;
  icon: React.ElementType;
  accentColor: string;
  online: boolean;
  loading: boolean;
  uptime?: number;
  extra?: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border transition-all duration-500 ${
      online
        ? "border-white/[0.12] bg-white/[0.035]"
        : "border-white/[0.06] bg-white/[0.015]"
    }`}>
      <div className="p-4 flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg transition-colors duration-500 ${
              online ? accentColor : "bg-white/[0.04] text-white/20"
            }`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className={`text-sm font-semibold transition-colors duration-500 ${
                online ? "text-white" : "text-white/40"
              }`}>{label}</p>
              <p className="text-[11px] text-white/35 mt-0.5">{description}</p>
            </div>
          </div>
          <StatusBadge online={online} loading={loading} />
        </div>

        {/* Detail row */}
        <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-white/[0.06]">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-white/25 mb-1">
              Hostname
            </p>
            <p className={`text-[11px] font-mono ${online ? "text-white/70" : "text-white/25"}`}>
              {name}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-white/25 mb-1">
              Uptime
            </p>
            <p className={`text-[11px] font-mono ${online ? "text-white/70" : "text-white/25"}`}>
              <UptimeStr seconds={uptime} />
            </p>
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-white/25 mb-1">
              Acceso
            </p>
            <p className={`text-[11px] ${online ? "text-white/60" : "text-white/20"}`}>
              {online ? (
                <span className="flex items-center gap-1">
                  <Wifi className="h-3 w-3" /> Activo
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <WifiOff className="h-3 w-3" /> Inactivo
                </span>
              )}
            </p>
          </div>
        </div>

        {extra && (
          <div className="pt-1 border-t border-white/[0.06]">
            {extra}
          </div>
        )}
      </div>
    </div>
  );
}

export function DevicesPanel() {
  const vpsQuery = useQuery<HealthResponse>({
    queryKey: ["admin-vps-health"],
    queryFn: getHealth,
    refetchInterval: 20_000,
  });

  const jetsonQuery = useQuery<{ online: boolean }>({
    queryKey: ["admin-jetson-status"],
    queryFn: getJetsonStatus,
    refetchInterval: 35_000,
    retry: 1,
  });

  const vpsOnline = vpsQuery.data?.status === "ok";
  const jetsonOnline = jetsonQuery.data?.online === true;

  return (
    <div className="space-y-6">

      {/* ── Device status cards ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
            Estado de dispositivos
          </p>
          <span className="flex items-center gap-1.5 text-[10px] text-white/25">
            <Radio className="h-3 w-3" />
            Actualización automática
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DeviceCard
            name="vps-eb441baa"
            label="VPS — Backend"
            description="integramosoe.com · Debian 12"
            icon={Server}
            accentColor="bg-emerald-500/15 text-emerald-400"
            online={vpsOnline}
            loading={vpsQuery.isLoading}
          />
          <DeviceCard
            name="tegra-ubuntu"
            label="Jetson TK1"
            description="Nodo edge · Ubuntu 14.04 · ARM"
            icon={Cpu}
            accentColor="bg-sky-500/15 text-sky-400"
            online={jetsonOnline}
            loading={jetsonQuery.isLoading || jetsonQuery.isFetching}
          />
        </div>
      </div>

      {/* ── Terminals ── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">
          Terminales remotas
        </p>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4" style={{ minHeight: "420px" }}>
          <WsTerminal
            wsPath="/api/v1/admin/terminal/vps"
            title="VPS"
            accentClass="text-emerald-400"
            badgeClass="bg-emerald-500/10 text-emerald-400"
          />
          <WsTerminal
            wsPath="/api/v1/admin/terminal/jetson"
            title="Jetson TK1"
            accentClass="text-sky-400"
            badgeClass="bg-sky-500/10 text-sky-400"
          />
        </div>
      </div>

    </div>
  );
}
