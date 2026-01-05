const int PH_PIN = A0;
const float VREF = 5.0;
const int SAMPLES = 20;

// CAMBIA ESTOS VALORES SEGÚN TU CALIBRACIÓN
const float V_PH7 = 2.50;   // coloca el voltaje medido en pH 7
const float V_PH4 = 3.00;   // coloca el voltaje medido en pH 4

float m;
float b;

void setup() {
  Serial.begin(9600);
  Serial.println("M.A.N.G.O. - pH CALIBRATED");

  m = (4.0 - 7.0) / (V_PH4 - V_PH7);
  b = 7.0 - (m * V_PH7);
}

void loop() {
  float voltage = readVoltage();
  float pH = (m * voltage) + b;

  Serial.print("Voltage: ");
  Serial.print(voltage, 3);
  Serial.print(" V | pH: ");
  Serial.println(pH, 2);

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
