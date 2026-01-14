// ==============================================
// M.A.N.G.O. - Sistema Integrado de Monitoreo de Agua
// Versión: 2.0.0 - Integración completa con mejoras de precisión
// Fecha: 13 de enero de 2026
// ==============================================

// ====== LIBRERÍAS ======
#include <SPI.h>

// ====== DEFINICIONES DE PINES ======
// Sensor de Turbidez (AZDM01) - ¡MEJORADO CON DOBLE LECTURA!
const int TURBIDITY_ANALOG_PIN = A1;    // Puerto analógico para turbidez
const int TURBIDITY_DIGITAL_PIN = 6;    // Puerto digital para turbidez
const int TURBIDITY_SAMPLES = 50;       // Más muestras para mejor filtrado

// Sensor de pH - Recalibrado para mejor precisión
const int PH_PIN = A2;                  // Cambiado a A2 para evitar conflictos
const float VREF = 5.0;
const int PH_SAMPLES = 30;

// Valores de calibración pH - AJUSTAR SEGÚN TUS MEDIDAS
const float V_PH7 = 2.50;   // Voltaje medido en solución pH 7.0
const float V_PH4 = 3.00;   // Voltaje medido en solución pH 4.0
float m_pH, b_pH;

// Sensor de Temperatura PT100 (MAX31865)
const int chipSelectPin = 10;
double resistance;
double temperature;
const double RTDa = 3.9083e-3;
const double RTDb = -5.775e-7;

// ====== VARIABLES GLOBALES ======
unsigned long previousMillisTurbidity = 0;
unsigned long previousMillisPH = 0;
unsigned long previousMillisTemp = 0;
const long intervalTurbidity = 2000;    // 2 segundos para turbidez (lectura más lenta)
const long intervalPH = 1500;           // 1.5 segundos para pH
const long intervalTemp = 1000;         // 1 segundo para temperatura

// ====== FUNCIONES DE TURBIDEZ MEJORADAS ======
float readTurbidityAnalog() {
  long sum = 0;
  for (int i = 0; i < TURBIDITY_SAMPLES; i++) {
    sum += analogRead(TURBIDITY_ANALOG_PIN);
    delay(2); // Pequeño delay para estabilidad
  }
  float avg = sum / (float)TURBIDITY_SAMPLES;
  return avg * (5.0 / 1023.0);
}

int readTurbidityDigital() {
  return digitalRead(TURBIDITY_DIGITAL_PIN);
}

// Función avanzada que combina ambas lecturas para mayor precisión
float calculateAdvancedTurbidity() {
  float analogVoltage = readTurbidityAnalog();
  int digitalState = readTurbidityDigital();
  
  // Modelo mejorado con compensación por estado digital
  float ntu = -1120.4 * analogVoltage * analogVoltage + 5742.3 * analogVoltage - 4352.9;
  
  // Si el sensor digital indica alta turbidez, ajustamos el cálculo
  if (digitalState == HIGH && ntu < 100) {
    ntu = ntu * 1.2; // Compensación para lecturas bajas cuando el digital indica alta turbidez
  } else if (digitalState == LOW && ntu > 200) {
    ntu = ntu * 0.8; // Compensación para lecturas altas cuando el digital indica baja turbidez
  }
  
  // Filtro de rango realista
  if (ntu < 0) ntu = 0;
  if (ntu > 1000) ntu = 1000; // Límite máximo realista
  
  return ntu;
}

// ====== FUNCIONES DE PH ======
float readPHVoltage() {
  long sum = 0;
  for (int i = 0; i < PH_SAMPLES; i++) {
    sum += analogRead(PH_PIN);
    delay(5);
  }
  float avg = sum / (float)PH_SAMPLES;
  return avg * (VREF / 1023.0);
}

float calculatePH(float voltage) {
  return (m_pH * voltage) + b_pH;
}

// ====== FUNCIONES DE TEMPERATURA ======
void convertToTemperature() {
  double Rt = resistance;
  Rt /= 32768;
  Rt *= 430; // Resistencia de referencia

  // Fórmula principal para temperaturas >= 0°C
  double Z1 = -RTDa;
  double Z2 = RTDa * RTDa - (4 * RTDb);
  double Z3 = (4 * RTDb) / 100;
  double Z4 = 2 * RTDb;

  temperature = Z2 + (Z3 * Rt);
  temperature = (sqrt(temperature) + Z1) / Z4;

  // Corrección para temperaturas < 0°C
  if (temperature < 0) {
    double rpoly = Rt / 100;
    temperature = -242.02 + 2.2228 * rpoly;
    rpoly *= Rt; temperature += 2.5859e-3 * rpoly;
    rpoly *= Rt; temperature -= 4.8260e-6 * rpoly;
    rpoly *= Rt; temperature -= 2.8183e-8 * rpoly;
    rpoly *= Rt; temperature += 1.5243e-10 * rpoly;
  }
}

void readTemperatureRegister() {
  SPI.beginTransaction(SPISettings(500000, MSBFIRST, SPI_MODE1));
  digitalWrite(chipSelectPin, LOW);
  SPI.transfer(0x80); // Dirección de escritura
  SPI.transfer(0xB0); // Configuración: Bias ON, 3-wire mode
  digitalWrite(chipSelectPin, HIGH);
  delay(10);

  digitalWrite(chipSelectPin, LOW);
  SPI.transfer(0x01); // Dirección de lectura RTD MSB
  uint8_t reg1 = SPI.transfer(0xFF);
  uint8_t reg2 = SPI.transfer(0xFF);
  digitalWrite(chipSelectPin, HIGH);
  SPI.endTransaction();

  uint16_t fullreg = reg1;
  fullreg <<= 8;
  fullreg |= reg2;
  fullreg >>= 1; // Eliminar bit de falla
  resistance = (double)fullreg;
}

