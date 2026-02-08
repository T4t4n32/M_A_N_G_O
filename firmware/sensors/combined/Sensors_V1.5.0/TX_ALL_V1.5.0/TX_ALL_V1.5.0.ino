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
static const int MAX_CS = 17;      // set to your actual CS for MAX31865

// pH sensor analog (ADC):
static const int PH_ADC = 32;

// Turbidity (AZDM01) analog + optional digital:
static const int TURB_ADC = 33;    // CHANGE if your AO is on another pin
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
// Helpers: clamp
// ===============================
static float clampf(float v, float lo, float hi) {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

// ===============================
// ESP32 ADC to voltage (approx)
// NOTE: If you use divider, this voltage is at the ADC pin.
// ===============================
static float adcToVolt(int raw, float vref = 3.3f) {
  return (raw * vref) / 4095.0f;
}

// ===============================
// pH (simple 2-point model)
// You must calibrate these later; for now we keep a sane mapping.
// Example placeholders (edit with your measured values):
// ===============================
static const float PH_V7 = 2.50f;  // voltage at pH 7 (placeholder)
static const float PH_V4 = 3.00f;  // voltage at pH 4 (placeholder)

static void phLine(float &m, float &b) {
  // pH = m*V + b
  m = (4.0f - 7.0f) / (PH_V4 - PH_V7);
  b = 7.0f - (m * PH_V7);
}

static bool readPH(float &ph, float &v) {
  long sum = 0;
  const int N = 20;
  for (int i=0;i<N;i++){
    sum += analogRead(PH_ADC);
    delay(5);
  }
  int raw = (int)(sum / N);
  v = adcToVolt(raw, 3.3f);

  float m,b;
  phLine(m,b);
  ph = (m * v) + b;

  // Range rules (for dashboard):
  // - "offline": impossible voltage or raw stuck
  // - "out-of-range": pH < 0 or > 14
  if (v < 0.05f || v > 3.25f) return false;
  return true;
}

// ===============================
// Turbidity: read AO voltage; optional DO state
// We keep it as voltage (stable), and also estimate NTU (rough).
// ===============================
static bool readTurbidity(float &v, int &dostate, float &ntu) {
  long sum = 0;
  const int N = 30;
  for (int i=0;i<N;i++){
    sum += analogRead(TURB_ADC);
    delay(2);
  }
  int raw = (int)(sum / N);
  v = adcToVolt(raw, 3.3f);

  if (TURB_DO >= 0) {
    dostate = digitalRead(TURB_DO);
  } else {
    dostate = -1;
  }

  // Classic polynomial used often (not guaranteed accurate):
  // ntu = -1120.4*V^2 + 5742.3*V - 4352.9
  float est = (-1120.4f * v * v) + (5742.3f * v) - 4352.9f;
  if (est < 0) est = 0;
  if (est > 1000) est = 1000;
  ntu = est;

  // Offline criteria: voltage nonsense
  if (v < 0.01f || v > 3.29f) return false;
  return true;
}

// ===============================
// MAX31865 minimal read (your style)
// Works in SPI_MODE1, 500kHz, 3-wire config (0xB0)
// ===============================
double resistance = 0.0;
double temperatureC = 0.0;

static bool maxReadRegister(double &rawReg) {
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

  rawReg = (double)full;

  // Basic sanity
  if (full == 0 || full == 0x7FFF) return false;
  return true;
}

static bool maxConvertToTemp(double rawReg, double &tempOut) {
  // Callendar–Van Dusen (PT100)
  const double RTDa = 3.9083e-3;
  const double RTDb = -5.775e-7;

  double Rt = rawReg;
  Rt /= 32768.0;
  Rt *= 430.0; // Rref module

  // Sanity for PT100
  if (Rt < 50 || Rt > 300) return false;

  double Z1 = -RTDa;
  double Z2 = RTDa * RTDa - (4 * RTDb);
  double Z3 = (4 * RTDb) / 100.0;
  double Z4 = 2 * RTDb;

  double t = Z2 + (Z3 * Rt);
  t = (sqrt(t) + Z1) / Z4;

  // Accept typical water bounds (you can widen later)
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
  // Out-of-range example: sensor nonsense voltage
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

  Serial.println("\n[TX] Boot (3 sensors)");
  Serial.println("[TX] Init SPI + pins");

  // ADC setup
  analogReadResolution(12);
  pinMode(PH_ADC, INPUT);
  pinMode(TURB_ADC, INPUT);
  if (TURB_DO >= 0) pinMode(TURB_DO, INPUT);

  // SPI shared bus
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
// Build compact JSON payload (short!)
// Example:
// {"t":24.31,"ts":0,"ph":7.02,"phs":0,"tu":1.92,"tus":0}
// ===============================
static void buildPayload(char *buf, size_t n,
                         double tempC, int tempS,
                         float ph, int phS,
                         float turbV, int turbS) {
  // keep it small
  snprintf(buf, n,
           "{\"t\":%.2f,\"ts\":%d,\"ph\":%.2f,\"phs\":%d,\"tu\":%.2f,\"tus\":%d}",
           tempC, tempS, ph, phS, turbV, turbS);
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
  double rawReg = 0;
  bool okTempRead = maxReadRegister(rawReg);
  bool okTempConv = false;
  double tempC = -999.0;

  if (okTempRead) {
    okTempConv = maxConvertToTemp(rawReg, tempC);
  }
  int tempS = statusTemp(tempC, okTempRead && okTempConv);

  // --- pH ---
  float ph = -1.0f, phV = 0.0f;
  bool okPH = readPH(ph, phV);
  int phS = statusPH(ph, phV, okPH);

  // --- Turbidity ---
  float turbV = 0.0f, turbNTU = 0.0f;
  int turbDO = -1;
  bool okTurb = readTurbidity(turbV, turbDO, turbNTU);
  int turbS = statusTurb(turbV, okTurb);

  // Build payload (sending turbidity voltage "tu")
  char payload[140];
  buildPayload(payload, sizeof(payload),
               (tempS==0 ? tempC : -1.0), tempS,
               (phS==0 ? ph : -1.0f), phS,
               (turbS==0 ? turbV : -1.0f), turbS);

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
