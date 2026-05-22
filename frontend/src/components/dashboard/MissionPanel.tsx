import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Target, Play, Square, Pause, RotateCcw,
  CheckSquare, RefreshCw, Shield, AlertTriangle,
  Clock, Zap,
} from "lucide-react";
import { getMissions, sendCommand } from "@/lib/api";
import type { Mission, MissionState } from "@/types/dashboard";

// ─── State color / label map ──────────────────────────────────────────────────

type StateMeta = {
  label: string;
  bg: string;
  text: string;
  pulse?: boolean;
};

const STATE_META: Record<string, StateMeta> = {
  BOOT:             { label: "Boot",            bg: "bg-blue-500/15",   text: "text-blue-300" },
  SELF_CHECK:       { label: "Self-Check",      bg: "bg-blue-500/15",   text: "text-blue-300" },
  IDLE:             { label: "Idle",            bg: "bg-white/[0.07]",  text: "text-white/45" },
  STANDBY:          { label: "Standby",         bg: "bg-white/[0.07]",  text: "text-white/45" },
  ARMED:            { label: "Armed",           bg: "bg-amber-500/15",  text: "text-amber-300" },
  FIELD_RUNNING:    { label: "Field Running",   bg: "bg-emerald-500/15",text: "text-emerald-300", pulse: true },
  PAUSED:           { label: "Paused",          bg: "bg-yellow-500/15", text: "text-yellow-300" },
  RETURNING:        { label: "Returning",       bg: "bg-sky-500/15",    text: "text-sky-300" },
  ERROR:            { label: "Error",           bg: "bg-red-500/15",    text: "text-red-300" },
  MISSION_FINISHED: { label: "Finished",        bg: "bg-purple-500/15", text: "text-purple-300" },
  SYNCING:          { label: "Syncing",         bg: "bg-purple-500/15", text: "text-purple-300", pulse: true },
};

