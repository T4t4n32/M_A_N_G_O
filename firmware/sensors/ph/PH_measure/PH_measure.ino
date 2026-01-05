// ph_measure.ino
const int PH_PIN = A0;
const float VREF = 5.0;
const int SAMPLES = 20;

float readVoltage() {
  long sum = 0;
  for (int i = 0; i < SAMPLES; i++) {
    sum += analogRead(PH_PIN);
    delay(10);
  }
  float avg = sum / (float)SAMPLES;
  return avg * (VREF / 1023.0);
}

void setup() {
  Serial.begin(9600);
  Serial.println("PH Measure: put electrode in buffer and read voltage");
}
void loop() {
  float v = readVoltage();
  Serial.print("Voltage: ");
  Serial.println(v, 4);
  delay(1000);
}
