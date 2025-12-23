#include <SPI.h>

// Pines MAX31865
#define CS_PIN 10

// PT100 parameters
#define RNOMINAL 100.0
#define RREF     431.0   // Tu resistencia real

// Variables lectura RTD
double resistance;
uint8_t reg1, reg2;
uint16_t fullreg;
double temperature;

// Conversión RTD → T (AN-709)
double Z1, Z2, Z3, Z4, Rt;
double RTDa = 3.9083e-3;
double RTDb = -5.775e-7;
double rpoly = 0;

// Logging
double lastTemperature = NAN;
const double TEMP_DELTA_THRESHOLD = 0.05; // °C

void setup()
{
  Serial.begin(115200);
  SPI.begin();

  pinMode(CS_PIN, OUTPUT);
  digitalWrite(CS_PIN, HIGH);

  Serial.println("=== M.A.N.G.O. | PT100 (3-wire) Temperature Logger ===");
}

void loop()
{
  readRegister();
  convertToTemperature();
  logIfChanged();
  delay(1000);
}

void logIfChanged()
{
  if (isnan(lastTemperature) || abs(temperature - lastTemperature) >= TEMP_DELTA_THRESHOLD)
  {
    Serial.print("[");
    Serial.print(millis());
    Serial.print(" ms] Temp: ");
    Serial.print(temperature, 2);
    Serial.print(" °C");

    if (!isnan(lastTemperature))
    {
      Serial.print(" | Δ ");
      Serial.print(temperature - lastTemperature, 2);
      Serial.print(" °C");
    }

    Serial.println();
    lastTemperature = temperature;
  }
}

void convertToTemperature()
{
  Rt = resistance;
  Rt /= 32768;
  Rt *= RREF;

  Z1 = -RTDa;
  Z2 = RTDa * RTDa - (4 * RTDb);
  Z3 = (4 * RTDb) / 100;
  Z4 = 2 * RTDb;

  temperature = Z2 + (Z3 * Rt);
  temperature = (sqrt(temperature) + Z1) / Z4;

  if (temperature < 0)
  {
    Rt /= 100;
    Rt *= 100;
    rpoly = Rt;

    temperature = -242.02;
    temperature += 2.2228 * rpoly;
    rpoly *= Rt;
    temperature += 2.5859e-3 * rpoly;
    rpoly *= Rt;
    temperature -= 4.8260e-6 * rpoly;
    rpoly *= Rt;
    temperature -= 2.8183e-8 * rpoly;
    rpoly *= Rt;
    temperature += 1.5243e-10 * rpoly;
  }
}

void readRegister()
{
  SPI.beginTransaction(SPISettings(500000, MSBFIRST, SPI_MODE1));

  // Config: bias ON, 1-shot, start conversion, 3-wire
  digitalWrite(CS_PIN, LOW);
  SPI.transfer(0x80);
  SPI.transfer(0xB0);
  digitalWrite(CS_PIN, HIGH);

  delay(10);

  // Read RTD MSB/LSB
  digitalWrite(CS_PIN, LOW);
  SPI.transfer(0x01);
  reg1 = SPI.transfer(0xFF);
  reg2 = SPI.transfer(0xFF);
  digitalWrite(CS_PIN, HIGH);

  fullreg = reg1;
  fullreg <<= 8;
  fullreg |= reg2;
  fullreg >>= 1;

  resistance = fullreg;

  // Disable bias
  digitalWrite(CS_PIN, LOW);
  SPI.transfer(0x80);
  SPI.transfer(0x90);
  digitalWrite(CS_PIN, HIGH);

  SPI.endTransaction();
}
