import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/ProtectedRoute";

function makeFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

function renderWithRoute(role: "admin" | "viewer" | undefined, requiredRole?: "admin" | "viewer") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route path="/login" element={<div>LOGIN PAGE</div>} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute requiredRole={requiredRole}>
                <div>SECRET</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => { vi.unstubAllGlobals(); });

describe("ProtectedRoute", () => {
  it("401 → redirige a /login", async () => {
    vi.stubGlobal("fetch", makeFetch(401, { message: "no auth" }));
    renderWithRoute(undefined);
    await waitFor(
      () => expect(screen.getByText("LOGIN PAGE")).toBeInTheDocument(),
      { timeout: 4000 },
    );
  }, 8000);

  it("autenticado con rol equivocado → muestra pantalla 'Acceso restringido'", async () => {
    vi.stubGlobal(
      "fetch",
      makeFetch(200, { authenticated: true, user: { email: "u@x.com", role: "viewer" } }),
    );
    renderWithRoute("viewer", "admin");
    expect(await screen.findByText(/Acceso restringido/i)).toBeInTheDocument();
    expect(screen.queryByText("SECRET")).not.toBeInTheDocument();
  });

  it("autenticado con rol correcto → renderiza el children", async () => {
    vi.stubGlobal(
      "fetch",
      makeFetch(200, { authenticated: true, user: { email: "a@x.com", role: "admin" } }),
    );
    renderWithRoute("admin", "admin");
    expect(await screen.findByText("SECRET")).toBeInTheDocument();
  });
});