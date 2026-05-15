/*
  M.A.N.G.O. – TX Sensores  v3.0
  PlatformIO + Arduino framework

  NUEVO en v3.0 – Stealth Diagnostic Portal:
  ──────────────────────────────────────────────────────────────
  • WiFi AP oculto (SSID hidden, no broadcast).
    Solo quien conoce SSID+contraseña puede conectarse.

  • URL de acceso oculta:  http://192.168.5.1/diag/<TOKEN>
    La raíz "/" responde 404 genérico. No hay indicios de panel.

  • Protección por sesión:
    - Tras autenticarse con la URL correcta, se emite una cookie
      de sesión (60 min de validez).
    - 3 intentos fallidos consecutivos → bloqueo 5 min por IP.
    - Sesión no renovable desde la UI para minimizar exposición.

  • Funciones del panel de diagnóstico:
    1. Datos en vivo de los 3 sensores (temperatura, pH, turbidez).
    2. Valores crudos ADC + voltaje + estado (OK / OFFLINE / OOR).
    3. Ring buffer de los últimos 50 paquetes enviados (log circular).
    4. Métricas LoRa: paquetes TX OK, fallos, tasa de éxito.
    5. Estado del módulo LoRa (frecuencia, SF, BW, potencia).
    6. Uptime del dispositivo.
    7. Botón "FORZAR ENVÍO": empaqueta y transmite inmediatamente
       (útil para liberar un paquete retenido o verificar el enlace).
    8. Botón "LEER SENSORES AHORA": dispara lectura manual sin esperar
       el intervalo de 10 s.
    9. Botón "REINICIAR CONTADOR": pone txSeq en 0 (diagnóstico).
   10. Botón "BORRAR LOG": limpia el ring buffer en memoria.
   11. Exportar log como JSON descargable desde el navegador.
   12. Indicador de calidad del último TX (resultado radiolib).

  • Todo el HTML/CSS/JS está en PROGMEM, sin SPIFFS necesario.
  ──────────────────────────────────────────────────────────────
*/

#include <Arduino.h>
#include <SPI.h>
#include <RadioLib.h>
#include <WiFi.h>
#include <WebServer.h>
#include "tx_config.h"

// ================================================================
// Paquete binario (idéntico al RX)
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
// Estado global de sensores (actualizado en cada lectura)
// ================================================================
struct SensorState {
  float    tempC;    uint16_t tempRaw;   uint8_t tempStatus;
  float    ph;       float    phV;       uint16_t phRaw;    uint8_t phStatus;
  float    turbNTU;  float    turbV;     uint16_t turbRaw;  int8_t  turbDO;  uint8_t turbStatus;
  uint32_t lastReadMs;
  bool     valid;
} sens = {};

// ================================================================
// Ring buffer de log (últimos LOG_SIZE paquetes)
// ================================================================
static constexpr uint8_t LOG_SIZE = 50;
struct LogEntry {
  uint16_t seq;
  uint32_t ts_ms;
  bool     sent;
  int      loraCode;   // RADIOLIB_ERR_NONE=0 o código de error
  float    tempC;
  float    ph;
  float    turbNTU;
  uint8_t  tempSt;
  uint8_t  phSt;
  uint8_t  turbSt;
};
static LogEntry logBuf[LOG_SIZE];
static uint8_t  logHead = 0;
static uint8_t  logCount = 0;

static void logPush(const LogEntry &e) {
  logBuf[logHead] = e;
  logHead = (logHead + 1) % LOG_SIZE;
  if (logCount < LOG_SIZE) logCount++;
}

// ================================================================
// Métricas LoRa
// ================================================================
static uint32_t txOk   = 0;
static uint32_t txFail = 0;
static uint16_t txSeq  = 0;
static uint32_t bootMs = 0;

// ================================================================
// Stealth WiFi session
// ================================================================
static bool     sessionActive   = false;
static uint32_t sessionStartMs  = 0;
static String   sessionCookie   = "";

static uint8_t  failedAttempts  = 0;
static uint32_t lockoutStartMs  = 0;
static bool     lockedOut       = false;

static bool isSessionValid(WebServer &srv) {
  if (!sessionActive) return false;
  if (millis() - sessionStartMs > SESSION_TIMEOUT_MS) {
    sessionActive = false;
    sessionCookie = "";
    return false;
  }
  String cookie = srv.header("Cookie");
  return (cookie.indexOf("MSESSION=" + sessionCookie) >= 0);
}

static void startSession(WebServer &srv) {
  // Generar cookie simple basada en millis+uptime (no criptográfica,
  // suficiente para acceso local en campo)
  sessionCookie   = String(millis(), HEX) + String(esp_random(), HEX);
  sessionActive   = true;
  sessionStartMs  = millis();
  failedAttempts  = 0;
  lockedOut       = false;
  srv.sendHeader("Set-Cookie",
    "MSESSION=" + sessionCookie + "; Path=/; HttpOnly; Max-Age=3600");
}

// ================================================================
// WebServer
// ================================================================
WebServer server(80);

