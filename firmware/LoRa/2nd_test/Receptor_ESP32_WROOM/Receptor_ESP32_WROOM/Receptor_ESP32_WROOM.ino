#include <Arduino.h>
#include <RadioLib.h>

// Ajusta estos pines al hardware del RX
#define LORA_NSS   5
#define LORA_RST   14
#define LORA_DIO0  26

SX1278 lora = new Module(LORA_NSS, LORA_DIO0, LORA_RST);

void setup() {
  Serial.begin(115200);
  delay(2000);

  Serial.println("Init LoRa RX...");
  int state = lora.begin(433.0);

  if (state != RADIOLIB_ERR_NONE) {
    Serial.print("LoRa RX init failed: ");
    Serial.println(state);
    while (true);
  }

  Serial.println("LoRa RX OK");
}

void loop() {
  String msg;

  int state = lora.receive(msg);

  if (state == RADIOLIB_ERR_NONE) {
    Serial.print("Received: ");
    Serial.println(msg);

    Serial.print("RSSI: ");
    Serial.println(lora.getRSSI());
  }
}