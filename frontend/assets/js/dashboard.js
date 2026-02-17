// Dashboard M.A.N.G.O. — JS (LOCAL con frontend :8000 y backend :5000)
const API_BASE = "http://127.0.0.1:5000/api";

let chart = null;

const el = {
  ph: document.getElementById("kpi-ph-value"),
  temp: document.getElementById("kpi-temp-value"),
  turb: document.getElementById("kpi-turb-value"),
  phStatus: document.getElementById("kpi-ph-status"),
  tempStatus: document.getElementById("kpi-temp-status"),
  turbStatus: document.getElementById("kpi-turb-status"),
  alerts: document.getElementById("alerts-list"),
  eco: document.getElementById("ecosystemStatus"),
  canvas: document.getElementById("mainChart"),
};

function fmt(v) {
  if (v === null || v === undefined) return "—";
  return Number(v).toFixed(2);
}

function setStatus(node, ok, messageWhenBad = "En mantenimiento") {
  node.textContent = ok ? "Operativo" : messageWhenBad;
  node.style.color = ok ? "var(--mango-green)" : "var(--mango-gold)";
}

function resetAlerts() {
  if (!el.alerts) return;
  el.alerts.innerHTML = "";
}

function addAlert(msg) {
  if (!el.alerts) return;
  const li = document.createElement("li");
  li.textContent = msg;
  el.alerts.appendChild(li);
}

function setEcoText(text) {
  if (el.eco) el.eco.textContent = text;
}

async function fetchJSON(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Servidor no responde (${res.status})`);
  return res.json();
}

async function updateKPIs() {
  try {
    const data = await fetchJSON(`${API_BASE}/latest`);

    resetAlerts();

    // pH
    if (data.ph && data.ph.value !== null) {
      el.ph.textContent = fmt(data.ph.value);
      setStatus(el.phStatus, data.ph.valid);
      if (!data.ph.valid) addAlert("Sensor de pH en mantenimiento: lecturas fuera de rango.");
    } else {
      el.ph.textContent = "—";
      el.phStatus.textContent = "Sin datos";
    }

    // Temp
    if (data.temperature && data.temperature.value !== null) {
      el.temp.textContent = fmt(data.temperature.value);
      setStatus(el.tempStatus, data.temperature.valid);
      if (!data.temperature.valid) addAlert("Sensor PT100: lecturas inválidas detectadas.");
    } else {
      el.temp.textContent = "—";
      el.tempStatus.textContent = "Sin datos";
    }

    // Turbidez
    if (data.turbidity && data.turbidity.value !== null) {
      el.turb.textContent = fmt(data.turbidity.value);
      setStatus(el.turbStatus, data.turbidity.valid);
      if (!data.turbidity.valid) addAlert("Sensor de turbidez en mantenimiento: revisar histórico confiable.");
    } else {
      el.turb.textContent = "—";
      el.turbStatus.textContent = "Sin datos";
    }

    if (el.alerts && el.alerts.children.length === 0) {
      addAlert("Sin alertas: sensores operando normalmente.");
      setEcoText("Condición estable según lecturas actuales. Revisa histórico para tendencias.");
    } else {
      setEcoText("Condición degradada: hay lecturas inválidas o mantenimiento activo.");
    }
  } catch (err) {
    console.error("Error KPIs:", err);
    resetAlerts();
    addAlert("No hay comunicación con la API local.");
    el.ph.textContent = el.temp.textContent = el.turb.textContent = "—";
    el.phStatus.textContent = el.tempStatus.textContent = el.turbStatus.textContent = "Desconectado";
    setEcoText("Sin conexión con el sistema de adquisición.");
  }
}

function buildChart(labels, ph, temp, turb) {
  if (!el.canvas) return;

  if (chart) chart.destroy();

  chart = new Chart(el.canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "pH", data: ph, tension: 0.35 },
        { label: "Temperatura (°C)", data: temp, tension: 0.35 },
        { label: "Turbidez (NTU)", data: turb, tension: 0.35 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: "#eaf6ff" } },
        tooltip: { enabled: true },
      },
      scales: {
        x: { ticks: { color: "rgba(234,246,255,0.7)" }, grid: { color: "rgba(255,255,255,0.06)" } },
        y: { ticks: { color: "rgba(234,246,255,0.7)" }, grid: { color: "rgba(255,255,255,0.06)" } },
      },
    },
  });
}

async function updateChart() {
  try {
    const series = await fetchJSON(`${API_BASE}/history/series?limit=50`);

    if (!series.ph || !series.ph.points || series.ph.points.length === 0) return;

    const labels = series.ph.points.map(p => new Date(p.timestamp).toLocaleTimeString());

    const ph = series.ph.points.map(p => (p.valid ? p.value : null));
    const temp = series.temperature.points.map(p => (p.valid ? p.value : null));
    const turb = series.turbidity.points.map(p => (p.valid ? p.value : null));

    buildChart(labels, ph, temp, turb);
  } catch (err) {
    console.error("Error Chart:", err);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log("dashboard.js cargado ✅ API_BASE =", API_BASE);

  await updateKPIs();
  await updateChart();

  setInterval(updateKPIs, 5000);
  setInterval(updateChart, 15000);
});


const SENSORS = [
  { key: "temperature", label: "Temperatura", unit: "°C", valueId: "tempValue", statusId: "tempStatus" },
  { key: "ph",          label: "pH",          unit: "pH", valueId: "phValue",   statusId: "phStatus"   },
  { key: "turbidity",   label: "Turbidez",    unit: "NTU",valueId: "tuValue",   statusId: "tuStatus"   },
];

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function humanStatus(latest) {
  if (!latest) return { text: "Sensor Offline", cls: "offline" };

  if (latest.valid === false) {
    // reason puede ser: MISSING_VALUE, OUT_OF_RANGE_LOW, OUT_OF_RANGE_HIGH, NOT_A_NUMBER...
    const reason = latest.reason ? ` (${latest.reason})` : "";
    return { text: `Sensor Fuera de Rango (En Mantenimiento)${reason}`, cls: "warn" };
  }

  return { text: "OK", cls: "ok" };
}

async function fetchLatest(sensorKey) {
  const url = `${API_BASE}/api/sensors/${sensorKey}/latest?limit=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

async function tick() {
  for (const s of SENSORS) {
    try {
      const data = await fetchLatest(s.key);
      const latest = data.latest;

      const st = humanStatus(latest);
      setText(s.statusId, st.text);

      if (!latest || latest.value === null || latest.value === undefined) {
        setText(s.valueId, "--");
      } else {
        setText(s.valueId, `${Number(latest.value).toFixed(2)} ${s.unit}`);
      }

      if (latest && latest.timestamp) {
        setText("lastUpdate", latest.timestamp);
      }
    } catch (e) {
      setText(s.statusId, "Dashboard sin conexión al backend");
      setText(s.valueId, "--");
    }
  }
}

setInterval(tick, 2000);
tick();
