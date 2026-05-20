import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

const SSE_URL = "/api/v1/stream";
const INITIAL_RETRY = 1_000;
const MAX_RETRY = 30_000;

/**
 * Opens an SSE connection to /api/v1/stream and invalidates the
 * ["latest-by-type"] query whenever the backend publishes a new reading.
 *
 * Reconnects automatically with exponential backoff (1s → 30s cap).
 * The heartbeat event resets the backoff counter without triggering a refetch.
 */
export function useSensorStream() {
  const queryClient = useQueryClient();
  const esRef = useRef<EventSource | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryMs = useRef(INITIAL_RETRY);

  useEffect(() => {
    let destroyed = false;

    function connect() {
      if (destroyed) return;

      const es = new EventSource(SSE_URL, { withCredentials: true });
      esRef.current = es;

      es.onmessage = () => {
        retryMs.current = INITIAL_RETRY;
        queryClient.invalidateQueries({ queryKey: ["latest-by-type"] });
      };

      es.addEventListener("heartbeat", () => {
        retryMs.current = INITIAL_RETRY;
      });

      es.onerror = () => {
        es.close();
        esRef.current = null;
        if (!destroyed) {
          timerRef.current = setTimeout(() => {
            retryMs.current = Math.min(retryMs.current * 2, MAX_RETRY);
            connect();
          }, retryMs.current);
        }
      };
    }

    connect();

    return () => {
      destroyed = true;
      esRef.current?.close();
      esRef.current = null;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [queryClient]);
}
