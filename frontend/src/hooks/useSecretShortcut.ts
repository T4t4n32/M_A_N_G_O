import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Global secret shortcut: Ctrl+Shift+M (or Cmd+Shift+M on macOS) navigates
 * to the hidden super-admin access route. Mounted once at App level.
 * Intentionally NOT documented in the public UI.
 */
export function useSecretShortcut(targetPath = "/panel-emma") {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.shiftKey && (e.key === "M" || e.key === "m")) {
        e.preventDefault();
        navigate(targetPath);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate, targetPath]);
}