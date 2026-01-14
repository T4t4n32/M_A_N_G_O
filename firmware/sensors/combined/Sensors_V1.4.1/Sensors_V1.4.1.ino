// ==============================================
// M.A.N.G.O. - Sistema Integrado de Monitoreo de Agua
// Versión: 2.4.0 - Corregido error de sintaxis y optimizado pH
// Fecha: 13 de enero de 2026
// ==============================================

// ====== LIBRERÍAS ======
#include <SPI.h>

// ====== DEFINICIONES DE PINES ======
// Sensor de Turbidez (AZDM01)
const int TURBIDITY_ANALOG_PIN = A1;    // Puerto analógico para turbidez
const int TURBIDITY_DIGITAL_PIN = 6;    // Puerto digital para turbidez
const int TURBIDITY_SAMPLES = 30;

// Sensor de pH - CORREGIDO Y OPTIMIZADO
const int PH_PIN = A0;                  // Pin A0 para pH (CORREGIDO)
const float VREF = 5.0;
const int PH_SAMPLES = 20;

// Valores de calibración pH - AJUSTA ESTOS VALORES SEGÚN TUS MEDICIONES
const float V_PH7 = 2.50;   // Voltaje medido en solución pH 7.0
const float V_PH4 = 2.00;   // Voltaje medido en solución pH 4.0 (¡CORREGIDO!)
float m_pH, b_pH;

// Sensor de Temperatura PT100 (MAX31865)
const int chipSelectPin = 10;
double resistance;
double temperature;
const double RTDa = 3.9083e-3;
const double RTDb = -5.775e-7;

// ====== VARIABLES DE ESTADO DE SENSORES ======
struct SensorStatus {
  bool available;
  float lastValue;
  unsigned long lastUpdateTime;
  int consecutiveFailures;
  bool initialized;
};

SensorStatus turbiditySensor = {false, 0.0, 0, 0, false};
SensorStatus phSensor = {false, 0.0, 0, 0, false};
SensorStatus tempSensor = {false, 0.0, 0, 0, false};

// ====== VARIABLES DE TEMPORIZACIÓN ======
const long intervalTurbidity = 2000;    // 2 segundos para turbidez
const long intervalPH = 1500;           // 1.5 segundos para pH
const long intervalTemp = 1000;         // 1 segundo para temperatura
const long maxWaitForFirstReading = 10000; // 10 segundos máximo para primera lectura

// ====== FUNCIONES DE TURBIDEZ MEJORADAS ======
float readTurbidityAnalog() {
  long sum = 0;
  int validReadings = 0;
  
  for (int i = 0; i < TURBIDITY_SAMPLES; i++) {
    int reading = analogRead(TURBIDITY_ANALOG_PIN);
    if (reading >= 0 && reading <= 1023) {
      sum += reading;
      validReadings++;
    }
    delay(2);
  }
  
  if (validReadings == 0) return -1.0;
  
  float avg = sum / (float)validReadings;
  return avg * (5.0 / 1023.0);
}

int readTurbidityDigital() {
  return digitalRead(TURBIDITY_DIGITAL_PIN);
}

bool calculateAdvancedTurbidity(float& result) {
  float analogVoltage = readTurbidityAnalog();
  int digitalState = readTurbidityDigital();
  
  if (analogVoltage < 0 || analogVoltage > 5.0) {
    return false;
  }
  
  float ntu = -1120.4 * analogVoltage * analogVoltage + 5742.3 * analogVoltage - 4352.9;
  
  if (digitalState == HIGH && ntu < 100) {
    ntu = ntu * 1.2;
  } else if (digitalState == LOW && ntu > 200) {
    ntu = ntu * 0.8;
  }
  
  if (ntu < 0) ntu = 0;
  if (ntu > 1000) ntu = 1000;
  
  result = ntu;
  return true;
}

