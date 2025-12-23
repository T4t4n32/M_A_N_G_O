// ===============================
// M.A.N.G.O. - Turbidity Sensor
// Output format: TURBIDITY:<value>
// ===============================

const int sensorPin = A0;

void setup() {
  Serial.begin(9600);
}

void loop() {
  int sensorValue = analogRead(sensorPin);
  float voltage = sensorValue * (5.0 / 1024.0);

  // Por ahora enviamos voltaje como proxy de turbidez
  // (la conversión a NTU vendrá luego con calibración)
  Serial.print("TURBIDITY:");
  Serial.println(voltage, 3);

  delay(1000);
}
