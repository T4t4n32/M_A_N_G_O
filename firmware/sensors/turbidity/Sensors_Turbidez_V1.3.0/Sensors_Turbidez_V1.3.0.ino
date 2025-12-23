// ===============================
// M.A.N.G.O. — Sensor de Turbidez
// AZDM01 / Analógico
// ===============================

const int sensorPin = A0;
const int samples = 20;   // número de muestras para promedio

void setup() {
  Serial.begin(9600);
  Serial.println("=== M.A.N.G.O. | Turbidez AZDM01 ===");
}

void loop() {
  int rawSum = 0;

  // 1. Promedio de lecturas
  for (int i = 0; i < samples; i++) {
    rawSum += analogRead(sensorPin);
    delay(10);
  }

  float rawValue = rawSum / (float)samples;

  // 2. Convertir a voltaje (Arduino UNO = 5V)
  float voltage = rawValue * (5.0 / 1023.0);

  // 3. Conversión voltaje -> NTU (modelo empírico)
  float turbidityNTU = -1120.4 * voltage * voltage 
                       + 5742.3 * voltage 
                       - 4352.9;

  // Evitar valores negativos
  if (turbidityNTU < 0) turbidityNTU = 0;

  // 4. Mostrar resultados
  Serial.print("Raw: ");
  Serial.print(rawValue, 0);

  Serial.print(" | Voltage: ");
  Serial.print(voltage, 2);
  Serial.print(" V");

  Serial.print(" | Turbidity: ");
  Serial.print(turbidityNTU, 1);
  Serial.println(" NTU");

  delay(1000);
}
