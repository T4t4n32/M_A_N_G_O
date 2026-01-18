/* =========================
   auth.js — M.A.N.G.O
   ========================= */

import { apiGet, apiPost } from "./api.service.js";

const AUTH_ENDPOINTS = {
  login: "/api/auth/login",
  logout: "/api/auth/logout",
  status: "/api/auth/status"
};

export async function checkAuthStatus() {
  try {
    const res = await apiGet(AUTH_ENDPOINTS.status);
    if (!res || !res.authenticated) {
      window.location.replace("login.html");
      return false;
    }
    return true;
  } catch (e) {
    window.location.replace("login.html");
    return false;
  }
}

export async function login(username, password) {
  const payload = {
    username: username.trim(),
    password: password
  };

  const res = await apiPost(AUTH_ENDPOINTS.login, payload);

  if (!res || !res.success) {
    throw new Error("AUTH_FAILED");
  }

  return true;
}

export async function logout() {
  try {
    await apiPost(AUTH_ENDPOINTS.logout, {});
  } finally {
    window.location.replace("login.html");
  }
}

/* =========================
   Auto-protect dashboard
   ========================= */

document.addEventListener("DOMContentLoaded", async () => {
  if (document.body.dataset.protected === "true") {
    await checkAuthStatus();
  }

  const logoutBtn = document.querySelector(".logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
});
