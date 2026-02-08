#include <SPI.h>
#include <RadioLib.h>

// Use SAME LoRa wiring as TX side (adjust if different)
static const int LORA_SCK  = 18;
static const int LORA_MISO = 19;
static const int LORA_MOSI = 23;

static const int LORA_NSS  = 21;
static const int LORA_DIO0 = 26;
static const int LORA_RST  = 14;

SX1278 lora = new Module(LORA_NSS, LORA_DIO0, LORA_RST, -1);

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n[RX] Boot");
  SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_NSS);

  Serial.println("[RX] Init LoRa...");
  int st = lora.begin(433.0);
  if (st != RADIOLIB_ERR_NONE) {
    Serial.print("[RX] Failed: ");
    Serial.println(st);
  } else {
    Serial.println("[RX] LoRa RX OK");
  }
}

void loop() {
  String str;
  int st = lora.receive(str);

  if (st == RADIOLIB_ERR_NONE) {
    Serial.print("[RX] Got: ");
    Serial.println(str);
  } else if (st == RADIOLIB_ERR_RX_TIMEOUT) {
    // normal if nothing received
  } else {
    Serial.print("[RX] Receive error: ");
    Serial.println(st);
  }

  delay(10);
}
