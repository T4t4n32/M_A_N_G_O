// Conexión SENCILLA al backend (¡usa localhost explícitamente!)
const API_BASE = "http://localhost:5000/api";

// Función para actualizar datos del sensor
async function fetchSensorData(sensorType, elementId) {
  try {
    const response = await fetch(`${API_BASE}/${sensorType}/latest`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    
    const data = await response.json();
    document.getElementById(elementId).textContent = data.raw;
    document.getElementById(`${elementId}-time`).textContent = 
      new Date(data.received_at).toLocaleTimeString();
  } catch (error) {
    console.error(`Error en ${sensorType}:`, error);
    document.getElementById(elementId).textContent = "⚠️ ERROR";
  }
}

// Actualizar cada 3 segundos (pH + temperatura + turbidez)
setInterval(() => {
  fetchSensorData("ph", "ph-value");
  fetchSensorData("temperature", "temp-value");
  fetchSensorData("turbidity", "turb-value");
}, 3000);

// Carga inicial inmediata
document.addEventListener("DOMContentLoaded", () => {
  fetchSensorData("ph", "ph-value");
  fetchSensorData("temperature", "temp-value");
  fetchSensorData("turbidity", "turb-value");
});