// ====== FUNCIONES DE PH - ¡COMPLETAMENTE CORREGIDAS! ======
void debugPHCalibration() {
  Serial.println("\n=== CALIBRACIÓN pH ACTUAL ===");
  Serial.print("V_PH7 (pH 7.0): "); Serial.print(V_PH7, 3); Serial.println(" V");
  Serial.print("V_PH4 (pH 4.0): "); Serial.print(V_PH4, 3); Serial.println(" V");
  
  // Recalcular pendiente e intercepto
  if (V_PH4 != V_PH7) {
    m_pH = (4.0 - 7.0) / (V_PH4 - V_PH7);
    b_pH = 7.0 - (m_pH * V_PH7);
    
    Serial.print("Pendiente (m): "); Serial.println(m_pH, 4);
    Serial.print("Intercepto (b): "); Serial.println(b_pH, 4);
    
    // Prueba con voltajes intermedios
    Serial.println("\n=== PRUEBA DE VALORES ===");
    testPHValue(V_PH7, 7.0);
    testPHValue(V_PH4, 4.0);
    testPHValue((V_PH7 + V_PH4) / 2.0, 5.5);
  } else {
    Serial.println("¡ERROR! V_PH4 y V_PH7 son iguales. Calibración inválida.");
  }
  Serial.println("=========================\n");
}

void testPHValue(float voltage, float expectedPH) {
  float calculatedPH = (m_pH * voltage) + b_pH;
  Serial.print("Voltaje: "); Serial.print(voltage, 3); Serial.print(" V | ");
  Serial.print("pH esperado: "); Serial.print(expectedPH, 1); Serial.print(" | ");
  Serial.print("pH calculado: "); Serial.println(calculatedPH, 2);
}

bool readPHVoltage(float& result) {
  long sum = 0;
  int validReadings = 0;
  
  for (int i = 0; i < PH_SAMPLES; i++) {
    int reading = analogRead(PH_PIN);
    
    // Depuración para las primeras lecturas
    if (i == 0 && !phSensor.initialized) {
      Serial.print("[pH DEBUG] Lectura RAW #0: "); Serial.println(reading);
    }
    
    if (reading >= 0 && reading <= 1023) {
      sum += reading;
      validReadings++;
    }
    delay(5);
  }
  
  if (validReadings == 0) {
    Serial.println("[pH ERROR] No se obtuvieron lecturas válidas");
    return false;
  }
  
  float avg = sum / (float)validReadings;
  result = avg * (VREF / 1023.0);
  
  // Depuración adicional para valores extremos
  if (!phSensor.initialized && (result < 0.5 || result > 4.5)) {
    Serial.print("[pH WARNING] Voltaje fuera de rango: "); Serial.print(result, 3); Serial.println(" V");
  }
  
  return true;
}

bool calculatePH(float voltage, float& result) {
  // Fórmula corregida: ¡LA PENDIENTE DEBE SER NEGATIVA!
  result = (m_pH * voltage) + b_pH;
  
  // Rango realista de pH para agua (0-14)
  if (result < 0 || result > 14) {
    Serial.print("[pH WARNING] Valor fuera de rango: "); Serial.print(result, 2);
    Serial.print(" (voltaje: "); Serial.print(voltage, 3); Serial.println(" V)");
    // No devolvemos false, solo advertimos
    return true; // Seguimos procesando pero con advertencia
  }
  
  return true;
}

// ====== FUNCIONES DE TEMPERATURA ======
bool convertToTemperature() {
  double Rt = resistance;
  Rt /= 32768;
  Rt *= 430;

  if (Rt < 50 || Rt > 300) {
    return false;
  }

  double Z1 = -RTDa;
  double Z2 = RTDa * RTDa - (4 * RTDb);
  double Z3 = (4 * RTDb) / 100;
  double Z4 = 2 * RTDb;

  temperature = Z2 + (Z3 * Rt);
  temperature = (sqrt(temperature) + Z1) / Z4;

  if (temperature < 0) {
    double rpoly = Rt / 100;
    temperature = -242.02 + 2.2228 * rpoly;
    rpoly *= Rt; temperature += 2.5859e-3 * rpoly;
    rpoly *= Rt; temperature -= 4.8260e-6 * rpoly;
    rpoly *= Rt; temperature -= 2.8183e-8 * rpoly;
    rpoly *= Rt; temperature += 1.5243e-10 * rpoly;
  }

  return (temperature >= -50 && temperature <= 150);
}

