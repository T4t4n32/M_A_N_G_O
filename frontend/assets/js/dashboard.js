/**
 * M.A.N.G.O - Monitoreo Autonomo de Niveles y Gestion Oceanica
 * Lógica principal del dashboard de monitoreo
 */

class DashboardApp {
  constructor() {
    this.apiBase = getApiBaseUrl();
    this.config = {
      updateInterval: 5000, // 5 segundos
      chartHistoryMinutes: 30,
      maxDataPoints: 60 // 1 punto por segundo durante 60 segundos
    };
    
    this.sensors = {
      ph: {
        name: 'pH',
        icon: '💧',
        unit: 'pH',
        description: 'Nivel de acidez/alkalinidad del agua',
        optimalRange: { min: 6.5, max: 8.5 },
        chartColor: '#3498db',
        lastData: null,
        historicalData: [],
        status: 'needs_calibration',
        connected: false,
        hardwareNote: 'Sensor de pH requiere calibración antes de uso'
      },
      temperature: {
        name: 'Temperatura',
        icon: '🌡',
        unit: '°C',
        description: 'Temperatura del agua',
        optimalRange: { min: 24, max: 28 },
        chartColor: '#e74c3c',
        lastData: null,
        historicalData: [],
        status: 'operational',
        connected: false,
        hardwareNote: 'Sensor de temperatura listo para usar'
      },
      turbidity: {
        name: 'Turbidez',
        icon: '🌫',
        unit: 'NTU',
        description: 'Claridad del agua',
        optimalRange: { min: 0, max: 5 },
        chartColor: '#9b59b6',
        lastData: null,
        historicalData: [],
        status: 'hardware_issue',
        connected: false,
        hardwareNote: 'Sensor de turbidez con problema de hardware - requiere mantenimiento'
      }
    };
    
    this.systemState = {
      sensorsConnected: false,
      databaseConfigured: false,
      lastUpdate: null,
      chartInstances: {},
      wasOnline: false,
      offlineMode: false,
      systemStatus: 'initializing'
    };
    
    this.domElements = {};
  }

  /**
   * Inicializa la aplicación del dashboard
   */
  async init() {
    this.cacheDOMElements();
    this.setupEventListeners();
    
    logSystem('Iniciando dashboard de M.A.N.G.O...');
    
    // Verificar sesión primero
    const sessionValid = await this.checkSession();
    if (!sessionValid) return;
    
    // Verificar conexiones iniciales
    await this.checkSystemStatus();
    
    // Renderizar dashboard
    this.renderDashboard();
    
    // Configurar actualización periódica
    this.setupAutoUpdate();
    
    logSystem('Dashboard inicializado correctamente');
  }

  /**
   * Cachea los elementos del DOM que se usan frecuentemente
   */
  cacheDOMElements() {
    this.domElements = {
      mainConnectionStatus: document.getElementById('main-status-indicator'),
      databaseConnectionStatus: document.getElementById('database-status-indicator'),
      mainStatusText: document.getElementById('main-status-text'),
      databaseStatusText: document.getElementById('database-status-text'),
      explorationStatus: document.getElementById('exploration-text'),
      sensorsContainer: document.getElementById('sensors-container'),
      systemStateElement: document.getElementById('system-state'),
      lastUpdateTimeElement: document.getElementById('last-update-time'),
      refreshBtn: document.getElementById('refresh-btn'),
      historicalBtn: document.getElementById('historical-btn'),
      notificationContainer: document.getElementById('notification-container'),
      logoutBtn: document.querySelector('.logout-btn')
    };
  }

  /**
   * Configura los listeners de eventos
   */
  setupEventListeners() {
    if (this.domElements.refreshBtn) {
      this.domElements.refreshBtn.addEventListener('click', () => this.handleRefresh());
    }
    
    if (this.domElements.historicalBtn) {
      this.domElements.historicalBtn.addEventListener('click', () => this.handleHistoricalData());
    }
    
    if (this.domElements.logoutBtn) {
      this.domElements.logoutBtn.addEventListener('click', () => this.logout());
    }
    
    // Listener para modo offline/online
    window.addEventListener('online', () => this.handleConnectionChange(true));
    window.addEventListener('offline', () => this.handleConnectionChange(false));
  }

