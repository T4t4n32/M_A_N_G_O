#include <RadioLib.h>

// SX1278 (Ra-02)
SX1278 lora = new Module(5, 26, 14, -1);

unsigned long lastSend = 0;
const unsigned long interval = 10000; // 10 segundos

void setup() {
  Serial.begin(115200);
  delay(2000);

  Serial.println("[TX] Initializing LoRa...");

  int state = lora.begin(433.0);
  if (state != RADIOLIB_ERR_NONE) {
    Serial.print("[TX] LoRa init failed, code ");
    Serial.println(state);
    while (true);
  }

  Serial.println("[TX] LoRa init OK");
}

void loop() {
  if (millis() - lastSend >= interval) {
    lastSend = millis();

    // Datos simulados
    float temp = 24.5;
    float ph = 7.10;
    float turb = 120.0;

    String payload = "{";
    payload += "\"temp\":" + String(temp, 2) + ",";
    payload += "\"ph\":" + String(ph, 2) + ",";
    payload += "\"turb\":" + String(turb, 1);
    payload += "}";

    Serial.print("[TX] Sending: ");
    Serial.println(payload);

    int state = lora.transmit(payload);
    if (state == RADIOLIB_ERR_NONE) {
      Serial.println("[TX] Sent OK");
    } else {
      Serial.print("[TX] Send failed, code ");
      Serial.println(state);
    }
  }
}
