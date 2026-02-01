// M.A.N.G.O - Dashboard de Monitoreo

let charts = {};

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Dashboard M.A.N.G.O iniciado');
    
    // Verificar autenticación
    await checkSession();
    
    // Inicializar gráficos
    initCharts();
    
    // Actualizar datos iniciales
    await updateAllSensors();
    
    // Configurar actualización automática cada 30 segundos
    setInterval(updateAllSensors, 30000);
});

// Inicializar gráficos
function initCharts() {
    const tempCtx = document.getElementById('temp-chart').getContext('2d');
    const phCtx = document.getElementById('ph-chart').getContext('2d');
    const turbidityCtx = document.getElementById('turbidity-chart').getContext('2d');
    
    charts.temp = new Chart(tempCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Temperatura (°C)',
                data: [],
                borderColor: '#f39c12',
                backgroundColor: 'rgba(243, 156, 18, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#a8d8c5'
                    }
                },
                x: {
                    type: 'time',
                    time: {
                        unit: 'minute',
                        displayFormats: {
                            minute: 'HH:mm'
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#a8d8c5'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#eaeaea'
                    }
                }
            }
        }
    });
    
    // Similar para pH y Turbidez...
    // (Implementación completa en el archivo real)
}

// Actualizar todos los sensores
async function updateAllSensors() {
    try {
        await Promise.all([
            fetchSensorData('ph'),
            fetchSensorData('temperature'),
            fetchSensorData('turbidity')
        ]);
        
        console.log('Datos actualizados exitosamente');
    } catch (error) {
        console.error('Error actualizando sensores:', error);
    }
}

// Obtener datos de un sensor específico
async function fetchSensorData(sensorType) {
    try {
        const response = await fetch(`/api/${sensorType}/latest`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        updateSensorDisplay(sensorType, data);
        
    } catch (error) {
        console.error(`Error en sensor ${sensorType}:`, error);
        handleSensorError(sensorType, error.message);
    }
}

// Actualizar visualización del sensor
function updateSensorDisplay(sensorType, data) {
    const elements = {
        'ph': {
            value: 'ph-value',
            trend: 'ph-trend'
        },
        'temperature': {
            value: 'temp-value',
            trend: 'temp-trend'
        },
        'turbidity': {
            value: 'turbidity-value',
            trend: 'turbidity-trend'
        }
    };
    
    const el = elements[sensorType];
    const valueEl = document.getElementById(el.value);
    const trendEl = document.getElementById(el.trend);
    
    if (valueEl) {
        // Formatear valor según tipo de sensor
        let displayValue;
        if (sensorType === 'ph') {
            displayValue = data.voltage ? data.voltage.toFixed(2) : '--';
        } else if (sensorType === 'temperature') {
            displayValue = data.value ? data.value.toFixed(1) : '--';
        } else {
            displayValue = data.raw || '--';
        }
        
        valueEl.textContent = displayValue;
    }
    
    if (trendEl) {
        trendEl.textContent = '✓ En línea';
        trendEl.style.color = '#2ecc71';
    }
}

// Manejar error de sensor
function handleSensorError(sensorType, errorMessage) {
    const elements = {
        'ph': { value: 'ph-value', trend: 'ph-trend' },
        'temperature': { value: 'temp-value', trend: 'temp-trend' },
        'turbidity': { value: 'turbidity-value', trend: 'turbidity-trend' }
    };
    
    const el = elements[sensorType];
    const valueEl = document.getElementById(el.value);
    const trendEl = document.getElementById(el.trend);
    
    if (valueEl) valueEl.textContent = '--';
    if (trendEl) {
        trendEl.textContent = '✗ Offline';
        trendEl.style.color = '#e74c3c';
    }
}