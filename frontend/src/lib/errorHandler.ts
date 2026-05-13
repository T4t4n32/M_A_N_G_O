/**
 * Manejador centralizado de errores de API.
 *
 * Toda la app debe usar `handleApiError` para reaccionar a fallos de
 * peticiones (`ApiError` de `@/lib/api`) o errores inesperados. Garantiza:
 *   - Mensaje consistente en la UI mediante `toast.error` (sonner).
 *   - Detalle técnico (status, contexto, stack) registrado en `console.error`
 *     para depuración por parte de soporte.
 *
 * No re-lanza por defecto: el `try/catch` que invoque puede decidir si
 * continuar o no. Devuelve el `ApiError` cuando lo era (útil para
 * inspección del status, ej. `if (err?.status === 401) ...`).
 */
import { toast } from "sonner";
import { ApiError } from "@/lib/api";

type StatusBucket = "auth" | "forbidden" | "server" | "network" | "generic";

function bucketFor(status: number): StatusBucket {
  if (status === 401) return "auth";
  if (status === 403) return "forbidden";
  if (status === 0) return "network";
  if (status >= 500) return "server";
  return "generic";
}

const TITLES: Record<StatusBucket, string> = {
  auth: "Sesión no válida",
  forbidden: "Acceso denegado",
  server: "Error del servidor",
  network: "Sin conexión",
  generic: "Operación rechazada",
};

export interface HandleApiErrorOptions {
  /** Etiqueta opcional que se prepende al log técnico (ej. nombre del flujo). */
  context?: string;
  /** Mensaje a mostrar si NO es un ApiError reconocido. */
  fallbackMessage?: string;
  /** Si es false, no muestra toast (solo loggea). Útil para tests. */
  silent?: boolean;
}

export function handleApiError(
  err: unknown,
  options: HandleApiErrorOptions = {},
): ApiError | null {
  const { context, fallbackMessage, silent } = options;
  const tag = context ? `[${context}]` : "[api]";

  if (err instanceof ApiError) {
    const bucket = bucketFor(err.status);
    // Detalle técnico SIEMPRE va a consola para soporte.
    console.error(
      `${tag} ApiError status=${err.status} bucket=${bucket} :: ${err.detail}`,
      err,
    );
    if (!silent) {
      toast.error(TITLES[bucket], {
        description: err.message,
      });
    }
    return err;
  }

  const msg =
    err instanceof Error ? err.message : typeof err === "string" ? err : "Error desconocido";
  console.error(`${tag} Unhandled error:`, err);
  if (!silent) {
    toast.error(TITLES.generic, {
      description: fallbackMessage ?? msg,
    });
  }
  return null;
}

/**
 * Helper especializado para flujos `query` donde sólo se quiere loggear y
 * dejar que el componente muestre su propio fallback (sin toast).
 */
export function logApiError(err: unknown, context?: string) {
  return handleApiError(err, { context, silent: true });
}