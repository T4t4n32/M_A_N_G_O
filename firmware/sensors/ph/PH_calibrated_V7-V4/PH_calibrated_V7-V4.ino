// ph_calibrated.ino
const int PH_PIN = A0;
const float VREF = 5.0;
const int SAMPLES = 20;

// REPLACE these with measured voltages
const float V_PH7 = 2.50; // measured in pH 7
const float V_PH4 = 3.00; // measured in pH 4

float m, b;

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
  m = (4.0 - 7.0) / (V_PH4 - V_PH7); // if using pH4; adjust if using pH10
  b = 7.0 - (m * V_PH7);
  Serial.println("pH calibrated readout");
}

void loop() {
  float v = readVoltage();
  float ph = m * v + b;
  Serial.print("Voltage: ");
  Serial.print(v,4);
  Serial.print(" V | pH: ");
  Serial.println(ph,2);
  delay(1000);
}
