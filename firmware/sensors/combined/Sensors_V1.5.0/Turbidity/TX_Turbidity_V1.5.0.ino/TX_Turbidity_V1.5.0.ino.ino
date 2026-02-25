#include <Arduino.h>
#include <SPI.h>
#include <RadioLib.h>

// ========== LoRa (ajusta a tu montaje) ==========
static const int LORA_NSS  = 5;
static const int LORA_DIO0 = 26;
static const int LORA_RST  = 14;
static const int LORA_BUSY = -1;
SX1278 radio = new Module(LORA_NSS, LORA_DIO0, LORA_RST, LORA_BUSY);

// ========== pH ==========
static const int PH_PIN = 32;   // ya funcionando
static const float V_PH7 = 1.65; // AJUSTA según tu calibración real en GPIO32
static const float V_PH4 = 2.00; // AJUSTA
float m_pH = 0.0f, b_pH = 0.0f;
static const int PH_SAMPLES = 30;

// ========== Turbidez ==========
static const int TURB_PIN = 33;      // AO turbidez -> divisor -> GPIO33
static const int TURB_SAMPLES = 30;

// envío
static const uint32_t SEND_EVERY_MS = 10000;

float readVoltageAvg(int pin, int samples) {
  analogSetPinAttenuation(pin, ADC_11db);
  delay(2);

  uint32_t sumMv = 0;
  for (int i = 0; i < samples; i++) {
    sumMv += analogReadMilliVolts(pin);
    delay(5);
  }
  float mv = (float)sumMv / (float)samples;
  return mv / 1000.0f;
}

float voltageToPh(float v) {
  return (m_pH * v) + b_pH;
}

// Modelo típico (aprox) para turbidez por voltaje (ojo: depende del módulo)
float voltageToNTU(float v) {
  float ntu = -1120.4f * v * v + 5742.3f * v - 4352.9f;
  if (ntu < 0) ntu = 0;
  if (ntu > 1000) ntu = 1000;
  return ntu;
}

void setup() {
  Serial.begin(115200);
  delay(300);

  Serial.println("[TX] Boot");

  // Calibración pH lineal
  m_pH = (4.0f - 7.0f) / (V_PH4 - V_PH7);
  b_pH = 7.0f - (m_pH * V_PH7);

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

    // leer pH
    float vph  = readVoltageAvg(PH_PIN, PH_SAMPLES);
    float ph   = voltageToPh(vph);

    // leer turbidez
    float vturb = readVoltageAvg(TURB_PIN, TURB_SAMPLES);
    float ntu   = voltageToNTU(vturb);

    // payload
    char payload[120];
    snprintf(payload, sizeof(payload),
             "PH=%.2f,VPH=%.3f,TURB_V=%.3f,NTU=%.1f",
             ph, vph, vturb, ntu);

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
