import { useQuery } from "@tanstack/react-query";
import { Server, Cpu, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { TerminalPanel } from "@/components/dashboard/TerminalPanel";
import { getHealth } from "@/lib/api";
import type { HealthResponse } from "@/types/dashboard";

function UptimeStr({ seconds }: { seconds?: number }) {
  if (!seconds) return <span className="text-white/30">—</span>;
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return <span>{d}d {h}h {m}m</span>;
  if (h > 0) return <span>{h}h {m}m</span>;
  return <span>{m}m</span>;
}

function DeviceCard({
  name,
  label,
  description,
  icon: Icon,
  color,
  online,
  uptime,
  loading,
}: {
  name: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  online: boolean;
  uptime?: number;
  loading: boolean;
}) {
  return (
    <div className={`rounded-xl border p-5 flex flex-col gap-3 ${
      online
        ? "border-white/[0.1] bg-white/[0.03]"
        : "border-white/[0.05] bg-white/[0.01] opacity-60"
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{label}</p>
            <p className="text-[11px] text-white/40">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {loading ? (
            <RefreshCw className="h-3 w-3 text-white/30 animate-spin" />
          ) : online ? (
            <Wifi className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-red-400/70" />
          )}
          <span className={`text-xs font-semibold ${online ? "text-emerald-400" : "text-red-400/70"}`}>
            {loading ? "..." : online ? "EN LINEA" : "DESCONECTADO"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/[0.05]">
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Dispositivo</p>
          <p className="text-xs text-white/70 font-mono">{name}</p>
        </div>
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Uptime</p>
          <p className="text-xs text-white/70 font-mono">
            <UptimeStr seconds={uptime} />
          </p>
        </div>
      </div>
    </div>
  );
}

export function DevicesPanel() {
  const vpsQuery = useQuery<HealthResponse>({
    queryKey: ["admin-vps-health"],
    queryFn: getHealth,
    refetchInterval: 15_000,
  });

  const vpsOnline = vpsQuery.data?.status === "ok";
  const vpsUptime = undefined; // uptime_s not in current HealthResponse

  return (
    <div className="space-y-6">
      {/* Device status cards */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">
          Estado de dispositivos
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DeviceCard
            name="vps-eb441baa"
            label="VPS — Backend"
            description="integramosoe.com · Debian 12"
            icon={Server}
            color="bg-emerald-500/10 text-emerald-400"
            online={vpsOnline}
            uptime={vpsUptime}
            loading={vpsQuery.isLoading}
          />
          <DeviceCard
            name="tegra-ubuntu"
            label="Jetson TK1"
            description="Nodo edge · Ubuntu 14.04 · ARM"
            icon={Cpu}
            color="bg-sky-500/10 text-sky-400"
            online={false}
            loading={false}
          />
        </div>
        <p className="text-[10px] text-white/25 mt-2">
          La Jetson aparecerá en línea cuando el tunnel reverso SSH esté activo (requiere SIM).
        </p>
      </div>

      {/* Terminal */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">
          Terminal remota
        </p>
        <TerminalPanel defaultOpen={true} />
      </div>
    </div>
  );
}
