import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_TARGET || process.env.VITE_API_TARGET;

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: { overlay: false },
      // ── Mismo origen en producción ─────────────────────────────────────
      // En producción el frontend y la API se sirven bajo el mismo host
      // (Nginx / Traefik enruta /api/* al backend). No se necesita CORS y
      // las cookies httpOnly de sesión viajan automáticamente.
      //
      // ── Desarrollo con backend separado ────────────────────────────────
      // Definir VITE_API_TARGET (p. ej. http://localhost:3000) para que
      // Vite haga de proxy y reescriba el dominio de las cookies para que
      // el navegador las acepte como propias del origen del dev server.
      ...(apiTarget
        ? {
            proxy: {
              "/api": {
                target: apiTarget,
                changeOrigin: true,
                secure: false,
                // Reescribe Domain en Set-Cookie para que el navegador
                // acepte la cookie como del origen del frontend.
                cookieDomainRewrite: { "*": "" },
                cookiePathRewrite: { "*": "/" },
              },
            },
          }
        : {}),
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
  };
});
