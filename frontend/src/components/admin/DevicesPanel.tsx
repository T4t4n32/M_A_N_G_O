import { useQuery } from "@tanstack/react-query";
import {
  Server, Cpu, Wifi, WifiOff, RefreshCw, Radio,
  Signal, SignalHigh, SignalLow, SignalZero, SignalMedium,
  ArrowUp, ArrowDown, Globe, Antenna,
} from "lucide-react";
import { WsTerminal } from "@/components/dashboard/WsTerminal";
import { getHealth, getJetsonStatus, getEdgeStatus } from "@/lib/api";
import type { HealthResponse, EdgeStatusResponse, ModemSnapshot } from "@/types/dashboard";

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

// ── Signal bar icon helper ────────────────────────────────────────────────────
function SignalBars({ bars }: { bars: number | null | undefined }) {
  const cls = "h-3.5 w-3.5";
  if (bars === null || bars === undefined) return <SignalZero className={`${cls} text-white/20`} />;
  if (bars <= 1) return <SignalLow className={`${cls} text-red-400`} />;
  if (bars <= 2) return <SignalMedium className={`${cls} text-amber-400`} />;
  if (bars <= 3) return <SignalHigh className={`${cls} text-emerald-400`} />;
  return <Signal className={`${cls} text-emerald-400`} />;
}

function fmtBytes(bytes: number | null | undefined): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

