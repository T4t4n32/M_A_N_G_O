const int turbidezPin = A0;  // Pin donde conectaste la salida analógica del sensor

void setup() {
  Serial.begin(9600);  // Inicializa el monitor serial
}

void loop() {
  int valorTurbidez = analogRead(turbidezPin);  // Lee el valor analógico del sensor
  float voltaje = valorTurbidez * (5.0 / 1023.0);  // Convierte el valor a voltaje

  Serial.print("Turbidez: ");
  Serial.print(valorTurbidez);
  
  delay(1000);  // Pausa de 1 segundo entre lecturas
}
