// frontend/assets/js/dashboard.js
document.addEventListener('DOMContentLoaded', () => {
  const dashboard = new Dashboard();
  dashboard.initialize();
});

class Dashboard {
  constructor() {
    this.charts = {};
    this.sensorData = null;
    this.lastUpdate = null;
    this.autoRefreshInterval = null;
    this.dataHistory = {
      temperature: [],
      ph: [],
      turbidity: []
    };
  }

  initialize() {
    this.setupEventListeners();
    this.initializeCharts();
    this.fetchAndDisplayData();
    this.startAutoRefresh();
  }

  setupEventListeners() {
    document.getElementById('refresh-btn').addEventListener('click', () => {
      this.fetchAndDisplayData();
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
      this.logout();
    });
  }

  initializeCharts() {
    const ctxTemp = document.getElementById('temp-chart').getContext('2d');
    const ctxPh = document.getElementById('ph-chart').getContext('2d');
    const ctxTurbidity = document.getElementById('turbidity-chart').getContext('2d');

    this.createChart(ctxTemp, 'Temperatura (°C)', '#e74c3c');
    this.createChart(ctxPh, 'pH', '#3498db');
    this.createChart(ctxTurbidity, 'Turbidez (NTU)', '#9b59b6');
  }

  createChart(ctx, label, borderColor) {
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [{
          label: label,
          data: [],
          borderColor: borderColor,
          backgroundColor: borderColor + '15',
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: borderColor,
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'minute',
              tooltipFormat: 'MMM d, HH:mm'
            },
            title: {
              display: true,
              text: 'Hora'
            }
          },
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: label.split(' ')[0]
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0,0,0,0.7)',
            titleColor: 'white',
            bodyColor: 'white'
          }
        },
        animation: {
          duration: 0
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    });
    
    const sensorType = label.toLowerCase().includes('temperatura') ? 'temperature' : 
                      label.toLowerCase().includes('ph') ? 'ph' : 'turbidity';
    
    this.charts[sensorType] = chart;
  }

  async fetchAndDisplayData() {
    try {
      this.showLoading();
      
      const data = await mangoAPI.getSensorData();
      this.sensorData = data;
      this.lastUpdate = new Date();
      
      this.updateUI(data);
      this.updateCharts(data);
      this.checkAlerts(data);
      
      this.updateConnectionStatus(data.status === 'online');
      
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      this.showOfflineMode();
      this.updateConnectionStatus(false);
    } finally {
      this.hideLoading();
    }
  }

  updateUI(data) {
    // Actualizar valores de los sensores
    document.getElementById('temp-value').textContent = 
      data.data.temperature?.value ? data.data.temperature.value.toFixed(1) : '--';
    
    document.getElementById('ph-value').textContent = 
      data.data.ph?.value ? data.data.ph.value.toFixed(2) : '--';
    
    document.getElementById('turbidity-value').textContent = 
      data.data.turbidity?.value ? data.data.turbidity.value.toFixed(1) : '--';
    
    // Actualizar última actualización
    const now = new Date();
    document.getElementById('last-update').textContent = 
      `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Actualizar estado del sistema
    document.getElementById('system-state').textContent = 
      data.status === 'online' ? 'Operativo' : 'Sensores Offline';
    
    // Actualizar modo
    document.getElementById('system-mode').textContent = 
      data.status === 'online' ? 'Monitoreo en tiempo real' : 'Mostrando datos históricos';
    
    // Actualizar sensores activos
    const activeSensors = Object.values(data.connection_status || {})
      .filter(status => status === 'online').length;
    document.getElementById('active-sensors').textContent = `${activeSensors}/3`;
  }

  updateCharts(data) {
    Object.entries(data.data).forEach(([sensorType, sensorData]) => {
      if (sensorData && sensorData.value !== null && this.charts[sensorType]) {
        const chart = this.charts[sensorType];
        
        // Agregar nuevo dato al historial
        const timestamp = new Date();
        const value = sensorData.value;
        
        this.dataHistory[sensorType].push({ timestamp, value });
        
        // Mantener solo los últimos 120 puntos (2 horas)
        if (this.dataHistory[sensorType].length > 120) {
          this.dataHistory[sensorType].shift();
        }
        
        // Actualizar gráfico
        chart.data.datasets[0].data = this.dataHistory[sensorType].map(point => ({
          x: point.timestamp,
          y: point.value
        }));
        
        chart.update('none');  // Sin animación para mejor rendimiento
      }
    });
  }

  checkAlerts(data) {
    const alertsContainer = document.getElementById('alerts-container');
    alertsContainer.innerHTML = '';
    
    const alerts = [];
    
    // Alerta si sensores offline
    if (data.status !== 'online') {
      alerts.push({
        type: 'warning',
        message: '⚠️ Los sensores están offline. Mostrando datos históricos de los últimos registros.',
        icon: 'fas fa-exclamation-triangle'
      });
    }
    
    // Alertas por valores fuera de rango
    if (data.data.temperature?.value) {
      if (data.data.temperature.value < 20 || data.data.temperature.value > 35) {
        alerts.push({
          type: 'warning',
          message: `🌡️ Temperatura fuera de rango normal (${data.data.temperature.value.toFixed(1)}°C). Valores esperados: 20-35°C`,
          icon: 'fas fa-thermometer'
        });
      }
    }
    
    if (data.data.ph?.value) {
      if (data.data.ph.value < 5.0 || data.data.ph.value > 9.0) {
        alerts.push({
          type: 'danger',
          message: `💧 pH crítico (${data.data.ph.value.toFixed(2)}). Valores esperados: 5.0-9.0 pH. Posible contaminación.`,
          icon: 'fas fa-tint'
        });
      }
    }
    
    if (data.data.turbidity?.value) {
      if (data.data.turbidity.value > 150) {
        alerts.push({
          type: 'warning',
          message: `🌊 Alta turbidez (${data.data.turbidity.value.toFixed(1)} NTU). Valores esperados: < 150 NTU.`,
          icon: 'fas fa-water'
        });
      }
    }
    
    // Mostrar alertas
    alerts.forEach(alert => {
      const alertDiv = document.createElement('div');
      alertDiv.className = `alert ${alert.type}`;
      alertDiv.innerHTML = `
        <i class="${alert.icon}"></i>
        <div class="alert-content">
          <p>${alert.message}</p>
        </div>
      `;
      alertsContainer.appendChild(alertDiv);
    });
  }

  updateConnectionStatus(isOnline) {
    const indicator = document.getElementById('status-indicator');
    const text = document.getElementById('status-text');
    
    if (isOnline) {
      indicator.className = 'status-indicator online';
      text.textContent = 'Sensores: Conectados';
      text.style.color = '';
    } else {
      indicator.className = 'status-indicator offline';
      text.textContent = 'Sensores: Offline';
      text.style.color = '#dc3545';
    }
  }

  showOfflineMode() {
    console.log('Modo offline activado');
  }

  showLoading() {
    document.getElementById('refresh-btn').disabled = true;
    document.getElementById('refresh-btn').innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  }

  hideLoading() {
    document.getElementById('refresh-btn').disabled = false;
    document.getElementById('refresh-btn').innerHTML = '<i class="fas fa-sync"></i>';
  }

  async logout() {
    try {
      await mangoAPI.logout();
      window.location.href = 'login.html';
    } catch (error) {
      console.error('Error en logout:', error);
      window.location.href = 'login.html';
    }
  }

  startAutoRefresh() {
    // Actualizar cada 30 segundos
    this.autoRefreshInterval = setInterval(() => {
      this.fetchAndDisplayData();
    }, 30000);
  }

  destroy() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
    Object.values(this.charts).forEach(chart => chart.destroy());
  }
}