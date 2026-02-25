#include <SPI.h>
#include <RadioLib.h>

// ===============================
// PINOUT (YOUR CURRENT WIRING)
// ===============================
// LoRa RA-02 (SX1278) on SPI:
static const int LORA_SCK  = 18;
static const int LORA_MISO = 19;
static const int LORA_MOSI = 23;

static const int LORA_NSS  = 21;   // IMPORTANT: per your note
static const int LORA_DIO0 = 26;
static const int LORA_RST  = 14;

// MAX31865 (PT100) shares SPI lines, separate CS:
static const int MAX_CS = 17;

// pH sensor analog (ADC):
static const int PH_ADC = 32;

// Turbidity (AZDM01) analog + optional digital:
static const int TURB_ADC = 33;
static const int TURB_DO  = 27;    // optional; if not used, set to -1

// ===============================
// LoRa object
// ===============================
SX1278 lora = new Module(LORA_NSS, LORA_DIO0, LORA_RST, -1);

// ===============================
// Timing
// ===============================
static const unsigned long SEND_INTERVAL_MS = 10000;
unsigned long lastSend = 0;

// ===============================
// Helpers
// ===============================
static float adcToVolt(int raw, float vref = 3.3f) {
  return (raw * vref) / 4095.0f;
}

static float clampf(float v, float lo, float hi) {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

// ===============================
// pH (simple 2-point model placeholders)
// ===============================
static const float PH_V7 = 2.50f;  // placeholder
static const float PH_V4 = 3.00f;  // placeholder

static void phLine(float &m, float &b) {
  m = (4.0f - 7.0f) / (PH_V4 - PH_V7);
  b = 7.0f - (m * PH_V7);
}

// Returns: okRead + fills (ph, v, raw)
static bool readPH(float &ph, float &v, int &rawOut) {
  long sum = 0;
  const int N = 20;
  for (int i = 0; i < N; i++) {
    sum += analogRead(PH_ADC);
    delay(5);
  }
  int raw = (int)(sum / N);
  rawOut = raw;

  v = adcToVolt(raw, 3.3f);

  float m, b;
  phLine(m, b);
  ph = (m * v) + b;

  // Offline criteria: voltage nonsense / ADC nonsense
  if (raw <= 0 || raw >= 4095) return false;
  if (v < 0.05f || v > 3.25f) return false;

  return true;
}

// ===============================
// Turbidity
// Returns: okRead + fills (v, raw, dostate, ntu)
// ===============================
static bool readTurbidity(float &v, int &rawOut, int &dostate, float &ntu) {
  long sum = 0;
  const int N = 30;
  for (int i = 0; i < N; i++) {
    sum += analogRead(TURB_ADC);
    delay(2);
  }
  int raw = (int)(sum / N);
  rawOut = raw;

  v = adcToVolt(raw, 3.3f);

  if (TURB_DO >= 0) dostate = digitalRead(TURB_DO);
  else dostate = -1;

  // Rough estimation (not calibrated)
  float est = (-1120.4f * v * v) + (5742.3f * v) - 4352.9f;
  est = clampf(est, 0.0f, 1000.0f);
  ntu = est;

  // Offline criteria
  if (raw <= 0 || raw >= 4095) return false;
  if (v < 0.01f || v > 3.29f) return false;

  return true;
}

// ===============================
// MAX31865 minimal read (your style)
// ===============================
static bool maxReadRegister(uint16_t &raw15bits) {
  // Write config
  SPI.beginTransaction(SPISettings(500000, MSBFIRST, SPI_MODE1));
  digitalWrite(MAX_CS, LOW);
  SPI.transfer(0x80);
  SPI.transfer(0xB0); // bias on, 3-wire
  digitalWrite(MAX_CS, HIGH);
  SPI.endTransaction();

  delay(10);

  // Read RTD MSB/LSB
  SPI.beginTransaction(SPISettings(500000, MSBFIRST, SPI_MODE1));
  digitalWrite(MAX_CS, LOW);
  SPI.transfer(0x01);
  uint8_t msb = SPI.transfer(0xFF);
  uint8_t lsb = SPI.transfer(0xFF);
  digitalWrite(MAX_CS, HIGH);
  SPI.endTransaction();

  uint16_t full = ((uint16_t)msb << 8) | lsb;
  full >>= 1; // remove fault bit
  raw15bits = full;

  if (full == 0 || full == 0x7FFF) return false;
  return true;
}

static bool maxConvertToTemp(uint16_t raw15bits, double &tempOut) {
  const double RTDa = 3.9083e-3;
  const double RTDb = -5.775e-7;

  double Rt = (double)raw15bits;
  Rt /= 32768.0;
  Rt *= 430.0;

  if (Rt < 50 || Rt > 300) return false;

  double Z1 = -RTDa;
  double Z2 = RTDa * RTDa - (4 * RTDb);
  double Z3 = (4 * RTDb) / 100.0;
  double Z4 = 2 * RTDb;

  double t = Z2 + (Z3 * Rt);
  t = (sqrt(t) + Z1) / Z4;

  if (t < -20 || t > 100) return false;

  tempOut = t;
  return true;
}

// ===============================
// Status mapping
// 0=OK, 1=OFFLINE, 2=OUT_OF_RANGE
// ===============================
static int statusPH(float ph, float v, bool okRead) {
  if (!okRead) return 1;
  if (ph < 0.0f || ph > 14.0f) return 2;
  return 0;
}

static int statusTurb(float v, bool okRead) {
  if (!okRead) return 1;
  if (v < 0.05f || v > 3.25f) return 2;
  return 0;
}

static int statusTemp(double t, bool okRead) {
  if (!okRead) return 1;
  if (t < -20 || t > 100) return 2;
  return 0;
}

// ===============================
// Setup
// ===============================
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n[TX] Boot (3 sensors + raw)");
  Serial.println("[TX] Init SPI + pins");

  analogReadResolution(12);

  pinMode(PH_ADC, INPUT);
  pinMode(TURB_ADC, INPUT);
  if (TURB_DO >= 0) pinMode(TURB_DO, INPUT);

  // Shared SPI bus
  SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_NSS);

  // CS pins
  pinMode(LORA_NSS, OUTPUT);
  digitalWrite(LORA_NSS, HIGH);

  pinMode(MAX_CS, OUTPUT);
  digitalWrite(MAX_CS, HIGH);

  Serial.println("[TX] Init LoRa...");
  int st = lora.begin(433.0);
  if (st != RADIOLIB_ERR_NONE) {
    Serial.print("[TX] LoRa init FAILED, code ");
    Serial.println(st);
  } else {
    Serial.println("[TX] LoRa init OK");
  }
}

