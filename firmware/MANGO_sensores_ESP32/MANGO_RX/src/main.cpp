/*
  M.A.N.G.O. – RX Gateway  v3.0
  PlatformIO + Arduino framework

  Cambios v3.0 respecto al v2.0:
  ──────────────────────────────────────────────────────────────
  1. Salida JSON corregida: elimina el prefijo "JSON:" y usa el
     protocolo correcto de ingest (campo "type":"sensor_reading",
     "readings": {...}) que espera la Jetson.
  2. Receive no-bloqueante (startReceive + polling DIO0) para que
     el loop() siga corriendo mientras espera paquetes LoRa.
  3. Botón de misión en BUTTON_PIN (GPIO 4 por defecto).
     - Pulsación corta (200 ms – 2,5 s) → evento button_press
     - Pulsación larga (≥ 3 s)          → evento button_hold
     Los eventos se envían como líneas JSON por Serial → Jetson.
  ──────────────────────────────────────────────────────────────
*/

#include <Arduino.h>
#include <SPI.h>
#include <RadioLib.h>

// ── Configuración ─────────────────────────────────────────────────
static constexpr int    LORA_SCK      = 18;
static constexpr int    LORA_MISO     = 19;
static constexpr int    LORA_MOSI     = 23;
static constexpr int    LORA_NSS      = 21;
static constexpr int    LORA_DIO0     = 26;
static constexpr int    LORA_RST      = 14;
static constexpr float  LORA_FREQ_MHZ = 433.0f;
static constexpr float  LORA_BW_KHZ   = 125.0f;
static constexpr uint8_t LORA_SF      = 7;
static constexpr uint8_t LORA_CR      = 5;
static constexpr uint8_t LORA_SYNC    = 0x12;
static constexpr int8_t  LORA_PWR_DBM = 14;

// Identificador del nodo (aparece en "station" del JSON de ingest)
static const char STATION_NAME[] = "MANGO-RX-01";

// ── Botón de misión ───────────────────────────────────────────────
// Conectar entre BUTTON_PIN y GND (pull-up interno activado).
// Para cambiar el pin: modifica solo este valor.
static constexpr int     BUTTON_PIN      = 4;
static constexpr uint32_t BTN_DEBOUNCE_MS = 50;    // glitches < 50 ms ignorados
static constexpr uint32_t BTN_MIN_PRESS_MS = 200;  // pulsación válida mínima
static constexpr uint32_t BTN_HOLD_MS     = 3000;  // umbral pulsación larga

// ── Protocolo ────────────────────────────────────────────────────
static constexpr uint8_t  PKT_MAGIC    = 0xA5;
static constexpr uint8_t  PKT_VERSION  = 0x02;

// ── ACK opcional ─────────────────────────────────────────────────
#define ENABLE_ACK 0
static constexpr uint32_t ACK_GUARD_MS = 60;

// ================================================================
// Estructura del paquete (idéntica a TX)
// ================================================================
#pragma pack(push, 1)
struct SensorPacket {
  uint8_t  magic;
  uint8_t  version;
  uint16_t seq;
  uint32_t ts_ms;
  int16_t  tempC_x100;
  uint16_t tempRaw;
  uint8_t  tempStatus;
  int16_t  ph_x100;
  int16_t  phV_x1000;
  uint16_t phRaw;
  uint8_t  phStatus;
  int16_t  turbNTU_x10;
  int16_t  turbV_x1000;
  uint16_t turbRaw;
  int8_t   turbDO;
  uint8_t  turbStatus;
};
#pragma pack(pop)

static constexpr size_t PKT_SIZE = sizeof(SensorPacket);

// ================================================================
// LoRa
// ================================================================
SX1278 lora = new Module(LORA_NSS, LORA_DIO0, LORA_RST, -1);
static bool loraOk = false;

// ================================================================
// Estadísticas de enlace
// ================================================================
struct LinkStats {
  uint32_t pktsTotal      = 0;
  uint32_t pktsLost       = 0;
  uint16_t lastSeq        = 0;
  bool     seqInitialized = false;
};
static LinkStats stats;

// ================================================================
// Botón – máquina de estados
// ================================================================
enum BtnState { BTN_IDLE, BTN_PRESSED, BTN_HELD };
static BtnState  btnState    = BTN_IDLE;
static uint32_t  btnDownMs   = 0;
static bool      holdFired   = false;

