/**
 * M.A.N.G.O - Monitoreo Autonomo de Niveles y Gestion Oceanica
 * Funciones de utilidad reutilizables en todo el proyecto
 */

/**
 * Formatea una fecha ISO a formato legible (hora:minuto:segundo)
 * @param {string} isoString - Fecha en formato ISO
 * @returns {string} Hora formateada HH:mm:ss
 */
function formatTime(isoString) {
  if (!isoString) return '--:--:--';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '--:--:--';
    
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch (e) {
    console.error('[M.A.N.G.O] Error formateando hora:', e);
    return '--:--:--';
  }
}

/**
 * Formatea fecha y hora completa (DD/MM/YYYY HH:mm:ss)
 * @param {string} isoString - Fecha en formato ISO
 * @returns {string} Fecha y hora formateadas
 */
function formatDateTime(isoString) {
  if (!isoString) return 'No disponible';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    
    return date.toLocaleString('es-ES', { 
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (e) {
    console.error('[M.A.N.G.O] Error formateando fecha:', e);
    return 'Fecha inválida';
  }
}

/**
 * Muestra una notificación en pantalla con animación
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - 'online' (éxito) o 'offline' (advertencia/error)
 */
function showNotification(message, type = 'online') {
  const notificationContainer = document.getElementById('notification-container');
  if (!notificationContainer) return;

  // Eliminar notificaciones previas del mismo tipo
  const existingNotifications = notificationContainer.querySelectorAll(`.notification.${type}`);
  existingNotifications.forEach(notification => {
    notification.remove();
  });

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <span style="font-size: 1.5rem; margin-right: 10px;">${type === 'online' ? '✔' : '⚠'}</span>
    ${message}
  `;
  
  notificationContainer.appendChild(notification);
  
  // Auto-eliminar después de 5 segundos
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(-50%) translateY(-20px)';
    setTimeout(() => {
      if (notificationContainer.contains(notification)) {
        notificationContainer.removeChild(notification);
      }
    }, 300);
  }, 5000);
}

/**
 * Registra mensajes en la consola con formato y contexto
 * @param {string} message - Mensaje a registrar
 * @param {boolean} isError - Si es un error (true) o información (false)
 */
function logSystem(message, isError = false) {
  const timestamp = new Date().toLocaleTimeString('es-ES');
  const prefix = `[M.A.N.G.O ${timestamp}] `;
  console[isError ? 'error' : 'log'](prefix + message);
}

/**
 * Obtiene la configuración de la API según el entorno
 * @returns {string} Base URL de la API
 */
function getApiBaseUrl() {
  // En producción, usar ruta relativa
  if (window.location.hostname !== 'localhost') {
    return '/api';
  }
  
  // En desarrollo, usar localhost con puerto específico
  const port = 5000; // Puerto por defecto del backend
  return `http://localhost:${port}/api`;
}

/**
 * Genera datos simulados para modo offline o prueba
 * @param {string} sensorType - Tipo de sensor (pH, temperature, turbidity)
 * @returns {Object} Datos simulados del sensor
 */
function generateSimulatedData(sensorType) {
  const now = new Date().toISOString();
  const baseTime = Date.now();
  
  switch(sensorType) {
    case 'ph':
      return {
        value: (7.2 + Math.sin(baseTime / 10000) * 0.3).toFixed(1),
        raw: 720 + Math.floor(Math.sin(baseTime / 10000) * 30),
        voltage: (3.6 + Math.sin(baseTime / 15000) * 0.1).toFixed(3),
        timestamp: now,
        status: 'uncalibrated',
        calibration_status: 'needs_calibration'
      };
    case 'temperature':
      return {
        value: (25.5 + Math.sin(baseTime / 8000) * 1.5).toFixed(1),
        raw: 255 + Math.floor(Math.sin(baseTime / 8000) * 10),
        timestamp: now,
        status: 'calibrated',
        calibration_status: 'calibrated'
      };
    case 'turbidity':
      return {
        value: (120 + Math.floor(Math.random() * 80) - 40).toFixed(0),
        raw: 300 + Math.floor(Math.random() * 200) - 100,
        timestamp: now,
        status: 'uncalibrated',
        calibration_status: 'hardware_issue',
        hardware_note: 'Sensor funcional pero con lecturas inconsistentes'
      };
    default:
      return {
        value: 0,
        timestamp: now,
        status: 'unknown'
      };
  }
}

/**
 * Verifica si el navegador está en modo offline
 * @returns {boolean} true si está offline, false si está online
 */
function isOfflineMode() {
  return !navigator.onLine || localStorage.getItem('mango_offline_mode') === 'true';
}

/**
 * Configura listeners para cambios de conexión
 */
function setupConnectionListeners() {
  window.addEventListener('online', () => {
    logSystem('Conexión restaurada');
    document.body.classList.remove('offline-mode');
    if (localStorage.getItem('mango_offline_mode') === 'true') {
      localStorage.removeItem('mango_offline_mode');
      showNotification('Conexión restaurada. Volviendo a modo online', 'online');
    }
  });
  
  window.addEventListener('offline', () => {
    logSystem('Conexión perdida. Activando modo offline', true);
    document.body.classList.add('offline-mode');
    localStorage.setItem('mango_offline_mode', 'true');
    showNotification('Sin conexión a internet. Usando modo offline', 'offline');
  });
}

/**
 * Inicializa funciones de utilidad al cargar la página
 */
function initUtils() {
  setupConnectionListeners();
  logSystem('Utilidades inicializadas correctamente');
}

// Ejecutar inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initUtils);

/**
 * Manejador de errores global para el proyecto
 */
window.addEventListener('error', (event) => {
  logSystem(`Error global: ${event.message} en ${event.filename}:${event.lineno}`, true);
  event.preventDefault();
});

window.addEventListener('unhandledrejection', (event) => {
  logSystem(`Promesa no manejada: ${event.reason}`, true);
  event.preventDefault();
});