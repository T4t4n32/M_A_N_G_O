#include <Arduino.h>
#include <RadioLib.h>

#define LORA_NSS   8
#define LORA_RST   12
#define LORA_BUSY  13
#define LORA_DIO1  14

SX1262 lora = new Module(LORA_NSS, LORA_DIO1, LORA_RST, LORA_BUSY);

void setup() {
  Serial.begin(115200);
  delay(2000);

  Serial.println("Init LoRa TX...");
  int state = lora.begin(433.0);

  if (state != RADIOLIB_ERR_NONE) {
    Serial.print("LoRa init failed: ");
    Serial.println(state);
    while (true);
  }

  Serial.println("LoRa TX OK");
}

void loop() {
  String msg = "Hola desde Heltec V3";

  Serial.print("Sending: ");
  Serial.println(msg);

  int state = lora.transmit(msg);

  if (state == RADIOLIB_ERR_NONE) {
    Serial.println("TX success");
  } else {
    Serial.print("TX failed, code ");
    Serial.println(state);
  }

  delay(2000);
}