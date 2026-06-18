// Sensor state model for UI rendering
export type SensorState =
  | "loading"
  | "no-data"          // no readings in DB
  | "has-data"         // device online, sending data < 5 min ago
  | "stale"            // data 5 min–1 h old: device was on, now quiet
  | "offline"          // data > 1 h old: device off / out of field
  | "error"
  | "disconnected"     // legacy alias for offline
  | "needs_calibration"
  | "hardware_issue";

export type SensorType = "ph" | "temperature" | "turbidity";

// ─── Contact Form ────────────────────────────────────────────
export interface ContactRequest {
  name: string;
  email: string;
  institution: string;
  message: string;
}

export interface ContactResponse {
  success: boolean;
  message?: string;
}

export interface SensorReading {
  value: number;
  timestamp: string;
  unit: string;
  connected?: boolean;
  status?: "operational" | "needs_calibration" | "hardware_issue" | "unknown";
  hardware_note?: string;
}

export interface LatestByType {
  ph?: SensorReading;
  temperature?: SensorReading;
  turbidity?: SensorReading;
}

export interface RangePoint {
  ts: string;
  value: number;
}

export interface RangeData {
  type: SensorType;
  count: number;
  series: RangePoint[];
}

export interface HealthResponse {
  status: "ok" | "degraded" | "error";
  timestamp?: string;
}

export interface MetricsResponse {
  available: SensorType[];
}

export type UserRole = "admin" | "estudiante" | "institucional";

export type TierName =
  | "none"
  | "registrado_basico"
  | "documental_premium"
  | "dataline_low"
  | "dataline_high"
  | "institutional"
  | "admin";

export const TIER_ORDER: Record<TierName, number> = {
  none:              0,
  registrado_basico: 1,
  documental_premium: 2,
  dataline_low:      3,
  dataline_high:     4,
  institutional:     5,
  admin:             6,
};

export const TIER_LABELS: Record<TierName, string> = {
  none:              "Público",
  registrado_basico: "Registrado Básico",
  documental_premium: "Documental Premium",
  dataline_low:      "DataLine Low",
  dataline_high:     "DataLine High",
  institutional:     "Institucional",
  admin:             "Administrativo Interno",
};

export interface AuthStatus {
  authenticated: boolean;
  user?: {
    id?: number;
    email: string;
    name?: string;
    role?: UserRole;
    tier?: TierName;
  };
}

export interface AccessRequestRecord {
  id: number;
  user_id: number;
  user_email?: string;
  user_name?: string;
  requested_tier: TierName;
  motivation?: string;
  status: "pending" | "approved" | "rejected";
  reviewed_by_id?: number;
  reviewed_at?: string;
  admin_note?: string;
  created_at: string;
}

export interface SubmitAccessRequest {
  requested_tier: TierName;
  motivation?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: "estudiante" | "institucional";
}

export interface UserRecord {
  id: number;
  email: string;
  name?: string;
  role: UserRole;
  active?: boolean;
  login_count?: number;
  created_at?: string;
  last_login?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  ok: boolean;
  message?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    role?: UserRole;
  };
}

// Alert system types
export type AlertLevel = "normal" | "warning" | "critical";

export interface SensorThreshold {
  type: SensorType;
  label: string;
  unit: string;
  warningLow: number;
  warningHigh: number;
  criticalLow: number;
  criticalHigh: number;
  optimalLow: number;
  optimalHigh: number;
}

export interface SensorAlert {
  type: SensorType;
  level: AlertLevel;
  message: string;
  value?: number;
  range: { low: number; high: number };
}

export interface SystemAlert {
  level: AlertLevel;
  title: string;
  message: string;
  sensorAlerts: SensorAlert[];
  criticalCount: number;
  warningCount: number;
}

// SMS alert system — backend-managed
export interface AlertEvent {
  id: number;
  station_name: string | null;
  sensor_type: string;
  value: number | null;
  alert_level: string;
  message: string | null;
  sms_sent: boolean;
  sms_sent_at: string | null;
  sms_error: string | null;
  measured_at: string | null;
  created_at: string;
  contact_id: number | null;
}

export type MaintenanceAlertType =
  | "no_data"
  | "station_offline"
  | "no_contacts"
  | "no_rules"
  | "calibration_due";

export interface MaintenanceAlert {
  type: MaintenanceAlertType;
  level: "warning" | "critical";
  message: string;
}

export interface AlertStatus {
  last_sms: AlertEvent | null;
  recent_events: AlertEvent[];
  stats: {
    sent_today: number;
    sent_last_24h: number;
    active_rules: number;
    active_contacts: number;
  };
  maintenance_alerts: MaintenanceAlert[];
}

