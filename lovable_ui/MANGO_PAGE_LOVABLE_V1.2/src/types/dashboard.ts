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

export interface AuthStatus {
  authenticated: boolean;
  user?: {
    email: string;
    name?: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: {
    email: string;
    name?: string;
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
