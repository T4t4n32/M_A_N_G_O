// frontend/assets/js/dashboard.js

const API_LATEST = "/api/v1/latest?limit=50"; // same-origin via nginx

const kpi = {
  ph: {
    value: document.getElementById("kpi-ph-value"),
    status: document.getElementById("kpi-ph-status"),
  },
  temperature: {
    value: document.getElementById("kpi-temp-value"),
    status: document.getElementById("kpi-temp-status"),
  },
  turbidity: {
    value: document.getElementById("kpi-turb-value"),
    status: document.getElementById("kpi-turb-status"),
  },
};

const alertsList = document.getElementById("alerts-list");
const ecosystemStatus = document.getElementById("ecosystemStatus");

let chart;

function fmt(n, digits = 2) {
  if (n === null || n === undefined) return "—";
  const num = Number(n);
  if (Number.isNaN(num)) return "—";
  return num.toFixed(digits);
}

function setKpi(sensorType, reading) {
  if (!reading) {
    kpi[sensorType].value.textContent = "—";
    kpi[sensorType].status.textContent = "Sin datos";
    return;
  }
  kpi[sensorType].value.textContent = fmt(reading.value);
  kpi[sensorType].status.textContent = `Actualizado: ${new Date(reading.ts).toLocaleString()}`;
}

function latestByType(rows) {
  const out = {};
  for (const r of rows) {
    if (!out[r.type]) out[r.type] = r; // rows ya vienen del más reciente hacia atrás
  }
  return out;
}

function buildSeries(rows, type) {
  // queremos histórico (más viejo -> más nuevo)
  const filtered = rows.filter(r => r.type === type).slice().reverse();
  return {
    labels: filtered.map(r => new Date(r.ts).toLocaleTimeString()),
    values: filtered.map(r => Number(r.value)),
  };
}

function ensureChart(rows) {
  const ctx = document.getElementById("mainChart");
  if (!ctx) return;

  const ph = buildSeries(rows, "ph");
  const temp = buildSeries(rows, "temperature");
  const turb = buildSeries(rows, "turbidity");

  if (!chart) {
    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: ph.labels, // base
        datasets: [
          { label: "pH", data: ph.values, tension: 0.25 },
          { label: "Temperatura (°C)", data: temp.values, tension: 0.25 },
          { label: "Turbidez (NTU)", data: turb.values, tension: 0.25 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          y: { beginAtZero: false },
        },
      },
    });
    return;
  }

  // update
  chart.data.labels = ph.labels;
  chart.data.datasets[0].data = ph.values;
  chart.data.datasets[1].data = temp.values;
  chart.data.datasets[2].data = turb.values;
  chart.update();
}

function setAlertsAndEcosystem(latest) {
  // reglas simples (ajustables después)
  const alerts = [];

  if (latest.ph && (latest.ph.value < 6.5 || latest.ph.value > 8.5)) {
    alerts.push(`pH fuera de rango recomendado (6.5–8.5): ${fmt(latest.ph.value)}`);
  }
  if (latest.temperature && (latest.temperature.value < 10 || latest.temperature.value > 35)) {
    alerts.push(`Temperatura atípica: ${fmt(latest.temperature.value)} °C`);
  }
  if (latest.turbidity && latest.turbidity.value > 50) {
    alerts.push(`Turbidez alta: ${fmt(latest.turbidity.value)} NTU`);
  }

  alertsList.innerHTML = "";
  if (alerts.length === 0) {
    alertsList.innerHTML = `<li>No se han detectado alertas activas.</li>`;
    ecosystemStatus.textContent = "Condiciones generales estables según los últimos datos recibidos.";
  } else {
    for (const a of alerts) {
      const li = document.createElement("li");
      li.textContent = a;
      alertsList.appendChild(li);
    }
    ecosystemStatus.textContent = "Se detectaron observaciones. Revisa alertas y valida el entorno.";
  }
}

async function refresh() {
  try {
    const res = await fetch(API_LATEST, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      setKpi("ph", null);
      setKpi("temperature", null);
      setKpi("turbidity", null);
      ecosystemStatus.textContent = "A la espera de datos suficientes para evaluar condiciones ambientales.";
      alertsList.innerHTML = `<li>No se han detectado alertas activas.</li>`;
      ensureChart([]);
      return;
    }

    const latest = latestByType(rows);
    setKpi("ph", latest.ph || null);
    setKpi("temperature", latest.temperature || null);
    setKpi("turbidity", latest.turbidity || null);

    setAlertsAndEcosystem(latest);
    ensureChart(rows);
  } catch (e) {
    // si el backend cae, no “rompas” la UI: solo muestra estado
    ecosystemStatus.textContent = "Sin conexión al servidor. Verifica que los contenedores estén arriba.";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // primer refresh inmediato
  refresh();
  // refresco cada 2s (ajusta luego)
  setInterval(refresh, 2000);
});
