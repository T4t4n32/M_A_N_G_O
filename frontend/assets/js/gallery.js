/* =========================
   auth.js — M.A.N.G.O
   ========================= */

import { apiPost, apiHealthCheck } from "./api.service.js";

/* =========================
   Config
   ========================= */

const AUTH_CONFIG = {
  LOGIN_ENDPOINT: "/api/auth/login",
  SESSION_KEY: "mango_session",
  REMEMBER_KEY: "mango_remember"
};

/* =========================
   DOM
   ========================= */

const form = document.getElementById("login-form");
const userInput = document.getElementById("user");
const passInput = document.getElementById("pass");
const togglePasswordBtn = document.getElementById("toggle-password");
const submitBtn = document.getElementById("submit-btn");
const btnText = document.getElementById("btn-text");

const errorContainer = document.getElementById("error-container");
const errorText = document.getElementById("error-text");

const offlineWarning = document.getElementById("offline-warning");

const statusText = document.getElementById("connection-status");
const statusIndicator = document.getElementById("connection-indicator");

/* =========================
   Init
   ========================= */

document.addEventListener("DOMContentLoaded", initAuth);

async function initAuth() {
  restoreRememberedUser();
  await checkBackendStatus();
  bindEvents();
}

/* =========================
   Events
   ========================= */

function bindEvents() {
  togglePasswordBtn.addEventListener("click", togglePassword);
  form.addEventListener("submit", handleLogin);
}

/* =========================
   UI helpers
   ========================= */

function togglePassword() {
  if (passInput.type === "password") {
    passInput.type = "text";
    togglePasswordBtn.textContent = "🙈";
  } else {
    passInput.type = "password";
    togglePasswordBtn.textContent = "👁️";
  }
}

function setLoading(state) {
  if (state) {
    submitBtn.classList.add("loading");
    submitBtn.disabled = true;
    btnText.textContent = "Verificando...";
  } else {
    submitBtn.classList.remove("loading");
    submitBtn.disabled = false;
    btnText.textContent = "Ingresar al dashboard";
  }
}

function showError(message) {
  errorText.textContent = message;
  errorContainer.style.display = "block";
}

function hideError() {
  errorContainer.style.display = "none";
}

function showOfflineWarning() {
  offlineWarning.style.display = "block";
}

function hideOfflineWarning() {
  offlineWarning.style.display = "none";
}

/* =========================
   Backend status
   ========================= */

async function checkBackendStatus() {
  const online = await apiHealthCheck();

  if (online) {
    statusText.textContent = "Sistema online";
    statusIndicator.classList.remove("offline");
    hideOfflineWarning();
  } else {
    statusText.textContent = "Sistema offline";
    statusIndicator.classList.add("offline");
    showOfflineWarning();
  }
}

/* =========================
   Remember user
   ========================= */

function restoreRememberedUser() {
  const remembered = localStorage.getItem(AUTH_CONFIG.REMEMBER_KEY);
  if (remembered) {
    userInput.value = remembered;
  }
}

/* =========================
   Login logic
   ========================= */

async function handleLogin(event) {
  event.preventDefault();
  hideError();
  setLoading(true);

  const username = userInput.value.trim();
  const password = passInput.value;

  if (!username || !password) {
    setLoading(false);
    showError("Debe ingresar usuario y contraseña.");
    return;
  }

  try {
    const response = await apiPost(AUTH_CONFIG.LOGIN_ENDPOINT, {
      username,
      password
    });

    persistSession(response);
    rememberUserIfNeeded(username);

    window.location.href = "dashboard.html";
  } catch (err) {
    setLoading(false);

    if (err.status === 401) {
      showError("Credenciales inválidas.");
    } else {
      showError("No se pudo conectar con el servidor.");
      showOfflineWarning();
    }
  }
}

/* =========================
   Session handling
   ========================= */

function persistSession(payload) {
  sessionStorage.setItem(
    AUTH_CONFIG.SESSION_KEY,
    JSON.stringify({
      token: payload.token || null,
      user: payload.user || null,
      timestamp: Date.now()
    })
  );
}

function rememberUserIfNeeded(username) {
  const rememberCheckbox = document.getElementById("remember");
  if (rememberCheckbox && rememberCheckbox.checked) {
    localStorage.setItem(AUTH_CONFIG.REMEMBER_KEY, username);
  } else {
    localStorage.removeItem(AUTH_CONFIG.REMEMBER_KEY);
  }
}

/* =========================
   Guard helper (for dashboard)
   ========================= */

export function requireAuth() {
  const session = sessionStorage.getItem(AUTH_CONFIG.SESSION_KEY);
  if (!session) {
    window.location.href = "login.html";
  }
}
