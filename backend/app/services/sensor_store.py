import time
import random
from datetime import datetime

class SensorStore:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SensorStore, cls).__new__(cls)
            cls._instance._data = {}
            cls._instance._raw_data = {}  # Almacena datos crudos del hardware
            cls._instance.simulation_mode = False  # False para datos reales
            cls._instance.last_update = {}
        return cls._instance
    
    def update(self, sensor_type, data):
        """Actualiza los datos del sensor con datos procesados"""
        self._data[sensor_type] = data
        self.last_update[sensor_type] = datetime.now().isoformat()
    
    def update_raw(self, sensor_type, raw_value):
        """Actualiza los datos CRUDOS directamente desde el hardware"""
        timestamp = datetime.now().isoformat()
        
        # ✅ CÁLCULO DE VOLTAJE PARA pH (5V sistema, 1023 para 10-bit ADC)
        voltage = (raw_value * 5.0 / 1023) if sensor_type == 'ph' else 0
        
        raw_data = {
            'raw': raw_value,
            'received_at': timestamp,
            'sensor': sensor_type,
            'voltage': round(voltage, 3) if sensor_type == 'ph' else 0,  # Solo para pH
            'status': 'raw_unprocessed',
            'source': 'hardware',
            'calibration_status': 'uncalibrated'  # Indica que no está calibrado
        }
        
        self._raw_data[sensor_type] = raw_data
        self.last_update[sensor_type] = timestamp
        print(f"💾 {sensor_type.upper()} crudo actualizado: {raw_value} (V: {voltage:.3f})")
        return raw_data
    
    def get_latest(self, sensor_type):
        """Obtiene los últimos datos disponibles"""
        # 1. Para temperatura: intenta datos procesados primero
        if sensor_type == 'temperature' and sensor_type in self._data:
            return self._data[sensor_type]
        
        # 2. Para pH y turbidez: usa SIEMPRE datos crudos
        if sensor_type in ['ph', 'turbidity'] and sensor_type in self._raw_data:
            return self._raw_data[sensor_type]
        
        # 3. Si no hay datos crudos, usa datos procesados o simulados
        if sensor_type in self._data and self._data[sensor_type]:
            return self._data[sensor_type]
        
        return self._get_simulated_data(sensor_type)
    
    def _get_simulated_data(self, sensor_type):
        """Genera datos simulados para desarrollo"""
        timestamp = datetime.now().isoformat()
        base_time = int(time.time())
        
        simulated = {
            'ph': {
                'raw': 700 + (base_time % 50),  # Valor ADC simulado
                'received_at': timestamp,
                'sensor': 'ph',
                'voltage': round(3.4 + (base_time % 20) * 0.01, 3),  # Voltaje simulado
                'status': 'simulation_raw',
                'source': 'simulated',
                'calibration_status': 'uncalibrated'
            },
            'temperature': {
                'raw': 250 + (base_time % 15),  # Valor crudo
                'value': 25.0 + (base_time % 5) * 0.1,  # Valor calibrado
                'received_at': timestamp,
                'sensor': 'temperature',
                'status': 'simulation_calibrated',
                'source': 'simulated',
                'calibration_status': 'calibrated'
            },
            'turbidity': {
                'raw': 200 + (base_time % 300),  # Valor ADC simulado
                'received_at': timestamp,
                'sensor': 'turbidity',
                'voltage': 0.0,
                'status': 'simulation_raw',
                'source': 'simulated',
                'calibration_status': 'uncalibrated'
            }
        }
        
        return simulated.get(sensor_type, {
            'status': 'no_data',
            'received_at': timestamp,
            'sensor': sensor_type
        })

    def get_system_status(self):
        """Devuelve el estado del sistema para diagnóstico"""
        return {
            'simulation_mode': self.simulation_mode,
            'has_processed_data': bool(self._data),
            'has_raw_data': bool(self._raw_data),
            'last_updates': self.last_update,
            'timestamp': datetime.now().isoformat()
        }
    
        # Agregar estos métodos dentro de la clase SensorStore:

    def get_historical_data(self, sensor_type, limit=10):
        """
        Obtiene datos históricos reales de un sensor (NO SIMULADOS)
        """
        try:
            # En producción: aquí iría la consulta a la base de datos
            # Por ahora, devolvemos datos vacíos (no hay registros reales)
            return []
        except Exception as e:
            print(f"Error obteniendo datos históricos de {sensor_type}: {e}")
            return []

    def get_historical_count(self, sensor_type):
        """
        Cuenta cuántos registros históricos existen para un sensor
        """
        try:
            # En producción: COUNT(*) desde la base de datos
            return 0  # Por ahora no hay datos reales
        except Exception as e:
            print(f"Error contando datos históricos de {sensor_type}: {e}")
            return 0

    def get_last_historical_update(self, sensor_type):
        """
        Obtiene la última actualización de datos históricos
        """
        try:
            # En producción: MAX(timestamp) desde la base de datos
            return None
        except Exception as e:
            print(f"Error obteniendo última actualización de {sensor_type}: {e}")
            return None

    def clear_cache(self):
        """
        Limpia cachés para desarrollo
        """
        self._data = {}
        self._raw_data = {}
        self.last_update = {}
        print("🧹 Caché del sensor_store limpiado")

# Instancia global
sensor_store = SensorStore()

# ¡¡¡INYECCIÓN AUTOMÁTICA DE DATOS CRUDOS PARA DEMOSTRACIÓN!!! (¡CORREGIDO!)
if not sensor_store.simulation_mode and not sensor_store._raw_data:  # ¡AQUÍ ESTABA EL ERROR! _raw_ -> _raw_data
    import threading
    
    def inject_demo_data():
        """Inyecta datos de demostración periódicamente"""
        print("🎭 Iniciando inyección de datos crudos de demostración...")
        while True:
            # Simula datos crudos como si vinieran del hardware
            sensor_store.update_raw('ph', 720 + (int(time.time()) % 30))  # Valor ADC
            
            # Temperatura especial - datos calibrados (NO va en _raw_data)
            temp_data = {
                'raw': 255 + (int(time.time()) % 10),
                'value': 25.5 + (int(time.time()) % 5) * 0.1,  # Valor calibrado
                'received_at': datetime.now().isoformat(),
                'sensor': 'temperature',
                'status': 'calibrated',
                'source': 'hardware',
                'calibration_status': 'calibrated'
            }
            sensor_store._data['temperature'] = temp_data  # ¡IMPORTANTE! Va en _data, no en _raw_data
            
            sensor_store.update_raw('turbidity', 300 + (int(time.time()) % 200))  # Valor ADC
            time.sleep(2)
    
    demo_thread = threading.Thread(target=inject_demo_data, daemon=True)
    demo_thread.start()