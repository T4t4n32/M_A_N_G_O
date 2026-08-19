import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Top-level render-error catch-all. Without this, an uncaught error
 * anywhere in the tree unmounts the whole app to a blank white screen
 * (React 18's createRoot has no built-in fallback UI).
 */
export class RootErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Error no controlado en la aplicación:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-mango-dark flex flex-col items-center justify-center gap-5 p-4 text-center">
        <p className="text-sm font-mono uppercase tracking-widest text-white/40">M.A.N.G.O</p>
        <h1 className="text-2xl font-bold text-white">Algo salió mal</h1>
        <p className="max-w-md text-sm text-white/60">
          Ocurrió un error inesperado al cargar esta página. Intenta recargar; si el problema
          persiste, volvé al inicio.
        </p>
        <div className="flex items-center gap-3">
          <Button onClick={() => window.location.reload()} className="rounded-full bg-accent hover:bg-accent/90 text-accent-foreground">
            Recargar
          </Button>
          <Button asChild variant="outline" className="rounded-full border-white/20 text-white/80 hover:bg-white/5">
            <a href="/">Volver al inicio</a>
          </Button>
        </div>
      </div>
    );
  }
}
