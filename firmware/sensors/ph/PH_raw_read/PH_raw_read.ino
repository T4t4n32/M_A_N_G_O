/*
 * M.A.N.G.O - PH RAW READ
 * File: PH_raw_read.ino
 * Purpose:
 *  - Read raw analog values from pH sensor
 *  - Convert to voltage
 *  - Output stable JSON-like data via Serial
 *
 * IMPORTANT:
 *  - No calibration
 *  - No pH conversion
 *  - Experimental phase
 */

const int PH_PIN = A0;        // pH sensor analog output
const float VREF = 5.0;       // ADC reference voltage
const int ADC_RESOLUTION = 1023;

unsigned long lastRead = 0;
const unsigned long READ_INTERVAL = 2000; // ms

void setup() {
  Serial.begin(9600);
  delay(1000);

  Serial.println("{\"status\":\"PH RAW READ STARTED\"}");
}

void loop() {
  if (millis() - lastRead >= READ_INTERVAL) {
    lastRead = millis();

    int rawValue = analogRead(PH_PIN);
    float voltage = (rawValue * VREF) / ADC_RESOLUTION;

    // JSON-like output (backend-friendly)
    Serial.print("{");
    Serial.print("\"sensor\":\"ph\",");
    Serial.print("\"raw\":");
    Serial.print(rawValue);
    Serial.print(",");
    Serial.print("\"voltage\":");
    Serial.print(voltage, 3);
    Serial.print(",");
    Serial.print("\"timestamp\":");
    Serial.print(millis());
    Serial.println("}");
  }
}
