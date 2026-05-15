/*
  M.A.N.G.O. – RX Gateway  v2.0
  PlatformIO + Arduino framework

  Recibe paquetes binarios de 32 bytes del TX v2.0,
  los valida y los reenvía a Jetson/PC como JSON por Serial.

  Mejoras v2.0 respecto al .ino original:
  ──────────────────────────────────────────────────
  1. Decodifica el paquete binario SensorPacket (struct compartida).
  2. Reconstruye un JSON completo y rico para Jetson → mismo contrato
     de datos que antes, ahora derivado de datos reales validados.
  3. Detecta paquetes perdidos por número de secuencia y lo reporta.
  4. Parámetros LoRa idénticos al TX (SF, BW, CR, sync word).
  5. Métricas de enlace (RSSI, SNR, FreqError) incluidas en el JSON.
  6. Estadísticas de recepción acumuladas: total / perdidos / tasa.
  7. Toda la configuración en include/rx_config.h.
  ──────────────────────────────────────────────────
*/

#include <Arduino.h>
#include <SPI.h>
#include <RadioLib.h>

// ── Configuración compartida de LoRa ─────────────────────────────
// IMPORTANTE: estos valores DEBEN coincidir exactamente con el TX.
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
static constexpr int8_t  LORA_PWR_DBM = 14;   // usado si se habilita ACK

// ── Protocolo ────────────────────────────────────────────────────
static constexpr uint8_t  PKT_MAGIC    = 0xA5;
static constexpr uint8_t  PKT_VERSION  = 0x02;
static constexpr size_t   PKT_SIZE     = sizeof(SensorPacket);

// ── ACK opcional ─────────────────────────────────────────────────
#define ENABLE_ACK 0
static constexpr uint32_t ACK_GUARD_MS = 60;

// ================================================================
// Estructura del paquete (debe ser idéntica a la del TX)
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


// ================================================================
// LoRa
// ================================================================
SX1278 lora = new Module(LORA_NSS, LORA_DIO0, LORA_RST, -1);
static bool loraOk = false;

// ================================================================
// Estadísticas de enlace
// ================================================================
struct LinkStats {
  uint32_t pktsTotal   = 0;
  uint32_t pktsLost    = 0;   // inferido por saltos en seq
  uint16_t lastSeq     = 0;
  bool     seqInitialized = false;
};
static LinkStats stats;

// ================================================================
// Validación del paquete
// ================================================================
static bool validatePacket(const SensorPacket &p) {
  if (p.magic   != PKT_MAGIC)   { Serial.println("[RX] Bad magic");   return false; }
  if (p.version != PKT_VERSION) { Serial.println("[RX] Bad version"); return false; }
  return true;
}

