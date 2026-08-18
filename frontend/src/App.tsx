import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import PanelEmmaLogin from "./pages/PanelEmmaLogin";
import PanelEmmaDashboard from "./pages/PanelEmmaDashboard";
import Archivos from "./pages/Archivos";
import { useSecretShortcut } from "@/hooks/useSecretShortcut";
import { LiveEditProvider, useLiveEdit } from "@/contexts/LiveEditContext";
import { LiveEditToolbar } from "@/components/editor/LiveEditToolbar";

// Lazy-loaded — heavy former landing sections, only fetched when visited
const Galeria = lazy(() => import("./pages/Galeria"));
const Documentacion = lazy(() => import("./pages/Documentacion"));
const Sobre = lazy(() => import("./pages/Sobre"));

const RouteFallback = () => (
  <div className="min-h-screen flex justify-center items-center bg-mango-dark">
    <div className="w-8 h-8 border-2 border-white/20 border-t-accent rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient();

function ShortcutMount() {
  useSecretShortcut("/panel-emma");
  return null;
}

/** Activates live edit when ?live=1 is in the URL (e.g. opened from the panel via link). */
function LiveEditUrlActivator() {
  const { activateLiveEdit } = useLiveEdit();
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("live") === "1") {
      activateLiveEdit();
    }
  // Run once on mount — activateLiveEdit is stable (useCallback with no deps).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LiveEditProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <LiveEditToolbar />
          <LiveEditUrlActivator />
          <ShortcutMount />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <Admin />
              </ProtectedRoute>
            }
          />
          {/* Hidden super-admin console — reachable only via Ctrl+Shift+M or direct URL */}
          <Route
            path="/archivos"
            element={
              <ProtectedRoute>
                <Archivos />
              </ProtectedRoute>
            }
          />
          <Route path="/galeria" element={<Suspense fallback={<RouteFallback />}><Galeria /></Suspense>} />
          <Route path="/documentacion" element={<Suspense fallback={<RouteFallback />}><Documentacion /></Suspense>} />
          <Route path="/sobre" element={<Suspense fallback={<RouteFallback />}><Sobre /></Suspense>} />
          <Route path="/panel-emma" element={<PanelEmmaLogin />} />
          <Route path="/panel-emma/dashboard" element={<PanelEmmaDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LiveEditProvider>
  </QueryClientProvider>
);

export default App;
