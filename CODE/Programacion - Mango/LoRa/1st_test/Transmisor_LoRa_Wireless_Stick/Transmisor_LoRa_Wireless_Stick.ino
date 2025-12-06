// TX - Heltec Wireless Stick V3 (SX1262) - RadioLib
#include <RadioLib.h>

// pines (tal como en la doc de Heltec)
SX1262 lora = new Module(8, 14, 12, 13); // NSS, DIO1, NRST, BUSY

void setup() {
  Serial.begin(115200);
  delay(100);

  int state = lora.begin(915.0); // 915 MHz
  if (state == RADIOLIB_ERR_NONE) {
    Serial.println("SX1262 listo (TX)");
  } else {
    Serial.print("Error init SX1262: ");
    Serial.println(state);
    while(true) delay(1000);
  }
}

void loop() {
  String mensaje = "Hola desde Heltec";
  Serial.print("Enviando: "); Serial.println(mensaje);

  int st = lora.transmit(mensaje);
  if (st == RADIOLIB_ERR_NONE) {
    Serial.println("Enviado OK");
  } else {
    Serial.print("Error transmit: ");
    Serial.println(st);
  }
  delay(1000);
}