function StateBadge({ state }: { state: string }) {
  const meta = STATE_META[state] ?? { label: state, bg: "bg-white/[0.07]", text: "text-white/40" };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${meta.bg} ${meta.text} border border-current/10`}
    >
      {meta.pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      {meta.label}
    </span>
  );
}

// ─── Valid state transitions ──────────────────────────────────────────────────

const TRANSITIONS: Record<string, string[]> = {
  IDLE:             ["ARM"],
  ARMED:            ["START_FIELD", "START_TEST", "STOP"],
  FIELD_RUNNING:    ["PAUSE", "STOP"],
  PAUSED:           ["RESUME", "STOP"],
  RETURNING:        ["STOP"],
  ERROR:            ["STOP"],
  MISSION_FINISHED: ["SYNC_DATA"],
};

const COMMAND_META: Record<string, { label: string; icon: React.ElementType; danger?: boolean }> = {
  ARM:              { label: "ARM",        icon: Shield },
  START_FIELD:      { label: "Start Field",icon: Play },
  START_TEST:       { label: "Start Test", icon: Play },
  PAUSE:            { label: "Pause",      icon: Pause },
  RESUME:           { label: "Resume",     icon: Play },
  STOP:             { label: "Stop",       icon: Square, danger: true },
  SYNC_DATA:        { label: "Sync Data",  icon: RefreshCw },
  CALIBRATE_SENSOR: { label: "Calibrate",  icon: CheckSquare },
};

// ─── Duration formatter ───────────────────────────────────────────────────────

function fmtDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-MX", {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ─── Command confirmation dialog ──────────────────────────────────────────────

function ConfirmDialog({
  command, onConfirm, onCancel,
}: {
  command: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="rounded-xl border border-white/[0.1] bg-[hsl(205,35%,10%)] p-6 w-80 shadow-2xl">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-semibold text-white/80">Confirm Command</span>
        </div>
        <p className="text-[13px] text-white/55 mb-5">
          Issue command <span className="text-white/85 font-mono font-semibold">{command}</span> to the active device?
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-[12px] text-white/45 border border-white/[0.08] hover:text-white/70 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-[hsl(168,72%,42%)]/20 border border-[hsl(168,72%,42%)]/30 text-[hsl(168,72%,55%)] hover:bg-[hsl(168,72%,42%)]/30 transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface MissionPanelProps {
  isAdmin?: boolean;
}

export function MissionPanel({ isAdmin = false }: MissionPanelProps) {
  const queryClient = useQueryClient();
  const [pendingCommand, setPendingCommand] = useState<{ command: string; deviceId: string; missionId?: string } | null>(null);
  const [cmdResult, setCmdResult] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["missions"],
    queryFn: () => getMissions({ limit: 10 }),
    refetchInterval: 10_000,
  });

  const missions: Mission[] = data?.missions ?? [];
  const current = missions.find(
    (m) => !["MISSION_FINISHED", "SYNCING", "STANDBY"].includes(m.state)
  ) ?? missions[0] ?? null;

  const cmdMutation = useMutation({
    mutationFn: sendCommand,
    onSuccess: () => {
      setCmdResult("Command issued.");
      queryClient.invalidateQueries({ queryKey: ["missions"] });
      setTimeout(() => setCmdResult(null), 3000);
    },
    onError: (err: Error) => {
      setCmdResult(`Error: ${err.message}`);
      setTimeout(() => setCmdResult(null), 4000);
    },
  });

  const handleCommand = (command: string) => {
    if (!current) return;
    setPendingCommand({ command, deviceId: current.device_id ?? "mango-field-unit-01", missionId: current.mission_id });
  };

  const confirmCommand = () => {
    if (!pendingCommand) return;
    cmdMutation.mutate({
      device_id: pendingCommand.deviceId,
      command: pendingCommand.command,
      mission_id: pendingCommand.missionId,
    });
    setPendingCommand(null);
  };

  const allowedCommands = current ? (TRANSITIONS[current.state] ?? []) : [];

  // Stats
  const totalMissions = missions.length;
  const finishedToday = missions.filter((m) => {
    if (!m.ended_at) return false;
    const d = new Date(m.ended_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;
  const totalFieldSeconds = missions.reduce(
    (acc, m) => acc + (m.duration_seconds ?? 0), 0
  );

  return (
    <>
      {pendingCommand && (
        <ConfirmDialog
          command={pendingCommand.command}
          onConfirm={confirmCommand}
          onCancel={() => setPendingCommand(null)}
        />
      )}

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
        {/* Top accent */}
        <div className="h-0.5 w-full bg-gradient-to-r from-[hsl(168,72%,42%)]/60 via-[hsl(204,70%,53%)]/30 to-transparent" />

        <div className="p-5 space-y-5">
          {/* ── Current mission header ── */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Active Mission</p>
              <p className="text-sm font-mono font-semibold text-white/80">
                {current?.mission_id ?? "—"}
              </p>
              {current?.device_id && (
                <p className="text-[11px] text-white/30 mt-0.5">{current.device_id}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {current && <StateBadge state={current.state} />}
              <button
                onClick={() => refetch()}
                className="p-1.5 rounded-lg text-white/30 hover:text-white/60 border border-white/[0.06] hover:border-white/[0.12] transition-colors"
                aria-label="Refresh missions"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* ── Command buttons (admin only) ── */}
          {isAdmin && (
            <div className="space-y-2">
              <p className="text-[10px] text-white/25 uppercase tracking-widest">Commands</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(COMMAND_META).map(([cmd, meta]) => {
                  const Icon = meta.icon;
                  const allowed = allowedCommands.includes(cmd);
                  return (
                    <button
                      key={cmd}
                      onClick={() => handleCommand(cmd)}
                      disabled={!allowed || cmdMutation.isPending}
                      className={[
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-150",
                        allowed && !cmdMutation.isPending
                          ? meta.danger
                            ? "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                            : "border-[hsl(168,72%,42%)]/30 bg-[hsl(168,72%,42%)]/10 text-[hsl(168,72%,55%)] hover:bg-[hsl(168,72%,42%)]/20"
                          : "border-white/[0.06] bg-transparent text-white/20 cursor-not-allowed",
                      ].join(" ")}
                    >
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
              {cmdResult && (
                <p className="text-[11px] text-[hsl(168,72%,55%)] mt-1">{cmdResult}</p>
              )}
            </div>
          )}

          {/* ── Stats row ── */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Target,  label: "Total Missions",   value: String(totalMissions) },
              { icon: Clock,   label: "Field Time Today", value: finishedToday > 0 ? fmtDuration(totalFieldSeconds) : "—" },
              { icon: Zap,     label: "Missions Today",   value: String(finishedToday) },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="h-3 w-3 text-[hsl(168,72%,42%)]" />
                  <span className="text-[9px] text-white/30 uppercase tracking-wider">{label}</span>
                </div>
                <span className="text-base font-semibold text-white/75">{value}</span>
              </div>
            ))}
          </div>

          {/* ── Mission history table ── */}
          <div>
            <p className="text-[10px] text-white/25 uppercase tracking-widest mb-2">Recent Missions</p>

            {isLoading && (
              <p className="text-[12px] text-white/30 py-4 text-center">Loading...</p>
            )}
            {isError && (
              <p className="text-[12px] text-red-400/70 py-4 text-center">Failed to load missions.</p>
            )}

            {!isLoading && !isError && missions.length === 0 && (
              <p className="text-[12px] text-white/25 py-4 text-center">No missions recorded.</p>
            )}

            {missions.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-white/25 uppercase tracking-wider">
                      <th className="text-left px-3 py-2 font-medium">Mission ID</th>
                      <th className="text-left px-3 py-2 font-medium">State</th>
                      <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">Device</th>
                      <th className="text-left px-3 py-2 font-medium hidden md:table-cell">Started</th>
                      <th className="text-left px-3 py-2 font-medium hidden md:table-cell">Ended</th>
                      <th className="text-right px-3 py-2 font-medium">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {missions.map((m) => (
                      <tr
                        key={m.mission_id}
                        className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-3 py-2 font-mono text-white/65 max-w-[160px] truncate">
                          {m.mission_id}
                        </td>
                        <td className="px-3 py-2">
                          <StateBadge state={m.state} />
                        </td>
                        <td className="px-3 py-2 text-white/35 hidden sm:table-cell">
                          {m.device_id ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-white/35 hidden md:table-cell">
                          {fmtDate(m.started_at)}
                        </td>
                        <td className="px-3 py-2 text-white/35 hidden md:table-cell">
                          {fmtDate(m.ended_at)}
                        </td>
                        <td className="px-3 py-2 text-right text-white/45 tabular-nums">
                          {fmtDuration(m.duration_seconds)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