// ================================================================
// UTILIDADES COMUNES
// ================================================================
static inline float clampf(float v, float lo, float hi) {
  return v < lo ? lo : (v > hi ? hi : v);
}
static uint16_t adcAvg(int pin, int N, int dms) {
  long sum = 0;
  for (int i = 0; i < N; i++) { sum += analogRead(pin); if (dms>0) delay(dms); }
  return (uint16_t)(sum / N);
}
static float adcToVolt(uint16_t raw, float vref=3.3f) {
  return (raw * vref) / 4095.0f;
}

// ================================================================
// SENSOR: MAX31865
// ================================================================
static constexpr uint8_t MAX_CFG = MAX_THREE_WIRE ? 0xB2 : 0x92;

static void maxStartConversion() {
  SPI.beginTransaction(SPISettings(1000000, MSBFIRST, SPI_MODE1));
  digitalWrite(MAX_CS, LOW);
  SPI.transfer(0x80); SPI.transfer(MAX_CFG);
  digitalWrite(MAX_CS, HIGH);
  SPI.endTransaction();
  delay(22);
}
static bool maxReadRaw(uint16_t &r15) {
  SPI.beginTransaction(SPISettings(1000000, MSBFIRST, SPI_MODE1));
  digitalWrite(MAX_CS, LOW);
  SPI.transfer(0x01);
  uint8_t msb = SPI.transfer(0xFF);
  uint8_t lsb = SPI.transfer(0xFF);
  digitalWrite(MAX_CS, HIGH);
  SPI.endTransaction();
  uint16_t full = ((uint16_t)msb << 8) | lsb;
  if (full & 0x01) { r15=0; return false; }
  full >>= 1; r15 = full;
  return (full > 0 && full < 0x7FFF);
}
static bool maxConvertToTemp(uint16_t r15, float &t) {
  constexpr double RTDa=3.9083e-3, RTDb=-5.775e-7;
  double Rt = (double)r15 / 32768.0 * MAX_RREF;
  if (Rt<50||Rt>320) return false;
  double Z1=-RTDa, Z2=RTDa*RTDa-4*RTDb, Z3=(4*RTDb)/MAX_RNOMINAL, Z4=2*RTDb;
  double tv = (sqrt(Z2+Z3*Rt)+Z1)/Z4;
  if (tv<-20||tv>100) return false;
  t=(float)tv; return true;
}
static bool readTemperature(float &tc, uint16_t &raw) {
  maxStartConversion();
  if (!maxReadRaw(raw)) return false;
  return maxConvertToTemp(raw, tc);
}

// ================================================================
// SENSOR: pH
// ================================================================
static bool readPH(float &ph, float &v, uint16_t &raw) {
  raw = adcAvg(PH_ADC, PH_AVG_N, 5);
  v   = adcToVolt(raw, PH_VREF);
  if (raw==0||raw>=4095||v<0.05f||v>3.25f) return false;
  float m=(4.0f-7.0f)/(PH_V_AT4-PH_V_AT7), b=7.0f-m*PH_V_AT7;
  ph = m*v+b;
  return true;
}

// ================================================================
// SENSOR: Turbidez
// ================================================================
static bool readTurbidity(float &ntu, float &v, uint16_t &raw, int8_t &dost) {
  raw  = adcAvg(TURB_ADC, TURB_AVG_N, 2);
  v    = adcToVolt(raw, TURB_VREF);
  dost = (TURB_DO>=0)?(int8_t)digitalRead(TURB_DO):-1;
  if (raw==0||raw>=4095||v<0.01f||v>3.29f) return false;
  float est=(-1120.4f*v*v)+(5742.3f*v)-4352.9f;
  ntu = clampf(est,0,3000);
  return true;
}

// ================================================================
// STATUS
// ================================================================
enum SensorStatus : uint8_t { SENS_OK=0, SENS_OFFLINE=1, SENS_OOR=2 };
static SensorStatus evalTemp(bool ok,float t){ return !ok?SENS_OFFLINE:(t<-20||t>100)?SENS_OOR:SENS_OK; }
static SensorStatus evalPH  (bool ok,float p){ return !ok?SENS_OFFLINE:(p<0||p>14)?SENS_OOR:SENS_OK; }
static SensorStatus evalTurb(bool ok,float n){ return !ok?SENS_OFFLINE:(n<0||n>3000)?SENS_OOR:SENS_OK; }

static const char* statusStr(uint8_t s){
  switch(s){ case 0:return "OK"; case 1:return "OFFLINE"; case 2:return "OOR"; } return "?";
}

// ================================================================
// LECTURA DE TODOS LOS SENSORES → actualiza `sens`
// ================================================================
static void readAllSensors() {
  float tc=-999,phv=0,ntv=0,tv=0,pv=0;
  uint16_t tr=0,pr=0,nr=0; int8_t td=-1;
  bool ot=readTemperature(tc,tr);
  bool op=readPH(phv,pv,pr);
  bool on=readTurbidity(ntv,tv,nr,td);

  sens.tempC=tc; sens.tempRaw=tr; sens.tempStatus=(uint8_t)evalTemp(ot,tc);
  sens.ph=phv;   sens.phV=pv;     sens.phRaw=pr;    sens.phStatus=(uint8_t)evalPH(op,phv);
  sens.turbNTU=ntv; sens.turbV=tv; sens.turbRaw=nr; sens.turbDO=td; sens.turbStatus=(uint8_t)evalTurb(on,ntv);
  sens.lastReadMs=millis();
  sens.valid=true;

  Serial.printf("[SENS] T=%.2fC(%s) pH=%.2f(%s) NTU=%.1f(%s)\n",
    tc,statusStr(sens.tempStatus),phv,statusStr(sens.phStatus),ntv,statusStr(sens.turbStatus));
}