bool readTemperatureRegister() {
  SPI.beginTransaction(SPISettings(500000, MSBFIRST, SPI_MODE1));
  digitalWrite(chipSelectPin, LOW);
  SPI.transfer(0x80);
  SPI.transfer(0xB0);
  digitalWrite(chipSelectPin, HIGH);
  SPI.endTransaction();

  delay(10);

  SPI.beginTransaction(SPISettings(500000, MSBFIRST, SPI_MODE1));
  digitalWrite(chipSelectPin, LOW);
  SPI.transfer(0x01);
  uint8_t reg1 = SPI.transfer(0xFF);
  uint8_t reg2 = SPI.transfer(0xFF);
  digitalWrite(chipSelectPin, HIGH);
  SPI.endTransaction();

  uint16_t fullreg = reg1;
  fullreg <<= 8;
  fullreg |= reg2;
  
  if (fullreg == 0xFFFF) {
    return false;
  }
  
  fullreg >>= 1;
  
  if (fullreg > 32767) {
    return false;
  }
  
  resistance = (double)fullreg;
  return true;
}

// ====== FUNCIÓN ROBUSTA DE IMPRESIÓN ======
void printSensorData() {
  unsigned long currentTime = millis();
  
  Serial.print("[M.A.N.G.O.] ");
  
  bool anyData = false;
  
  // Turbidez
  if (turbiditySensor.available || (currentTime - turbiditySensor.lastUpdateTime > maxWaitForFirstReading && !turbiditySensor.initialized)) {
    Serial.print("Turb: ");
    Serial.print(turbiditySensor.available ? turbiditySensor.lastValue : -1.0, 1);
    Serial.print(turbiditySensor.available ? "" : "*");
    Serial.print(" NTU");
    anyData = true;
  }
  
  // pH
  if (phSensor.available || (currentTime - phSensor.lastUpdateTime > maxWaitForFirstReading && !phSensor.initialized)) {
    if (anyData) Serial.print(" | ");
    Serial.print("pH: ");
    Serial.print(phSensor.available ? phSensor.lastValue : -1.0, 2);
    Serial.print(phSensor.available ? "" : "*");
    anyData = true;
  }
  
  // Temperatura
  if (tempSensor.available || (currentTime - tempSensor.lastUpdateTime > maxWaitForFirstReading && !tempSensor.initialized)) {
    if (anyData) Serial.print(" | ");
    Serial.print("Temp: ");
    Serial.print(tempSensor.available ? tempSensor.lastValue : -1.0, 2);
    Serial.print(tempSensor.available ? "" : "*");
    Serial.print(" °C");
  }
  
  if (!anyData) {
    Serial.print("Inicializando sensores...");
  }
  
  Serial.println();
}

