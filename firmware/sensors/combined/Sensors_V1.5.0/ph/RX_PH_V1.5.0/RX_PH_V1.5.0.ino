#include <Arduino.h>
#include <SPI.h>
#include <RadioLib.h>

// AJUSTA A TU MONTAJE
static const int LORA_NSS  = 5;
static const int LORA_DIO0 = 26;
static const int LORA_RST  = 14;
static const int LORA_BUSY = -1;

SX1278 radio = new Module(LORA_NSS, LORA_DIO0, LORA_RST, LORA_BUSY);

void setup() {
  Serial.begin(115200);
  delay(300);

  Serial.println("[RX] Boot");
  Serial.println("[RX] Init LoRa...");

  int state = radio.begin(433.0);
  if (state != RADIOLIB_ERR_NONE) {
    Serial.print("[RX] LoRa init FAILED, code ");
    Serial.println(state);
    while (true) delay(1000);
  }

  Serial.println("[RX] LoRa init OK");
}

void loop() {
  String str;
  int state = radio.receive(str);

  if (state == RADIOLIB_ERR_NONE) {
    Serial.print("[RX] ");
    Serial.println(str);
  } else if (state != RADIOLIB_ERR_RX_TIMEOUT) {
    Serial.print("[RX] receive error ");
    Serial.println(state);
  }
}
