// Sensor state model for UI rendering
export type SensorState =
  | "loading"
  | "no-data"
  | "has-data"
  | "error"
  | "disconnected"
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

export type UserRole = "admin" | "viewer";

export interface AuthStatus {
  authenticated: boolean;
  user?: {
    email: string;
    name?: string;
    role?: UserRole;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
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
