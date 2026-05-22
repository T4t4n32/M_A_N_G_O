import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

function ShortcutMount() {
  useSecretShortcut("/panel-emma");
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          <Route path="/panel-emma" element={<PanelEmmaLogin />} />
          <Route path="/panel-emma/dashboard" element={<PanelEmmaDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
