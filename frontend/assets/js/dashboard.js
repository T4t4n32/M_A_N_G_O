/* ======================================================
   M.A.N.G.O. Dashboard JS
   Datos REALES únicamente
   ====================================================== */

const API_BASE = "/api";

/* ================= DOM ================= */
const kpiPH = document.getElementById("kpi-ph-value");
const kpiTemp = document.getElementById("kpi-temp-value");
const kpiTurb = document.getElementById("kpi-turb-value");

const statusPH = document.getElementById("kpi-ph-status");
const statusTemp = document.getElementById("kpi-temp-status");
const statusTurb = document.getElementById("kpi-turb-status");

const alertsList = document.getElementById("alerts-list");

/* ================= UTILIDADES ================= */
function formatValue(value) {
    if (value === null || value === undefined) return "—";
    return Number(value).toFixed(2);
}

function setStatus(element, valid, label = "") {
    if (valid) {
        element.textContent = "Operativo";
        element.style.color = "var(--mango-green)";
    } else {
        element.textContent = label || "En mantenimiento";
        element.style.color = "var(--mango-gold)";
    }
}

function addAlert(message) {
    const li = document.createElement("li");
    li.textContent = message;
    alertsList.appendChild(li);
}

/* ================= LIMPIAR ALERTAS ================= */
function resetAlerts() {
    alertsList.innerHTML = "";
}

/* ================= FETCH DATOS ================= */
async function fetchLatestData() {
    try {
        const response = await fetch(`${API_BASE}/latest`);

        if (!response.ok) {
            throw new Error("Servidor no responde");
        }

        const data = await response.json();
        updateDashboard(data);

    } catch (error) {
        console.error("Error API:", error);
        showGlobalError();
    }
}

/* ================= UPDATE DASHBOARD ================= */
function updateDashboard(data) {

    resetAlerts();

    if (!data) {
        showGlobalError();
        return;
    }

    /* ===== pH ===== */
    if (data.ph) {
        kpiPH.textContent = formatValue(data.ph.value);
        setStatus(statusPH, data.ph.valid);

        if (!data.ph.valid) {
            addAlert("Sensor de pH en mantenimiento. Datos actuales no confiables.");
        }
    } else {
        kpiPH.textContent = "—";
        statusPH.textContent = "Sin datos";
    }

    /* ===== TEMPERATURA ===== */
    if (data.temperature) {
        kpiTemp.textContent = formatValue(data.temperature.value);
        setStatus(statusTemp, data.temperature.valid);

        if (!data.temperature.valid) {
            addAlert("Sensor PT100 presenta lecturas inválidas.");
        }
    } else {
        kpiTemp.textContent = "—";
        statusTemp.textContent = "Sin datos";
    }

    /* ===== TURBIDEZ ===== */
    if (data.turbidity) {
        kpiTurb.textContent = formatValue(data.turbidity.value);
        setStatus(statusTurb, data.turbidity.valid);

        if (!data.turbidity.valid) {
            addAlert("Sensor de turbidez en mantenimiento. Revisar histórico.");
        }
    } else {
        kpiTurb.textContent = "—";
        statusTurb.textContent = "Sin datos";
    }

    if (alertsList.children.length === 0) {
        addAlert("Todos los sensores operan dentro de parámetros normales.");
    }
}

/* ================= ERROR GLOBAL ================= */
function showGlobalError() {
    kpiPH.textContent = "—";
    kpiTemp.textContent = "—";
    kpiTurb.textContent = "—";

    statusPH.textContent = "Desconectado";
    statusTemp.textContent = "Desconectado";
    statusTurb.textContent = "Desconectado";

    resetAlerts();
    addAlert("No hay comunicación con el sistema de adquisición de datos.");
}

/* ================= ACTUALIZACIÓN AUTOMÁTICA ================= */
/* Frecuencia real depende del backend */
setInterval(fetchLatestData, 5000); // cada 5s (ajustable)

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
    fetchLatestData();
});
