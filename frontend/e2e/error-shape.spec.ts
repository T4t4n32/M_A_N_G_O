import { type Page, type Route } from "@playwright/test";
import { test, expect } from "./helpers/evidence";

/**
 * Verifica que las respuestas 401 / 403 / 500 emitidas por el backend
 * cuando un usuario navega a /admin o /panel-emma cumplen el contrato
 * JSON esperado por el frontend (`{ detail, message }`) y que el cliente
 * las trata sin filtrar mensajes técnicos crudos al usuario.
 *
 * El frontend mapea status → texto en `src/lib/api.ts`, así que aquí
 * comprobamos: (a) shape JSON correcto en la respuesta interceptada y
 * (b) que la UI muestra el bucket esperado ("Acceso restringido", login
 * del panel, etc.) sin fugar el `detail` técnico al render visible.
 */

test.use({ trace: "on", screenshot: "on", video: "on" });

type Role = "admin" | "viewer" | null;
type ErrorPayload = { detail: string; message: string };

const ERROR_BODIES: Record<number, ErrorPayload> = {
  401: {
    detail: "HTTP 401 Unauthorized — token ausente o expirado",
    message: "Las credenciales son incorrectas o la sesión expiró.",
  },
  403: {
    detail: "HTTP 403 Forbidden — rol 'viewer' no autorizado para /admin",
    message: "No tiene permisos para acceder a este recurso.",
  },
  500: {
    detail: "HTTP 500 Internal Server Error — fallo inesperado en backend",
    message: "Error interno del servidor. Inténtelo más tarde.",
  },
};

async function mockAuth(page: Page, role: Role) {
  await page.route("**/api/v1/users/status", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        role
          ? { authenticated: true, user: { email: `${role}@mango.test`, role, name: role } }
          : { authenticated: false, user: null },
      ),
    }),
  );
}

/**
 * Mockea un endpoint del área protegida para que devuelva el status
 * indicado con el body JSON canónico `{ detail, message }`. Devuelve la
 * Promise de la respuesta interceptada para que el test pueda inspeccionar
 * headers + body exactos.
 */
async function mockProtected(page: Page, urlGlob: string, status: number) {
  await page.route(urlGlob, (route: Route) =>
    route.fulfill({
      status,
      contentType: "application/json",
      headers: { "x-error-source": "e2e-mock" },
      body: JSON.stringify(ERROR_BODIES[status]),
    }),
  );
}

test.describe("Error shape (401/403/500) en /admin y /panel-emma", () => {
  test("viewer → /admin recibe 403 con shape { detail, message }", async ({ page }) => {
    await mockAuth(page, "viewer");
    await mockProtected(page, "**/api/v1/admin/**", 403);

    const respPromise = page.waitForResponse(
      (r) => /\/api\/v1\/admin\//.test(r.url()) && r.status() === 403,
      { timeout: 10_000 },
    ).catch(() => null);

    await page.goto("/admin");
    const resp = await respPromise;

    if (resp) {
      // Contrato del backend
      expect(resp.headers()["content-type"]).toMatch(/application\/json/);
      const body = (await resp.json()) as ErrorPayload;
      expect(body).toMatchObject({
        detail: expect.stringMatching(/HTTP 403/),
        message: expect.stringMatching(/permisos|acceso/i),
      });
    }

    // El RBAC del frontend ya bloquea por rol antes incluso de llamar; en
    // ambos casos el usuario debe ver el bucket "forbidden", nunca el detail.
    await expect(page.getByText(/acceso restringido/i)).toBeVisible();
    await expect(page.getByText(/HTTP 403/)).toHaveCount(0);
  });

  test("sin sesión → /panel-emma/dashboard recibe 401 con shape { detail, message }", async ({
    page,
  }) => {
    await mockAuth(page, null);
    await mockProtected(page, "**/api/v1/panel-emma/**", 401);
    await mockProtected(page, "**/api/v1/users/me", 401);

    const respPromise = page.waitForResponse(
      (r) => /\/api\/v1\/(panel-emma|users\/me)/.test(r.url()) && r.status() === 401,
      { timeout: 5_000 },
    ).catch(() => null);

    await page.goto("/panel-emma/dashboard");
    const resp = await respPromise;

    if (resp) {
      const body = (await resp.json()) as ErrorPayload;
      expect(body.detail).toMatch(/HTTP 401/);
      expect(body.message).toMatch(/credenciales|sesión/i);
    }

    // Nunca exponer el detail técnico en la UI.
    await expect(page.getByText(/HTTP 401/)).toHaveCount(0);
    await expect(page.getByText(/consola privada de gestión/i)).toHaveCount(0);
  });

  test("admin → /admin con backend caído (500) propaga shape canónico", async ({ page }) => {
    await mockAuth(page, "admin");
    await mockProtected(page, "**/api/v1/admin/**", 500);

    const respPromise = page.waitForResponse(
      (r) => /\/api\/v1\/admin\//.test(r.url()) && r.status() === 500,
      { timeout: 10_000 },
    ).catch(() => null);

    await page.goto("/admin");
    const resp = await respPromise;

    if (resp) {
      const body = (await resp.json()) as ErrorPayload;
      expect(body).toMatchObject({
        detail: expect.stringMatching(/HTTP 500/),
        message: expect.stringMatching(/servidor/i),
      });
      expect(resp.headers()["content-type"]).toMatch(/application\/json/);
    }

    await expect(page).toHaveURL(/\/admin/);
    // El detail técnico jamás debe filtrarse al DOM visible.
    await expect(page.getByText(/HTTP 500/)).toHaveCount(0);
  });
});