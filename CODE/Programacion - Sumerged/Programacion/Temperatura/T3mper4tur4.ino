/*
#define ONE_WIRE_BUS 2
OneWire oneWire (ONE_WIRE_BUS);
DallasTemperature sensors (&oneWire);

void setup (){
  sensors.begin();
  Serial.begin(9600);
}
void loop (){
  sensors.requestTemperatures();
  Serial.print((sensors.getTempCByIndex(0) * 9.0) / 5.0 + 32.0);
  Serial.print("F");
  delay(500);
}
*/


#include <OneWire.h>
#include <DallasTemperature.h>

// Pin donde está conectado el sensor de datos
#define PIN_SENSOR 2

// Configuración de la comunicación OneWire y el sensor de temperatura
OneWire oneWire(PIN_SENSOR);
DallasTemperature sensors(&oneWire);

void setup() {
  Serial.begin(9600);  // Iniciar la comunicación serial
  sensors.begin();     // Iniciar el sensor de temperatura
}

void loop() {
  sensors.requestTemperatures();  // Solicitar la temperatura al sensor
  float temperaturaC = sensors.getTempCByIndex(0);  // Leer temperatura en °C

  // Comprobar si la lectura es válida
  if (temperaturaC == DEVICE_DISCONNECTED_C) {
    Serial.println("Error:NECES");
  } else {
    Serial.print("T:");
    Serial.print(temperaturaC);
    Serial.println("°C");
  }

  delay(200);  // Esperar un segundo antes de la siguiente lectura
}
