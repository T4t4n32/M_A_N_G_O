const int PH_PIN = A0;
const float VREF = 5.0;
const int SAMPLES = 20;

void setup() {
  Serial.begin(9600);
  Serial.println("M.A.N.G.O. - pH RAW READ");
}

void loop() {
  float voltage = readVoltage();

  Serial.print("Voltage: ");
  Serial.print(voltage, 3);
  Serial.println(" V");

  delay(1000);
}

float readVoltage() {
  long sum = 0;

  for (int i = 0; i < SAMPLES; i++) {
    sum += analogRead(PH_PIN);
    delay(10);
  }

  float avg = sum / (float)SAMPLES;
  return avg * (VREF / 1023.0);
}
