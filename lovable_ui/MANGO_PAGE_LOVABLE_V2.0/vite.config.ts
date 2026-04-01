import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    // In production the frontend and API share the same origin.
    // For local dev with a separate backend, set VITE_API_TARGET env var:
    // e.g. VITE_API_TARGET=http://localhost:3000
    ...(process.env.VITE_API_TARGET
      ? {
          proxy: {
            "/api": {
              target: process.env.VITE_API_TARGET,
              changeOrigin: true,
            },
          },
        }
      : {}),
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
