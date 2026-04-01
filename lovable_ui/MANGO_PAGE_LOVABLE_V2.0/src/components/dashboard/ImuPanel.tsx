import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Box, WifiOff, AlertCircle, Loader2, Settings } from "lucide-react";
import type { ImuState } from "@/types/dashboard";

interface ImuPanelProps {
  state: ImuState;
}

export function ImuPanel({ state }: ImuPanelProps) {
  return (
    <Card className="bg-mango-slate border-border/20 text-secondary-foreground overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <Box className="h-4 w-4 text-muted" />
            <h3 className="text-sm font-semibold">IMU / BNO080 (3D)</h3>
          </div>
          <Badge variant="outline" className="text-[10px] text-muted border-border/30 bg-mango-deep/40">
            Próximamente
          </Badge>
        </div>

        <div className="h-48 mx-5 mb-5 rounded-xl bg-mango-deep/50 border border-border/10 flex flex-col items-center justify-center text-muted gap-3">
          {state === "not_configured" && (
            <>
              <div className="p-4 rounded-2xl bg-mango-dark/40">
                <Settings className="h-10 w-10 opacity-20" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Módulo no configurado</p>
                <p className="text-xs text-muted/60 mt-1">El visor 3D estará disponible cuando se conecte el sensor IMU</p>
              </div>
            </>
          )}
          {state === "disconnected" && (
            <>
              <div className="p-4 rounded-2xl bg-mango-dark/40">
                <WifiOff className="h-10 w-10 opacity-20" />
              </div>
              <p className="text-sm">Dispositivo no conectado</p>
            </>
          )}
          {state === "loading" && (
            <>
              <Loader2 className="h-8 w-8 animate-spin opacity-30" />
              <p className="text-sm">Conectando…</p>
            </>
          )}
          {state === "error" && (
            <>
              <AlertCircle className="h-8 w-8 opacity-30" />
              <p className="text-sm">No se pudo iniciar el stream</p>
            </>
          )}
          {state === "active" && (
            <p className="text-sm">Visor 3D — en desarrollo</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
