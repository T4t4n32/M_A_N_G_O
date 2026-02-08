#include <SPI.h>
#include <RadioLib.h>

// ESP32 VSPI pins
static const int PIN_SCK  = 18;
static const int PIN_MISO = 19;
static const int PIN_MOSI = 23;

// LoRa RA-02 (SX1278) wiring
static const int PIN_NSS  = 21;  // <-- CAMBIADO (no uses 5 en esta prueba)
static const int PIN_DIO0 = 26;
static const int PIN_RST  = 14;

SX1278 lora = new Module(PIN_NSS, PIN_DIO0, PIN_RST, -1);

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n[TEST] Boot");

  // Ensure SPI uses the pins we want
  SPI.begin(PIN_SCK, PIN_MISO, PIN_MOSI, PIN_NSS);

  Serial.println("[TEST] Init LoRa...");
  int state = lora.begin(433.0);   // Colombia 433 MHz

  if (state == RADIOLIB_ERR_NONE) {
    Serial.println("[TEST] LoRa init OK");
  } else {
    Serial.print("[TEST] LoRa init FAILED, code: ");
    Serial.println(state);
  }
}

void loop() {
  delay(1000);
}
