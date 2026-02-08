#include <Arduino.h>
#include <SPI.h>
#include <RadioLib.h>

// =====================
// LoRa (SX1278 / Ra-02)
// AJUSTA ESTOS PINES a tu montaje que ya funciona
// =====================
static const int LORA_NSS  = 5;   // SS / NSS
static const int LORA_DIO0 = 26;  // DIO0
static const int LORA_RST  = 14;  // RST
static const int LORA_BUSY = -1;  // SX127x no usa BUSY

SX1278 radio = new Module(LORA_NSS, LORA_DIO0, LORA_RST, LORA_BUSY);

// =====================
// pH (analógico)
// =====================
static const int PH_PIN = 32;     // GPIO32 (ADC1)
static const float VREF = 3.3;    // Referencia lógica del ESP32

// Calibración 2 puntos (RECOMENDADO)
// Debes medir estos voltajes en el PIN GPIO32 (ya con divisor resistivo aplicado)
static const float V_PH7 = 1.65;  // ejemplo (ajústalo)
static const float V_PH4 = 2.00;  // ejemplo (ajústalo)

float m_pH = 0.0f;
float b_pH = 0.0f;

// Envío cada 10s (estable para pruebas)
static const uint32_t SEND_EVERY_MS = 10000;

// filtro simple
static const int PH_SAMPLES = 30;

float readPhVoltage() {
  // mejor para rangos altos en ESP32
  analogSetPinAttenuation(PH_PIN, ADC_11db);
  delay(2);

  uint32_t sumMv = 0;
  for (int i = 0; i < PH_SAMPLES; i++) {
    sumMv += analogReadMilliVolts(PH_PIN);
    delay(5);
  }
  float mv = (float)sumMv / (float)PH_SAMPLES;
  return mv / 1000.0f; // volts
}

float voltageToPh(float v) {
  return (m_pH * v) + b_pH;
}

void setup() {
  Serial.begin(115200);
  delay(300);

  Serial.println("[TX] Boot");

  // Calibración lineal
  // pH = m*V + b
  m_pH = (4.0f - 7.0f) / (V_PH4 - V_PH7);
  b_pH = 7.0f - (m_pH * V_PH7);

  // LoRa init (433 MHz)
  Serial.println("[TX] Init LoRa...");
  int state = radio.begin(433.0);
  if (state != RADIOLIB_ERR_NONE) {
    Serial.print("[TX] LoRa init FAILED, code ");
    Serial.println(state);
    while (true) delay(1000);
  }
  Serial.println("[TX] LoRa init OK");
}

void loop() {
  static uint32_t lastSend = 0;
  uint32_t now = millis();

  if (now - lastSend >= SEND_EVERY_MS) {
    lastSend = now;

    float v = readPhVoltage();
    float ph = voltageToPh(v);

    // payload simple (fácil de leer)
    // ejemplo: PH=6.98,V=1.723
    char payload[64];
    snprintf(payload, sizeof(payload), "PH=%.2f,V=%.3f", ph, v);

    Serial.print("[TX] ");
    Serial.println(payload);

    int state = radio.transmit(payload);
    if (state != RADIOLIB_ERR_NONE) {
      Serial.print("[TX] transmit FAILED, code ");
      Serial.println(state);
    } else {
      Serial.println("[TX] transmit OK");
    }
  }
}
