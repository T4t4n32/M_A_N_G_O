import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { SECTIONS, type SiteField } from "@/lib/siteContent";

export interface EditTarget {
  siteKey: string;
  label: string;
  type: SiteField["type"];
  anchorRect: DOMRect | null;
}

interface LiveEditCtx {
  isEditMode: boolean;
  /** activateLiveEdit(true) skips the auth fetch — use when caller already verified admin role. */
  activateLiveEdit: (preVerified?: boolean) => Promise<boolean>;
  deactivateLiveEdit: () => void;
  editTarget: EditTarget | null;
  openEdit: (target: EditTarget) => void;
  closeEdit: () => void;
}

const LiveEditContext = createContext<LiveEditCtx>({
  isEditMode: false,
  activateLiveEdit: async () => false,
  deactivateLiveEdit: () => {},
  editTarget: null,
  openEdit: () => {},
  closeEdit: () => {},
});

export function LiveEditProvider({ children }: { children: ReactNode }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  const activateLiveEdit = useCallback(async (preVerified = false): Promise<boolean> => {
    if (preVerified) {
      setIsEditMode(true);
      return true;
    }
    try {
      const res = await fetch("/api/v1/users/status", { credentials: "include" });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.user?.role === "admin") {
        setIsEditMode(true);
        return true;
      }
    } catch {
      // network error — block activation
    }
    return false;
  }, []);

  const deactivateLiveEdit = useCallback(() => {
    setIsEditMode(false);
    setEditTarget(null);
  }, []);

  const openEdit = useCallback((target: EditTarget) => setEditTarget(target), []);
  const closeEdit = useCallback(() => setEditTarget(null), []);

  return (
    <LiveEditContext.Provider
      value={{ isEditMode, activateLiveEdit, deactivateLiveEdit, editTarget, openEdit, closeEdit }}
    >
      {children}
    </LiveEditContext.Provider>
  );
}

export const useLiveEdit = () => useContext(LiveEditContext);

/** Resolve label + type for a siteKey from SECTIONS schema. */
export function resolveSiteField(siteKey: string): Pick<SiteField, "label" | "type"> {
  for (const sec of SECTIONS) {
    const f = sec.fields.find((x) => x.key === siteKey);
    if (f) return { label: f.label, type: f.type };
  }
  return { label: siteKey, type: "text" };
}
