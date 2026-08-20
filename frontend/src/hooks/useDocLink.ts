import { useCallback, useState } from "react";
import { requestDocLink } from "@/lib/api";

/** Document formats exposed by the docs listings. */
export const DOC_FORMATS = ["PDF", "DOCX", "XLSX", "PPTX", "MD", "TXT", "ZIP"];

export type DocLinkState =
  | { s: "idle" }
  | { s: "loading" }
  | { s: "ready"; url: string; filename: string }
  | { s: "error"; msg: string };

/**
 * Signed-link state machine for a single document format: requests the link on
 * `generate`, toggles back to idle when already ready, clears errors after 3s,
 * and copies the absolute URL with a 2s `copied` flag.
 */
export function useDocLink(href: string) {
  const [state, setState] = useState<DocLinkState>({ s: "idle" });
  const [copied, setCopied] = useState(false);

  const generate = useCallback(async () => {
    if (state.s === "loading") return;
    if (state.s === "ready") { setState({ s: "idle" }); return; }
    setState({ s: "loading" });
    try {
      const data = await requestDocLink(href);
      setState({ s: "ready", url: data.url, filename: data.filename });
    } catch (e: unknown) {
      setState({ s: "error", msg: e instanceof Error ? e.message : "Error" });
      setTimeout(() => setState({ s: "idle" }), 3000);
    }
  }, [href, state.s]);

  const copy = useCallback(() => {
    if (state.s !== "ready") return;
    navigator.clipboard.writeText(`${window.location.origin}${state.url}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [state]);

  const reset = useCallback(() => setState({ s: "idle" }), []);

  return { state, copied, generate, copy, reset };
}
