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
} from "@/types/dashboard";

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

export const getUsers = () => request<UserRecord[]>("/users");

export const deleteUser = (userId: string) =>
  request<{ success: boolean }>(`/users/${userId}`, { method: "DELETE" });

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
