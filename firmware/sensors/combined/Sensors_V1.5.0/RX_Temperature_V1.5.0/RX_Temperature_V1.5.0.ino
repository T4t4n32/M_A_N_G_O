#include <SPI.h>
#include <RadioLib.h>

// Ra-02 pins (same as TX)
static const int PIN_LORA_CS  = 5;
static const int PIN_LORA_DIO0 = 26;
static const int PIN_LORA_RST = 14;

SX1278 lora = new Module(PIN_LORA_CS, PIN_LORA_DIO0, PIN_LORA_RST);

void setup() {
  Serial.begin(115200);
  delay(200);

  SPI.begin(18, 19, 23); // SCK, MISO, MOSI

  Serial.println("[RX] Boot");
  Serial.println("[RX] Init LoRa...");
  int state = lora.begin(433.0);
  if (state != RADIOLIB_ERR_NONE) {
    Serial.print("[RX] LoRa init FAILED, code: ");
    Serial.println(state);
    while (true) delay(1000);
  }
  Serial.println("[RX] LoRa init OK");
}

void loop() {
  String str;
  int state = lora.receive(str);

  if (state == RADIOLIB_ERR_NONE) {
    Serial.print("[RX] ");
    Serial.println(str);
  } else if (state != RADIOLIB_ERR_RX_TIMEOUT) {
    Serial.print("[RX] Receive FAILED, code: ");
    Serial.println(state);
  }
}
