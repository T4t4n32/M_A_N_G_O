import type {
  AuthStatus,
  LoginRequest,
  LoginResponse,
  HealthResponse,
  MetricsResponse,
  LatestByType,
  RangeData,
  SensorType,
  ContactRequest,
  ContactResponse,
  RegisterRequest,
  UserRecord,
  AlertStatus,
  AccessRequestRecord,
  SubmitAccessRequest,
  ReadingsLatestResponse,
  ReadingsHistoryResponse,
  SensorsStatusResponse,
  SystemStatusResponse,
  VersionResponse,
  DevicesResponse,
  DeviceRecord,
  SyncStatusResponse,
  EdgeStatusResponse,
  Mission,
  MissionsResponse,
  MissionResponse,
  SendCommandRequest,
  CommandResponse,
} from "@/types/dashboard";

export type { Mission };

const API_BASE = "/api/v1";
const REQUEST_TIMEOUT = 8000;

// ─── Error descriptivo con código HTTP ───────────────────────
export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, userMessage: string, detail: string) {
    super(userMessage);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

/** Mapeo de status HTTP → mensaje para el usuario + explicación técnica */
const HTTP_ERROR_MAP: Record<number, { user: string; detail: string }> = {
  400: {
    user: "Los datos enviados no son válidos.",
    detail: "HTTP 400 Bad Request — El servidor rechazó la petición porque el cuerpo o los parámetros no cumplen el formato esperado.",
  },
  401: {
    user: "Las credenciales son incorrectas o la sesión expiró.",
    detail: "HTTP 401 Unauthorized — El servidor no pudo autenticar al usuario. Verifique email y contraseña.",
  },
  403: {
    user: "No tiene permisos para acceder a este recurso.",
    detail: "HTTP 403 Forbidden — El usuario fue identificado pero no tiene autorización para esta acción.",
  },
  404: {
    user: "No se encontró una cuenta con ese email.",
    detail: "HTTP 404 Not Found — El endpoint o el recurso solicitado no existe en el servidor. Si es login, el usuario no está registrado.",
  },
  409: {
    user: "Ya existe una cuenta con ese email.",
    detail: "HTTP 409 Conflict — La operación genera un conflicto con el estado actual del recurso.",
  },
  422: {
    user: "Los datos enviados son incorrectos o incompletos.",
    detail: "HTTP 422 Unprocessable Entity — El servidor entiende la petición pero no puede procesarla por errores de validación.",
  },
  429: {
    user: "Demasiados intentos. Espere un momento antes de reintentar.",
    detail: "HTTP 429 Too Many Requests — Se excedió el límite de peticiones. Espere antes de reintentar.",
  },
  500: {
    user: "Error interno del servidor. Inténtelo más tarde.",
    detail: "HTTP 500 Internal Server Error — Ocurrió un error inesperado en el backend.",
  },
  502: {
    user: "El servidor no está disponible temporalmente.",
    detail: "HTTP 502 Bad Gateway — El servidor proxy no obtuvo una respuesta válida del backend.",
  },
  503: {
    user: "El servicio está en mantenimiento. Inténtelo más tarde.",
    detail: "HTTP 503 Service Unavailable — El servidor no puede procesar la petición en este momento.",
  },
  504: {
    user: "El servidor tardó demasiado en responder.",
    detail: "HTTP 504 Gateway Timeout — La conexión con el backend expiró antes de obtener respuesta.",
  },
};

function buildApiError(status: number, serverMessage?: string): ApiError {
  const mapped = HTTP_ERROR_MAP[status];
  if (mapped) {
    // If the server sent a custom message, prefer it for the user-facing text
    const userMsg = serverMessage || mapped.user;
    return new ApiError(status, userMsg, mapped.detail);
  }

  // Fallback genérico
  return new ApiError(
    status,
    serverMessage || `Error inesperado del servidor.`,
    `HTTP ${status} — El servidor respondió con un código no esperado.`
  );
}

// ─── Request base ────────────────────────────────────────────
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options?.headers,
      },
      signal: controller.signal,
    });

    // Guard: HTML instead of JSON (SPA fallback = backend not running)
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      throw new ApiError(
        0,
        "El servidor no respondió correctamente. Verifique que el backend está activo.",
        "La respuesta no tiene Content-Type: application/json. Probablemente el servidor de desarrollo está devolviendo el index.html como fallback."
      );
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw buildApiError(res.status, body.message || body.error);
    }

    return await res.json() as T;
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;

    const message = err instanceof Error ? err.message : "Error desconocido";

    if (
      message.includes("aborted") ||
      message.includes("AbortError") ||
      message === "Failed to fetch" ||
      message === "NetworkError when attempting to fetch resource." ||
      message === "Load failed"
    ) {
      throw new ApiError(
        0,
        "No se pudo conectar con el servidor. Verifique su conexión.",
        "La petición fue abortada o no se pudo establecer conexión TCP con el backend. Posibles causas: servidor apagado, firewall, DNS, o timeout."
      );
    }

    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Auth ────────────────────────────────────────────────────