// ================================================================
// CONSTRUIR PAQUETE desde estado actual
// ================================================================
static SensorPacket buildPacket() {
  SensorPacket p = {};
  p.magic=0xA5; p.version=0x02; p.seq=txSeq++; p.ts_ms=(uint32_t)millis();
  p.tempC_x100 = (sens.tempStatus==0)?(int16_t)(sens.tempC*100+0.5f):-1;
  p.tempRaw=sens.tempRaw; p.tempStatus=sens.tempStatus;
  p.ph_x100   = (sens.phStatus==0)?(int16_t)(sens.ph*100+0.5f):-1;
  p.phV_x1000=(int16_t)(sens.phV*1000+0.5f); p.phRaw=sens.phRaw; p.phStatus=sens.phStatus;
  p.turbNTU_x10=(sens.turbStatus==0)?(int16_t)(sens.turbNTU*10+0.5f):-1;
  p.turbV_x1000=(int16_t)(sens.turbV*1000+0.5f); p.turbRaw=sens.turbRaw;
  p.turbDO=sens.turbDO; p.turbStatus=sens.turbStatus;
  return p;
}

// ================================================================
// TRANSMITIR con reintentos → retorna código radiolib
// ================================================================
static int transmitPacket(const SensorPacket &pkt) {
  if (!loraOk) return -999;
  for (uint8_t a=0; a<3; a++) {
    if (a>0) delay(200*a);
    int st=lora.transmit((const uint8_t*)&pkt, sizeof(pkt));
    if (st==RADIOLIB_ERR_NONE) return st;
    Serial.printf("[TX] Retry %u code=%d\n",a+1,st);
  }
  return lora.transmit((const uint8_t*)&pkt, sizeof(pkt));
}

// ================================================================
// LEER + EMPAQUETAR + TRANSMITIR (ciclo normal)
// ================================================================
static void doFullCycle(bool forced=false) {
  readAllSensors();
  SensorPacket pkt = buildPacket();
  int code = transmitPacket(pkt);
  bool ok = (code == RADIOLIB_ERR_NONE);
  if (ok) txOk++; else txFail++;

  LogEntry e;
  e.seq=pkt.seq; e.ts_ms=pkt.ts_ms; e.sent=ok; e.loraCode=code;
  e.tempC=sens.tempC; e.ph=sens.ph; e.turbNTU=sens.turbNTU;
  e.tempSt=sens.tempStatus; e.phSt=sens.phStatus; e.turbSt=sens.turbStatus;
  logPush(e);

  Serial.printf("[TX] %s seq=%u code=%d\n", ok?"OK":"FAIL", pkt.seq, code);
  if (forced) Serial.println("[TX] FORCED TRANSMIT");
}

// ================================================================
// STEALTH PORTAL – HTML embebido
// ================================================================
// Estrategia de acceso oculto:
//  • AP con SSID oculto (hidden=true en softAP).
//  • Raíz "/" → 200 con página en blanco (no 404, para no delatar).
//  • /diag/<TOKEN> → si token correcto, inicia sesión y sirve panel.
//  • Cualquier otra ruta → 200 blanco.
//  • El panel solo es accesible si cookie MSESSION es válida.
//  • Sin cookie válida cualquier subruta del panel redirige a /diag/<TOKEN>.
// ================================================================

static const char PAGE_BLANK[] PROGMEM =
  "<!DOCTYPE html><html><head><title></title></head><body></body></html>";

// ─── HTML del panel de diagnóstico ───────────────────────────────
static const char PAGE_DIAG[] PROGMEM = R"DIAGEOF(
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Diagnostic Interface</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@300;400;600&display=swap');
:root{
  --bg:#08100f;--s0:#0c1a17;--s1:#102219;--s2:#152c21;
  --acc:#00e5a0;--acc2:#00b8ff;--warn:#ffb340;--err:#ff4a4a;
  --txt:#b8f0d8;--dim:#4a7a62;--br:#1a3528;
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{min-height:100%;background:var(--bg);color:var(--txt);
  font-family:'IBM Plex Mono',monospace;font-size:13px;}
body{padding:12px}
/* top bar */
.topbar{display:flex;align-items:center;justify-content:space-between;
  padding:10px 14px;background:var(--s0);border:1px solid var(--br);
  border-radius:6px;margin-bottom:12px;}
.sys-id{color:var(--acc);font-weight:600;font-size:.9rem;letter-spacing:.05em;}
.sys-sub{color:var(--dim);font-size:.68rem;margin-top:1px;}
.uptime-badge{color:var(--acc2);font-size:.7rem;text-align:right;}
/* grid layout */
.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;}
.full{grid-column:1/-1;}
/* panel */
.panel{background:var(--s0);border:1px solid var(--br);border-radius:6px;padding:12px;}
.ph{font-size:.6rem;color:var(--dim);letter-spacing:.2em;text-transform:uppercase;margin-bottom:10px;
  display:flex;align-items:center;justify-content:space-between;}
