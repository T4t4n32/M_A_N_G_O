#include <SPI.h>
#include <Adafruit_MAX31865.h>

#define CS_PIN 10

#define RNOMINAL 100.0   // PT100
#define RREF     430.0   // referencia típica PT100

Adafruit_MAX31865 thermo = Adafruit_MAX31865(CS_PIN);

void setup() {
  Serial.begin(115200);
  thermo.begin(MAX31865_3WIRE);  // 👈 CLAVE
}

void loop() {
  uint16_t rtd = thermo.readRTD();

  float ratio = rtd;
  ratio /= 32768;
  float resistance = RREF * ratio;

  float temperature = thermo.temperature(RNOMINAL, RREF);

  Serial.print("RTD raw: "); Serial.print(rtd);
  Serial.print(" | Resistance: "); Serial.print(resistance, 2);
  Serial.print(" ohm | Temp: "); Serial.print(temperature, 2);
  Serial.println(" °C");

  uint8_t fault = thermo.readFault();
  if (fault) {
    Serial.print("FAULT: 0x");
    Serial.println(fault, HEX);

    if (fault & MAX31865_FAULT_HIGHTHRESH) Serial.println("RTD High Threshold");
    if (fault & MAX31865_FAULT_LOWTHRESH)  Serial.println("RTD Low Threshold");
    if (fault & MAX31865_FAULT_REFINLOW)   Serial.println("REFIN- < 0.85 x Bias");
    if (fault & MAX31865_FAULT_REFINHIGH)  Serial.println("REFIN- > 0.85 x Bias");
    if (fault & MAX31865_FAULT_RTDINLOW)   Serial.println("RTDIN- < 0.85 x Bias");
    if (fault & MAX31865_FAULT_OVUV)       Serial.println("Over/Under voltage");

    thermo.clearFault();
  }

  delay(1000);
}
