#pragma once
// ================================================================
// M.A.N.G.O. TX – Configuración v3.0
// ================================================================

// ── LoRa SX1278 ─────────────────────────────────────────────────
static constexpr int   LORA_SCK  = 18;
static constexpr int   LORA_MISO = 19;
static constexpr int   LORA_MOSI = 23;
static constexpr int   LORA_NSS  = 21;
static constexpr int   LORA_DIO0 = 26;
static constexpr int   LORA_RST  = 14;

static constexpr float   LORA_FREQ_MHZ  = 433.0f;
static constexpr float   LORA_BW_KHZ    = 125.0f;
static constexpr uint8_t LORA_SF        = 7;
static constexpr uint8_t LORA_CR        = 5;
static constexpr uint8_t LORA_SYNC      = 0x12;
static constexpr int8_t  LORA_PWR_DBM   = 14;

// ── MAX31865 PT100 ───────────────────────────────────────────────
static constexpr int   MAX_CS         = 17;
static constexpr float MAX_RREF       = 430.0f;
static constexpr float MAX_RNOMINAL   = 100.0f;
static constexpr bool  MAX_THREE_WIRE = true;

// ── pH ───────────────────────────────────────────────────────────
static constexpr int   PH_ADC   = 32;
static constexpr float PH_VREF  = 3.3f;
static constexpr float PH_V_AT7 = 2.50f;
static constexpr float PH_V_AT4 = 3.00f;
static constexpr int   PH_AVG_N = 20;

// ── Turbidez AZDM01 ─────────────────────────────────────────────
static constexpr int   TURB_ADC  = 33;
static constexpr int   TURB_DO   = 27;
static constexpr float TURB_VREF = 3.3f;
static constexpr int   TURB_AVG_N = 30;

// ── Intervalos ───────────────────────────────────────────────────
static constexpr uint32_t SEND_INTERVAL_MS = 10000UL;

// ── WiFi Stealth AP ─────────────────────────────────────────────
// El AP se levanta SIN broadcasting de SSID (hidden network).
// Solo quien conoce las credenciales puede conectarse.
// La URL de acceso al diagnóstico NO está en la raíz "/".
// Ruta pública:  /        → 404 genérico (nada sospechoso)
// Ruta oculta:   /diag/<TOKEN>  → panel de diagnóstico completo
// Sesión:        cookie de 60 min; tras 3 fallos bloquea 5 min.

static const char* STEALTH_SSID    = "MANGO-SEN";      // SSID (hidden)
static const char* STEALTH_PASS    = "mgsen2025!";      // ≥8 chars
static const char* DIAG_TOKEN      = "x9kTmP4wZv";     // path secreto
static constexpr uint32_t SESSION_TIMEOUT_MS  = 3600000UL; // 60 min
static constexpr uint8_t  MAX_FAILED_ATTEMPTS = 3;
static constexpr uint32_t LOCKOUT_MS          = 300000UL;  // 5 min
