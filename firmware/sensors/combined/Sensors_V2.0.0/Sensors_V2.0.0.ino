// ==============================================
// M.A.N.G.O. - ESP32 Sensor Node
// Version: 2.0.0 - Protocol-aligned with /api/v1/ingest
// Role: mango-sensor-esp32
//
// Output format on Serial (115200 baud):
//   MANGO_JSON:{"device_id":"mango-sensor-esp32-01","seq":1,"t":24.36,"ph":7.12,"tu":183.4,"al":0}
//
// Fields:
//   device_id — stable identifier for this hardware unit
//   seq       — monotonically increasing packet counter (persists across reboots via EEPROM)
//   t         — temperature (°C) from PT100 / MAX31865
//   ph        — pH value
//   tu        — turbidity (NTU)
//   al        — alert level: 0=normal, 1=warning, 2=critical
// ==============================================

#include <SPI.h>
#include <EEPROM.h>

// ======== DEVICE IDENTITY ========
// Change this value for each physical unit deployed.
const char DEVICE_ID[] = "mango-sensor-esp32-01";

// EEPROM address where the sequence counter is stored (4 bytes = uint32_t)
const int EEPROM_SEQ_ADDR = 0;
const int EEPROM_SIZE = 8;
uint32_t seq_counter = 0;

// ======== SENSOR PINS ========
const int TURBIDITY_ANALOG_PIN  = A1;
const int TURBIDITY_DIGITAL_PIN = 6;
const int TURBIDITY_SAMPLES     = 30;

const int PH_PIN     = A0;
const float VREF     = 5.0;
const int PH_SAMPLES = 20;

// pH calibration — adjust after measuring your buffer solutions
const float V_PH7 = 2.50;
const float V_PH4 = 2.00;
float m_pH, b_pH;

// PT100 / MAX31865
const int chipSelectPin = 10;
const double RTDa = 3.9083e-3;
const double RTDb = -5.775e-7;

// ======== TIMING ========
const long PUBLISH_INTERVAL_MS = 2000;  // publish every 2 s
unsigned long lastPublishMs = 0;

// ======== ALERT THRESHOLDS ========
struct Thresholds {
  float ph_warn_lo, ph_warn_hi, ph_crit_lo, ph_crit_hi;
  float turb_warn, turb_crit;
  float temp_warn_lo, temp_warn_hi, temp_crit_lo, temp_crit_hi;
} THRESH = {
  5.5f, 9.5f, 4.0f, 10.5f,   // pH
  10.0f, 50.0f,               // turbidity NTU
  10.0f, 35.0f, 5.0f, 40.0f  // temperature °C
};

// ======== SENSOR STATE ========
struct SensorValue {
  bool valid;
  float value;
};

SensorValue readTurbidity();
SensorValue readPH();
SensorValue readTemperature();

// ======== SEQUENCE COUNTER (EEPROM) ========
void loadSeq() {
  EEPROM.begin(EEPROM_SIZE);
  EEPROM.get(EEPROM_SEQ_ADDR, seq_counter);
  if (seq_counter == 0xFFFFFFFF) seq_counter = 0;  // erased EEPROM
}

void saveSeq() {
  EEPROM.put(EEPROM_SEQ_ADDR, seq_counter);
  EEPROM.commit();
}

uint32_t nextSeq() {
  seq_counter++;
  // Save every 10 packets to limit write cycles (EEPROM endurance ~100k writes)
  if (seq_counter % 10 == 0) saveSeq();
  return seq_counter;
}

// ======== pH CALIBRATION ========
void calibratePH() {
  if (abs(V_PH7 - V_PH4) < 0.01f) {
    m_pH = -5.0f;
    b_pH = 7.0f + 5.0f * V_PH7;
    return;
  }
  m_pH = (4.0f - 7.0f) / (V_PH4 - V_PH7);
  b_pH = 7.0f - m_pH * V_PH7;
}

// ======== TURBIDITY ========
SensorValue readTurbidity() {
  long sum = 0;
  int valid = 0;
  for (int i = 0; i < TURBIDITY_SAMPLES; i++) {
    int r = analogRead(TURBIDITY_ANALOG_PIN);
    if (r >= 0 && r <= 1023) { sum += r; valid++; }
    delay(2);
  }
  if (valid == 0) return {false, 0};
  float voltage = (sum / (float)valid) * (5.0f / 1023.0f);
  if (voltage < 0 || voltage > 5.0f) return {false, 0};
  float ntu = -1120.4f * voltage * voltage + 5742.3f * voltage - 4352.9f;
  if (ntu < 0) ntu = 0;
  if (ntu > 3000) ntu = 3000;
  return {true, ntu};
}

