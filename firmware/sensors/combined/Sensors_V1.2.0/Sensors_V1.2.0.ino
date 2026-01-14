// ==============================================
// M.A.N.G.O. - Sistema Integrado de Monitoreo de Agua
// Versión: 2.2.0 - Tolerante a fallos y sensores defectuosos
// Fecha: 13 de enero de 2026
// ==============================================

// ====== LIBRERÍAS ======
#include <SPI.h>

// ====== DEFINICIONES DE PINES ======
// Sensor de Turbidez (AZDM01) - ¡MEJORADO CON DOBLE LECTURA!
const int TURBIDITY_ANALOG_PIN = A1;    // Puerto analógico para turbidez
const int TURBIDITY_DIGITAL_PIN = 6;    // Puerto digital para turbidez
const int TURBIDITY_SAMPLES = 30;       // Muestras reducidas para mayor velocidad

// Sensor de pH 
const int PH_PIN = A2;                  // Cambiado a A2 para evitar conflictos
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
    if (reading >= 0 && reading <= 1023) { // Verificar lectura válida
      sum += reading;
      validReadings++;
    }
    delay(2);
  }
  
  if (validReadings == 0) return -1.0; // Error de lectura
  
  float avg = sum / (float)validReadings;
  return avg * (5.0 / 1023.0);
}

int readTurbidityDigital() {
  return digitalRead(TURBIDITY_DIGITAL_PIN);
}

bool calculateAdvancedTurbidity(float& result) {
  float analogVoltage = readTurbidityAnalog();
  int digitalState = readTurbidityDigital();
  
  // Verificar si las lecturas son válidas
  if (analogVoltage < 0 || analogVoltage > 5.0) {
    return false; // Lectura analógica inválida
  }
  
  // Modelo mejorado con compensación por estado digital
  float ntu = -1120.4 * analogVoltage * analogVoltage + 5742.3 * analogVoltage - 4352.9;
  
  // Si el sensor digital indica alta turbidez, ajustamos el cálculo
  if (digitalState == HIGH && ntu < 100) {
    ntu = ntu * 1.2;
  } else if (digitalState == LOW && ntu > 200) {
    ntu = ntu * 0.8;
  }
  
  // Filtro de rango realista
  if (ntu < 0) ntu = 0;
  if (ntu > 1000) ntu = 1000;
  
  result = ntu;
  return true;
}

// ====== FUNCIONES DE PH ======
bool readPHVoltage(float& result) {
  long sum = 0;
  int validReadings = 0;
  
  for (int i = 0; i < PH_SAMPLES; i++) {
    int reading = analogRead(PH_PIN);
    if (reading >= 0 && reading <= 1023) {
      sum += reading;
      validReadings++;
    }
    delay(5);
  }
  
  if (validReadings == 0) return false;
  
  float avg = sum / (float)validReadings;
  result = avg * (VREF / 1023.0);
  return true;
}

bool calculatePH(float voltage, float& result) {
  // Verificar voltaje razonable
  if (voltage < 0.5 || voltage > 4.5) {
    return false; // Voltaje fuera de rango razonable
  }
  
  result = (m_pH * voltage) + b_pH;
  return true;
}

// ====== FUNCIONES DE TEMPERATURA ======
bool convertToTemperature() {
  double Rt = resistance;
  Rt /= 32768;
  Rt *= 430; // Resistencia de referencia

  // Verificar resistencia razonable (PT100: ~100-200 ohms típico)
  if (Rt < 50 || Rt > 300) {
    return false;
  }

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

  // Verificar temperatura razonable (-20°C a 100°C para agua)
  return (temperature >= -20 && temperature <= 100);
}

bool readTemperatureRegister() {
  try {
    SPI.beginTransaction(SPISettings(500000, MSBFIRST, SPI_MODE1));
    digitalWrite(chipSelectPin, LOW);
    SPI.transfer(0x80);
    SPI.transfer(0xB0);
    digitalWrite(chipSelectPin, HIGH);
    delay(10);

    digitalWrite(chipSelectPin, LOW);
    SPI.transfer(0x01);
    uint8_t reg1 = SPI.transfer(0xFF);
    uint8_t reg2 = SPI.transfer(0xFF);
    digitalWrite(chipSelectPin, HIGH);
    SPI.endTransaction();

    uint16_t fullreg = reg1;
    fullreg <<= 8;
    fullreg |= reg2;
    fullreg >>= 1;
    resistance = (double)fullreg;
    
    return true;
  } catch (...) {
    return false;
  }
}