static void emitButtonEvent(const char* eventType, uint32_t heldMs) {
  char buf[128];
  snprintf(buf, sizeof(buf),
    "{\"type\":\"event\",\"event_type\":\"%s\",\"data\":{\"held_ms\":%lu}}",
    eventType, (unsigned long)heldMs);
  Serial.println(buf);
  Serial.printf("[BTN] %s held_ms=%lu\n", eventType, (unsigned long)heldMs);
}

static void checkButton() {
  bool pressed = (digitalRead(BUTTON_PIN) == LOW);
  uint32_t now = millis();

  switch (btnState) {
    case BTN_IDLE:
      if (pressed) {
        btnDownMs = now;
        holdFired = false;
        btnState  = BTN_PRESSED;
      }
      break;

    case BTN_PRESSED:
      if (!pressed) {
        uint32_t held = now - btnDownMs;
        btnState = BTN_IDLE;
        // Fire short press only if release was in valid window
        if (held >= BTN_MIN_PRESS_MS && held < BTN_HOLD_MS) {
          emitButtonEvent("button_press", held);
        }
        // If held >= HOLD_MS, holdFired is already true (fired below)
      } else {
        // Still pressed: check long-press threshold
        uint32_t held = now - btnDownMs;
        if (!holdFired && held >= BTN_HOLD_MS) {
          holdFired = true;
          btnState  = BTN_HELD;
          emitButtonEvent("button_hold", held);
        }
      }
      break;

    case BTN_HELD:
      // Wait for release after hold was fired
      if (!pressed) {
        btnState = BTN_IDLE;
      }
      break;
  }
}

// ================================================================
// Validación y estadísticas
// ================================================================
static bool validatePacket(const SensorPacket &p) {
  if (p.magic   != PKT_MAGIC)   { Serial.println("[RX] Bad magic");   return false; }
  if (p.version != PKT_VERSION) { Serial.println("[RX] Bad version"); return false; }
  return true;
}

static void updateLinkStats(uint16_t seq) {
  stats.pktsTotal++;
  if (!stats.seqInitialized) {
    stats.lastSeq        = seq;
    stats.seqInitialized = true;
    return;
  }
  uint16_t expected = stats.lastSeq + 1;
  if (seq != expected) {
    uint16_t lost = (seq >= expected)
                  ? (seq - expected)
                  : (uint16_t)(65536u - expected + seq);
    stats.pktsLost += lost;
    Serial.printf("[RX] WARN seq jump: expected %u got %u (~%u lost)\n",
                  expected, seq, lost);
  }
  stats.lastSeq = seq;
}

// ================================================================
// Salida JSON — protocolo de ingest de la Jetson
// ================================================================
// Formato de salida (una línea JSON por paquete recibido):
//   {"type":"sensor_reading","station":"MANGO-RX-01","source":"lora-rx",
//    "seq":42,"rssi":-85.3,"snr":9.5,
//    "readings":{"temperature_c":28.60,"ph":7.10,"turbidity_ntu":18.4}}
//
// Si un sensor está OFFLINE o OOR, su valor es null.
// La Jetson ignora los null al insertar en SQLite.
//
// Líneas LINK: y STATS: son solo diagnóstico; el serial reader las ignora.
// ================================================================
static void emitSensorJSON(const SensorPacket &p,
                            float rssi, float snr, long freqErr) {
  float tempC   = (p.tempStatus == 0) ? p.tempC_x100  / 100.0f : -1.0f;
  float ph      = (p.phStatus   == 0) ? p.ph_x100     / 100.0f : -1.0f;
  float turbNTU = (p.turbStatus == 0) ? p.turbNTU_x10 / 10.0f  : -1.0f;

  // Construir el sub-objeto "readings" con null para sensores inválidos
  char readings[160];
  int ri = 0;
  ri += snprintf(readings + ri, sizeof(readings) - ri, "{");

  if (p.tempStatus == 0)
    ri += snprintf(readings + ri, sizeof(readings) - ri, "\"temperature_c\":%.2f", tempC);
  else
    ri += snprintf(readings + ri, sizeof(readings) - ri, "\"temperature_c\":null");

  if (p.phStatus == 0)
    ri += snprintf(readings + ri, sizeof(readings) - ri, ",\"ph\":%.2f", ph);
  else
    ri += snprintf(readings + ri, sizeof(readings) - ri, ",\"ph\":null");

  if (p.turbStatus == 0)
    ri += snprintf(readings + ri, sizeof(readings) - ri, ",\"turbidity_ntu\":%.1f", turbNTU);
  else
    ri += snprintf(readings + ri, sizeof(readings) - ri, ",\"turbidity_ntu\":null");

  ri += snprintf(readings + ri, sizeof(readings) - ri, "}");

  // JSON principal — una sola línea, serial reader la procesa al ver '{'
  char buf[350];
  snprintf(buf, sizeof(buf),
    "{\"type\":\"sensor_reading\","
    "\"station\":\"%s\","
    "\"source\":\"lora-rx\","
    "\"seq\":%u,\"rssi\":%.1f,\"snr\":%.1f,"
    "\"readings\":%s}",
    STATION_NAME,
    p.seq, rssi, snr,
    readings);

  Serial.println(buf);

  // Líneas de diagnóstico (ignoradas por serial reader, útiles en monitor serie)
  float lossPct = (stats.pktsTotal > 0)
                ? (100.0f * stats.pktsLost / (float)(stats.pktsTotal + stats.pktsLost))
                : 0.0f;
  Serial.printf("LINK:rssi=%.1f snr=%.1f freq_err=%ld\n", rssi, snr, freqErr);
  Serial.printf("STATS:total=%lu lost=%lu loss_pct=%.1f\n",
                (unsigned long)stats.pktsTotal,
                (unsigned long)stats.pktsLost,
                lossPct);
}

