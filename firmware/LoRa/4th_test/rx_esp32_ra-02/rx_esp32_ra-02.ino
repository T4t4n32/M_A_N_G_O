#include <RadioLib.h>

// SX1278 (Ra-02)
SX1278 lora = new Module(5, 26, 14, -1);

void setup() {
  Serial.begin(115200);
  delay(2000);

  Serial.println("[RX] Initializing LoRa...");

  int state = lora.begin(433.0);
  if (state != RADIOLIB_ERR_NONE) {
    Serial.print("[RX] LoRa init failed, code ");
    Serial.println(state);
    while (true);
  }

  Serial.println("[RX] LoRa RX OK");
}

void loop() {
  String incoming;
  int state = lora.receive(incoming);

  if (state == RADIOLIB_ERR_NONE) {
    Serial.print("[RX] Received: ");
    Serial.println(incoming);
  } 
  else if (state != RADIOLIB_ERR_RX_TIMEOUT) {
    Serial.print("[RX] Receive failed, code ");
    Serial.println(state);
  }
}
