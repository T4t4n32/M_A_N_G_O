#include <SPI.h>
#include <RadioLib.h>
#include <math.h>

// =====================
// SPI PINS (ESP32 VSPI typical)
// SCK=18, MISO=19, MOSI=23
// =====================

// -------- MAX31865 pins --------
static const int PIN_MAX_CS = 17;

// -------- Ra-02 (SX1278) pins --------
static const int PIN_LORA_CS  = 5;   // NSS
static const int PIN_LORA_DIO0 = 26; // DIO0
static const int PIN_LORA_RST = 14;  // RST

// RadioLib SX1278 instance
SX1278 lora = new Module(PIN_LORA_CS, PIN_LORA_DIO0, PIN_LORA_RST);

// -------- MAX31865 variables (from your working code) --------
double resistance;
uint8_t reg1, reg2;
uint16_t fullreg;
double temperature;

double Z1, Z2, Z3, Z4, Rt;
double RTDa = 3.9083e-3;
double RTDb = -5.775e-7;
double rpoly = 0;

void readRegister() {
  SPI.beginTransaction(SPISettings(500000, MSBFIRST, SPI_MODE1));

  // write config reg 0
  digitalWrite(PIN_MAX_CS, LOW);
  SPI.transfer(0x80);
  SPI.transfer(0xB0); // bias ON, 3-wire
  digitalWrite(PIN_MAX_CS, HIGH);

  delay(10);

  // read RTD MSB/LSB from reg 1
  digitalWrite(PIN_MAX_CS, LOW);
  SPI.transfer(0x01);
  reg1 = SPI.transfer(0xFF);
  reg2 = SPI.transfer(0xFF);
  digitalWrite(PIN_MAX_CS, HIGH);

  SPI.endTransaction();

  fullreg = reg1;
  fullreg <<= 8;
  fullreg |= reg2;

  fullreg >>= 1;
  resistance = (double)fullreg;
}

void convertToTemperature() {
  Rt = resistance;
  Rt /= 32768.0;
  Rt *= 430.0;

  Z1 = -RTDa;
  Z2 = RTDa * RTDa - (4.0 * RTDb);
  Z3 = (4.0 * RTDb) / 100.0;
  Z4 = 2.0 * RTDb;

  temperature = Z2 + (Z3 * Rt);
  temperature = (sqrt(temperature) + Z1) / Z4;

  if (temperature < 0) {
    Rt /= 100.0;
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

void setup() {
  Serial.begin(115200);
  delay(200);

  // Start SPI
  SPI.begin(18, 19, 23); // SCK, MISO, MOSI (ESP32)
  pinMode(PIN_MAX_CS, OUTPUT);
  digitalWrite(PIN_MAX_CS, HIGH);

  Serial.println("[TX] Boot");

  // Init LoRa at 433 MHz
  Serial.println("[TX] Init LoRa...");
  int state = lora.begin(433.0);
  if (state != RADIOLIB_ERR_NONE) {
    Serial.print("[TX] LoRa init FAILED, code: ");
    Serial.println(state);
    while (true) delay(1000);
  }
  Serial.println("[TX] LoRa init OK");
}

void loop() {
  // Read temperature
  readRegister();
  convertToTemperature();

  // Build payload (simple & robust)
  // Example: TEMP:24.56
  String payload = "TEMP:" + String(temperature, 2);

  Serial.print("[TX] ");
  Serial.println(payload);

  // Send via LoRa
  int state = lora.transmit(payload);
  if (state == RADIOLIB_ERR_NONE) {
    Serial.println("[TX] Sent OK");
  } else {
    Serial.print("[TX] Send FAILED, code: ");
    Serial.println(state);
  }

  delay(10000); // every 10 seconds
}