  /**
   * Maneja cambios en la conexión de red
   * @param {boolean} isOnline - true si está online, false si está offline
   */
  handleConnectionChange(isOnline) {
    this.systemState.offlineMode = !isOnline;
    
    if (isOnline) {
      logSystem('Conexión restaurada. Verificando estado del sistema...');
      this.checkSystemStatus();
    } else {
      logSystem('Conexión perdida. Activando modo offline', true);
      this.updateConnectionStatus();
    }
  }

  /**
   * Verifica si la sesión es válida
   * @returns {Promise<boolean>} true si la sesión es válida
   */
  async checkSession() {
    try {
      const response = await fetch(`${this.apiBase}/auth/status`, {
        method: 'GET',
        credentials: 'include',
        signal: AbortSignal.timeout(3000)
      });
      
      if (!response.ok) {
        logSystem('Sesión inválida. Redirigiendo a login', true);
        window.location.href = 'login.html';
        return false;
      }
      
      return true;
    } catch (error) {
      logSystem(`Error verificando sesión: ${error.message}`, true);
      window.location.href = 'login.html';
      return false;
    }
  }

  /**
   * Verifica el estado del sistema
   */
  async checkSystemStatus() {
    try {
      const response = await fetch(`${this.apiBase}/status`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include',
        signal: AbortSignal.timeout(3000)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const statusData = await response.json();
      
      // Actualizar estado de sensores
      this.systemState.sensorsConnected = statusData.sensors.connected;
      this.systemState.databaseConfigured = statusData.database.online;
      
      // Actualizar estado de cada sensor
      if (statusData.sensors.details) {
        Object.keys(this.sensors).forEach(sensorKey => {
          if (statusData.sensors.details[sensorKey]) {
            this.sensors[sensorKey].connected = statusData.sensors.details[sensorKey].connected;
            this.sensors[sensorKey].status = statusData.sensors.details[sensorKey].status;
            this.sensors[sensorKey].hardwareNote = statusData.sensors.details[sensorKey].hardware_note || '';
          }
        });
      }
      
      // Actualizar estado del sistema
      this.systemState.lastUpdate = new Date();
      this.systemState.systemStatus = 'operational';
      
      this.updateConnectionStatus();
      this.updateSystemInfo();
      
      return true;
    } catch (error) {
      logSystem(`Error verificando estado del sistema: ${error.message}`, true);
      this.systemState.systemStatus = 'error';
      return false;
    }
  }

  /**
   * Actualiza el estado de conexión en la interfaz
   */
  updateConnectionStatus() {
    const isOnline = this.systemState.systemStatus === 'operational';
    this.systemState.offlineMode = !isOnline;
    
    // Actualizar estado de sensores
    if (this.domElements.mainConnectionStatus && this.domElements.mainStatusText) {
      if (this.systemState.sensorsConnected) {
        this.domElements.mainConnectionStatus.className = 'status-indicator online';
        this.domElements.mainStatusText.textContent = 'Sensores: Conectados';
      } else {
        this.domElements.mainConnectionStatus.className = 'status-indicator offline';
        this.domElements.mainStatusText.textContent = 'Sensores: Desconectados';
      }
    }
    
    // Actualizar estado de base de datos
    if (this.domElements.databaseConnectionStatus && this.domElements.databaseStatusText) {
      if (this.systemState.databaseConfigured) {
        this.domElements.databaseConnectionStatus.className = 'status-indicator online';
        this.domElements.databaseStatusText.textContent = 'Base de datos: Configurada';
      } else {
        this.domElements.databaseConnectionStatus.className = 'status-indicator offline';
        this.domElements.databaseStatusText.textContent = 'Base de datos: No configurada';
      }
    }
    
    // Actualizar estado general
    let statusText = 'Sistema: Listo';
    let statusClass = 'online';
    
    if (!this.systemState.sensorsConnected) {
      statusText = 'Sistema: Sensores desconectados';
      statusClass = 'offline';
    }
    
    if (this.domElements.systemStateElement) {
      this.domElements.systemStateElement.textContent = statusText;
      this.domElements.systemStateElement.className = statusClass;
    }
    
    // Actualizar clase del body para estilos
    document.body.classList.toggle('offline-mode', this.systemState.offlineMode);
    
    return isOnline;
  }

  /**
   * Actualiza la información del sistema en la interfaz
   */
  updateSystemInfo() {
    if (this.domElements.lastUpdateTimeElement && this.systemState.lastUpdate) {
      this.domElements.lastUpdateTimeElement.textContent = formatDateTime(this.systemState.lastUpdate);
    }
  }

  /**
   * Obtiene datos actuales de los sensores
   */
  async fetchCurrentData() {
    try {
      const response = await fetch(`${this.apiBase}/sensors/all`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include',
        signal: AbortSignal.timeout(4000)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const sensorsData = await response.json();
      
      // Actualizar cada sensor
      Object.keys(this.sensors).forEach(sensorKey => {
        const sensorData = sensorsData[sensorKey];
        
        if (sensorData) {
          this.sensors[sensorKey].connected = sensorData.connected;
          this.sensors[sensorKey].status = sensorData.status;
          
          // Solo actualizar datos si el sensor está conectado
          if (sensorData.connected && sensorData.data) {
            this.sensors[sensorKey].lastData = sensorData.data;
            this.addToHistoricalData(sensorKey, sensorData.data);
          } else {
            this.sensors[sensorKey].lastData = null;
          }
        }
      });
      
      return true;
    } catch (error) {
      logSystem(`Error obteniendo datos de sensores: ${error.message}`, true);
      return false;
    }
  }

  /**
   * Agrega datos al historial para los gráficos
   * @param {string} sensorKey - Clave del sensor
   * @param {Object} data - Datos del sensor
   */
  addToHistoricalData(sensorKey, data) {
    const sensor = this.sensors[sensorKey];
    const timestamp = new Date(data.timestamp || data.received_at || new Date());
    
    // Crear punto de datos para el gráfico
    const chartPoint = {
      x: timestamp,
      y: parseFloat(data.value)
    };
    
    // Agregar al array histórico
    sensor.historicalData.push(chartPoint);
    
    // Mantener solo los últimos datos (30 minutos)
    const thirtyMinutesAgo = new Date(Date.now() - this.config.chartHistoryMinutes * 60000);
    sensor.historicalData = sensor.historicalData.filter(point => point.x > thirtyMinutesAgo);
  }

  /**
   * Crea un gráfico para un sensor específico
   * @param {string} sensorKey - Clave del sensor
   * @param {HTMLElement} chartContainer - Contenedor del gráfico
   */
  createSensorChart(sensorKey, chartContainer) {
    const ctx = document.createElement('canvas');
    chartContainer.appendChild(ctx);
    
    const sensor = this.sensors[sensorKey];
    const chartData = {
      datasets: [{
        label: `${sensor.name} en tiempo real`,
        data: sensor.historicalData,
        borderColor: sensor.chartColor,
        backgroundColor: `${sensor.chartColor}22`,
        tension: 0.3,
        fill: true,
        pointRadius: 2,
        pointBackgroundColor: sensor.chartColor,
        borderWidth: 2
      }]
    };
    
    const chart = new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: {
              size: 14
            },
            bodyFont: {
              size: 13
            },
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.y}${sensor.unit}`;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'minute',
              tooltipFormat: 'HH:mm:ss',
              displayFormats: {
                minute: 'HH:mm'
              }
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#a8d8c5',
              maxTicksLimit: 5
            }
          },
          y: {
            beginAtZero: sensorKey === 'turbidity',
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#a8d8c5'
            },
            title: {
              display: true,
              text: sensor.unit,
              color: sensor.chartColor,
              font: {
                size: 12
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'nearest'
        },
        animation: {
          duration: 0
        }
      }
    });
    
    // Guardar instancia para actualizaciones futuras
    this.systemState.chartInstances[sensorKey] = chart;
    return chart;
  }

  /**
   * Actualiza un gráfico existente
   * @param {string} sensorKey - Clave del sensor
   */
  updateSensorChart(sensorKey) {
    const chart = this.systemState.chartInstances[sensorKey];
    if (chart) {
      chart.data.datasets[0].data = this.sensors[sensorKey].historicalData;
      chart.update('none'); // Sin animación para mejor rendimiento
    }
  }

  /**
   * Renderiza una tarjeta de sensor
   * @param {string} sensorKey - Clave del sensor
   * @returns {HTMLElement} Elemento DOM de la tarjeta
   */
  renderSensorCard(sensorKey) {
    const sensor = this.sensors[sensorKey];
    const data = sensor.lastData;
    
    const card = document.createElement('div');
    card.className = `sensor-card ${sensorKey} ${sensor.status} ${!sensor.connected ? 'offline' : ''}`;
    
    // Si el sensor no está conectado
    if (!sensor.connected) {
      card.innerHTML = `
        <div class="sensor-header">
          <div class="sensor-title">
            <span class="sensor-icon">${sensor.icon}</span>
            ${sensor.name}
          </div>
        </div>
        <div class="no-data-message">
          <div class="no-data-icon">🔌</div>
          <div class="no-data-title">Sensor no conectado</div>
          <p class="no-data-text">${sensor.hardwareNote}</p>
          <p>Conecte el sensor físico para ver datos en tiempo real.</p>
        </div>
      `;
      return card;
    }
    
    // Si el sensor está conectado pero no tiene datos
    if (sensor.connected && !data) {
      card.innerHTML = `
        <div class="sensor-header">
          <div class="sensor-title">
            <span class="sensor-icon">${sensor.icon}</span>
            ${sensor.name}
          </div>
        </div>
        <div class="no-data-message">
          <div class="no-data-icon">⚠️</div>
          <div class="no-data-title">Sensor conectado sin lecturas</div>
          <p class="no-data-text">${sensor.hardwareNote}</p>
          <p>El sensor está conectado pero no está enviando datos. Verifique la configuración.</p>
        </div>
      `;
      return card;
    }
    
    // Si el sensor tiene datos
    let statusText = '✅ Operativo';
    let statusClass = 'success';
    
    if (sensor.status === 'needs_calibration') {
      statusText = '🔧 Necesita calibración';
      statusClass = 'warning';
    } else if (sensor.status === 'hardware_issue') {
      statusText = '🔧 Problema de hardware';
      statusClass = 'error';
    }

    const timestamp = data ? (data.timestamp || data.received_at) : null;
    
    card.innerHTML = `
      <div class="sensor-header">
        <div class="sensor-title">
          <span class="sensor-icon">${sensor.icon}</span>
          ${sensor.name}
        </div>
      </div>
      <div class="sensor-value-container">
        <div class="sensor-value">
          ${data ? parseFloat(data.value).toFixed(1) : '---'}
          <span class="sensor-unit">${sensor.unit}</span>
        </div>
      </div>
      <div class="sensor-meta">
        <div class="status-row">
          <span class="status-label">Estado:</span>
          <span class="status-value ${statusClass}">${statusText}</span>
        </div>
        <div class="status-row">
          <span class="status-label">Descripción:</span>
          <span class="status-value">${sensor.description}</span>
        </div>
        ${sensor.hardwareNote ? `
        <div class="status-row">
          <span class="status-label">Notas:</span>
          <span class="status-value ${sensor.status === 'hardware_issue' ? 'error' : 'warning'}">${sensor.hardwareNote}</span>
        </div>
        ` : ''}
        <div class="last-update">
          📅 Última medición: <span class="update-time">${timestamp ? formatDateTime(timestamp) : 'No disponible'}</span>
        </div>
        <div class="last-update">
          📶 Conexión: <span class="status-value ${sensor.connected ? 'success' : 'error'}">
            ${sensor.connected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
        <div class="chart-container" id="chart-${sensorKey}">
          <!-- El gráfico se generará aquí -->
        </div>
      </div>
    `;
    
    return card;
  }

  /**
   * Renderiza el dashboard completo
   */
  renderDashboard() {
    if (!this.domElements.sensorsContainer) return;
    
    this.domElements.sensorsContainer.innerHTML = '';
    
    // Renderizar tarjetas de sensores - SIEMPRE LAS 3
    Object.keys(this.sensors).forEach(sensorKey => {
      const card = this.renderSensorCard(sensorKey);
      this.domElements.sensorsContainer.appendChild(card);
      
      // Crear gráfico si el contenedor existe y el sensor tiene datos
      const chartContainer = document.getElementById(`chart-${sensorKey}`);
      if (chartContainer && !this.systemState.chartInstances[sensorKey] && this.sensors[sensorKey].lastData) {
        this.createSensorChart(sensorKey, chartContainer);
      }
      
      // Actualizar gráfico si existe
      if (this.systemState.chartInstances[sensorKey]) {
        this.updateSensorChart(sensorKey);
      }
    });
    
    // Actualizar estado de botones
    this.updateButtonStates();
    
    // Mostrar alertas si es necesario
    this.showSystemAlerts();
  }

  /**
   * Muestra alertas del sistema
   */
  showSystemAlerts() {
    const alertsContainer = document.querySelector('.alerts-container');
    if (!alertsContainer) return;
    
    alertsContainer.innerHTML = '';
    
    // Alerta de sensores desconectados
    if (!this.systemState.sensorsConnected) {
      const alert = document.createElement('div');
      alert.className = 'alert alert-warning';
      alert.innerHTML = `
        <span>⚠️</span>
        <div>
          <strong>Ningún sensor conectado</strong><br>
          Conecte los sensores físicos (pH, temperatura, turbidez) para ver datos en tiempo real.
        </div>
      `;
      alertsContainer.appendChild(alert);
    }
    
    // Alerta de base de datos no configurada
    if (!this.systemState.databaseConfigured) {
      const alert = document.createElement('div');
      alert.className = 'alert alert-error';
      alert.innerHTML = `
        <span>⚠️</span>
        <div>
          <strong>Base de datos no configurada</strong><br>
          Configure la conexión a base de datos para almacenar y consultar datos históricos.
        </div>
      `;
      alertsContainer.appendChild(alert);
    }
  }

  /**
   * Actualiza el estado de los botones según la conexión
   */
  updateButtonStates() {
    if (this.domElements.refreshBtn && this.domElements.historicalBtn) {
      // Botón de actualizar - siempre habilitado para verificar estado
      this.domElements.refreshBtn.disabled = false;
      this.domElements.refreshBtn.className = 'action-btn primary';
      
      // Botón de datos históricos - deshabilitado si no hay base de datos
      this.domElements.historicalBtn.disabled = true;
      this.domElements.historicalBtn.className = 'action-btn offline';
      this.domElements.historicalBtn.title = 'Base de datos no configurada';
    }
  }

  /**
   * Maneja el clic en el botón de actualizar
   */
  async handleRefresh() {
    if (!this.domElements.refreshBtn) return;
    
    this.domElements.refreshBtn.disabled = true;
    this.domElements.refreshBtn.innerHTML = '<span>🔄</span> Verificando estado...';
    
    try {
      // Verificar estado del sistema
      await this.checkSystemStatus();
      
      // Obtener datos de sensores si están conectados
      if (this.systemState.sensorsConnected) {
        await this.fetchCurrentData();
      }
      
      // Renderizar dashboard actualizado
      this.renderDashboard();
      
      showNotification('Estado del sistema verificado correctamente', 'online');
    } catch (error) {
      showNotification(`Error al actualizar: ${error.message}`, 'offline');
    } finally {
      this.domElements.refreshBtn.disabled = false;
      this.domElements.refreshBtn.innerHTML = '<span>🔄</span> Verificar Estado';
    }
  }

  /**
   * Maneja el clic en el botón de datos históricos
   */
  handleHistoricalData() {
    showNotification('Base de datos no configurada. Configure la conexión para ver datos históricos', 'offline');
  }

  /**
   * Configura la actualización automática
   */
  setupAutoUpdate() {
    setInterval(() => {
      if (!document.hidden) { // Solo actualizar si la pestaña está visible
        this.checkSystemStatus();
        if (this.systemState.sensorsConnected) {
          this.fetchCurrentData();
        }
        this.renderDashboard();
      }
    }, this.config.updateInterval);
  }

  /**
   * Cierra la sesión del usuario
   */
  logout() {
    fetch(`${this.apiBase}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    }).finally(() => {
      localStorage.clear();
      window.location.href = 'login.html';
    });
  }
}

/**
 * Inicializa la aplicación cuando el DOM esté listo
 */
document.addEventListener('DOMContentLoaded', () => {
  const dashboard = new DashboardApp();
  dashboard.init();
  
  // Manejo de errores globales
  window.addEventListener('error', (event) => {
    logSystem(`Error global: ${event.message}`, true);
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    logSystem(`Promesa no manejada: ${event.reason}`, true);
  });
});