// ====== SETUP PRINCIPAL ======
void setup() {
  Serial.begin(115200);
  Serial.println("=== M.A.N.G.O. - Sistema Integrado pH Corregido ===");
  Serial.println("Versión 2.4.0 | Calibración pH optimizada");
  
  // Inicializar pines
  pinMode(TURBIDITY_ANALOG_PIN, INPUT);
  pinMode(TURBIDITY_DIGITAL_PIN, INPUT);
  pinMode(PH_PIN, INPUT); // A0 - ¡CORREGIDO!
  pinMode(chipSelectPin, OUTPUT);
  digitalWrite(chipSelectPin, HIGH);
  
  // Calibración pH - ¡CORREGIDA LA LÓGICA!
  if (V_PH4 == V_PH7) {
    Serial.println("¡CRÍTICO! Valores de calibración iguales. Usando valores por defecto.");
    m_pH = -5.0; // Pendiente típica para sensores pH
    b_pH = 20.0; // Intercepto típico
  } else {
    // ¡LA FÓRMULA CORRECTA! pH = m*V + b
    // Si V_PH7 = 2.5V (pH 7.0) y V_PH4 = 2.0V (pH 4.0)
    // Entonces cuando el voltaje DISMINUYE, el pH DISMINUYE
    m_pH = (4.0 - 7.0) / (V_PH4 - V_PH7); // Esto debe ser NEGATIVO
    b_pH = 7.0 - (m_pH * V_PH7);
  }
  
  Serial.println("\n=== PARÁMETROS pH CALCULADOS ===");
  Serial.print("Pendiente (m): "); Serial.println(m_pH, 4);
  Serial.print("Intercepto (b): "); Serial.println(b_pH, 4);
  
  // Mostrar tabla de calibración
  debugPHCalibration();
  
  // Inicializar SPI
  SPI.begin();
  
  Serial.println("\n=== INICIANDO MONITOREO ===");
  Serial.println("Formato: Turb: X.X NTU | pH: X.XX | Temp: X.XX °C");
  Serial.println("* indica sensor no disponible o con errores");
  Serial.println("¡LISTO PARA LECTURAS!");
}

// ====== LOOP PRINCIPAL ======
void loop() {
  unsigned long currentMillis = millis();

  // ====== LEER TURBIDEZ ======
  if (currentMillis - turbiditySensor.lastUpdateTime >= intervalTurbidity) {
    turbiditySensor.lastUpdateTime = currentMillis;
    
    float turbidityValue;
    if (calculateAdvancedTurbidity(turbidityValue)) {
      turbiditySensor.lastValue = turbidityValue;
      turbiditySensor.available = true;
      turbiditySensor.consecutiveFailures = 0;
      turbiditySensor.initialized = true;
    } else {
      turbiditySensor.consecutiveFailures++;
      if (turbiditySensor.consecutiveFailures > 5) {
        turbiditySensor.available = false;
      }
    }
  }

  // ====== LEER PH ======
  if (currentMillis - phSensor.lastUpdateTime >= intervalPH) {
    phSensor.lastUpdateTime = currentMillis;
    
    float phVoltage;
    if (readPHVoltage(phVoltage)) {
      float phValue;
      if (calculatePH(phVoltage, phValue)) {
        phSensor.lastValue = phValue;
        phSensor.available = true;
        phSensor.consecutiveFailures = 0;
        
        if (!phSensor.initialized) {
          Serial.println("\n=== ¡PRIMERA LECTURA pH EXITOSA! ===");
          Serial.print("Voltaje: "); Serial.print(phVoltage, 3); Serial.print(" V | ");
          Serial.print("pH: "); Serial.println(phValue, 2);
          phSensor.initialized = true;
        }
      } else {
        phSensor.consecutiveFailures++;
      }
    } else {
      phSensor.consecutiveFailures++;
    }
    
    if (phSensor.consecutiveFailures > 5) {
      phSensor.available = false;
    }
  }

  // ====== LEER TEMPERATURA ======
  if (currentMillis - tempSensor.lastUpdateTime >= intervalTemp) {
    tempSensor.lastUpdateTime = currentMillis;
    
    if (readTemperatureRegister() && convertToTemperature()) {
      tempSensor.lastValue = temperature;
      tempSensor.available = true;
      tempSensor.consecutiveFailures = 0;
      tempSensor.initialized = true;
    } else {
      tempSensor.consecutiveFailures++;
      if (tempSensor.consecutiveFailures > 3) {
        tempSensor.available = false;
      }
    }
  }

  // Imprimir datos cada segundo
  static unsigned long lastPrintTime = 0;
  if (currentMillis - lastPrintTime >= 1000) {
    lastPrintTime = currentMillis;
    printSensorData();
  }

  delay(10);
}