// ======== pH ========
SensorValue readPH() {
  long sum = 0;
  for (int i = 0; i < PH_SAMPLES; i++) {
    sum += analogRead(PH_PIN);
    delay(5);
  }
  float voltage = (sum / (float)PH_SAMPLES) * (VREF / 1023.0f);
  float ph = m_pH * voltage + b_pH;
  if (ph < 0 || ph > 14) return {false, 0};
  return {true, ph};
}

// ======== TEMPERATURE (MAX31865 bit-bang) ========
uint16_t readRTDRegister() {
  digitalWrite(chipSelectPin, LOW);
  SPI.transfer(0x01);  // read RTD MSBs register
  uint16_t msb = SPI.transfer(0x00);
  uint16_t lsb = SPI.transfer(0x00);
  digitalWrite(chipSelectPin, HIGH);
  return (msb << 8) | lsb;
}

SensorValue readTemperature() {
  uint16_t rtdReg = readRTDRegister();
  if (rtdReg & 0x0001) return {false, 0};  // fault bit
  uint16_t adcCode = rtdReg >> 1;
  // Callendar-Van Dusen for PT100
  const double R0 = 100.0;
  const double Rref = 400.0;
  double resistance = ((double)adcCode * Rref) / 32768.0;
  double Z1 = -RTDa;
  double Z2 = RTDa * RTDa - (4.0 * RTDb);
  double Z3 = (4.0 * RTDb) / R0;
  double Z4 = 2.0 * RTDb;
  double temp = (Z2 + Z3 * resistance);
  if (temp < 0) return {false, 0};
  temp = (sqrt(temp) + Z1) / Z4;
  if (temp < -50 || temp > 120) return {false, 0};
  return {true, (float)temp};
}

// ======== ALERT LEVEL ========
int computeAlertLevel(SensorValue ph, SensorValue turb, SensorValue temp) {
  int level = 0;
  if (ph.valid) {
    if (ph.value < THRESH.ph_crit_lo || ph.value > THRESH.ph_crit_hi) level = max(level, 2);
    else if (ph.value < THRESH.ph_warn_lo || ph.value > THRESH.ph_warn_hi) level = max(level, 1);
  }
  if (turb.valid) {
    if (turb.value > THRESH.turb_crit)      level = max(level, 2);
    else if (turb.value > THRESH.turb_warn) level = max(level, 1);
  }
  if (temp.valid) {
    if (temp.value < THRESH.temp_crit_lo || temp.value > THRESH.temp_crit_hi) level = max(level, 2);
    else if (temp.value < THRESH.temp_warn_lo || temp.value > THRESH.temp_warn_hi) level = max(level, 1);
  }
  return level;
}

// ======== SETUP ========
void setup() {
  Serial.begin(115200);
  SPI.begin();
  pinMode(chipSelectPin, OUTPUT);
  digitalWrite(chipSelectPin, HIGH);
  EEPROM.begin(EEPROM_SIZE);
  loadSeq();
  calibratePH();
  Serial.println("[mango] sensor node v2.0.0 started");
  Serial.print("[mango] device_id=");
  Serial.println(DEVICE_ID);
  Serial.print("[mango] seq_start=");
  Serial.println(seq_counter);
}

// ======== LOOP ========
void loop() {
  unsigned long now = millis();
  if (now - lastPublishMs < PUBLISH_INTERVAL_MS) return;
  lastPublishMs = now;

  SensorValue sv_turb = readTurbidity();
  SensorValue sv_ph   = readPH();
  SensorValue sv_temp = readTemperature();

  int alert = computeAlertLevel(sv_ph, sv_turb, sv_temp);
  uint32_t seq = nextSeq();

  // Build compact JSON payload — Jetson reads this via serial_acquire.py
  Serial.print("MANGO_JSON:{\"device_id\":\"");
  Serial.print(DEVICE_ID);
  Serial.print("\",\"seq\":");
  Serial.print(seq);
  if (sv_temp.valid) {
    Serial.print(",\"t\":");
    Serial.print(sv_temp.value, 2);
  }
  if (sv_ph.valid) {
    Serial.print(",\"ph\":");
    Serial.print(sv_ph.value, 2);
  }
  if (sv_turb.valid) {
    Serial.print(",\"tu\":");
    Serial.print(sv_turb.value, 1);
  }
  Serial.print(",\"al\":");
  Serial.print(alert);
  Serial.println("}");
}