// ─── Protocol-aligned reading types (/api/v1/readings/*) ─────
export type ConnectionStatus = "online" | "stale" | "offline" | "no_data";
export type ValueStatus = "optimal" | "normal" | "warning" | "critical" | "unknown";

export interface ReadingSensorEntry {
  value: number | null;
  unit: string;
  timestamp: string | null;
  status: ConnectionStatus;
  value_status: ValueStatus;
}

export interface ReadingsLatestResponse {
  status: ConnectionStatus | "no_data";
  server_time: string;
  sensors: Record<SensorType, ReadingSensorEntry | null>;
}

export interface ReadingsHistoryPoint {
  ts: string;
  value: number | null;
}

export interface ReadingsHistoryResponse {
  type: SensorType;
  minutes: number;
  count: number;
  series: ReadingsHistoryPoint[];
}

// ─── Sensors system status (/api/v1/sensors/status) ──────────
export interface SensorsStatusResponse {
  system_status: "online" | "stale" | "offline";
  server_time: string;
  sensors: Record<SensorType, {
    status: ConnectionStatus;
    value_status: ValueStatus;
    value: number | null;
    unit: string;
    timestamp: string | null;
  }>;
}

// ─── System status (/api/v1/status) ──────────────────────────
export interface SystemStatusResponse {
  status: "online" | "stale" | "offline";
  db: "ok" | "error";
  readings_total: number;
  devices_registered: number;
  last_reading_ts: string | null;
  server_time: string;
  version: string;
}

// ─── Version (/api/v1/version) ───────────────────────────────
export interface VersionResponse {
  project: string;
  version: string;
  protocol: string;
  api_prefix: string;
}

// ─── Device registry (/api/v1/devices) ───────────────────────
export type DeviceStatus = "online" | "stale" | "offline" | "maintenance" | "unknown";

export interface ModemSnapshot {
  available: boolean;
  connected: boolean;
  status: string | null;
  network_type: string | null;
  signal_bars: number | null;
  rssi: number | null;
  rsrp: number | null;
  rsrq: number | null;
  sinr: number | null;
  band: string | null;
  operator: string | null;
  session_upload_bytes: number | null;
  session_download_bytes: number | null;
  total_upload_bytes: number | null;
  total_download_bytes: number | null;
  session_seconds: number | null;
  modem_sampled_at: string | null;
  reported_at: string | null;
  updated_at: string | null;
}

export interface DeviceRecord {
  device_id: string;
  station_name: string | null;
  last_seen: string | null;
  last_seq: number | null;
  total_packets: number;
  status: DeviceStatus;
  age_seconds: number | null;
  registered_at: string;
  modem?: ModemSnapshot | null;
}

export interface DevicesResponse {
  devices: DeviceRecord[];
  count: number;
}

export interface EdgeStatusResponse {
  server_time: string;
  devices: DeviceRecord[];
  count: number;
}

// ─── Sync status (/api/v1/sync/status) ───────────────────────
export interface SyncStatusResponse {
  server_time: string;
  total_packets_received: number;
  total_readings_stored: number;
  devices: Array<DeviceRecord & { sync_state: string }>;
}

// ─── Mission system ───────────────────────────────────────────
export type MissionState =
  | "BOOT" | "SELF_CHECK" | "IDLE" | "ARMED"
  | "FIELD_RUNNING" | "PAUSED" | "RETURNING"
  | "ERROR" | "MISSION_FINISHED" | "SYNCING" | "STANDBY";

export interface Mission {
  id: number;
  mission_id: string;
  device_id: string | null;
  state: MissionState;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  summary: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MissionsResponse {
  missions: Mission[];
}

export interface MissionResponse {
  mission: Mission;
}

export type MissionCommand =
  | "ARM" | "START_FIELD" | "START_TEST"
  | "PAUSE" | "RESUME" | "STOP"
  | "SYNC_DATA" | "CALIBRATE_SENSOR";

export interface SendCommandRequest {
  device_id: string;
  command: MissionCommand | string;
  mission_id?: string;
  params?: Record<string, unknown>;
}

export interface CommandResponse {
  ok: boolean;
  command: {
    id: number;
    device_id: string;
    mission_id: string | null;
    command: string;
    status: string;
    issued_at: string;
  };
}

// IMU / BNO080 types (future)
export type ImuState =
  | "not_configured"
  | "disconnected"
  | "loading"
  | "active"
  | "error";

export interface ImuStatus {
  connected: boolean;
  streaming: boolean;
  sensor: string;
  rate_hz?: number;
}

export interface ImuFrame {
  ts: string;
  quaternion: { w: number; x: number; y: number; z: number };
  euler?: { roll: number; pitch: number; yaw: number };
  accuracy?: number;
}