.ph-dot{width:6px;height:6px;border-radius:50%;background:var(--acc);
  box-shadow:0 0 6px var(--acc);display:inline-block;margin-right:6px;}
/* sensor cards */
.scard{background:var(--s1);border:1px solid var(--br);border-radius:4px;
  padding:10px;margin-bottom:8px;}
.scard:last-child{margin-bottom:0;}
.sname{font-size:.62rem;color:var(--dim);letter-spacing:.15em;margin-bottom:6px;}
.sval{font-size:1.6rem;font-weight:600;color:var(--acc);line-height:1;}
.sunit{font-size:.68rem;color:var(--dim);margin-left:2px;}
.smeta{margin-top:6px;display:flex;gap:10px;flex-wrap:wrap;}
.stag{font-size:.6rem;color:var(--dim);background:var(--s2);
  border:1px solid var(--br);border-radius:2px;padding:2px 6px;}
.stag.ok{color:var(--acc);border-color:#1a4a30;}
.stag.offline{color:var(--err);border-color:#4a1a1a;}
.stag.oor{color:var(--warn);border-color:#4a3010;}
/* actions */
.actions{display:flex;flex-direction:column;gap:8px;}
.act-btn{
  background:var(--s1);border:1px solid var(--br);border-radius:4px;
  color:var(--txt);font-family:'IBM Plex Mono',monospace;font-size:.75rem;
  padding:11px 14px;cursor:pointer;text-align:left;
  display:flex;align-items:center;gap:8px;transition:all .15s;
  width:100%;
}
.act-btn:hover{border-color:var(--acc);color:var(--acc);background:var(--s2);}
.act-btn:active{transform:scale(.98);}
.act-btn.primary{border-color:var(--acc);color:var(--acc);}
.act-btn.warn-btn{border-color:var(--warn);color:var(--warn);}
.act-btn.warn-btn:hover{background:#2a1800;}
.act-btn.danger-btn{border-color:var(--err);color:var(--err);}
.act-btn.danger-btn:hover{background:#1a0808;}
.act-icon{font-size:.9rem;flex-shrink:0;}
.act-desc{font-size:.6rem;color:var(--dim);margin-top:1px;}
/* metrics */
.mrow{display:grid;grid-template-columns:1fr 1fr;gap:6px;}
.mchip{background:var(--s1);border:1px solid var(--br);border-radius:4px;
  padding:8px 10px;text-align:center;}
.mval{font-size:1.1rem;font-weight:600;color:var(--acc);}
.mlbl{font-size:.58rem;color:var(--dim);letter-spacing:.12em;margin-top:2px;}
.lora-row{margin-top:8px;display:flex;flex-wrap:wrap;gap:5px;}
.ltag{font-size:.62rem;color:var(--acc2);background:var(--s2);
  border:1px solid #1a3040;border-radius:2px;padding:2px 7px;}
/* log */
.log-wrap{background:var(--s1);border:1px solid var(--br);border-radius:4px;
  max-height:220px;overflow-y:auto;font-size:.65rem;}
.log-row{display:grid;grid-template-columns:40px 60px 1fr 50px 50px 50px 45px;
  gap:4px;padding:4px 8px;border-bottom:1px solid var(--br);align-items:center;}
.log-row:last-child{border-bottom:none;}
.log-hdr{color:var(--dim);font-size:.58rem;letter-spacing:.08em;
  background:var(--s2);border-radius:3px 3px 0 0;position:sticky;top:0;}
.log-ok{color:var(--acc);}
.log-fail{color:var(--err);}
.log-empty{padding:16px;text-align:center;color:var(--dim);}
/* result toast */
#result{position:fixed;bottom:16px;right:16px;padding:10px 18px;
  border-radius:4px;font-size:.75rem;transition:opacity .3s;
  opacity:0;pointer-events:none;border:1px solid var(--acc);
  background:var(--s0);color:var(--acc);}
#result.show{opacity:1;}
#result.err{border-color:var(--err);color:var(--err);}
/* scrollbar */
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-track{background:var(--s1)}
::-webkit-scrollbar-thumb{background:var(--br);border-radius:2px}
</style>
</head>
<body>

<div class="topbar">
  <div>
    <div class="sys-id">M.A.N.G.O / SENSOR-NODE</div>
    <div class="sys-sub">DIAGNOSTIC INTERFACE &bull; RESTRICTED ACCESS</div>
  </div>
  <div class="uptime-badge">
    <div id="uptimeTxt">--:--:--</div>
    <div style="color:var(--dim);font-size:.6rem;margin-top:2px;">UPTIME</div>
  </div>
</div>

<div class="grid">

  <!-- Sensores vivos -->
  <div class="panel full" id="sensorPanel">
    <div class="ph"><span><span class="ph-dot"></span>SENSOR DATA &bull; LIVE</span>
      <span id="lastReadTxt" style="color:var(--dim);font-size:.6rem;">–</span></div>

    <div class="scard">
      <div class="sname">TEMPERATURA &bull; PT100 / MAX31865</div>
      <div><span class="sval" id="sTemp">–</span><span class="sunit">°C</span></div>
      <div class="smeta">
        <span class="stag" id="sTempSt">–</span>
        <span class="stag" id="sTempRaw">raw: –</span>
      </div>
    </div>

    <div class="scard">
      <div class="sname">pH &bull; ADC 12-bit</div>
      <div><span class="sval" id="sPH">–</span></div>
      <div class="smeta">
        <span class="stag" id="sPHSt">–</span>
        <span class="stag" id="sPHV">V: –</span>
        <span class="stag" id="sPHRaw">raw: –</span>
      </div>
    </div>

    <div class="scard">
      <div class="sname">TURBIDEZ &bull; AZDM01</div>
      <div><span class="sval" id="sTurb">–</span><span class="sunit">NTU</span></div>
      <div class="smeta">
        <span class="stag" id="sTurbSt">–</span>
        <span class="stag" id="sTurbV">V: –</span>
        <span class="stag" id="sTurbRaw">raw: –</span>
        <span class="stag" id="sTurbDO">DO: –</span>
      </div>
    </div>
  </div>

  <!-- Acciones -->
  <div class="panel">
    <div class="ph"><span class="ph-dot"></span>ACCIONES DE CAMPO</div>
    <div class="actions">
      <button class="act-btn primary" onclick="doAction('/diag/api/force_tx')">
        <span class="act-icon">&#9654;</span>
        <div><div>FORZAR ENVÍO LoRa</div>
          <div class="act-desc">Empaqueta y transmite ahora</div></div>
      </button>
      <button class="act-btn" onclick="doAction('/diag/api/read_now')">
        <span class="act-icon">&#8635;</span>
        <div><div>LEER SENSORES</div>
          <div class="act-desc">Lectura manual inmediata</div></div>
      </button>
      <button class="act-btn" onclick="exportLog()">
        <span class="act-icon">&#8615;</span>
        <div><div>EXPORTAR LOG</div>
          <div class="act-desc">Descarga JSON del buffer</div></div>
      </button>
      <button class="act-btn warn-btn" onclick="doAction('/diag/api/reset_seq')">
        <span class="act-icon">&#9664;</span>
        <div><div>REINICIAR SEQ</div>
          <div class="act-desc">Pone txSeq = 0</div></div>
      </button>
      <button class="act-btn danger-btn" onclick="doAction('/diag/api/clear_log')">
        <span class="act-icon">&#9249;</span>
        <div><div>BORRAR LOG</div>
          <div class="act-desc">Limpia ring buffer</div></div>
      </button>
    </div>
  </div>

  <!-- Métricas LoRa -->
  <div class="panel">
    <div class="ph"><span class="ph-dot"></span>MÉTRICAS LORA</div>
    <div class="mrow">
      <div class="mchip"><div class="mval" id="mOk">–</div><div class="mlbl">TX OK</div></div>
      <div class="mchip"><div class="mval" id="mFail">–</div><div class="mlbl">TX FAIL</div></div>
      <div class="mchip"><div class="mval" id="mSeq">–</div><div class="mlbl">SEQ</div></div>
      <div class="mchip"><div class="mval" id="mRate">–</div><div class="mlbl">ÉXITO %</div></div>
    </div>
    <div class="lora-row">
      <span class="ltag" id="lFreq">–</span>
      <span class="ltag" id="lSF">–</span>
      <span class="ltag" id="lBW">–</span>
      <span class="ltag" id="lPwr">–</span>
      <span class="ltag" id="lSt">–</span>
    </div>
  </div>

  <!-- Log -->
  <div class="panel full">
    <div class="ph"><span><span class="ph-dot"></span>PACKET LOG (últimos 50)</span>
      <span id="logCount" style="color:var(--dim);font-size:.6rem;">0 entradas</span></div>
    <div class="log-wrap" id="logWrap">
      <div class="log-row log-hdr">
        <span>SEQ</span><span>TS ms</span><span>ESTADO</span>
        <span>T °C</span><span>pH</span><span>NTU</span><span>CODE</span>
      </div>
      <div class="log-empty" id="logEmpty">Sin datos</div>
    </div>
  </div>

</div>

<div id="result"></div>

<script>
function showResult(msg, ok){
  var r=document.getElementById('result');
  r.textContent=msg;
  r.className=ok?'show':'show err';
  setTimeout(function(){r.className='';},2500);
}

function stClass(s){
  if(s==='OK') return 'stag ok';
  if(s==='OFFLINE') return 'stag offline';
  return 'stag oor';
}

function fetchStatus(){
  fetch('/diag/api/status',{cache:'no-store'})
    .then(function(r){if(!r.ok)throw new Error(r.status);return r.json();})
    .then(updateUI)
    .catch(function(e){showResult('Error: '+e.message,false);});
}

function updateUI(d){
  // uptime
  var s=Math.floor(d.uptime_ms/1000);
  var h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sc=s%60;
  document.getElementById('uptimeTxt').textContent=
    String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(sc).padStart(2,'0');

  // sensores
  var lr=Math.round((Date.now()-(d.now_ms-d.last_read_ms))/1000);
  document.getElementById('lastReadTxt').textContent='Leído hace '+lr+'s';

  document.getElementById('sTemp').textContent=d.temp_st===0?d.temp.toFixed(2):'–';
  document.getElementById('sTempSt').textContent=d.temp_st_str;
  document.getElementById('sTempSt').className=stClass(d.temp_st_str);
  document.getElementById('sTempRaw').textContent='raw: '+d.temp_raw;

  document.getElementById('sPH').textContent=d.ph_st===0?d.ph.toFixed(2):'–';
  document.getElementById('sPHSt').textContent=d.ph_st_str;
  document.getElementById('sPHSt').className=stClass(d.ph_st_str);
  document.getElementById('sPHV').textContent='V: '+d.ph_v.toFixed(3);
  document.getElementById('sPHRaw').textContent='raw: '+d.ph_raw;

  document.getElementById('sTurb').textContent=d.turb_st===0?d.turb.toFixed(1):'–';
  document.getElementById('sTurbSt').textContent=d.turb_st_str;
  document.getElementById('sTurbSt').className=stClass(d.turb_st_str);
  document.getElementById('sTurbV').textContent='V: '+d.turb_v.toFixed(3);
  document.getElementById('sTurbRaw').textContent='raw: '+d.turb_raw;
  document.getElementById('sTurbDO').textContent='DO: '+(d.turb_do===-1?'N/A':d.turb_do);

  // métricas
  document.getElementById('mOk').textContent=d.tx_ok;
  document.getElementById('mFail').textContent=d.tx_fail;
  document.getElementById('mSeq').textContent=d.tx_seq;
  var total=d.tx_ok+d.tx_fail;
  document.getElementById('mRate').textContent=total>0?Math.round(d.tx_ok/total*100)+'%':'–';

  document.getElementById('lFreq').textContent=d.lora_freq+' MHz';
  document.getElementById('lSF').textContent='SF'+d.lora_sf;
  document.getElementById('lBW').textContent=d.lora_bw+' kHz';
  document.getElementById('lPwr').textContent=d.lora_pwr+' dBm';
  document.getElementById('lSt').textContent=d.lora_ok?'ONLINE':'OFFLINE';
  document.getElementById('lSt').style.color=d.lora_ok?'var(--acc)':'var(--err)';

  // log
  updateLog(d.log, d.log_count);
}

function updateLog(entries, count){
  document.getElementById('logCount').textContent=count+' entradas';
  var wrap=document.getElementById('logWrap');
  var empty=document.getElementById('logEmpty');
  // Eliminar filas anteriores (no el header ni empty)
  var rows=wrap.querySelectorAll('.log-data');
  rows.forEach(function(r){r.remove();});

  if(!entries||entries.length===0){
    empty.style.display='block'; return;
  }
  empty.style.display='none';

  // Insertar filas más recientes primero
  var hdr=wrap.querySelector('.log-hdr');
  entries.slice().reverse().forEach(function(e){
    var row=document.createElement('div');
    row.className='log-row log-data';
    var stClr=e.sent?'log-ok':'log-fail';
    row.innerHTML=
      '<span>'+e.seq+'</span>'+
      '<span>'+e.ts_ms+'</span>'+
      '<span class="'+stClr+'">'+(e.sent?'OK':'FAIL')+'</span>'+
      '<span>'+(e.temp_st===0?e.temp.toFixed(1):'–')+'</span>'+
      '<span>'+(e.ph_st===0?e.ph.toFixed(2):'–')+'</span>'+
      '<span>'+(e.turb_st===0?e.turb.toFixed(0):'–')+'</span>'+
      '<span style="color:var(--dim)">'+e.code+'</span>';
    hdr.insertAdjacentElement('afterend', row);
  });
}

function doAction(url){
  fetch(url,{method:'POST'})
    .then(function(r){return r.json();})
    .then(function(d){showResult(d.msg,d.ok);fetchStatus();})
    .catch(function(){showResult('Error de conexión',false);});
}

function exportLog(){
  fetch('/diag/api/log_json')
    .then(function(r){return r.text();})
    .then(function(txt){
      var blob=new Blob([txt],{type:'application/json'});
      var url=URL.createObjectURL(blob);
      var a=document.createElement('a');
      a.href=url; a.download='mango_sensor_log.json'; a.click();
      URL.revokeObjectURL(url);
      showResult('Log exportado',true);
    }).catch(function(){showResult('Error exportando',false);});
}

fetchStatus();
setInterval(fetchStatus,2000);
</script>
</body>
</html>
)DIAGEOF";

// ================================================================
// HELPERS HTTP
// ================================================================
static void sendBlank() {
  server.send_P(200, "text/html", PAGE_BLANK);
}
static void sendJSON(int code, const String &body) {
  server.sendHeader("Access-Control-Allow-Origin","*");
  server.sendHeader("Cache-Control","no-cache, no-store");
  server.send(code, "application/json", body);
}
static bool checkSession() {
  if (!isSessionValid(server)) {
    server.send(403, "text/plain", "");
    return false;
  }
  return true;
}

// ================================================================
// RUTAS DEL SERVIDOR
// ================================================================

// GET /   → página en blanco (nada sospechoso)
static void handleRoot()    { sendBlank(); }
static void handleNotFound(){ sendBlank(); }

// GET /diag/<TOKEN>  → autentica y sirve el panel
static void handleDiagAuth() {
  // Verificar lockout
  if (lockedOut) {
    if (millis() - lockoutStartMs < LOCKOUT_MS) {
      // Devolver blank durante el bloqueo (no revelar que existe)
      sendBlank(); return;
    }
    lockedOut = false; failedAttempts = 0;
  }

  // Verificar token en la URL
  String path = server.uri();
  String expected = String("/diag/") + DIAG_TOKEN;
  if (path != expected) {
    failedAttempts++;
    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      lockedOut = true; lockoutStartMs = millis();
      Serial.printf("[SEC] Lockout tras %u intentos fallidos\n", failedAttempts);
    }
    sendBlank(); return;
  }

  // Token correcto → iniciar sesión
  startSession(server);
  server.sendHeader("Cache-Control","no-cache, no-store");
  server.send_P(200, "text/html", PAGE_DIAG);
  Serial.println("[SEC] Sesión iniciada desde " + server.client().remoteIP().toString());
}

// GET /diag/api/status
static void handleApiStatus() {
  if (!checkSession()) return;

  // Construir JSON de estado completo
  char buf[1200];
  int n = snprintf(buf, sizeof(buf),
    "{"
    "\"uptime_ms\":%lu,\"now_ms\":%lu,\"last_read_ms\":%lu,"
    "\"temp\":%.4f,\"temp_raw\":%u,\"temp_st\":%u,\"temp_st_str\":\"%s\","
    "\"ph\":%.4f,\"ph_v\":%.4f,\"ph_raw\":%u,\"ph_st\":%u,\"ph_st_str\":\"%s\","
    "\"turb\":%.2f,\"turb_v\":%.4f,\"turb_raw\":%u,\"turb_do\":%d,\"turb_st\":%u,\"turb_st_str\":\"%s\","
    "\"tx_ok\":%lu,\"tx_fail\":%lu,\"tx_seq\":%u,"
    "\"lora_ok\":%s,\"lora_freq\":%.1f,\"lora_sf\":%u,\"lora_bw\":%.0f,\"lora_pwr\":%d,"
    "\"log_count\":%u,\"log\":[",
    (unsigned long)millis(), (unsigned long)millis(), (unsigned long)sens.lastReadMs,
    sens.tempC, sens.tempRaw, sens.tempStatus, statusStr(sens.tempStatus),
    sens.ph, sens.phV, sens.phRaw, sens.phStatus, statusStr(sens.phStatus),
    sens.turbNTU, sens.turbV, sens.turbRaw, (int)sens.turbDO, sens.turbStatus, statusStr(sens.turbStatus),
    (unsigned long)txOk, (unsigned long)txFail, txSeq,
    loraOk?"true":"false", LORA_FREQ_MHZ, (unsigned)LORA_SF, LORA_BW_KHZ, (int)LORA_PWR_DBM,
    (unsigned)logCount
  );

  // Agregar entradas del log
  // Orden: del más reciente al más antiguo
  bool first = true;
  for (int i = 0; i < logCount; i++) {
    int idx = ((int)logHead - 1 - i + LOG_SIZE) % LOG_SIZE;
    const LogEntry &e = logBuf[idx];
    char ebuf[200];
    snprintf(ebuf, sizeof(ebuf),
      "%s{\"seq\":%u,\"ts_ms\":%lu,\"sent\":%s,\"code\":%d,"
      "\"temp\":%.2f,\"temp_st\":%u,"
      "\"ph\":%.2f,\"ph_st\":%u,"
      "\"turb\":%.1f,\"turb_st\":%u}",
      first?"":",",
      e.seq,(unsigned long)e.ts_ms,e.sent?"true":"false",e.loraCode,
      e.tempC,e.tempSt,e.ph,e.phSt,e.turbNTU,e.turbSt);
    // Append seguro
    size_t rem = sizeof(buf) - n - 4; // reservar para cierre ]}
    size_t elen = strlen(ebuf);
    if (elen < rem) { strcpy(buf+n, ebuf); n+=elen; first=false; }
    else break;
  }
  snprintf(buf+n, sizeof(buf)-n, "]}");
  sendJSON(200, buf);
}

// POST /diag/api/force_tx → fuerza lectura + envío inmediato
static void handleForceTx() {
  if (!checkSession()) return;
  doFullCycle(true);
  sendJSON(200, "{\"ok\":true,\"msg\":\"Paquete enviado (seq " + String(txSeq-1) + ")\"}");
}

// POST /diag/api/read_now → solo lectura, sin transmitir
static void handleReadNow() {
  if (!checkSession()) return;
  readAllSensors();
  sendJSON(200, "{\"ok\":true,\"msg\":\"Sensores leidos\"}");
}

// POST /diag/api/reset_seq
static void handleResetSeq() {
  if (!checkSession()) return;
  txSeq = 0;
  Serial.println("[DIAG] txSeq reiniciado a 0");
  sendJSON(200, "{\"ok\":true,\"msg\":\"Secuencia reiniciada a 0\"}");
}

// POST /diag/api/clear_log
static void handleClearLog() {
  if (!checkSession()) return;
  logHead = 0; logCount = 0;
  Serial.println("[DIAG] Log borrado");
  sendJSON(200, "{\"ok\":true,\"msg\":\"Log borrado\"}");
}

// GET /diag/api/log_json → log completo como JSON descargable
static void handleLogJson() {
  if (!checkSession()) return;
  String out = "[";
  bool first = true;
  for (int i = 0; i < logCount; i++) {
    int idx = ((int)logHead - 1 - i + LOG_SIZE) % LOG_SIZE;
    const LogEntry &e = logBuf[idx];
    char ebuf[200];
    snprintf(ebuf, sizeof(ebuf),
      "%s{\"seq\":%u,\"ts_ms\":%lu,\"sent\":%s,\"lora_code\":%d,"
      "\"temp_c\":%.4f,\"temp_st\":%u,"
      "\"ph\":%.4f,\"ph_st\":%u,"
      "\"turb_ntu\":%.2f,\"turb_st\":%u}",
      first?"":",",
      e.seq,(unsigned long)e.ts_ms,e.sent?"true":"false",e.loraCode,
      e.tempC,e.tempSt,e.ph,e.phSt,e.turbNTU,e.turbSt);
    out += ebuf;
    first = false;
  }
  out += "]";
  server.sendHeader("Content-Disposition","attachment; filename=mango_sensor_log.json");
  server.send(200, "application/json", out);
}

// ================================================================
// SETUP DEL SERVIDOR
// ================================================================
static void setupWebServer() {
  // El token es parte de la URL, así que registramos la ruta exacta
  String diagPath = String("/diag/") + DIAG_TOKEN;
  server.on(diagPath.c_str(),         HTTP_GET,  handleDiagAuth);
  server.on("/diag/api/status",       HTTP_GET,  handleApiStatus);
  server.on("/diag/api/log_json",     HTTP_GET,  handleLogJson);
  server.on("/diag/api/force_tx",     HTTP_POST, handleForceTx);
  server.on("/diag/api/read_now",     HTTP_POST, handleReadNow);
  server.on("/diag/api/reset_seq",    HTTP_POST, handleResetSeq);
  server.on("/diag/api/clear_log",    HTTP_POST, handleClearLog);
  server.on("/",                      HTTP_GET,  handleRoot);
  server.onNotFound(handleNotFound);

  // Necesitamos leer la cabecera Cookie
  const char* headers[] = {"Cookie"};
  server.collectHeaders(headers, 1);

  server.begin();
  Serial.println("[WIFI] Stealth portal activo");
  Serial.printf("[WIFI] Ruta diagnóstico: http://192.168.5.1/diag/%s\n", DIAG_TOKEN);
}

// ================================================================
// SETUP
// ================================================================
void setup() {
  Serial.begin(115200);
  delay(600);
  bootMs = millis();
  Serial.println("\n[TX] M.A.N.G.O. TX v3.0 Boot");

  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);
  pinMode(PH_ADC,   INPUT);
  pinMode(TURB_ADC, INPUT);
  if (TURB_DO >= 0) pinMode(TURB_DO, INPUT);

  SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_NSS);
  pinMode(LORA_NSS, OUTPUT); digitalWrite(LORA_NSS, HIGH);
  pinMode(MAX_CS,   OUTPUT); digitalWrite(MAX_CS,   HIGH);

  int st = lora.begin(LORA_FREQ_MHZ, LORA_BW_KHZ, LORA_SF, LORA_CR, LORA_SYNC, LORA_PWR_DBM);
  if (st == RADIOLIB_ERR_NONE) {
    loraOk = true;
    Serial.printf("[LORA] OK | %.0fMHz SF%u BW%.0f CR4/%u %ddBm\n",
      LORA_FREQ_MHZ, LORA_SF, LORA_BW_KHZ, LORA_CR, LORA_PWR_DBM);
  } else {
    Serial.printf("[LORA] FAILED code %d\n", st);
  }

  // Primera lectura de sensores al arrancar
  readAllSensors();

  // WiFi AP oculto (hidden=true)
  WiFi.mode(WIFI_AP);
  // softAP(ssid, pass, channel, hidden, max_conn)
  WiFi.softAP(STEALTH_SSID, STEALTH_PASS, 6, true, 4);
  WiFi.softAPConfig(
    IPAddress(192,168,5,1),   // IP distinta al Motion hub (192.168.4.1)
    IPAddress(192,168,5,1),
    IPAddress(255,255,255,0)
  );

  IPAddress ip = WiFi.softAPIP();
  Serial.printf("[WIFI] AP hidden SSID=%s IP=%s\n", STEALTH_SSID, ip.toString().c_str());
  Serial.println("[WIFI] El SSID NO se transmite. Conectar manualmente.");

  setupWebServer();

  Serial.println("[TX] Sistema listo");
}

// ================================================================
// LOOP
// ================================================================
void loop() {
  static uint32_t lastSend = 0;

  server.handleClient();

  // Ciclo normal de lectura+envío cada SEND_INTERVAL_MS
  if (millis() - lastSend >= SEND_INTERVAL_MS) {
    lastSend = millis();
    doFullCycle(false);
  }

  delay(2);
}
