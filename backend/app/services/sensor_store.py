# backend/app/services/sensor_store.py
"""
Almacenamiento en memoria de datos de sensores
"""
import threading
from datetime import datetime, timedelta
from collections import deque

class SensorStore:
    """Almacena datos de sensores en memoria con caché persistente"""
    
    def __init__(self):
        self._lock = threading.Lock()
        self._data = {
            'ph': deque(maxlen=1000),
            'temperature': deque(maxlen=1000),
            'turbidity': deque(maxlen=1000)
        }
        self._last_update = {
            'ph': None,
            'temperature': None,
            'turbidity': None
        }
        self._connection_status = {
            'ph': 'offline',
            'temperature': 'offline',
            'turbidity': 'offline'
        }
    
    def update_sensor(self, sensor_type, value, raw_value=None, location=None):
        """Actualiza datos de un sensor"""
        with self._lock:
            if sensor_type not in self._data:
                raise ValueError(f'Sensor type {sensor_type} not supported')
            
            timestamp = datetime.now().isoformat()
            reading = {
                'value': value,
                'raw_value': raw_value,
                'timestamp': timestamp,
                'location': location,
                'received_at': timestamp,
                'data_quality': 'good' if raw_value is not None else 'questionable'
            }
            
            self._data[sensor_type].append(reading)
            self._last_update[sensor_type] = datetime.now()
            self._connection_status[sensor_type] = 'online'
            
            # Limpiar datos antiguos (más de 1 hora)
            self._cleanup_old_data(sensor_type)
    
    def _cleanup_old_data(self, sensor_type, max_age=timedelta(hours=1)):
        """Elimina datos antiguos para mantener el rendimiento"""
        now = datetime.now()
        while self._data[sensor_type] and now - datetime.fromisoformat(self._data[sensor_type][0]['timestamp']) > max_age:
            self._data[sensor_type].popleft()
    
    def get_latest(self, sensor_type):
        """Obtiene el último dato de un sensor"""
        with self._lock:
            if sensor_type not in self._data or not self._data[sensor_type]:
                return None
            
            return self._data[sensor_type][-1]
    
    def get_all_latest(self):
        """Obtiene los últimos datos de todos los sensores"""
        result = {}
        for sensor_type in self._data:
            latest = self.get_latest(sensor_type)
            result[sensor_type] = latest if latest else {
                'value': None,
                'status': 'no_data',
                'message': 'Sin datos disponibles'
            }
        return result
    
    def get_connection_status(self):
        """Verifica el estado de conexión de los sensores"""
        now = datetime.now()
        status = {}
        
        for sensor_type, last_update in self._last_update.items():
            if last_update is None:
                status[sensor_type] = 'offline'
            elif now - last_update > timedelta(minutes=5):
                status[sensor_type] = 'disconnected'
                self._connection_status[sensor_type] = 'offline'
            else:
                status[sensor_type] = 'online'
        
        return status
    
    def get_system_status(self):
        """Devuelve el estado del sistema para diagnóstico"""
        return {
            'has_data': bool(any(self._data.values())),
            'last_updates': {k: v.isoformat() if v else None for k, v in self._last_update.items()},
            'connection_status': self._connection_status,
            'timestamp': datetime.now().isoformat()
        }

# Instancia singleton
sensor_store = SensorStore()