// ===============================
// Build compact JSON payload
// Keep keys short to reduce bytes.
// t,ts,tr (temp)
// ph,phs,phv,phr
// tu,tus,tuv,tur,tunu,tudo
// ===============================
static void buildPayload(char *buf, size_t n,
                         double t, int ts, uint16_t tr,
                         float ph, int phs, float phv, int phr,
                         float tu, int tus, float tuv, int tur, float tunu, int tudo) {
  // IMPORTANT: keep decimals limited
  snprintf(buf, n,
    "{\"t\":%.2f,\"ts\":%d,\"tr\":%u,"
    "\"ph\":%.2f,\"phs\":%d,\"phv\":%.3f,\"phr\":%d,"
    "\"tu\":%.2f,\"tus\":%d,\"tuv\":%.3f,\"tur\":%d,\"tunu\":%.0f,\"tudo\":%d}",
    t, ts, tr,
    ph, phs, phv, phr,
    tu, tus, tuv, tur, tunu, tudo
  );
}

// ===============================
// Loop
// ===============================
void loop() {
  unsigned long now = millis();
  if (now - lastSend < SEND_INTERVAL_MS) {
    delay(10);
    return;
  }
  lastSend = now;

  // --- Temperature ---
  uint16_t rawReg = 0;
  bool okTempRead = maxReadRegister(rawReg);
  bool okTempConv = false;
  double tempC = -999.0;

  if (okTempRead) okTempConv = maxConvertToTemp(rawReg, tempC);
  int tempS = statusTemp(tempC, okTempRead && okTempConv);

  // --- pH ---
  float ph = -1.0f, phV = 0.0f;
  int phRaw = -1;
  bool okPH = readPH(ph, phV, phRaw);
  int phS = statusPH(ph, phV, okPH);

  // --- Turbidity ---
  float turbV = 0.0f, turbNTU = 0.0f;
  int turbRaw = -1;
  int turbDO = -1;
  bool okTurb = readTurbidity(turbV, turbRaw, turbDO, turbNTU);
  int turbS = statusTurb(turbV, okTurb);

  // Decide reported values (if not OK -> send -1 but keep raw+volt to debug)
  double tSend   = (tempS == 0) ? tempC : -1.0;
  float  phSend  = (phS == 0)   ? ph    : -1.0f;
  float  tuSendV = (turbS == 0) ? turbV : -1.0f;

  // Build payload
  char payload[220]; // slightly bigger because we added raw fields
  buildPayload(payload, sizeof(payload),
               tSend, tempS, rawReg,
               phSend, phS, phV, phRaw,
               tuSendV, turbS, turbV, turbRaw, turbNTU, turbDO);

  Serial.print("[TX] Payload: ");
  Serial.println(payload);

  int st = lora.transmit(payload);
  if (st == RADIOLIB_ERR_NONE) {
    Serial.println("[TX] Sent OK");
  } else {
    Serial.print("[TX] Send FAILED, code ");
    Serial.println(st);
  }

  delay(50);
}