static void updateLinkStats(uint16_t seq) {
  stats.pktsTotal++;
  if (!stats.seqInitialized) {
    stats.lastSeq       = seq;
    stats.seqInitialized = true;
    return;
  }
  // Los saltos en secuencia indican paquetes perdidos
  uint16_t expected = stats.lastSeq + 1;
  if (seq != expected) {
    // Maneja wrap-around de uint16
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
// Construcción del JSON para Jetson
// ================================================================
// Formato:
//   JSON:{...}\n
//   LINK:rssi=x snr=y freq_err=z\n
//   STATS:total=x lost=y loss_pct=z\n
//
// Los valores -1 en campos de sensor indican OFFLINE.
// status: 0=OK, 1=OFFLINE, 2=OUT_OF_RANGE
// ================================================================
static void emitJSON(const SensorPacket &p,
                     float rssi, float snr, long freqErr) {
  // Reconstruir valores float desde enteros escalados
  float tempC   = (p.tempStatus == 0) ? p.tempC_x100 / 100.0f  : -1.0f;
  float ph      = (p.phStatus   == 0) ? p.ph_x100    / 100.0f  : -1.0f;
  float phV     =  p.phV_x1000  / 1000.0f;
  float turbNTU = (p.turbStatus == 0) ? p.turbNTU_x10 / 10.0f  : -1.0f;
  float turbV   =  p.turbV_x1000 / 1000.0f;

  // JSON compacto con claves cortas (igual contrato que v1)
  char buf[300];
  snprintf(buf, sizeof(buf),
    "{"
    "\"seq\":%u,\"ts\":%lu,"
    "\"t\":%.2f,\"ts_t\":%u,\"tr\":%u,"
    "\"ph\":%.2f,\"ph_s\":%u,\"ph_v\":%.3f,\"ph_r\":%u,"
    "\"tu\":%.1f,\"tu_s\":%u,\"tu_v\":%.3f,\"tu_r\":%u,\"tu_do\":%d,"
    "\"rssi\":%.1f,\"snr\":%.1f,\"fe\":%ld"
    "}",
    p.seq, (unsigned long)p.ts_ms,
    tempC, (unsigned)p.tempStatus, (unsigned)p.tempRaw,
    ph,    (unsigned)p.phStatus,   phV, (unsigned)p.phRaw,
    turbNTU,(unsigned)p.turbStatus, turbV, (unsigned)p.turbRaw, (int)p.turbDO,
    rssi, snr, freqErr
  );

  // Línea estable que la Jetson/backend debe parsear
  Serial.print("JSON:");
  Serial.println(buf);

  // Métricas de enlace en línea separada
  Serial.printf("LINK:rssi=%.1f snr=%.1f freq_err=%ld\n", rssi, snr, freqErr);

  // Estadísticas acumuladas
  float lossPct = (stats.pktsTotal > 0)
                ? (100.0f * stats.pktsLost / (stats.pktsTotal + stats.pktsLost))
                : 0.0f;
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
  Serial.println("\n[RX] M.A.N.G.O. RX v2.0 Boot");

  SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_NSS);

  Serial.println("[RX] Init LoRa SX1278...");
  int st = lora.begin(LORA_FREQ_MHZ, LORA_BW_KHZ,
                       LORA_SF, LORA_CR,
                       LORA_SYNC, LORA_PWR_DBM);
  if (st == RADIOLIB_ERR_NONE) {
    loraOk = true;
    Serial.printf("[RX] LoRa OK | %.0f MHz | SF%u | BW%.0f kHz | CR4/%u\n",
                  LORA_FREQ_MHZ, LORA_SF, LORA_BW_KHZ, LORA_CR);
  } else {
    Serial.printf("[RX] LoRa FAILED code %d\n", st);
  }

  Serial.println("[RX] Esperando paquetes...");
  Serial.println("[RX] Output → Jetson:");
  Serial.println("  JSON:{...}");
  Serial.println("  LINK:rssi=x snr=y freq_err=z");
  Serial.println("  STATS:total=x lost=y loss_pct=z");
}

// ================================================================
// LOOP
// ================================================================
void loop() {
  if (!loraOk) { delay(100); return; }

  // Recibir en buffer de tamaño fijo
  uint8_t rxBuf[PKT_SIZE + 4] = {};  // pequeño margen
  size_t  rxLen = sizeof(rxBuf);

  int st = lora.receive(rxBuf, rxLen);

  if (st == RADIOLIB_ERR_NONE) {

    if (rxLen != PKT_SIZE) {
      Serial.printf("[RX] Wrong size: got %u expected %u – ignored\n",
                    (unsigned)rxLen, (unsigned)PKT_SIZE);
      return;
    }

    // Interpretar buffer como SensorPacket
    SensorPacket pkt;
    memcpy(&pkt, rxBuf, PKT_SIZE);

    if (!validatePacket(pkt)) return;

    // Métricas de enlace (disponibles justo tras receive)
    float rssi    = lora.getRSSI();
    float snr     = lora.getSNR();
    long  freqErr = lora.getFrequencyError();

    updateLinkStats(pkt.seq);
    emitJSON(pkt, rssi, snr, freqErr);

#if ENABLE_ACK
    sendAck(pkt.seq);
#endif

  } else if (st == RADIOLIB_ERR_RX_TIMEOUT) {
    // Normal: no hay nada en el aire
  } else if (st == RADIOLIB_ERR_CRC_MISMATCH) {
    Serial.println("[RX] CRC error – paquete corrupto");
  } else {
    Serial.printf("[RX] Receive error: %d\n", st);
  }

  delay(5);
}
