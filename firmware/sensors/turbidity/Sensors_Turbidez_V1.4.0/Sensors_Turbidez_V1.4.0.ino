// ===============================
// M.A.N.G.O. — Turbidez AZDM01
// Calibración base
// ===============================

const int sensorPin = A0;
const int samples = 30;

float readVoltage() {
  long sum = 0;
  for (int i = 0; i < samples; i++) {
    sum += analogRead(sensorPin);
    delay(5);
  }
  float avg = sum / (float)samples;
  return avg * (5.0 / 1023.0);
}

void setup() {
  Serial.begin(9600);
  Serial.println("M.A.N.G.O. | Turbidez - Modo Calibracion");
}

void loop() {
  float voltage = readVoltage();

  // Modelo inicial (se ajusta luego)
  float ntu = -1120.4 * voltage * voltage
              + 5742.3 * voltage
              - 4352.9;

  if (ntu < 0) ntu = 0;

  Serial.print("Voltaje: ");
  Serial.print(voltage, 2);
  Serial.print(" V | Turbidez: ");
  Serial.print(ntu, 1);
  Serial.println(" NTU");

  delay(1000);
}
