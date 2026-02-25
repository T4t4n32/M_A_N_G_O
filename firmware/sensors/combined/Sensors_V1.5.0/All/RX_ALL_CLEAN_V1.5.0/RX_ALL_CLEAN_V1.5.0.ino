#include <SPI.h>
#include <RadioLib.h>

static const int LORA_SCK  = 18;
static const int LORA_MISO = 19;
static const int LORA_MOSI = 23;

static const int LORA_NSS  = 21;
static const int LORA_DIO0 = 26;
static const int LORA_RST  = 14;

SX1278 lora = new Module(LORA_NSS, LORA_DIO0, LORA_RST, -1);

void setup() {
  Serial.begin(115200);
  delay(400);

  SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_NSS);

  Serial.println("[RX] Boot");
  Serial.println("[RX] Init LoRa...");

  int st = lora.begin(433.0);
  if (st != RADIOLIB_ERR_NONE) {
    Serial.print("[RX] Failed: ");
    Serial.println(st);
    while (true) delay(1000);
  }
  Serial.println("[RX] LoRa RX OK");
}

void loop() {
  String payload;
  int st = lora.receive(payload);

  if (st == RADIOLIB_ERR_NONE) {
    // Línea 1: JSON puro (para el bridge)
    Serial.print("MANGO_JSON:");
    Serial.println(payload);

    // Línea 2: métricas RF
    Serial.print("MANGO_META:{\"rssi\":");
    Serial.print(lora.getRSSI());
    Serial.print(",\"snr\":");
    Serial.print(lora.getSNR());
    Serial.print(",\"freqerr\":");
    Serial.print(lora.getFrequencyError());
    Serial.println("}");
  } else if (st != RADIOLIB_ERR_RX_TIMEOUT) {
    Serial.print("[RX] Receive error: ");
    Serial.println(st);
  }

  delay(10);
}
