import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_TARGET || process.env.VITE_API_TARGET;

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: { overlay: false },
      ...(apiTarget
        ? {
            proxy: {
              "/api": {
                target: apiTarget,
                changeOrigin: true,
                secure: false,
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
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // React core — tiny, always needed, cache forever
            if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
              return "vendor-react";
            }
            // Framer Motion — heavy animation library
            if (id.includes("node_modules/framer-motion")) {
              return "vendor-framer";
            }
            // Radix UI — large UI primitives, rarely changes
            if (id.includes("node_modules/@radix-ui")) {
              return "vendor-radix";
            }
            // Three.js ecosystem — only loaded on 3D pages
            if (id.includes("node_modules/three") || id.includes("node_modules/@react-three")) {
              return "vendor-three";
            }
            // Lucide icons
            if (id.includes("node_modules/lucide-react")) {
              return "vendor-icons";
            }
          },
        },
      },
    },
  };
});
