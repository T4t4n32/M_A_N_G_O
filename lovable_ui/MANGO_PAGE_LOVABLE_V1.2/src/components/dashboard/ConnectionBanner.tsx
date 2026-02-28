import { AlertTriangle, WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ConnectionBannerProps {
  isOffline: boolean;
  isDegraded?: boolean;
}

export function ConnectionBanner({ isOffline, isDegraded }: ConnectionBannerProps) {
  const show = isOffline || isDegraded;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="alert"
          className={`overflow-hidden text-center text-sm font-medium ${
            isOffline
              ? "bg-destructive/20 text-destructive-foreground border-b border-destructive/30"
              : "bg-yellow-500/20 text-yellow-200 border-b border-yellow-500/30"
          }`}
        >
          <div className="px-4 py-2 flex items-center justify-center gap-2">
            {isOffline ? (
              <>
                <WifiOff className="h-4 w-4" />
                Sin conexión al backend — Los datos no se están actualizando
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                Conexión degradada — Algunos datos pueden no estar disponibles
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
