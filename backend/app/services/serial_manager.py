import serial
import threading
import time
from datetime import datetime
from .sensor_store import sensor_store  # Importa la instancia global

class SerialManager:
    def __init__(self, port='/dev/ttyUSB0', baudrate=9600):
        self.port = port
        self.baudrate = baudrate
        self.serial = None
        self.running = False
        self.thread = None
    
    def connect(self):
        """Intenta conectar al puerto serial"""
        try:
            print(f"🔌 Intentando conectar a {self.port}...")
            self.serial = serial.Serial(
                port=self.port,
                baudrate=self.baudrate,
                timeout=1,
                write_timeout=1
            )
            print(f"✅ Conexión exitosa a {self.port}")
            return True
        except Exception as e:
            print(f"❌ Error al conectar: {str(e)}")
            print("💡 Consejos:")
            print("   - Verifica que el dispositivo esté conectado")
            print("   - Ejecuta: ls /dev/ttyUSB* o ls /dev/ttyACM*")
            print("   - Permisos: sudo usermod -a -G dialout $USER")
            return False
    
    def read_data(self):
        """Lee datos del puerto serial en bucle"""
        while self.running and self.serial and self.serial.is_open:
            try:
                if self.serial.in_waiting > 0:
                    line = self.serial.readline().decode('utf-8', errors='ignore').strip()
                    if line:
                        print(f"📡 Datos recibidos: {line}")
                        self.process_line(line)
            except Exception as e:
                print(f"⚠️ Error leyendo serial: {str(e)}")
                time.sleep(1)
    
    def process_line(self, line):
        """Procesa una línea de datos del serial"""
        line_lower = line.lower()
        
        # Detecta formato: "ph:720" o "temp:255" o "turb:3"
        if ':' in line_lower:
            try:
                sensor_type, value = line_lower.split(':', 1)
                sensor_type = sensor_type.strip()
                raw_value = int(''.join(filter(str.isdigit, value)))
                
                # Mapea tipos de sensores a claves internas
                sensor_map = {
                    'ph': 'ph',
                    'p': 'ph',
                    'temp': 'temperature',
                    'temperature': 'temperature',
                    't': 'temperature',
                    'turb': 'turbidity',
                    'turbidity': 'turbidity',
                    'ntu': 'turbidity'
                }
                
                internal_type = sensor_map.get(sensor_type, None)
                if internal_type:
                    # Actualiza datos crudos en el store
                    sensor_store.update_raw(internal_type, raw_value)
                    print(f"✅ {internal_type.upper()} procesado: {raw_value}")
            
            except Exception as e:
                print(f"❌ Error procesando línea '{line}': {str(e)}")
    
    def start(self):
        """Inicia el hilo de lectura serial"""
        if not self.connect():
            print("🚨 No se pudo iniciar el serial manager")
            return False
        
        self.running = True
        self.thread = threading.Thread(target=self.read_data, daemon=True)
        self.thread.start()
        print("▶️ Serial manager iniciado")
        return True
    
    def stop(self):
        """Detiene el serial manager"""
        self.running = False
        if self.serial and self.serial.is_open:
            self.serial.close()
        if self.thread:
            self.thread.join(timeout=2.0)
        print("⏹️ Serial manager detenido")

# Instancia global para usar en toda la aplicación
serial_manager = SerialManager()

# Inicia el serial manager automáticamente al importar el módulo
def init_serial_manager():
    """Inicializa el serial manager en segundo plano"""
    def start_manager():
        time.sleep(2)  # Espera a que la app esté lista
        serial_manager.start()
    
    init_thread = threading.Thread(target=start_manager, daemon=True)
    init_thread.start()

# Llama a la función de inicialización
init_serial_manager()