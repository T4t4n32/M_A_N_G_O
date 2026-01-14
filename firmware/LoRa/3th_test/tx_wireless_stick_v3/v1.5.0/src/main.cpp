/*
#define LORA_FREQ 915E6

uint32_t seq = 0;

void setup() {
    Serial.begin(115200);
    delay(1000);
    
    LoRa.begin(LORA_FREQ);
}

void loop() {
    StaticJsonDocument<256> doc;


    doc["device"] = "MANGO-TX-01";
    doc["ts"] = millis() / 1000;
    doc["seq"] = seq++;

    JsonObject sensors = doc.createNestedObject("sensors");
    sensors["temperature_c"] = 27.3;
    sensors["ph"] = 6.8;
    sensors["turbidity_raw"] = 723;

    JsonObject status = doc.createNestedObject("status");
    sensors["temp"] = ok;
    sensors["ph"] = "uncalibrated";
    sensors["turbidity"] = "experimental";

    char buffer[256];
    serializeJson(doc, buffer);

    LoRa.beginPacket();
    LoRa.print(buffer);
    LoRa.endPacket();

    Serial.println(jsonBuffer);

    delay(3000);
}


void setup() {
    Serial.begin(115200);
    while (!Serial);

    Serial.println("TX: starting LoRa");

    LoRa.setPins(18, 14, 26); // NSS, RESET, DIO0 (Heltec Stick)

    if (!LoRa.begin(915E6)) {
        Serial.println("TX: LoRa init failed. Check your connections.");
        while (true);
    }

    Serial.println("TX: LoRa init OK.");
}

void loop() {
    Serial.println("TX: Sending packet");

    // send packet
    LoRa.beginPacket();
    LoRa.print("HELLO MANGO!");
    LoRa.endPacket();

    delay(3000);
}

*/
#include <Arduino.h>
#include <SPI.h>
#include <LoRa.h>

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
  Serial.println("[TX] Booting");

  pinMode(LORA_RST, OUTPUT);
  digitalWrite(LORA_RST, LOW);
  delay(50);
  digitalWrite(LORA_RST, HIGH);
  delay(50);

  SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_SS);
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);

  if (!LoRa.begin(LORA_BAND)) {
    Serial.println("[TX] LoRa init FAILED");
    while (true) delay(1000);
  }

  Serial.println("[TX] LoRa init OK");
}

void loop() {
  Serial.println("[TX] Sending...");
  LoRa.beginPacket();
  LoRa.print("HELLO_FROM_MANGO");
  LoRa.endPacket();
  delay(2000);
}