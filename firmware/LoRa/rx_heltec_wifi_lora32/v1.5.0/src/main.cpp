
/*
#define LORA_FREQ 915E6

void setup() {
    Serial.begin(115200);
    delay(1000);

    LoRa.begin(LORA_FREQ);
}

void loop() {
    int packetSize = LoRa.parsePacket();
    if (packetSize) {
        String payload = "";
        while (LoRa.available()) {
            payload += (char)LoRa.read();
        }
        // IMPORTANT: print raw JSON only
        Serial.println(payload);
    }
}


void setup() {
    Serial.begin(115200);
    while (!Serial);
    
    Serial.println("RX: starting LoRa");

    LoRa.setPins(18, 14, 26); // NSS, RESET, DIO0 (Heltec Stick)
    if (!LoRa.begin(915E6)) {
        Serial.println("RX: LoRa init failed. Check your connections.");
        while (true);
    }

    Serial.println("RX: LoRa init OK.");
}

void loop() {
    int packetSize = LoRa.parsePacket();
    if (packetSize) {
        Serial.print("RX: received packet -> '");
        while (LoRa.available()) {
            Serial.print((char)LoRa.read());
        }
        Serial.println();
    }
}

*/

#include <Arduino.h>
#include <SPI.h>
#include <LoRa.h>

// Pines Heltec ESP32 (ajústalos SOLO si sabes que son distintos)
#define LORA_SCK   5
#define LORA_MISO  19
#define LORA_MOSI  27
#define LORA_SS    18
#define LORA_RST   14
#define LORA_DIO0  26

#define LORA_BAND 915E6

void setup() {
  Serial.begin(115200);
  delay(2000);
  Serial.println("[RX] Booting");

  // Reset físico del SX127x
  pinMode(LORA_RST, OUTPUT);
  digitalWrite(LORA_RST, LOW);
  delay(50);
  digitalWrite(LORA_RST, HIGH);
  delay(50);

  SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_SS);
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);

  if (!LoRa.begin(LORA_BAND)) {
    Serial.println("[RX] LoRa init FAILED");
    while (true) delay(1000);
  }

  Serial.println("[RX] LoRa init OK");
}

void loop() {
  int packetSize = LoRa.parsePacket();
  if (packetSize) {
    String data = "";
    while (LoRa.available()) {
      data += (char)LoRa.read();
    }
    Serial.print("[RX] Packet: ");
    Serial.println(data);
  }
  delay(10);
}