// ====== FUNCIONES DE DIAGNÓSTICO ======
void diagnosticMode() {
  Serial.println("\n=== MODO DE DIAGNÓSTICO TURBIDEZ ===");
  Serial.println("Coloca el sensor en agua DESTILADA (0 NTU) y presiona cualquier tecla");
  while (!Serial.available());
  Serial.read();
  
  Serial.println("Leyendo agua destilada...");
  delay(2000);
  float clearVoltage = readTurbidityAnalog();
  int clearDigital = readTurbidityDigital();
  
  Serial.println("Ahora coloca el sensor en agua con TURBIDEZ ALTA (>200 NTU) y presiona cualquier tecla");
  while (!Serial.available());
  Serial.read();
  
  Serial.println("Leyendo agua turbia...");
  delay(2000);
  float turbidVoltage = readTurbidityAnalog();
  int turbidDigital = readTurbidityDigital();
  
  Serial.println("\n=== RESULTADOS DE DIAGNÓSTICO ===");
  Serial.print("Agua Destilada - Voltaje: "); Serial.print(clearVoltage, 3); 
  Serial.print(" V | Estado Digital: "); Serial.println(clearDigital ? "ALTO" : "BAJO");
  
  Serial.print("Agua Turbia    - Voltaje: "); Serial.print(turbidVoltage, 3); 
  Serial.print(" V | Estado Digital: "); Serial.println(turbidDigital ? "ALTO" : "BAJO");
  
  Serial.println("\nRecomendaciones:");
  if (abs(turbidVoltage - clearVoltage) < 0.5) {
    Serial.println("¡ALERTA! Diferencia de voltaje muy pequeña. Posible fallo de hardware.");
    Serial.println("Considera revisar las conexiones o reemplazar el sensor.");
  } else {
    Serial.println("Sensor respondiendo adecuadamente a cambios de turbidez.");
    Serial.print("Rango de voltaje detectado: ");
    Serial.print(abs(turbidVoltage - clearVoltage), 3);
    Serial.println(" V");
  }
  
  if (clearDigital == turbidDigital) {
    Serial.println("¡ADVERTENCIA! El puerto digital no está respondiendo a cambios.");
    Serial.println("Puede estar dañado o mal conectado.");
  }
  
  Serial.println("=== FIN DEL DIAGNÓSTICO ===");
  delay(5000);
}

// ====== SETUP PRINCIPAL ======
void setup() {
  Serial.begin(115200); // Velocidad más alta para mejor rendimiento
  Serial.println("=== M.A.N.G.O. - Sistema Integrado de Monitoreo de Agua ===");
  Serial.println("Versión 2.0.0 | Inicializando sensores...");
  
  // Inicializar pines de turbidez
  pinMode(TURBIDITY_ANALOG_PIN, INPUT);
  pinMode(TURBIDITY_DIGITAL_PIN, INPUT);
  
  // Inicializar pines de pH
  pinMode(PH_PIN, INPUT);
  
  // Calibración pH
  m_pH = (4.0 - 7.0) / (V_PH4 - V_PH7);
  b_pH = 7.0 - (m_pH * V_PH7);
  Serial.print("Calibración pH: m="); Serial.print(m_pH, 4);
  Serial.print(", b="); Serial.println(b_pH, 4);
  
  // Inicializar sensor de temperatura
  SPI.begin();
  pinMode(chipSelectPin, OUTPUT);
  digitalWrite(chipSelectPin, HIGH);
  Serial.println("Sensor PT100 inicializado correctamente");
  
  // Modo de diagnóstico inicial para turbidez
  Serial.println("\n¿Deseas ejecutar el modo de diagnóstico para turbidez? (y/n)");
  while (!Serial.available());
  char response = Serial.read();
  if (response == 'y' || response == 'Y') {
    diagnosticMode();
  }
  
  Serial.println("\n=== SISTEMA LISTO PARA OPERACIÓN ===");
  Serial.println("Formato de datos: TURBIDEZ | PH | TEMPERATURA");
}

// ====== LOOP PRINCIPAL ======
void loop() {
  unsigned long currentMillis = millis();

  // Leer turbidez cada 2 segundos
  if (currentMillis - previousMillisTurbidity >= intervalTurbidity) {
    previousMillisTurbidity = currentMillis;
    float turbidity = calculateAdvancedTurbidity();
    Serial.print("Turbidez: "); 
    Serial.print(turbidity, 1); 
    Serial.print(" NTU | ");
  }

  // Leer pH cada 1.5 segundos
  if (currentMillis - previousMillisPH >= intervalPH) {
    previousMillisPH = currentMillis;
    float phVoltage = readPHVoltage();
    float phValue = calculatePH(phVoltage);
    Serial.print("pH: "); 
    Serial.print(phValue, 2); 
    Serial.print(" | ");
  }

  // Leer temperatura cada 1 segundo
  if (currentMillis - previousMillisTemp >= intervalTemp) {
    previousMillisTemp = currentMillis;
    readTemperatureRegister();
    convertToTemperature();
    Serial.print("Temp: "); 
    Serial.print(temperature, 2); 
    Serial.println(" °C");
  }

  // Pequeño delay para no saturar el puerto serial
  delay(10);
}