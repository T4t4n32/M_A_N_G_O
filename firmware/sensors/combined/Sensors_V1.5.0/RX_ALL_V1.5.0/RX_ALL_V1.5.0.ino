#include <SPI.h>
#include <RadioLib.h>

// ===============================
// PINOUT (same as your current wiring)
// ===============================
static const int LORA_SCK  = 18;
static const int LORA_MISO = 19;
static const int LORA_MOSI = 23;

static const int LORA_NSS  = 21;
static const int LORA_DIO0 = 26;
static const int LORA_RST  = 14;

// ===============================
// RadioLib LoRa object
// ===============================
SX1278 lora = new Module(LORA_NSS, LORA_DIO0, LORA_RST, -1);

// ===============================
// Settings
// ===============================
static const float LORA_FREQ_MHZ = 433.0;
static const unsigned long RX_POLL_DELAY_MS = 5;

// Safety limits
static const size_t MAX_PAYLOAD_LEN = 240;   // keep under LoRa practical size
static const bool PRINT_RAW_PREFIX = true;   // prints "[RX] Got:" lines too

// Optional: ACK back to TX (only if you want it)
#define ENABLE_ACK 0
static const unsigned long ACK_GUARD_MS = 50;
static unsigned long lastAckMs = 0;

// ===============================
// Helpers
// ===============================
static bool looksLikeJsonObject(const String &s) {
  if (s.length() < 2) return false;
  // quick trim check without heavy operations
  int i = 0;
  while (i < (int)s.length() && (s[i] == ' ' || s[i] == '\r' || s[i] == '\n' || s[i] == '\t')) i++;
  if (i >= (int)s.length() || s[i] != '{') return false;

  int j = (int)s.length() - 1;
  while (j >= 0 && (s[j] == ' ' || s[j] == '\r' || s[j] == '\n' || s[j] == '\t')) j--;
  if (j < 0 || s[j] != '}') return false;

  return true;
}

static void printLinkMetrics() {
  // Available right after receive() succeeds
  float rssi = lora.getRSSI();
  float snr  = lora.getSNR();
  long fe    = lora.getFrequencyError();

  Serial.print("RSSI:");
  Serial.print(rssi, 1);
  Serial.print(" SNR:");
  Serial.print(snr, 1);
  Serial.print(" FREQERR:");
  Serial.println(fe);
}

#if ENABLE_ACK
static void sendAck() {
  unsigned long now = millis();
  if (now - lastAckMs < ACK_GUARD_MS) return;
  lastAckMs = now;

  // Minimal ACK payload
  const char *ack = "ACK";
  int st = lora.transmit(ack);
  if (st == RADIOLIB_ERR_NONE) {
    Serial.println("ACK:OK");
  } else {
    Serial.print("ACK:FAIL:");
    Serial.println(st);
  }
}
#endif

// ===============================
// Setup
// ===============================
void setup() {
  Serial.begin(115200);
  delay(400);

  Serial.println("\n[RX] Boot");
  Serial.println("[RX] Init SPI...");

  SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_NSS);

  Serial.println("[RX] Init LoRa...");
  int st = lora.begin(LORA_FREQ_MHZ);
  if (st != RADIOLIB_ERR_NONE) {
    Serial.print("[RX] LoRa init FAILED, code ");
    Serial.println(st);
    return;
  }

  // Optional: make RX a bit more stable
  // (Only change if you need it; keep defaults if you're already stable)
  // lora.setSpreadingFactor(7);
  // lora.setBandwidth(125.0);
  // lora.setCodingRate(5);

  Serial.println("[RX] LoRa RX OK");
  Serial.println("[RX] Output format to Jetson:");
  Serial.println("JSON:{...}");
  Serial.println("RSSI:x SNR:y FREQERR:z");
}

// ===============================
// Loop
// ===============================
void loop() {
  String msg;
  int st = lora.receive(msg);

  if (st == RADIOLIB_ERR_NONE) {
    // Safety checks
    if (msg.length() == 0) {
      Serial.println("[RX] Empty payload (ignored)");
      delay(RX_POLL_DELAY_MS);
      return;
    }
    if (msg.length() > MAX_PAYLOAD_LEN) {
      Serial.print("[RX] Payload too long (ignored), len=");
      Serial.println(msg.length());
      delay(RX_POLL_DELAY_MS);
      return;
    }
    if (!looksLikeJsonObject(msg)) {
      Serial.println("[RX] Non-JSON payload (ignored)");
      if (PRINT_RAW_PREFIX) {
        Serial.print("[RX] Raw: ");
        Serial.println(msg);
      }
      delay(RX_POLL_DELAY_MS);
      return;
    }

    // 1) Optional debug line
    if (PRINT_RAW_PREFIX) {
      Serial.print("[RX] Got: ");
      Serial.println(msg);
    }

    // 2) Line that Jetson/backend should parse (single line, stable prefix)
    Serial.print("JSON:");
    Serial.println(msg);

    // 3) Link metrics (second line)
    printLinkMetrics();

#if ENABLE_ACK
    sendAck();
#endif

  } else if (st == RADIOLIB_ERR_RX_TIMEOUT) {
    // Normal when nothing received
  } else {
    Serial.print("[RX] Receive error: ");
    Serial.println(st);
  }

  delay(RX_POLL_DELAY_MS);
}
