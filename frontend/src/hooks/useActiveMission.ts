import { useQuery } from "@tanstack/react-query";
import { getMissions } from "@/lib/api";
import type { Mission } from "@/types/dashboard";

export type OperationalContext =
  | "loading"
  | "standby"    // no active mission — device not deployed
  | "armed"      // mission ARMED / BOOT / SELF_CHECK — about to deploy
  | "field"      // FIELD_RUNNING / SYNCING — active data collection
  | "paused"     // PAUSED — field session temporarily stopped
  | "returning"; // RETURNING — field session ending

const ACTIVE_STATES = new Set([
  "BOOT", "SELF_CHECK", "ARMED",
  "FIELD_RUNNING", "PAUSED", "RETURNING", "SYNCING",
]);

function deriveContext(mission: Mission | null): OperationalContext {
  if (!mission) return "standby";
  switch (mission.state) {
    case "BOOT":
    case "SELF_CHECK":
    case "ARMED":
      return "armed";
    case "FIELD_RUNNING":
    case "SYNCING":
      return "field";
    case "PAUSED":
      return "paused";
    case "RETURNING":
      return "returning";
    default:
      return "standby";
  }
}

export interface ActiveMissionResult {
  activeMission: Mission | null;
  lastMission:   Mission | null;
  context:       OperationalContext;
  isLoading:     boolean;
}

export function useActiveMission(): ActiveMissionResult {
  const query = useQuery({
    queryKey:       ["missions-active"],
    queryFn:        () => getMissions({ limit: 20 }),
    refetchInterval: 30_000,
    staleTime:       15_000,
    retry:           1,
    retryDelay:      3000,
  });

  if (query.isLoading) {
    return { activeMission: null, lastMission: null, context: "loading", isLoading: true };
  }

  const missions = query.data?.missions ?? [];
  const active   = missions.find((m) => ACTIVE_STATES.has(m.state)) ?? null;
  const last     = missions[0] ?? null;

  return {
    activeMission: active,
    lastMission:   last,
    context:       deriveContext(active),
    isLoading:     false,
  };
}
