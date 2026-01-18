/* =========================
   api.service.js — M.A.N.G.O
   ========================= */

const API_CONFIG = {
  BASE_URL: "",                 // mismo host
  TIMEOUT: 10000,
  HEADERS: {
    "Content-Type": "application/json"
  }
};

/* =========================
   Utils
   ========================= */

function withTimeout(promise, timeout) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("API_TIMEOUT")), timeout)
    )
  ]);
}

function buildUrl(endpoint) {
  if (endpoint.startsWith("http")) return endpoint;
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}

/* =========================
   Core request
   ========================= */

async function request(method, endpoint, body = null) {
  const options = {
    method,
    headers: API_CONFIG.HEADERS,
    credentials: "include" // sesiones por cookie
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await withTimeout(
    fetch(buildUrl(endpoint), options),
    API_CONFIG.TIMEOUT
  );

  if (!response.ok) {
    let errorPayload = null;
    try {
      errorPayload = await response.json();
    } catch (_) {}
    throw {
      status: response.status,
      payload: errorPayload
    };
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await response.json();
  }

  return await response.text();
}

/* =========================
   Public API
   ========================= */

export async function apiGet(endpoint) {
  return await request("GET", endpoint);
}

export async function apiPost(endpoint, body) {
  return await request("POST", endpoint, body);
}

export async function apiPut(endpoint, body) {
  return await request("PUT", endpoint, body);
}

export async function apiDelete(endpoint) {
  return await request("DELETE", endpoint);
}

/* =========================
   Health check
   ========================= */

export async function apiHealthCheck() {
  try {
    await apiGet("/api/health");
    return true;
  } catch (_) {
    return false;
  }
}
