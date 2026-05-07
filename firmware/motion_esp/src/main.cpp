#include <Arduino.h>
#include <Wire.h>

#define SDA_PIN 21
#define SCL_PIN 22

void setup() {
  Serial.begin(115200);
  delay(1000);

  Wire.begin(SDA_PIN, SCL_PIN);
  Wire.setClock(400000);

  Serial.println("\nEscaneando bus I2C...");
}

void loop() {
  byte error, address;
  int devices = 0;

  Serial.println("Buscando dispositivos I2C...");

  for (address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    error = Wire.endTransmission();

    if (error == 0) {
      Serial.print("Dispositivo encontrado en 0x");
      if (address < 16) Serial.print("0");
      Serial.println(address, HEX);
      devices++;
    }
  }

  if (devices == 0) {
    Serial.println("No se encontraron dispositivos I2C.");
  } else {
    Serial.print("Total encontrados: ");
    Serial.println(devices);
  }

  Serial.println("----------------------");
  delay(3000);
}