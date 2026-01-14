// ==============================================
// M.A.N.G.O. - Sistema Integrado de Monitoreo de Agua
// Versión: 2.3.0 - Corrección específica para sensor de pH
// Fecha: 13 de enero de 2026
// ==============================================

// ====== LIBRERÍAS ======
#include <SPI.h>

// ====== DEFINICIONES DE PINES ======
// Sensor de Turbidez (AZDM01)
const int TURBIDITY_ANALOG_PIN = A1;    // Puerto analógico para turbidez
const int TURBIDITY_DIGITAL_PIN = 6;    // Puerto digital para turbidez
const int TURBIDITY_SAMPLES = 30;

// Sensor de pH - ¡CORREGIDO Y MEJORADO!
const int PH_PIN = A0;                  // VOLVER A A0 - Era el problema principal!
const float VREF = 5.0;
const int PH_SAMPLES = 20;

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

// ====== VARIABLES DE ESTADO DE SENSORES ======
struct SensorStatus {
  bool available;
  float lastValue;
  unsigned long lastUpdateTime;
  int consecutiveFailures;
  bool initialized;
  unsigned long lastDebugTime; // Para depuración periódica
};

SensorStatus turbiditySensor = {false, 0.0, 0, 0, false, 0};
SensorStatus phSensor = {false, 0.0, 0, 0, false, 0};
SensorStatus tempSensor = {false, 0.0, 0, 0, false, 0};

// ====== VARIABLES DE TEMPORIZACIÓN ======
const long intervalTurbidity = 2000;    // 2 segundos para turbidez
const long intervalPH = 1500;           // 1.5 segundos para pH
const long intervalTemp = 1000;         // 1 segundo para temperatura
const long maxWaitForFirstReading = 10000; // 10 segundos máximo para primera lectura
const long debugInterval = 5000;        // 5 segundos para mensajes de depuración

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

// ====== FUNCIONES DE PH - ¡COMPLETAMENTE REESCRITAS! ======
void debugPHSensor() {
  unsigned long currentMillis = millis();
  if (currentMillis - phSensor.lastDebugTime >= debugInterval) {
    phSensor.lastDebugTime = currentMillis;
    
    Serial.println("\n=== DEPURACIÓN SENSOR pH ===");
    
    // 1. Verificar configuración de pines
    Serial.print("Pin pH configurado: A");
    Serial.println(PH_PIN);
    
    // 2. Leer valor raw del pin analógico
    int rawReading = analogRead(PH_PIN);
    Serial.print("Lectura RAW del pin: ");
    Serial.println(rawReading);
    
    // 3. Verificar rango válido
    if (rawReading < 0 || rawReading > 1023) {
      Serial.println("¡ERROR! Lectura fuera de rango (debe ser 0-1023)");
    } else {
      float voltage = rawReading * (VREF / 1023.0);
      Serial.print("Voltaje calculado: ");
      Serial.print(voltage, 3);
      Serial.println(" V");
      
      // 4. Verificar contra valores de calibración
      Serial.print("Voltaje pH7 esperado: ");
      Serial.print(V_PH7, 2);
      Serial.println(" V");
      
      Serial.print("Voltaje pH4 esperado: ");
      Serial.print(V_PH4, 2);
      Serial.println(" V");
      
      // 5. Verificar si el voltaje está en rango razonable
      if (voltage < 0.5 || voltage > 4.5) {
        Serial.println("¡ADVERTENCIA! Voltaje fuera de rango razonable para pH");
        Serial.println("Posibles causas:");
        Serial.println("- Sensor no conectado");
        Serial.println("- Alimentación incorrecta");
        Serial.println("- Cableado defectuoso");
      }
    }
    
    // 6. Mostrar parámetros de calibración
    Serial.print("Parámetro m (pendiente): ");
    Serial.println(m_pH, 4);
    Serial.print("Parámetro b (intercepto): ");
    Serial.println(b_pH, 4);
    
    Serial.println("=== FIN DEPURACIÓN pH ===\n");
  }
}

bool readPHVoltage(float& result) {
  long sum = 0;
  int validReadings = 0;
  
  for (int i = 0; i < PH_SAMPLES; i++) {
    int reading = analogRead(PH_PIN);
    
    // Depuración detallada para la primera lectura
    static bool firstReading = true;
    if (firstReading) {
      Serial.print("Lectura pH #");
      Serial.print(i);
      Serial.print(": ");
      Serial.println(reading);
    }
    
    if (reading >= 0 && reading <= 1023) {
      sum += reading;
      validReadings++;
    }
    delay(5);
  }
  
  firstReading = false;
  
  if (validReadings == 0) {
    Serial.println("¡ERROR! No se obtuvieron lecturas válidas del sensor pH");
    return false;
  }
  
  float avg = sum / (float)validReadings;
  result = avg * (VREF / 1023.0);
  
  // Depuración adicional
  if (result < 0.1 || result > 4.9) {
    Serial.print("¡ADVERTENCIA! Voltaje pH fuera de rango: ");
    Serial.print(result, 3);
    Serial.println(" V");
  }
  
  return true;
}

