import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config para pruebas E2E del frontend.
 *
 * Levanta el dev server de Vite y corre los specs en `e2e/`. Las pruebas
 * mockean los endpoints de backend con `page.route` para no depender de la
 * API real (suficiente para validar contratos de auth y RBAC del cliente).
 *
 * Uso:
 *   bun run e2e            # corre los specs
 *   bun run e2e:ui         # modo UI interactivo
 */
const PORT = Number(process.env.E2E_PORT ?? 4173);
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `bun run preview -- --host 127.0.0.1 --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});