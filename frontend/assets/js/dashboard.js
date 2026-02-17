// frontend/assets/js/dashboard.js

const API_LATEST = "/api/v1/latest?limit=50"; // relativo (funciona local y en dominio)
const REFRESH_MS = 3000;

const els = {
  phValue: document.getElementById("kpi-ph-value"),
  phStatus: document.getElementById("kpi-ph-status"),
  tempValue: document.getElementById("kpi-temp-value"),
  tempStatus: document.getElementById("kpi-temp-status"),
  turbValue: document.getElementById("kpi-turb-value"),
  turbStatus: document.getElementById("kpi-turb-status"),
  ecosystem: document.getElementById("ecosystemStatus"),
  alerts: document.getElementById("alerts-list"),
};

function parseTs(ts) {
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
}

function fmtTime(ts) {
  const d = parseTs(ts);
  if (!d) return "—";
  return d.toLocaleString("es-CO", { hour12: false });
}

function newestByType(rows, type) {
  const filtered = rows.filter(r => (r.type || "").toLowerCase() === type);
  filtered.sort((a, b) => new Date(b.ts) - new Date(a.ts));
  return filtered[0] || null;
}

function setKpi(valueEl, statusEl, row) {
  if (!row) {
    valueEl.textContent = "—";
    statusEl.textContent = "Sin datos";
    return;
  }

  // OJO: si tu API no trae "value", aquí lo verás como undefined.
  const v = row.value;
  const unit = row.unit ? ` ${row.unit}` : "";

  valueEl.textContent = (v === undefined || v === null) ? "—" : `${v}${unit}`;

  const tsLabel = fmtTime(row.ts);
  statusEl.textContent = `Actualizado: ${tsLabel}`;
}

function computeAlerts(latest) {
  const alerts = [];

  // Reglas simples (ajústalas a tu criterio real)
  if (latest.ph?.value != null) {
    const ph = Number(latest.ph.value);
    if (!isNaN(ph) && (ph < 6.5 || ph > 8.5)) alerts.push(`pH fuera de rango típico: ${ph}`);
  }
  if (latest.temperature?.value != null) {
    const t = Number(latest.temperature.value);
    if (!isNaN(t) && (t < 0 || t > 40)) alerts.push(`Temperatura inusual: ${t} °C`);
  }
  if (latest.turbidity?.value != null) {
    const tu = Number(latest.turbidity.value);
    if (!isNaN(tu) && tu > 50) alerts.push(`Turbidez alta: ${tu} NTU`);
  }

  return alerts;
}

// -------- Chart.js ----------
let chart;

function ensureChart() {
  if (chart) return chart;
  const ctx = document.getElementById("mainChart");
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        { label: "pH", data: [] },
        { label: "Temperatura (°C)", data: [] },
        { label: "Turbidez (NTU)", data: [] },
      ],
    },
    options: {
      responsive: true,
      animation: false,
      scales: {
        x: { ticks: { maxRotation: 0 } },
      },
    },
  });
  return chart;
}

// Actualizar datos y luego chart.update() es el flujo normal en Chart.js. :contentReference[oaicite:2]{index=2}
function updateChart(rows) {
  const c = ensureChart();

  // Ordenar por ts asc para que el eje X vaya “hacia adelante”
  const sorted = [...rows].filter(r => r.ts).sort((a, b) => new Date(a.ts) - new Date(b.ts));

  // Tomamos puntos por tipo
  const labels = sorted.map(r => {
    const d = parseTs(r.ts);
    return d ? d.toLocaleTimeString("es-CO", { hour12: false }) : "";
  });

  const ph = sorted.map(r => (r.type === "ph" ? r.value ?? null : null));
  const temp = sorted.map(r => (r.type === "temperature" ? r.value ?? null : null));
  const turb = sorted.map(r => (r.type === "turbidity" ? r.value ?? null : null));

  c.data.labels = labels;
  c.data.datasets[0].data = ph;
  c.data.datasets[1].data = temp;
  c.data.datasets[2].data = turb;

  c.update();
}

async function refresh() {
  try {
    const res = await fetch(API_LATEST, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();

    const latest = {
      ph: newestByType(rows, "ph"),
      temperature: newestByType(rows, "temperature"),
      turbidity: newestByType(rows, "turbidity"),
    };

    setKpi(els.phValue, els.phStatus, latest.ph);
    setKpi(els.tempValue, els.tempStatus, latest.temperature);
    setKpi(els.turbValue, els.turbStatus, latest.turbidity);

    const alerts = computeAlerts(latest);
    els.alerts.innerHTML = "";
    if (alerts.length === 0) {
      els.alerts.innerHTML = "<li>No se han detectado alertas activas.</li>";
      els.ecosystem.textContent = "Condiciones en rango según las últimas lecturas disponibles.";
    } else {
      alerts.forEach(a => {
        const li = document.createElement("li");
        li.textContent = a;
        els.alerts.appendChild(li);
      });
      els.ecosystem.textContent = "Se detectaron observaciones que requieren revisión.";
    }

    updateChart(rows);
  } catch (e) {
    // Silencioso pero visible
    els.ecosystem.textContent = `Error leyendo datos del API: ${e.message}`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  refresh();
  setInterval(refresh, REFRESH_MS);
});
