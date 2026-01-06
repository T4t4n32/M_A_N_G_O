const int PH_PIN = A0;

void setup() {
  Serial.begin(9600);
  Serial.println("PH RAW READ - DIAGNOSTIC MODE");
}

void loop() {
  int raw = analogRead(PH_PIN);
  float voltage = raw * (5.0 / 1023.0);

  Serial.print("RAW: ");
  Serial.print(raw);
  Serial.print(" | Voltage: ");
  Serial.print(voltage, 3);
  Serial.println(" V");

  delay(1000);
}
