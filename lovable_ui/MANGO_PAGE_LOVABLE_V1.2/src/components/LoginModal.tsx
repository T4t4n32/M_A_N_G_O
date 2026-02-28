import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-mango-dark border-secondary/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center text-white">Acceso Institucional</DialogTitle>
          <DialogDescription className="text-center text-white/60">
            Este sistema es de uso exclusivo para instituciones autorizadas.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="p-4 rounded-2xl bg-white/[0.06]">
            <Lock className="h-10 w-10 text-white/30" />
          </div>
          <p className="text-sm text-white/60 text-center">
            Para acceder al panel de monitoreo, inicie sesión con sus credenciales institucionales.
          </p>
          <Button
            onClick={() => {
              onOpenChange(false);
              navigate("/login");
            }}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-full font-semibold"
          >
            Ir a Iniciar Sesión
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