bool calculatePH(float voltage, float& result) {
  // Verificar voltaje razonable - MÁS PERMISIVO para depuración
  if (voltage < 0.1 || voltage > 4.9) {
    Serial.print("¡ERROR! Voltaje pH no válido para cálculo: ");
    Serial.print(voltage, 3);
    Serial.println(" V");
    return false;
  }
  
  result = (m_pH * voltage) + b_pH;
  
  // Verificar rango de pH razonable
  if (result < 0 || result > 14) {
    Serial.print("¡ADVERTENCIA! Valor pH fuera de rango: ");
    Serial.print(result, 2);
    Serial.println(" - Posible error de calibración");
    // No devolver false aquí, solo advertir
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
  
  bool anySensorAvailable = false;
  
  // Mostrar turbidez
  if (turbiditySensor.available || 
      (currentTime - turbiditySensor.lastUpdateTime > maxWaitForFirstReading && !turbiditySensor.initialized)) {
    Serial.print("Turb: ");
    Serial.print(turbiditySensor.available ? turbiditySensor.lastValue : -1.0, 1);
    Serial.print(turbiditySensor.available ? "" : "*");
    Serial.print(" NTU");
    anySensorAvailable = true;
  }
  
  // Mostrar pH
  if (phSensor.available || 
      (currentTime - phSensor.lastUpdateTime > maxWaitForFirstReading && !phSensor.initialized)) {
    if (anySensorAvailable) Serial.print(" | ");
    Serial.print("pH: ");
    Serial.print(phSensor.available ? phSensor.lastValue : -1.0, 2);
    Serial.print(phSensor.available ? "" : "*");
    anySensorAvailable = true;
  }
  
  // Mostrar temperatura
  if (tempSensor.available || 
      (currentTime - tempSensor.lastUpdateTime > maxWaitForFirstReading && !tempSensor.initialized)) {
    if (anySensorAvailable) Serial.print(" | ");
    Serial.print("Temp: ");
    Serial.print(tempSensor.available ? tempSensor.lastValue : -1.0, 2);
    Serial.print(tempSensor.available ? "" : "*");
    Serial.print(" °C");
  }
  
  if (!anySensorAvailable) {
    Serial.print("Esperando sensores...");
  }
  
  Serial.println();
}

// ====== SETUP PRINCIPAL ======
void setup() {
  Serial.begin(115200);
  Serial.println("=== M.A.N.G.O. - Sistema Integrado con Depuración pH ===");
  Serial.println("Versión 2.3.0 | Enfocado en solución de problemas pH");
  
  // Inicializar pines
  pinMode(TURBIDITY_ANALOG_PIN, INPUT);
  pinMode(TURBIDITY_DIGITAL_PIN, INPUT);
  pinMode(PH_PIN, INPUT); // A0 - ¡CORREGIDO!
  pinMode(chipSelectPin, OUTPUT);
  digitalWrite(chipSelectPin, HIGH);
  
  // Calibración pH
  m_pH = (4.0 - 7.0) / (V_PH4 - V_PH7);
  b_pH = 7.0 - (m_pH * V_PH7);
  
  Serial.println("\n=== PARÁMETROS DE CALIBRACIÓN pH ===");
  Serial.print("V_PH7 = "); Serial.print(V_PH7, 2); Serial.println(" V");
  Serial.print("V_PH4 = "); Serial.print(V_PH4, 2); Serial.println(" V");
  Serial.print("m = "); Serial.print(m_pH, 4); Serial.println(" (pendiente)");
  Serial.print("b = "); Serial.print(b_pH, 4); Serial.println(" (intercepto)");
  
  // Verificar valores de calibración válidos
  if (V_PH4 == V_PH7) {
    Serial.println("¡CRÍTICO! V_PH4 y V_PH7 son iguales. Calibración inválida.");
    Serial.println("Debes configurar valores diferentes para la calibración.");
  }
  
  // Inicializar SPI
  SPI.begin();
  
  Serial.println("\n=== INICIANDO MONITOREO ===");
  Serial.println("Formato: Turb: X.X NTU | pH: X.XX | Temp: X.XX °C");
  Serial.println("* indica valor no confiable o sensor defectuoso");
  Serial.println("¡INICIANDO DEPURACIÓN DETALLADA DEL SENSOR pH!");
  
  // Primera depuración inmediata
  debugPHSensor();
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

  // ====== LEER PH - ¡MEJORADO! ======
  if (currentMillis - phSensor.lastUpdateTime >= intervalPH) {
    phSensor.lastUpdateTime = currentMillis;
    
    // Depuración continua
    debugPHSensor();
    
    float phVoltage;
    bool voltageReadSuccess = readPHVoltage(phVoltage);
    
    if (voltageReadSuccess) {
      float phValue;
      bool calculationSuccess = calculatePH(phVoltage, phValue);
      
      if (calculationSuccess) {
        phSensor.lastValue = phValue;
        phSensor.available = true;
        phSensor.consecutiveFailures = 0;
        phSensor.initialized = true;
        
        // Mensaje de éxito detallado
        Serial.print("[pH OK] Voltaje: ");
        Serial.print(phVoltage, 3);
        Serial.print(" V | pH: ");
        Serial.println(phValue, 2);
      } else {
        phSensor.consecutiveFailures++;
        Serial.println("[pH] Error en cálculo del pH");
      }
    } else {
      phSensor.consecutiveFailures++;
      Serial.println("[pH] Error en lectura de voltaje");
    }
    
    if (phSensor.consecutiveFailures > 5) {
      phSensor.available = false;
      Serial.println("[pH] Sensor marcado como no disponible después de múltiples fallos");
    }
    
    // Mostrar estado actual del pH
    Serial.print("[pH STATUS] Disponible: ");
    Serial.print(phSensor.available ? "SÍ" : "NO");
    Serial.print(" | Fallos consecutivos: ");
    Serial.print(phSensor.consecutiveFailures);
    Serial.print(" | Último valor: ");
    Serial.println(phSensor.lastValue, 2);
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

  // Imprimir datos cada segundo para mejor visualización
  static unsigned long lastPrintTime = 0;
  if (currentMillis - lastPrintTime >= 1000) {
    lastPrintTime = currentMillis;
    printSensorData();
  }

  delay(10);
}
