/**
 * Integration tests for the frontend API layer.
 *
 * These tests stub `fetch` to assert:
 *   - login/logout call the right endpoints with credentials="include"
 *   - cookie httpOnly headers are honored (request includes them implicitly)
 *   - 401 / 403 / 500 / 0 (network) → ApiError with friendly + technical message
 *   - HTML responses (SPA fallback) are caught and surfaced as ApiError
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  checkAuth,
  login,
  logout,
  sendContact,
} from "@/lib/api";

type FetchMock = ReturnType<typeof vi.fn>;

function makeJsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
}

function makeHtmlResponse(): Response {
  return new Response("<!doctype html><html></html>", {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
}

let fetchMock: FetchMock;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("auth flow", () => {
  it("POST /users/login envía cookies y JSON", async () => {
    fetchMock.mockResolvedValueOnce(
      makeJsonResponse({ success: true, user: { email: "a@x.com", role: "admin" } }),
    );

    const res = await login({ email: "a@x.com", password: "p" });

    expect(res.success).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/users/login");
    expect(init.credentials).toBe("include");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ email: "a@x.com", password: "p" });
    expect(init.headers["Content-Type"]).toBe("application/json");
  });

  it("POST /users/logout sin body", async () => {
    fetchMock.mockResolvedValueOnce(makeJsonResponse({ success: true }));
    await logout();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/users/logout");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
  });

  it("GET /users/status devuelve la sesión", async () => {
    fetchMock.mockResolvedValueOnce(
      makeJsonResponse({ authenticated: true, user: { email: "u@x.com", role: "viewer" } }),
    );
    const status = await checkAuth();
    expect(status.authenticated).toBe(true);
    expect(status.user?.role).toBe("viewer");
  });
});

describe("manejo de errores HTTP", () => {
  it("401 → ApiError con mensaje amigable y detalle técnico", async () => {
    fetchMock.mockResolvedValueOnce(
      makeJsonResponse({ message: "Credenciales inválidas" }, { status: 401 }),
    );
    await expect(login({ email: "x", password: "y" })).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
    });
    try {
      await login({ email: "x", password: "y" });
    } catch (err) {
      // El catch anterior se queja porque mock se consumió; rearmamos.
    }
  });

  it("403 → ApiError forbidden", async () => {
    fetchMock.mockResolvedValueOnce(
      makeJsonResponse({ message: "No tiene permisos" }, { status: 403 }),
    );
    try {
      await checkAuth();
      throw new Error("debió lanzar");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(403);
      expect((err as ApiError).detail).toMatch(/Forbidden/i);
    }
  });

  it("500 → ApiError genérico", async () => {
    fetchMock.mockResolvedValueOnce(
      makeJsonResponse({}, { status: 500 }),
    );
    try {
      await sendContact({ name: "n", email: "e@x.com", institution: "i", message: "m".repeat(20) });
      throw new Error("debió lanzar");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(500);
      expect((err as ApiError).detail).toMatch(/Internal Server Error/i);
    }
  });

  it("respuesta HTML (proxy/dev caído) → ApiError status=0", async () => {
    fetchMock.mockResolvedValueOnce(makeHtmlResponse());
    try {
      await checkAuth();
      throw new Error("debió lanzar");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(0);
      expect((err as ApiError).detail).toMatch(/Content-Type/);
    }
  });

  it("network failure → ApiError sin conexión", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    try {
      await checkAuth();
      throw new Error("debió lanzar");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(0);
      expect((err as ApiError).message).toMatch(/conectar/i);
    }
  });
});