// ── Modem status card ─────────────────────────────────────────────────────────
function ModemCard({ modem }: { modem: ModemSnapshot | null | undefined }) {
  if (!modem) {
    return (
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
        <div className="flex items-center gap-2 mb-2">
          <Antenna className="h-3.5 w-3.5 text-white/20" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/25">
            Modem LTE — sin datos
          </span>
        </div>
        <p className="text-[10px] text-white/25">
          El watchdog aun no ha reportado telemetria. Verifica que mango-node-modem este activo.
        </p>
      </div>
    );
  }

  const lteColor = modem.available && modem.connected
    ? "text-sky-400"
    : modem.available
      ? "text-amber-400"
      : "text-white/25";

  const lteBorder = modem.available && modem.connected
    ? "border-sky-500/20 bg-sky-500/[0.04]"
    : modem.available
      ? "border-amber-500/20 bg-amber-500/[0.03]"
      : "border-white/[0.06] bg-white/[0.02]";

  return (
    <div className={`rounded-lg border p-3 transition-all duration-500 ${lteBorder}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <Antenna className={`h-3.5 w-3.5 ${lteColor}`} />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
            Huawei E3372H-153
          </span>
        </div>
        <div className="flex items-center gap-2">
          {modem.available && <SignalBars bars={modem.signal_bars} />}
          <span className={`text-[10px] font-bold uppercase tracking-wider ${lteColor}`}>
            {!modem.available
              ? "Sin modem"
              : modem.connected
                ? modem.network_type || "LTE"
                : "Desconectado"}
          </span>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <MetricCell
          label="Operador"
          value={modem.operator || "—"}
          dim={!modem.available}
        />
        <MetricCell
          label="Banda"
          value={modem.band || "—"}
          dim={!modem.available}
        />
        <MetricCell
          label="RSSI"
          value={modem.rssi != null ? `${modem.rssi} dBm` : "—"}
          dim={!modem.available}
          warn={modem.rssi != null && modem.rssi < -100}
        />
        <MetricCell
          label="SINR"
          value={modem.sinr != null ? `${modem.sinr} dB` : "—"}
          dim={!modem.available}
        />
      </div>

      {/* Traffic row */}
      {modem.available && (
        <div className="flex items-center gap-4 mt-2.5 pt-2.5 border-t border-white/[0.06]">
          <div className="flex items-center gap-1.5 text-[10px] text-white/40">
            <ArrowUp className="h-3 w-3 text-sky-400/60" />
            <span className="font-mono">{fmtBytes(modem.session_upload_bytes)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-white/40">
            <ArrowDown className="h-3 w-3 text-emerald-400/60" />
            <span className="font-mono">{fmtBytes(modem.session_download_bytes)}</span>
          </div>
          {modem.reported_at && (
            <span className="ml-auto text-[9px] text-white/20 font-mono">
              {new Date(modem.reported_at).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function MetricCell({
  label, value, dim, warn,
}: { label: string; value: string; dim?: boolean; warn?: boolean }) {
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-widest text-white/20 mb-0.5">
        {label}
      </p>
      <p className={`text-[11px] font-mono ${
        dim ? "text-white/20" : warn ? "text-amber-300" : "text-white/60"
      }`}>
        {value}
      </p>
    </div>
  );
}

// ── Device card ───────────────────────────────────────────────────────────────
function DeviceCard({
  name, label, description, icon: Icon, accentColor,
  online, loading, uptime, extra,
}: {
  name: string; label: string; description: string;
  icon: React.ElementType; accentColor: string;
  online: boolean; loading: boolean; uptime?: number;
  extra?: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border transition-all duration-500 ${
      online ? "border-white/[0.12] bg-white/[0.035]" : "border-white/[0.06] bg-white/[0.015]"
    }`}>
      <div className="p-4 flex flex-col gap-3">
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

        <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-white/[0.06]">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-white/25 mb-1">Hostname</p>
            <p className={`text-[11px] font-mono ${online ? "text-white/70" : "text-white/25"}`}>{name}</p>
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-white/25 mb-1">Uptime</p>
            <p className={`text-[11px] font-mono ${online ? "text-white/70" : "text-white/25"}`}>
              <UptimeStr seconds={uptime} />
            </p>
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-white/25 mb-1">Acceso</p>
            <p className={`text-[11px] ${online ? "text-white/60" : "text-white/20"}`}>
              {online ? (
                <span className="flex items-center gap-1"><Wifi className="h-3 w-3" /> Activo</span>
              ) : (
                <span className="flex items-center gap-1"><WifiOff className="h-3 w-3" /> Inactivo</span>
              )}
            </p>
          </div>
        </div>

        {extra && <div className="pt-1 border-t border-white/[0.06]">{extra}</div>}
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
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

  const edgeQuery = useQuery<EdgeStatusResponse>({
    queryKey: ["admin-edge-status"],
    queryFn: getEdgeStatus,
    refetchInterval: 60_000,
    retry: 1,
  });

  const vpsOnline    = vpsQuery.data?.status === "ok";
  const jetsonOnline = jetsonQuery.data?.online === true;

  // Find the modem snapshot for the Jetson device (first device, or by station name)
  const jetsonDevice = edgeQuery.data?.devices?.[0];
  const modemSnapshot = jetsonDevice?.modem ?? null;

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
            Actualizacion automatica
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
            extra={<ModemCard modem={modemSnapshot} />}
          />
        </div>
      </div>

      {/* ── Modem telemetry detail (only when edge data is available) ── */}
      {jetsonDevice && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
              Conectividad LTE — Huawei E3372H-153
            </p>
            {edgeQuery.isFetching && (
              <RefreshCw className="h-3 w-3 text-white/20 animate-spin" />
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <TelemetryTile
              label="Total descarga"
              value={fmtBytes(modemSnapshot?.total_download_bytes)}
              icon={<ArrowDown className="h-3.5 w-3.5 text-emerald-400" />}
            />
            <TelemetryTile
              label="Total subida"
              value={fmtBytes(modemSnapshot?.total_upload_bytes)}
              icon={<ArrowUp className="h-3.5 w-3.5 text-sky-400" />}
            />
            <TelemetryTile
              label="RSRP"
              value={modemSnapshot?.rsrp != null ? `${modemSnapshot.rsrp} dBm` : "—"}
              icon={<Globe className="h-3.5 w-3.5 text-violet-400" />}
            />
            <TelemetryTile
              label="Paquetes recibidos"
              value={jetsonDevice.total_packets.toLocaleString("es")}
              icon={<Signal className="h-3.5 w-3.5 text-amber-400" />}
            />
          </div>
        </div>
      )}

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

function TelemetryTile({
  label, value, icon,
}: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <p className="text-[9px] font-semibold uppercase tracking-widest text-white/30">{label}</p>
      </div>
      <p className="text-sm font-mono font-semibold text-white/70">{value}</p>
    </div>
  );
}