export const checkAuth = () => request<AuthStatus>("/users/status");

export const login = (data: LoginRequest) =>
  request<LoginResponse>("/users/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const logout = () =>
  request<{ success: boolean }>("/users/logout", { method: "POST" });

// ─── User Management (admin) ────────────────────────────────
export const register = (data: RegisterRequest) =>
  request<{ success: boolean; message?: string }>("/users/register", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getUsers = () =>
  request<UserRecord[] | { users: UserRecord[] }>("/users/").then((res) =>
    Array.isArray(res) ? res : (res as { users: UserRecord[] }).users ?? []
  );

export const deleteUser = (userId: number) =>
  request<{ success: boolean }>(`/users/${userId}`, { method: "DELETE" });

export const changeUserPassword = (userId: number, password: string) =>
  request<{ ok: boolean }>(`/users/${userId}/password`, {
    method: "PATCH",
    body: JSON.stringify({ new_password: password }),
  });

export const updateUserName = (userId: number, name: string) =>
  request<{ ok: boolean }>(`/users/${userId}/name`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });

export const changeUserRole = (userId: number, role: string) =>
  request<{ ok: boolean }>(`/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });

export const execCommand = (command: string, target: "vps" | "jetson") =>
  request<{ stdout: string; stderr: string; returncode: number }>("/admin/exec", {
    method: "POST",
    body: JSON.stringify({ command, target }),
  });

export const getJetsonStatus = () =>
  request<{ online: boolean }>("/admin/jetson/status");

export const getEdgeStatus = () =>
  request<EdgeStatusResponse>("/edge/status");

export const requestDocLink = (path: string) =>
  request<{ url: string; expires_at: string; filename: string; ttl_minutes: number }>(
    "/docs/link",
    { method: "POST", body: JSON.stringify({ path }) },
  );

// ─── Health & Metrics ────────────────────────────────────────
export const getHealth = () => request<HealthResponse>("/health");

export const getMetrics = () => request<MetricsResponse>("/metrics");

// ─── Sensor Data ─────────────────────────────────────────────
export const getLatest = () => request<LatestByType>("/latest/by_type");

export const getRange = (type: SensorType, minutes: number) =>
  request<RangeData>(`/range?type=${type}&minutes=${minutes}`);

// ─── Contact ─────────────────────────────────────────────────
export const sendContact = (data: ContactRequest) =>
  request<ContactResponse>("/contact", {
    method: "POST",
    body: JSON.stringify(data),
  });

// ─── Alerts & SMS notifications ──────────────────────────────
export const getAlertStatus = () =>
  request<AlertStatus>("/alerts/status");

// ─── Access requests (tier upgrade) ──────────────────────────
export const submitAccessRequest = (data: SubmitAccessRequest) =>
  request<{ ok: boolean; request: AccessRequestRecord }>("/access-requests", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getMyAccessRequests = () =>
  request<{ requests: AccessRequestRecord[] }>("/access-requests/mine");

export const getAccessRequests = (status?: string) =>
  request<{ requests: AccessRequestRecord[] }>(
    `/access-requests${status ? `?status=${status}` : ""}`
  );

export const approveAccessRequest = (id: number, adminNote?: string) =>
  request<{ ok: boolean; request: AccessRequestRecord }>(`/access-requests/${id}/approve`, {
    method: "PATCH",
    body: JSON.stringify({ admin_note: adminNote }),
  });

export const rejectAccessRequest = (id: number, adminNote: string) =>
  request<{ ok: boolean; request: AccessRequestRecord }>(`/access-requests/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ admin_note: adminNote }),
  });

