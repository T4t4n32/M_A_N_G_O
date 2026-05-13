import { test, expect } from "@playwright/test";

/**
 * Verifica la regla de seguridad del sitio público: en la sección
 * Documentación SOLO deben exponerse PDFs como descargables. Cualquier
 * .docx/.xlsx/.pptx/.md/.txt/.zip debe quedar restringido al dashboard.
 */
const FORBIDDEN_EXTS = [".docx", ".xlsx", ".pptx", ".md", ".txt", ".zip", ".doc", ".xls", ".ppt"];

test("la sección pública Documentación solo expone PDFs", async ({ page }) => {
  await page.goto("/");
  // Scroll a la sección
  await page.locator("#documentacion").scrollIntoViewIfNeeded();
  await expect(page.locator("#documentacion")).toBeVisible();

  // Recolecta todos los hrefs de descarga dentro de la sección.
  const hrefs = await page
    .locator('#documentacion a[download], #documentacion a[href*="/docs/"]')
    .evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).getAttribute("href") ?? ""));

  // Debe haber al menos un PDF visible.
  const pdfHrefs = hrefs.filter((h) => h.toLowerCase().endsWith(".pdf"));
  expect(pdfHrefs.length).toBeGreaterThan(0);

  // No debe aparecer NINGÚN formato editable.
  const leaks = hrefs.filter((h) =>
    FORBIDDEN_EXTS.some((ext) => h.toLowerCase().endsWith(ext)),
  );
  expect(leaks, `Formatos editables filtrados al público: ${leaks.join(", ")}`).toEqual([]);
});