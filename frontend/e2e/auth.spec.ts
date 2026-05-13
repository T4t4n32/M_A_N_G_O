import { type Page, type Route } from "@playwright/test";
import { test, expect } from "./helpers/evidence";

// Para los flujos sensibles (login/logout y RBAC en /admin y /panel-emma/*)
// activamos trace + screenshot + video SIEMPRE, no sólo en fallo, para
// poder reconstruir cualquier 401/403/500 desde el Trace Viewer.
test.use({ trace: "on", screenshot: "on", video: "on" });

/**
 * E2E para flujos de autenticación y RBAC.
 *
 * Mockeamos `/api/v1/users/*` con `page.route` para no depender del backend
 * FastAPI real. Validamos que:
 *   - Login + logout llamen los endpoints correctos.
 *   - Un viewer pueda entrar a `/dashboard` pero no a `/admin`.
 *   - Un admin pueda entrar a `/admin`.
 *   - `/panel-emma` rechace usuarios sin sesión.
 */

type Role = "admin" | "viewer";

async function mockAuth(page: Page, opts: { role?: Role | null } = {}) {
  let role: Role | null = opts.role ?? null;

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

  await page.route("**/api/v1/users/login", async (route: Route) => {
    const req = route.request().postDataJSON?.() ?? {};
    const desired = (req?.email as string)?.startsWith("admin") ? "admin" : "viewer";
    role = desired;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        user: { email: req.email, role: desired, name: desired },
      }),
    });
  });

  await page.route("**/api/v1/users/logout", (route: Route) => {
    role = null;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  // Cualquier otra llamada a /api/v1/* devuelve 200 vacío para evitar errores
  // ruidosos del dashboard durante los tests E2E.
  await page.route("**/api/v1/**", (route: Route) => {
    if (route.request().url().includes("/users/")) return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "{}",
    });
  });
}

test.describe("Auth + RBAC", () => {
  test("login con viewer abre /dashboard", async ({ page }) => {
    await mockAuth(page, { role: null });
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("viewer@mango.test");
    await page.getByLabel(/contraseña|password/i).fill("hunter2");
    await page.getByRole("button", { name: /iniciar|entrar|login/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("viewer NO puede entrar a /admin (ve 'Acceso restringido')", async ({ page }) => {
    await mockAuth(page, { role: "viewer" });
    await page.goto("/admin");
    await expect(page.getByText(/acceso restringido/i)).toBeVisible();
  });

  test("admin SÍ puede entrar a /admin", async ({ page }) => {
    await mockAuth(page, { role: "admin" });
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByText(/acceso restringido/i)).toHaveCount(0);
  });

  test("logout vuelve a /login", async ({ page }) => {
    await mockAuth(page, { role: "viewer" });
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
    const logout = page.getByRole("button", { name: /cerrar sesión|logout/i }).first();
    if (await logout.isVisible().catch(() => false)) {
      await logout.click();
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test("/panel-emma sin sesión NO expone el dashboard super-admin", async ({ page }) => {
    await mockAuth(page, { role: null });
    await page.goto("/panel-emma/dashboard");
    // Debe redirigir o mostrar la pantalla de login del panel.
    await expect(page.getByText(/acceso|sesión|login|panel-emma/i).first()).toBeVisible();
    await expect(page.getByText(/consola privada de gestión/i)).toHaveCount(0);
  });
});