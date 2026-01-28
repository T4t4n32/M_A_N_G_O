# backend/app/services/serial_manager.py
"""
Gestor de comunicación serial con dispositivos
"""
import serial
import threading
import time
from datetime import datetime
from ..services.sensor_store import sensor_store

class SerialManager:
    """Gestor robusto de comunicación serial con reconexión automática"""
    
    def __init__(self, port='/dev/ttyUSB0', baudrate=9600, timeout=1):
        self.port = port
        self.baudrate = baudrate
        self.timeout = timeout
        self.serial = None
        self.running = False
        self.thread = None
        self.last_error = None
        self.reconnect_attempts = 0
        self.max_reconnect_attempts = 5
    
    def connect(self):
        """Intenta conectar con reintento automático"""
        while self.reconnect_attempts < self.max_reconnect_attempts:
            try:
                print(f"🔌 Intentando conectar a {self.port}...")
                self.serial = serial.Serial(
                    port=self.port,
                    baudrate=self.baudrate,
                    timeout=self.timeout,
                    write_timeout=self.timeout
                )
                self.reconnect_attempts = 0  # Resetear contador
                print(f"✅ Conexión exitosa a {self.port}")
                return True
            except Exception as e:
                self.reconnect_attempts += 1
                self.last_error = str(e)
                print(f"❌ Error al conectar ({self.reconnect_attempts}/{self.max_reconnect_attempts}): {e}")
                time.sleep(2 ** self.reconnect_attempts)  # Backoff exponencial
        
        print("🚨 Máximo de intentos de conexión alcanzado")
        return False
    
    def read_data(self):
        """Lee datos con manejo de errores robusto"""
        buffer = ""
        
        while self.running and self.serial and self.serial.is_open:
            try:
                if self.serial.in_waiting:
                    # Leer datos del puerto serial
                    raw_data = self.serial.read(self.serial.in_waiting).decode('utf-8', errors='ignore')
                    buffer += raw_data
                    
                    # Procesar líneas completas
                    while '\n' in buffer:
                        line, buffer = buffer.split('\n', 1)
                        line = line.strip()
                        if line:
                            self.process_line(line)
            except serial.SerialException as e:
                print(f"⚠️ Error de puerto serial: {e}")
                self.handle_serial_error(e)
            except Exception as e:
                print(f"🔥 Error inesperado leyendo serial: {e}")
                self.handle_serial_error(e)
            
            time.sleep(0.1)  # Pequeño delay para no saturar CPU
    
    def process_line(self, line):
        """Procesa línea de datos del serial"""
        try:
            # Formato esperado: "sensor:value" o "sensor_raw:value"
            if ':' in line:
                sensor_type, value = line.split(':', 1)
                sensor_type = sensor_type.strip().lower()
                value = value.strip()
                
                # Validar valor numérico
                try:
                    raw_value = float(''.join(filter(lambda x: x.isdigit() or x in ['.', '-'], value)))
                    
                    # Determinar tipo de sensor y procesar
                    sensor_map = {
                        'ph': 'ph',
                        'p': 'ph',
                        'temp': 'temperature',
                        'temperature': 'temperature',
                        'turb': 'turbidity',
                        'turbidity': 'turbidity',
                        'ntu': 'turbidity'
                    }
                    
                    internal_type = sensor_map.get(sensor_type)
                    if internal_type:
                        if '_raw' in sensor_type:
                            # Datos crudos
                            sensor_store.update_sensor(internal_type, raw_value, raw_value=raw_value)
                            print(f"✅ {internal_type.upper()} crudo actualizado: {raw_value}")
                        else:
                            # Datos procesados/calibrados
                            sensor_store.update_sensor(internal_type, raw_value)
                            print(f"✅ {internal_type.upper()} calibrado actualizado: {raw_value}")
                        return
                except ValueError:
                    print(f"⚠️ Valor no numérico en línea: {line}")
            
            print(f"🔍 Línea ignorada (formato incorrecto): {line}")
        except Exception as e:
            print(f"❌ Error procesando línea '{line}': {e}")
    
    def handle_serial_error(self, error):
        """Maneja errores de comunicación serial"""
        print("🔄 Intentando reconectar...")
        if self.serial and self.serial.is_open:
            try:
                self.serial.close()
            except:
                pass
        
        # Esperar antes de reconectar
        time.sleep(2)
        success = self.connect()
        
        if success:
            print("✨ Reconexión exitosa")
        else:
            print("❌ Falló la reconexión automática")
    
    def start(self):
        """Inicia el gestor serial en hilo separado"""
        if not self.connect():
            print("❌ No se pudo iniciar el gestor serial")
            return False
        
        self.running = True
        self.thread = threading.Thread(target=self.read_data, daemon=True)
        self.thread.start()
        print("▶️ Gestor serial iniciado en segundo plano")
        return True
    
    def stop(self):
        """Detiene el gestor serial de forma segura"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=5.0)
        
        if self.serial and self.serial.is_open:
            try:
                self.serial.close()
                print("⏹️ Puerto serial cerrado correctamente")
            except Exception as e:
                print(f"❌ Error cerrando puerto serial: {e}")
        
        print("🛑 Gestor serial detenido")

# Instancia global
serial_manager = SerialManager()

# Iniciar el gestor serial automáticamente al importar el módulo
def init_serial_manager():
    """Inicializa el serial manager en segundo plano"""
    def start_manager():
        time.sleep(2)  # Espera a que la app esté lista
        serial_manager.start()
    
    init_thread = threading.Thread(target=start_manager, daemon=True)
    init_thread.start()

# Llama a la función de inicialización
init_serial_manager()