// ================================
// M.A.N.G.O - PH RAW READ
// Sensor: Uncalibrated pH Electrode
// Stage: Experimental / Dashboard feed
// ================================

const int PH_PIN = A0;
const float VREF = 5.0;
const int ADC_RESOLUTION = 1023;

unsigned long lastRead = 0;
const unsigned long READ_INTERVAL = 1000; // 1s

void setup() {
  Serial.begin(9600);
}

void loop() {
  if (millis() - lastRead >= READ_INTERVAL) {
    lastRead = millis();

    int raw = analogRead(PH_PIN);
    float voltage = (raw * VREF) / ADC_RESOLUTION;

    // Structured output (dashboard-friendly)
    Serial.print("{");
    Serial.print("\"sensor\":\"ph\",");
    Serial.print("\"status\":\"online\",");
    Serial.print("\"raw\":");
    Serial.print(raw);
    Serial.print(",");
    Serial.print("\"voltage\":");
    Serial.print(voltage, 3);
    Serial.println("}");
  }
}
