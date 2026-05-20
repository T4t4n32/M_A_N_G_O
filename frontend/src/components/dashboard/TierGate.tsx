import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Lock, ChevronRight, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TIER_ORDER, TIER_LABELS, type TierName } from "@/types/dashboard";
import { submitAccessRequest, ApiError } from "@/lib/api";

// ── Tiers a los que un usuario puede solicitar upgrade ────────────────────────
const REQUESTABLE_TIERS: TierName[] = [
  "registrado_basico",
  "documental_premium",
  "dataline_low",
  "dataline_high",
  "institutional",
];

// ── Modal de solicitud de upgrade ────────────────────────────────────────────
function UpgradeModal({
  currentTier,
  defaultTier,
  onClose,
}: {
  currentTier: TierName;
  defaultTier: TierName;
  onClose: () => void;
}) {
  const [selectedTier, setSelectedTier] = useState<TierName>(defaultTier);
  const [motivation, setMotivation]     = useState("");
  const [sent, setSent]                 = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const availableTiers = REQUESTABLE_TIERS.filter(
    (t) => TIER_ORDER[t] > TIER_ORDER[currentTier]
  );

  const mutation = useMutation({
    mutationFn: () => submitAccessRequest({ requested_tier: selectedTier, motivation: motivation.trim() || undefined }),
    onSuccess: () => {
      setSent(true);
      setError(null);
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("No se pudo enviar la solicitud. Inténtalo de nuevo.");
      }
    },
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[hsl(205,35%,10%)] border-white/[0.08] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Lock className="h-4 w-4 text-[hsl(168,72%,42%)]" />
            Solicitar acceso
          </DialogTitle>
          <DialogDescription className="text-white/50 text-sm">
            Tu plan actual: <span className="text-[hsl(168,72%,55%)] font-medium">{TIER_LABELS[currentTier]}</span>.
            Un administrador revisará tu solicitud.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            <p className="text-sm font-medium text-white/80">Solicitud enviada</p>
            <p className="text-xs text-white/45">
              Recibirás una respuesta del equipo M.A.N.G.O. a la brevedad.
            </p>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white/50 hover:text-white mt-2">
              Cerrar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {availableTiers.length === 0 ? (
              <p className="text-sm text-white/50 py-4 text-center">
                Ya tienes el máximo nivel de acceso disponible.
              </p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label className="text-white/60 text-xs">Plan solicitado</Label>
                  <Select value={selectedTier} onValueChange={(v) => setSelectedTier(v as TierName)}>
                    <SelectTrigger className="bg-white/[0.05] border-white/[0.1] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTiers.map((t) => (
                        <SelectItem key={t} value={t}>{TIER_LABELS[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-white/60 text-xs">Motivación / uso previsto <span className="text-white/30">(opcional)</span></Label>
                  <Textarea
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    placeholder="Describe brevemente para qué usarás los datos o documentos…"
                    className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/25 resize-none h-24 text-sm"
                    maxLength={500}
                  />
                  <p className="text-[10px] text-white/25 text-right">{motivation.length}/500</p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-1">
                  <Button variant="ghost" size="sm" onClick={onClose} className="text-white/40 hover:text-white/70">
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => mutation.mutate()}
                    disabled={mutation.isPending}
                    className="bg-gradient-to-r from-[hsl(168,72%,42%)] to-[hsl(204,70%,53%)] text-white font-medium"
                  >
                    {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                    Enviar solicitud
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── TierGate — componente principal ──────────────────────────────────────────
interface TierGateProps {
  minTier: TierName;
  currentTier: TierName;
  /** Short section name displayed in the lock overlay */
  label?: string;
  children: React.ReactNode;
}

export function TierGate({ minTier, currentTier, label, children }: TierGateProps) {
  const [showModal, setShowModal] = useState(false);

  if (TIER_ORDER[currentTier] >= TIER_ORDER[minTier]) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="relative rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        {/* Lock overlay */}
        <div className="flex flex-col items-center justify-center py-14 px-6 text-center gap-4">
          <div className="p-3 rounded-full bg-white/[0.05] border border-white/[0.08]">
            <Lock className="h-5 w-5 text-white/35" />
          </div>
          <div>
            {label && (
              <p className="text-[11px] font-semibold tracking-widest uppercase text-white/30 mb-1">{label}</p>
            )}
            <p className="text-sm font-medium text-white/55">Acceso restringido</p>
            <p className="text-xs text-white/35 mt-1">
              Requiere plan{" "}
              <span className="text-[hsl(168,72%,55%)] font-medium">{TIER_LABELS[minTier]}</span>
              {" "}o superior
            </p>
            <p className="text-[11px] text-white/25 mt-0.5">
              Tu plan actual: {TIER_LABELS[currentTier]}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 text-xs text-[hsl(168,72%,55%)] hover:text-[hsl(168,72%,70%)] transition-colors font-medium"
          >
            Solicitar acceso
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {showModal && (
        <UpgradeModal
          currentTier={currentTier}
          defaultTier={minTier}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