// ================================================================
// ACK opcional
// ================================================================
#if ENABLE_ACK
static void sendAck(uint16_t seq) {
  static uint32_t lastAckMs = 0;
  if (millis() - lastAckMs < ACK_GUARD_MS) return;
  lastAckMs = millis();
  char ack[16];
  snprintf(ack, sizeof(ack), "ACK:%u", seq);
  int st = lora.transmit((uint8_t*)ack, strlen(ack));
  Serial.printf("[RX] ACK %s (seq=%u)\n", st==RADIOLIB_ERR_NONE?"OK":"FAIL", seq);
}
#endif

// ================================================================
// SETUP
// ================================================================
void setup() {
  Serial.begin(115200);
  delay(400);
  Serial.println("\n[RX] M.A.N.G.O. RX v3.0 Boot");

  // Botón de misión
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  Serial.printf("[BTN] Boton de mision en GPIO %d\n", BUTTON_PIN);
  Serial.println("[BTN] Pulsacion corta (0.2-2.5s) -> button_press");
  Serial.println("[BTN] Pulsacion larga  (>3s)      -> button_hold");

  SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_NSS);

  Serial.println("[RX] Init LoRa SX1278...");
  int st = lora.begin(LORA_FREQ_MHZ, LORA_BW_KHZ,
                      LORA_SF, LORA_CR,
                      LORA_SYNC, LORA_PWR_DBM);
  if (st == RADIOLIB_ERR_NONE) {
    loraOk = true;
    Serial.printf("[RX] LoRa OK | %.0f MHz | SF%u | BW%.0f kHz | CR4/%u\n",
                  LORA_FREQ_MHZ, LORA_SF, LORA_BW_KHZ, LORA_CR);
    // Modo recepcion no-bloqueante: DIO0 sube cuando llega un paquete
    lora.startReceive();
    Serial.println("[RX] Modo: receive async (polling DIO0)");
  } else {
    Serial.printf("[RX] LoRa FAILED code %d\n", st);
  }

  Serial.println("[RX] Listo. Output JSON -> Jetson via Serial");
}

// ================================================================
// LOOP
// ================================================================
void loop() {
  // El boton se revisa siempre (~100 Hz con delay(10))
  checkButton();

  if (!loraOk) { delay(100); return; }

  // DIO0 HIGH = paquete recibido en el buffer del SX1278
  if (digitalRead(LORA_DIO0) == HIGH) {
    uint8_t rxBuf[PKT_SIZE + 4] = {};
    int st = lora.readData(rxBuf, PKT_SIZE);

    if (st == RADIOLIB_ERR_NONE) {
      SensorPacket pkt;
      memcpy(&pkt, rxBuf, PKT_SIZE);

      if (validatePacket(pkt)) {
        float rssi    = lora.getRSSI();
        float snr     = lora.getSNR();
        long  freqErr = lora.getFrequencyError();
        updateLinkStats(pkt.seq);
        emitSensorJSON(pkt, rssi, snr, freqErr);

#if ENABLE_ACK
        sendAck(pkt.seq);
#endif
      } else {
        Serial.println("[RX] Paquete invalido, ignorado");
      }
    } else if (st == RADIOLIB_ERR_CRC_MISMATCH) {
      Serial.println("[RX] CRC error – paquete corrupto");
    } else {
      Serial.printf("[RX] Read error: %d\n", st);
    }

    // Reiniciar receptor para el proximo paquete
    lora.startReceive();
  }

  delay(10);
}
