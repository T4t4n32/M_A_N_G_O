import { type Page, type Route } from "@playwright/test";
import { test, expect } from "./helpers/evidence";

/**
 * Contrato actualizado de auto-routing del super-admin:
 *  - PDF                                 → Documentación pública.
 *  - DOCX/XLSX/PPTX/MD/TXT/ZIP/...       → Restringido (sólo dashboard).
 *  - Formato desconocido (ej. `.xyz`)    → Documentación pública.
 *
 * Esta spec sólo verifica el caso de formato desconocido.
 */

test.use({ trace: "on", screenshot: "on", video: "on" });

async function mockAdminAuth(page: Page) {
  await page.route("**/api/v1/users/status", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        authenticated: true,
        user: { email: "admin@mango.test", role: "admin", name: "admin" },
      }),
    }),
  );
  await page.route("**/api/v1/**", (route: Route) => {
    if (route.request().url().includes("/users/")) return route.fallback();
    return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
}

test.describe("Subida automática de formato desconocido (.xyz)", () => {
  test("se enruta a 'Público' (formato no reconocido)", async ({ page }) => {
    await mockAdminAuth(page);
    await page.goto("/panel-emma/dashboard");
    await expect(page.getByText(/consola privada de gestión/i)).toBeVisible();

    const fileInput = page.locator("#smart-upload-input");
    await fileInput.setInputFiles({
      name: "investigacion-x.xyz",
      mimeType: "application/octet-stream",
      buffer: Buffer.from("payload"),
    });

    await expect(
      page.getByText(/Documentación pública \(formato no reconocido\)/i),
    ).toBeVisible();
    await expect(page.getByText(/Público \(PDF\):\s*1/i)).toBeVisible();
    await expect(page.getByText(/Restringido:\s*0/i)).toBeVisible();
  });
});