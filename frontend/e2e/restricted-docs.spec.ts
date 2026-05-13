import { test, expect, type Page, type Route } from "@playwright/test";

async function mockAuth(page: Page) {
  await page.route("**/api/v1/users/status", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ authenticated: true, user: { email: "v@x.com", role: "viewer", name: "viewer" } }),
    }),
  );
  await page.route("**/api/v1/**", (route: Route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
  );
}

test.describe("RestrictedDocsPanel", () => {
  test("buscador y filtros muestran solo formatos permitidos", async ({ page }) => {
    await mockAuth(page);
    await page.goto("/dashboard");
    const panel = page.locator("#archivos-editables");
    await panel.scrollIntoViewIfNeeded();
    await expect(panel).toBeVisible();

    // Filtra por .docx → todos los hrefs visibles deben terminar en .docx
    await panel.getByRole("button", { name: ".docx" }).click();
    const docxHrefs = await panel
      .locator("a[href]")
      .evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).href));
    expect(docxHrefs.length).toBeGreaterThan(0);
    expect(docxHrefs.every((h) => h.toLowerCase().endsWith(".docx"))).toBe(true);

    // Cambia a .md y verifica el mismo invariante
    await panel.getByRole("button", { name: ".md" }).click();
    const mdHrefs = await panel
      .locator("a[href]")
      .evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).href));
    expect(mdHrefs.length).toBeGreaterThan(0);
    expect(mdHrefs.every((h) => h.toLowerCase().endsWith(".md"))).toBe(true);

    // Búsqueda por término que no exista → mensaje vacío
    await panel.getByRole("button", { name: "Todos" }).click();
    await panel.getByLabel("Buscar archivo editable").fill("zzznoexiste");
    await expect(panel.getByText(/no se encontraron archivos editables/i)).toBeVisible();
  });
});