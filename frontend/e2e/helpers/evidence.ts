import { test as base, expect, type TestInfo } from "@playwright/test";

/**
 * Fixture de Playwright que captura evidencia extra (red + screenshot)
 * cuando un test falla. Pensado para los flujos sensibles de auth/RBAC
 * (login/logout, /admin, /panel-emma/*) donde necesitamos saber por qué
 * el backend devolvió 401/403/500.
 *
 * Cada test que use este `test` exportado obtiene:
 *  - Trace siempre activado (gracias a `test.use({ trace: "on" })` en el
 *    spec) para que el Trace Viewer muestre la línea de tiempo completa.
 *  - Una lista en memoria con TODAS las respuestas HTTP que pasó el
 *    navegador (status, método y URL). Si el test falla, el log se
 *    adjunta al reporte como `network.json` y se sube una captura de
 *    pantalla `failure.png`.
 */

type NetworkEntry = {
  method: string;
  url: string;
  status: number;
  statusText?: string;
  ok?: boolean;
  resourceType?: string;
};

type EvidenceFixtures = { network: NetworkEntry[] };

export const test = base.extend<EvidenceFixtures>({
  network: async ({ page }, use, testInfo: TestInfo) => {
    const log: NetworkEntry[] = [];

    page.on("response", (resp) => {
      const req = resp.request();
      log.push({
        method: req.method(),
        url: resp.url(),
        status: resp.status(),
        statusText: resp.statusText(),
        ok: resp.ok(),
        resourceType: req.resourceType(),
      });
    });

    page.on("requestfailed", (req) => {
      log.push({
        method: req.method(),
        url: req.url(),
        status: 0,
        statusText: req.failure()?.errorText ?? "request failed",
        ok: false,
        resourceType: req.resourceType(),
      });
    });

    await use(log);

    if (testInfo.status && testInfo.status !== testInfo.expectedStatus) {
      // Sólo nos interesan llamadas relevantes (auth + rutas admin) para
      // que el adjunto sea legible. El log completo queda igualmente en el
      // trace viewer.
      const relevant = log.filter((e) =>
        /\/api\/v1\/(users|admin)|\/admin|\/panel-emma/.test(e.url),
      );
      await testInfo.attach("network-auth.json", {
        body: JSON.stringify(relevant.length ? relevant : log, null, 2),
        contentType: "application/json",
      });
      try {
        const png = await page.screenshot({ fullPage: true });
        await testInfo.attach("failure.png", { body: png, contentType: "image/png" });
      } catch {
        /* la página puede haberse cerrado; el trace lo cubre */
      }
    }
  },
});

export { expect };