// ─── Protocol-aligned readings (/api/v1/readings/*) ──────────
export const getReadingsLatest = () =>
  request<ReadingsLatestResponse>("/readings/latest");

export const getReadingsHistory = (type: SensorType, minutes = 60, limit = 360) =>
  request<ReadingsHistoryResponse>(`/readings/history?type=${type}&minutes=${minutes}&limit=${limit}`);

export const getReadingsExportUrl = (type: SensorType, hours = 24) =>
  `${API_BASE}/readings/export?type=${type}&hours=${hours}`;

// ─── Sensors system status (/api/v1/sensors/status) ──────────
export const getSensorsStatus = () =>
  request<SensorsStatusResponse>("/sensors/status");

// ─── System status + version ──────────────────────────────────
export const getSystemStatus = () =>
  request<SystemStatusResponse>("/status");

export const getVersion = () =>
  request<VersionResponse>("/version");

// ─── Device registry (/api/v1/devices) ───────────────────────
export const getDevices = () =>
  request<DevicesResponse>("/devices");

export const getDevice = (deviceId: string) =>
  request<DeviceRecord>(`/devices/${deviceId}`);

// ─── Sync coordination (/api/v1/sync) ────────────────────────
export const getSyncStatus = () =>
  request<SyncStatusResponse>("/sync/status");

// ─── Mission system (/api/v1/missions) ───────────────────────
export const getMissions = (params?: { device_id?: string; state?: string; limit?: number }) => {
  const qs = new URLSearchParams();
  if (params?.device_id) qs.set("device_id", params.device_id);
  if (params?.state) qs.set("state", params.state);
  if (params?.limit != null) qs.set("limit", String(params.limit));
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return request<MissionsResponse>(`/missions${query}`);
};

export const getMission = (missionId: string) =>
  request<MissionResponse>(`/missions/${encodeURIComponent(missionId)}`);

export const sendCommand = (body: SendCommandRequest) =>
  request<CommandResponse>("/commands", {
    method: "POST",
    body: JSON.stringify(body),
  });

// ─── Panel Emma — file uploads (/api/v1/admin/upload*) ───────────────────────

export interface UploadedFileRecord {
  id: number;
  stored_name: string;
  original_name: string;
  url: string;
  kind: "image" | "video" | "document";
  title: string;
  description: string | null;
  category: string | null;
  size: number;
  mime_type: string | null;
  uploaded_at: string;
}

/**
 * Upload a file to the backend via XHR for progress tracking.
 * Returns the server record (with public URL) on success.
 */
export function uploadFile(
  file: File,
  opts: { kind?: string; title: string; category: string; description: string },
  onProgress: (pct: number) => void,
): Promise<UploadedFileRecord> {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", opts.title);
    fd.append("category", opts.category);
    fd.append("description", opts.description);
    if (opts.kind) fd.append("kind", opts.kind);

    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.min(90, Math.round((e.loaded / e.total) * 90)));
    };
    xhr.onload = () => {
      onProgress(100);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as UploadedFileRecord);
        } catch {
          reject(new Error("Respuesta inválida del servidor."));
        }
      } else {
        let msg = `Error HTTP ${xhr.status} al subir el archivo.`;
        try {
          const j = JSON.parse(xhr.responseText);
          if (j.error) msg = j.error;
        } catch { /* ignore */ }
        reject(new Error(msg));
      }
    };
    xhr.onerror = () => reject(new Error("Error de red al subir el archivo."));
    xhr.open("POST", `${API_BASE}/admin/upload`);
    xhr.send(fd);
  });
}

export const listServerUploads = (kind?: "image" | "video" | "document") =>
  request<{ items: UploadedFileRecord[]; total: number }>(
    `/admin/uploads${kind ? `?kind=${kind}` : ""}`,
  );

export const deleteServerUpload = (id: number) =>
  request<{ ok: boolean }>(`/admin/uploads/${id}`, { method: "DELETE" });

export const patchServerUpload = (
  id: number,
  patch: { title?: string; description?: string; category?: string },
) =>
  request<UploadedFileRecord>(`/admin/uploads/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });

/** Public — no auth required. Returns only PDF documents uploaded via Panel Emma. */
export const listPublicDocs = () =>
  request<{ items: UploadedFileRecord[]; total: number }>("/public/docs");
