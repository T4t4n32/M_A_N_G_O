#include <SPI.h>

// CS => Arduino 10
// MISO => Arduino 12
// MOSI => Arduino 11
// SCK  => Arduino 13

// Variables for the PT100
double resistance;
uint8_t reg1, reg2;
uint16_t fullreg;
double temperature;

// Variables for R-T conversion (AN-709)
double Z1, Z2, Z3, Z4, Rt;
double RTDa = 3.9083e-3;
double RTDb = -5.775e-7;
double rpoly = 0;

const int chipSelectPin = 10;

void setup()
{
  Serial.begin(115200);
  SPI.begin();

  pinMode(chipSelectPin, OUTPUT);
  digitalWrite(chipSelectPin, HIGH);

  Serial.println("MAX31865 PT100 (3-wire) - Serial output only");
}

void loop()
{
  readRegister();
  convertToTemperature();
  delay(1000);
}

void convertToTemperature()
{
  Rt = resistance;
  Rt /= 32768;
  Rt *= 430; // RREF = 430 ohm

  Z1 = -RTDa;
  Z2 = RTDa * RTDa - (4 * RTDb);
  Z3 = (4 * RTDb) / 100;
  Z4 = 2 * RTDb;

  temperature = Z2 + (Z3 * Rt);
  temperature = (sqrt(temperature) + Z1) / Z4;

  if (temperature >= 0)
  {
    Serial.print("RTD Resistance: ");
    Serial.print(Rt, 2);
    Serial.print(" ohm | Temperature: ");
    Serial.print(temperature, 2);
    Serial.println(" °C");
  }
  else
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

    Serial.print("RTD Resistance: ");
    Serial.print(Rt, 2);
    Serial.print(" ohm | Temperature: ");
    Serial.print(temperature, 2);
    Serial.println(" °C");
  }
}

void readRegister()
{
  SPI.beginTransaction(SPISettings(500000, MSBFIRST, SPI_MODE1));

  // Configure MAX31865
  digitalWrite(chipSelectPin, LOW);
  SPI.transfer(0x80);   // Config register
  SPI.transfer(0xB0);   // Bias ON, 1-shot, start conversion, 3-wire
  digitalWrite(chipSelectPin, HIGH);

  delay(10);

  // Read RTD MSB/LSB
  digitalWrite(chipSelectPin, LOW);
  SPI.transfer(0x01);
  reg1 = SPI.transfer(0xFF);
  reg2 = SPI.transfer(0xFF);
  digitalWrite(chipSelectPin, HIGH);

  fullreg = reg1;
  fullreg <<= 8;
  fullreg |= reg2;
  fullreg >>= 1;

  resistance = fullreg;

  // Disable bias
  digitalWrite(chipSelectPin, LOW);
  SPI.transfer(0x80);
  SPI.transfer(0x90);
  digitalWrite(chipSelectPin, HIGH);

  SPI.endTransaction();
}
