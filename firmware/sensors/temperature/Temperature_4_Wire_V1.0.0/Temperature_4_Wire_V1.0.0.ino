#include <Adafruit_MAX31865.h>

/* =============================
   PIN CONFIGURATION (TU CASO)
   ============================= */
#define MAX31865_CS   10
#define MAX31865_MOSI 11
#define MAX31865_MISO 12
#define MAX31865_CLK  13

/* =============================
   PT1000 CONFIG
   ============================= */
// Para PT1000 → referencia = 4300 ohms
#define RREF      4300.0
#define RNOMINAL  1000.0

/* =============================
   CALIBRATION
   ============================= */
// ⬇️ AQUÍ es donde TÚ ajustas luego
float TEMP_OFFSET = 0.0; // coloca aquí el valor de calibración

/* =============================
   OBJECT
   ============================= */
Adafruit_MAX31865 max31865 =
  Adafruit_MAX31865(
    MAX31865_CS,
    MAX31865_MOSI,
    MAX31865_MISO,
    MAX31865_CLK
  );

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("M.A.N.G.O. | PT1000 Temperature Sensor");
  Serial.println("------------------------------------");

  // 4-WIRE CONFIGURATION (MUY IMPORTANTE)
  max31865.begin(MAX31865_4WIRE);
}

void loop() {
  uint16_t rtd = max31865.readRTD();

  float ratio = rtd;
  ratio /= 32768;

  float resistance = RREF * ratio;
  float temperature = max31865.temperature(RNOMINAL, RREF);

  // Aplicar calibración
  float calibratedTemp = temperature + TEMP_OFFSET;

  Serial.print("RTD raw: ");
  Serial.print(rtd);

  Serial.print(" | Resistance: ");
  Serial.print(resistance, 2);
  Serial.print(" ohm");

  Serial.print(" | Temp: ");
  Serial.print(calibratedTemp, 2);
  Serial.println(" °C");

  // Detectar errores
  uint8_t fault = max31865.readFault();
  if (fault) {
    Serial.print("FAULT: 0x");
    Serial.println(fault, HEX);

    if (fault & MAX31865_FAULT_HIGHTHRESH)
      Serial.println("RTD High Threshold");
    if (fault & MAX31865_FAULT_LOWTHRESH)
      Serial.println("RTD Low Threshold");
    if (fault & MAX31865_FAULT_REFINLOW)
      Serial.println("REFIN Low");
    if (fault & MAX31865_FAULT_REFINHIGH)
      Serial.println("REFIN High");
    if (fault & MAX31865_FAULT_RTDINLOW)
      Serial.println("RTDIN Low");
    if (fault & MAX31865_FAULT_OVUV)
      Serial.println("Over/Under Voltage");

    max31865.clearFault();
  }

  delay(1000);
}
