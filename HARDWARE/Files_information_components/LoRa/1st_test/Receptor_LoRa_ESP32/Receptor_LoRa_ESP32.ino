#include <RadioLib.h>

// Pines SX1262 de tu ESP32 LoRa Shell
#define LORA_NSS   8
#define LORA_DIO1  14
#define LORA_RST   12
#define LORA_BUSY  13

// Pines SPI de tu placa (según tu pinout)
#define LORA_SCK   9
#define LORA_MISO  11
#define LORA_MOSI  10

SPIClass SPI_LORA(FSPI);  
SX1262 radio = new Module(LORA_NSS, LORA_DIO1, LORA_RST, LORA_BUSY, SPI_LORA);

void setup() {
  Serial.begin(115200);
  delay(1000);

  // Inicializa SPI en los pines del módulo LoRa
  SPI_LORA.begin(LORA_SCK, LORA_MISO, LORA_MOSI);

  Serial.println("Inicializando SX1262...");

  int state = radio.begin(915.0);
  if (state != RADIOLIB_ERR_NONE) {
    Serial.print("Fallo SX1262! Código: ");
    Serial.println(state);
    while(true) delay(1000);
  }

  Serial.println("SX1262 listo en RX!");
  radio.setDio1Action([]() {
    // interrupción de recepción
  });
}

void loop() {
  String str;

  int state = radio.receive(str);
  if (state == RADIOLIB_ERR_NONE) {
    Serial.print("Recibido: ");
    Serial.println(str);
  }
}