// ====== FUNCIÓN ROBUSTA DE IMPRESIÓN ======
void printSensorData() {
  unsigned long currentTime = millis();
  
  Serial.print("[M.A.N.G.O.] ");
  
  // Mostrar turbidez (si está disponible o si ha pasado tiempo máximo)
  if (turbiditySensor.available || 
      (currentTime - turbiditySensor.lastUpdateTime > maxWaitForFirstReading && !turbiditySensor.initialized)) {
    Serial.print("Turb: ");
    Serial.print(turbiditySensor.available ? turbiditySensor.lastValue : -1.0, 1);
    Serial.print(turbiditySensor.available ? "" : "*"); // * indica valor no confiable
    Serial.print(" NTU | ");
  }
  
  // Mostrar pH (si está disponible o si ha pasado tiempo máximo)
  if (phSensor.available || 
      (currentTime - phSensor.lastUpdateTime > maxWaitForFirstReading && !phSensor.initialized)) {
    Serial.print("pH: ");
    Serial.print(phSensor.available ? phSensor.lastValue : -1.0, 2);
    Serial.print(phSensor.available ? "" : "*");
    Serial.print(" | ");
  }
  
  // Mostrar temperatura (si está disponible o si ha pasado tiempo máximo)
  if (tempSensor.available || 
      (currentTime - tempSensor.lastUpdateTime > maxWaitForFirstReading && !tempSensor.initialized)) {
    Serial.print("Temp: ");
    Serial.print(tempSensor.available ? tempSensor.lastValue : -1.0, 2);
    Serial.print(tempSensor.available ? "" : "*");
    Serial.print(" °C");
  }
  
  Serial.println();
  
  // Marcar sensores como inicializados si han pasado el tiempo máximo
  if (!turbiditySensor.initialized && currentTime - turbiditySensor.lastUpdateTime > maxWaitForFirstReading) {
    turbiditySensor.initialized = true;
  }
  if (!phSensor.initialized && currentTime - phSensor.lastUpdateTime > maxWaitForFirstReading) {
    phSensor.initialized = true;
  }
  if (!tempSensor.initialized && currentTime - tempSensor.lastUpdateTime > maxWaitForFirstReading) {
    tempSensor.initialized = true;
  }
}

// ====== SETUP PRINCIPAL ======
void setup() {
  Serial.begin(115200);
  Serial.println("=== M.A.N.G.O. - Sistema Integrado Robusto ===");
  Serial.println("Versión 2.2.0 | Modo tolerante a fallos");
  
  // Inicializar pines
  pinMode(TURBIDITY_ANALOG_PIN, INPUT);
  pinMode(TURBIDITY_DIGITAL_PIN, INPUT);
  pinMode(PH_PIN, INPUT);
  
  // Calibración pH
  m_pH = (4.0 - 7.0) / (V_PH4 - V_PH7);
  b_pH = 7.0 - (m_pH * V_PH7);
  
  // Inicializar sensor de temperatura
  SPI.begin();
  pinMode(chipSelectPin, OUTPUT);
  digitalWrite(chipSelectPin, HIGH);
  
  Serial.println("\n=== INICIANDO MONITOREO ===");
  Serial.println("Formato: Turb: X.X NTU | pH: X.XX | Temp: X.XX °C");
  Serial.println("* indica valor no confiable o sensor defectuoso");
  Serial.println("Mostrando datos disponibles inmediatamente...");
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
    
    printSensorData(); // Mostrar inmediatamente después de leer turbidez
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
        phSensor.initialized = true;
      } else {
        phSensor.consecutiveFailures++;
      }
    } else {
      phSensor.consecutiveFailures++;
    }
    
    if (phSensor.consecutiveFailures > 5) {
      phSensor.available = false;
    }
    
    printSensorData(); // Mostrar inmediatamente después de leer pH
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
    
    printSensorData(); // Mostrar inmediatamente después de leer temperatura
  }

  delay(10);
}
