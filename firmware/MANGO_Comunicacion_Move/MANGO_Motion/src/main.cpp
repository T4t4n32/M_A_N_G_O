/*
  M.A.N.G.O. – ESP32 Motion Sub-Brain  v3.0
  PlatformIO + Arduino framework

  NUEVO en v3.0:
  ─────────────────────────────────────────────────────────
  • WiFi Access Point embebido (sin router externo).
    SSID: "MANGO-HUB"  |  Password: "mango2025"
    IP:   192.168.4.1
  • Servidor HTTP en puerto 80 con interfaz de control completa.
    - Panel de estado en tiempo real (polling cada 800 ms vía /api/status).
    - Botones: MANUAL (ESP32), AUTOMÁTICO, PARAR.
    - Control de joystick de dirección en modo MANUAL.
    - Barra de progreso de misión AUTO con countdown.
    - Telemetría IMU (yaw/pitch/roll) y PWM actuales.
  • Toda la lógica de motores/IMU/AUTO de v2.0 intacta.
  ─────────────────────────────────────────────────────────
*/

#include <Arduino.h>
#include <Wire.h>
#include <ESP32Servo.h>
#include "SparkFun_BNO080_Arduino_Library.h"
#include "auto_config.h"
#include <WiFi.h>
#include <WebServer.h>
#include <ctype.h>
#include <math.h>

// =====================================================
// WiFi AP
// =====================================================
static const char* AP_SSID = "MANGO-HUB";
static const char* AP_PASS = "mango2025";

WebServer server(80);

// =====================================================
// CONFIGURACIÓN GENERAL
// =====================================================
static constexpr uint32_t SERIAL_BAUD           = 115200;
static constexpr uint32_t I2C_SPEED_HZ          = 400000;
static constexpr uint16_t IMU_REPORT_INTERVAL_MS = 10;
static constexpr uint16_t TELEMETRY_INTERVAL_MS  = 100;
static constexpr uint32_t FAILSAFE_MS            = 2000;
#define USE_GYRO_INTEGRATED_VECTOR 1

// =====================================================
// PINES
// =====================================================
namespace Pins {
  static constexpr int ESC_LEFT    = 25;
  static constexpr int ESC_RIGHT   = 26;
  static constexpr int ESC_VERT    = 27;
  static constexpr int RELAY_LEFT  = 18;
  static constexpr int RELAY_RIGHT = 19;
  static constexpr int RELAY_VERT  = 23;
  static constexpr int I2C_SDA     = 21;
  static constexpr int I2C_SCL     = 22;
  static constexpr int BNO_INT     = 4;
}

static constexpr bool RELAY_ACTIVE_LOW    = true;
static constexpr bool RELAY_ON_SELECTS_RF = true;
static constexpr bool USE_VERTICAL_RELAY  = false;

// =====================================================
// PWM ESC
// =====================================================
static constexpr int PWM_MIN      = 1000;
static constexpr int PWM_NEUTRAL  = 1500;
static constexpr int PWM_MAX      = 2000;
static constexpr int PWM_SAFE_MIN = 1400;
static constexpr int PWM_SAFE_MAX = 1600;
static constexpr float US_PER_PERCENT = 1.0f;

static constexpr int PWM_FWD_SLOW  = 1560;
static constexpr int PWM_FWD_MED   = 1600;
static constexpr int PWM_REV_SLOW  = 1440;
static constexpr int PWM_UP_SLOW   = 1560;
static constexpr int PWM_DOWN_SLOW = 1440;

// =====================================================
// OBJETOS Y ESTADO GLOBAL
// =====================================================
Servo escLeft, escRight, escVert;
BNO080 imu;

volatile bool imuInterruptFlag = false;
bool     imuOnline        = false;
uint8_t  activeBnoAddress = 0x00;

float qx=0,qy=0,qz=0,qw=1;
float gyroX=0,gyroY=0,gyroZ=0;
float yawDeg=0,pitchDeg=0,rollDeg=0;
uint8_t quatAccuracy    = 0;
float   quatRadAccuracy = 0.0f;
uint32_t sampleCounter  = 0;
uint32_t lastTelemetryMs = 0;

int lastLeftUs  = PWM_NEUTRAL;
int lastRightUs = PWM_NEUTRAL;
int lastVertUs  = PWM_NEUTRAL;

unsigned long lastCommandTime = 0;
bool failsafeActive = false;

enum ControlMode : uint8_t { MODE_ESP=0, MODE_RF=1, MODE_AUTO=2 };
ControlMode currentMode = MODE_ESP;

enum AutoState : uint8_t {
  AS_IDLE=0, AS_WARMUP,
  AS_FWD_LEG1, AS_TURN1, AS_SAMPLE_STOP1,
  AS_FWD_LEG2, AS_TURN2, AS_SPIN, AS_SAMPLE_STOP2,
  AS_RETURN_LEG, AS_RETURN_TURN, AS_DONE
};

AutoState autoState      = AS_IDLE;
uint32_t  autoStateStart = 0;
uint8_t   samplesDone    = 0;

// =====================================================
// UTILIDADES
// =====================================================
static inline int   clampInt(int v,int lo,int hi){ return v<lo?lo:(v>hi?hi:v); }
static inline float clampFloat(float v,float lo,float hi){ return v<lo?lo:(v>hi?hi:v); }

static const char* modeName() {
  switch(currentMode){
    case MODE_ESP:  return "MANUAL";
    case MODE_RF:   return "RF";
    case MODE_AUTO: return "AUTO";
  } return "?";
}

static const char* autoStateName() {
  switch(autoState){
    case AS_IDLE:         return "IDLE";
    case AS_WARMUP:       return "WARMUP";
    case AS_FWD_LEG1:     return "FWD_LEG1";
    case AS_TURN1:        return "TURN1";
    case AS_SAMPLE_STOP1: return "SAMPLE_STOP1";
    case AS_FWD_LEG2:     return "FWD_LEG2";
    case AS_TURN2:        return "TURN2";
    case AS_SPIN:         return "SPIN";
    case AS_SAMPLE_STOP2: return "SAMPLE_STOP2";
    case AS_RETURN_LEG:   return "RETURN_LEG";
    case AS_RETURN_TURN:  return "RETURN_TURN";
    case AS_DONE:         return "DONE";
  } return "?";
}

static uint8_t missionProgress() {
  if(currentMode!=MODE_AUTO) return 0;
  switch(autoState){
    case AS_WARMUP:       return 5;
    case AS_FWD_LEG1:     return 15;
    case AS_TURN1:        return 20;
    case AS_SAMPLE_STOP1: {
      uint32_t e=millis()-autoStateStart;
      uint8_t  p=(uint8_t)((e*30)/SAMPLE_STOP_MS);
      return 20+(p>30?30:p);
    }
    case AS_FWD_LEG2:     return 55;
    case AS_TURN2:        return 60;
    case AS_SPIN:         return 65;
    case AS_SAMPLE_STOP2: {
      uint32_t e=millis()-autoStateStart;
      uint8_t  p=(uint8_t)((e*25)/SAMPLE_STOP_MS);
      return 65+(p>25?25:p);
    }
    case AS_RETURN_LEG:   return 93;
    case AS_RETURN_TURN:  return 97;
    case AS_DONE:         return 100;
    default:              return 0;
  }
}

static void touchCommandTime(){
  lastCommandTime=millis();
  failsafeActive =false;
}

// =====================================================
// IMU
// =====================================================
void IRAM_ATTR imuISR(){ imuInterruptFlag=true; }

static void quaternionToEuler(float x,float y,float z,float w,
                               float &yaw,float &pitch,float &roll){
  roll  = atan2f(2*(w*x+y*z), 1-2*(x*x+y*y));
  float sinp = 2*(w*y-z*x);
  pitch = (fabsf(sinp)>=1)?copysignf(PI/2,sinp):asinf(sinp);
  yaw   = atan2f(2*(w*z+x*y), 1-2*(y*y+z*z));
  roll*=180/PI; pitch*=180/PI; yaw*=180/PI;
}

static bool startIMU(){
  Wire.begin(Pins::I2C_SDA,Pins::I2C_SCL);
  Wire.setClock(I2C_SPEED_HZ);
  pinMode(Pins::BNO_INT,INPUT_PULLUP);
  delay(100);
  if     (imu.begin(0x4B,Wire,Pins::BNO_INT)){activeBnoAddress=0x4B;}
  else if(imu.begin(0x4A,Wire,Pins::BNO_INT)){activeBnoAddress=0x4A;}
  else return false;
  Wire.setClock(I2C_SPEED_HZ);
  attachInterrupt(digitalPinToInterrupt(Pins::BNO_INT),imuISR,FALLING);
#if USE_GYRO_INTEGRATED_VECTOR
  imu.enableGyroIntegratedRotationVector(IMU_REPORT_INTERVAL_MS);
#else
  imu.enableRotationVector(IMU_REPORT_INTERVAL_MS);
#endif
  imuInterruptFlag=true;
  return true;
}

static void readIMU(){
  if(!imuOnline) return;
  bool chk=imuInterruptFlag;
  if(chk) imuInterruptFlag=false;
  if(!chk&&!imu.dataAvailable()) return;
  uint8_t r=0;
  do {
#if USE_GYRO_INTEGRATED_VECTOR
    qx=imu.getQuatI(); qy=imu.getQuatJ();
    qz=imu.getQuatK(); qw=imu.getQuatReal();
    gyroX=imu.getFastGyroX(); gyroY=imu.getFastGyroY(); gyroZ=imu.getFastGyroZ();
#else
    imu.getQuat(qx,qy,qz,qw,quatRadAccuracy,quatAccuracy);
#endif
    quaternionToEuler(qx,qy,qz,qw,yawDeg,pitchDeg,rollDeg);
    sampleCounter++;
  } while(++r<8&&imu.dataAvailable());
}

// =====================================================
// RELÉS Y ESC
// =====================================================
static void relayWrite(int pin,bool on){
  digitalWrite(pin,RELAY_ACTIVE_LOW?(!on):on);
}
static void setModeHardware(ControlMode mode){
  relayWrite(Pins::RELAY_LEFT, mode==MODE_RF);
  relayWrite(Pins::RELAY_RIGHT,mode==MODE_RF);
  if(USE_VERTICAL_RELAY) relayWrite(Pins::RELAY_VERT,mode==MODE_RF);
}
static void setLeft(int us) {lastLeftUs =clampInt(us,PWM_MIN,PWM_MAX);escLeft.writeMicroseconds(lastLeftUs);}
static void setRight(int us){lastRightUs=clampInt(us,PWM_MIN,PWM_MAX);escRight.writeMicroseconds(lastRightUs);}
static void setVert(int us) {lastVertUs =clampInt(us,PWM_MIN,PWM_MAX);escVert.writeMicroseconds(lastVertUs);}
static void allNeutral(){setLeft(PWM_NEUTRAL);setRight(PWM_NEUTRAL);setVert(PWM_NEUTRAL);}
static void reinforceNeutral(uint8_t n,uint16_t ms){for(uint8_t i=0;i<n;i++){allNeutral();delay(ms);}}
static void rawApplyPWM(int L,int R,int V){
  setLeft(clampInt(L,PWM_SAFE_MIN,PWM_SAFE_MAX));
  setRight(clampInt(R,PWM_SAFE_MIN,PWM_SAFE_MAX));
  setVert(clampInt(V,PWM_SAFE_MIN,PWM_SAFE_MAX));
  touchCommandTime();
}
static bool ensureESPMode(){
  if(currentMode==MODE_RF){Serial.println("ERR,MODE_RF_ACTIVE");return false;}
  return true;
}
static void applyPWM(int L,int R,int V){
  if(!ensureESPMode()) return;
  rawApplyPWM(L,R,V);
  Serial.printf("ACK,PWM,%d,%d,%d\n",lastLeftUs,lastRightUs,lastVertUs);
}
static void applyMoveVector(float fwd,float turn,float vert){
  if(!ensureESPMode()) return;
  fwd=clampFloat(fwd,-100,100);
  turn=clampFloat(turn,-100,100);
  vert=clampFloat(vert,-100,100);
  applyPWM((int)(PWM_NEUTRAL+(fwd+turn)*US_PER_PERCENT),
           (int)(PWM_NEUTRAL+(fwd-turn)*US_PER_PERCENT),
           (int)(PWM_NEUTRAL+vert*US_PER_PERCENT));
}

// =====================================================
// TRANSICIONES DE MODO
// =====================================================
static void stopAll(const char* r="STOP"){
  allNeutral();touchCommandTime();
  Serial.printf("ACK,%s\n",r);
}
static void switchToESP(){
  Serial.println("ACK,SWITCHING_TO_ESP32");
  autoState=AS_IDLE;
  reinforceNeutral(4,150);
  setModeHardware(MODE_ESP);
  delay(900);
  reinforceNeutral(4,150);
  currentMode=MODE_ESP;
  touchCommandTime();
  Serial.println("ACK,MODE,ESP32");
}
static void switchToRF(){
  Serial.println("ACK,SWITCHING_TO_RF");
  autoState=AS_IDLE;
  reinforceNeutral(4,150);
  setModeHardware(MODE_RF);
  delay(1500);
  currentMode=MODE_RF;
  touchCommandTime();
  Serial.println("ACK,MODE,RF");
}
static void switchToAuto(){
  if(currentMode==MODE_RF){setModeHardware(MODE_ESP);delay(900);}
  reinforceNeutral(4,150);
  currentMode=MODE_AUTO;autoState=AS_WARMUP;
  autoStateStart=millis();samplesDone=0;
  touchCommandTime();
  Serial.println("ACK,MODE,AUTO");
  Serial.printf("INFO,WARMUP_%lus\n",(unsigned long)(AUTO_WARMUP_MS/1000));
}
static void cancelAuto(const char* r="CANCELLED"){
  autoState=AS_IDLE;currentMode=MODE_ESP;
  allNeutral();
  Serial.printf("INFO,AUTO_%s\n",r);
}

// =====================================================
// MISIÓN AUTO (no bloqueante)
// =====================================================
static void transitionAuto(AutoState next){
  autoState=next;autoStateStart=millis();
  Serial.printf("AUTO,%s\n",autoStateName());
}
static void runAutoMission(){
  if(currentMode!=MODE_AUTO) return;
  const uint32_t e=millis()-autoStateStart;
  switch(autoState){
    case AS_WARMUP:
      allNeutral();
      if(e>=AUTO_WARMUP_MS){Serial.println("AUTO,WARMUP_DONE");transitionAuto(AS_FWD_LEG1);}
      break;
    case AS_FWD_LEG1:
      rawApplyPWM(AUTO_FWD_US,AUTO_FWD_US,PWM_NEUTRAL);
      if(e>=DUR_FWD_LEG_MS) transitionAuto(AS_TURN1);
      break;
    case AS_TURN1:
      rawApplyPWM(AUTO_TURN_R_L,AUTO_TURN_R_R,PWM_NEUTRAL);
      if(e>=DUR_TURN_MS) transitionAuto(AS_SAMPLE_STOP1);
      break;
    case AS_SAMPLE_STOP1:
      allNeutral();
      if(e>=SAMPLE_STOP_MS){samplesDone++;transitionAuto(AS_FWD_LEG2);}
      break;
    case AS_FWD_LEG2:
      rawApplyPWM(AUTO_FWD_US,AUTO_FWD_US,PWM_NEUTRAL);
      if(e>=DUR_FWD_LEG_MS) transitionAuto(AS_TURN2);
      break;
    case AS_TURN2:
      rawApplyPWM(AUTO_TURN_R_L,AUTO_TURN_R_R,PWM_NEUTRAL);
      if(e>=DUR_TURN_MS) transitionAuto(AS_SPIN);
      break;
    case AS_SPIN:
      rawApplyPWM(AUTO_SPIN_L,AUTO_SPIN_R,PWM_NEUTRAL);
      if(e>=DUR_SPIN_MS) transitionAuto(AS_SAMPLE_STOP2);
      break;
    case AS_SAMPLE_STOP2:
      allNeutral();
      if(e>=SAMPLE_STOP_MS){samplesDone++;transitionAuto(AS_RETURN_LEG);}
      break;
    case AS_RETURN_LEG:
      rawApplyPWM(AUTO_REV_US,AUTO_REV_US,PWM_NEUTRAL);
      if(e>=DUR_RETURN_MS) transitionAuto(AS_RETURN_TURN);
      break;
    case AS_RETURN_TURN:
      rawApplyPWM(AUTO_TURN_L_L,AUTO_TURN_L_R,PWM_NEUTRAL);
      if(e>=DUR_TURN_MS) transitionAuto(AS_DONE);
      break;
    case AS_DONE:
      allNeutral();
      Serial.printf("AUTO,MISSION_COMPLETE,stops=%u\n",samplesDone);
      currentMode=MODE_ESP;autoState=AS_IDLE;
      touchCommandTime();
      Serial.println("ACK,MODE,ESP32");
      break;
    default: break;
  }
}

// =====================================================
// FAILSAFE
// =====================================================
static void runFailsafe(){
  if(currentMode==MODE_AUTO||currentMode==MODE_RF) return;
  if(millis()-lastCommandTime>FAILSAFE_MS){
    allNeutral();
    if(!failsafeActive){failsafeActive=true;Serial.println("WARN,FAILSAFE_NEUTRAL");}
  }
}

// =====================================================
// TELEMETRÍA SERIAL
// =====================================================
static void sendTelemetry(bool force=false){
  if(!imuOnline) return;
  const uint32_t now=millis();
  if(!force&&(now-lastTelemetryMs<TELEMETRY_INTERVAL_MS)) return;
  lastTelemetryMs=now;
  Serial.printf("TEL,%lu,%s,%s,%lu,%.2f,%.2f,%.2f,%d,%d,%d\n",
    (unsigned long)now,modeName(),autoStateName(),(unsigned long)sampleCounter,
    yawDeg,pitchDeg,rollDeg,lastLeftUs,lastRightUs,lastVertUs);
}

// =====================================================
// HTML / CSS / JS  embebido en PROGMEM
// =====================================================
static const char HTML_PAGE[] PROGMEM = R"HTMLEOF(
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>M.A.N.G.O. HUB</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Exo+2:wght@300;600;800&display=swap');
:root{
  --bg:#050f0d;--panel:#0a1c18;--border:#0d3328;
  --accent:#00ff9d;--accent2:#00c4ff;
  --warn:#ff6b2b;--danger:#ff2b2b;
  --text:#c8ffe8;--dim:#4a7a65;--auto:#f7c948;
}
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html,body{height:100%;background:var(--bg);color:var(--text);font-family:'Exo 2',sans-serif;overflow-x:hidden}
body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:999;
  background:repeating-linear-gradient(0deg,rgba(0,0,0,.18) 0px,rgba(0,0,0,.18) 1px,transparent 1px,transparent 3px);}
header{display:flex;align-items:center;justify-content:space-between;
  padding:14px 20px;border-bottom:1px solid var(--border);
  background:linear-gradient(90deg,#081510 0%,#0d2820 100%);}
.logo{font-family:'Share Tech Mono',monospace;font-size:1.2rem;color:var(--accent);
  letter-spacing:.15em;text-shadow:0 0 12px var(--accent);}
.logo span{color:var(--dim);font-size:.7rem;display:block;letter-spacing:.3em;}
.net-badge{font-family:'Share Tech Mono',monospace;font-size:.68rem;color:var(--accent2);
  border:1px solid var(--accent2);padding:3px 10px;border-radius:2px;opacity:.8;}
main{max-width:520px;margin:0 auto;padding:16px 12px 40px;}
.card{background:var(--panel);border:1px solid var(--border);border-radius:6px;
  padding:16px;margin-bottom:14px;position:relative;overflow:hidden;}
.card::after{content:'';position:absolute;inset:0;
  background:radial-gradient(ellipse at top left,rgba(0,255,157,.04),transparent 70%);pointer-events:none;}
.lbl{font-family:'Share Tech Mono',monospace;font-size:.65rem;color:var(--dim);
  letter-spacing:.25em;text-transform:uppercase;margin-bottom:12px;}
/* estado */
.state-row{display:flex;align-items:center;gap:12px;margin-bottom:18px;}
.dot{width:11px;height:11px;border-radius:50%;flex-shrink:0;box-shadow:0 0 8px currentColor;}
.dot.manual{background:#00ff9d;color:#00ff9d;}
.dot.auto{background:#f7c948;color:#f7c948;}
.dot.rf{background:#00c4ff;color:#00c4ff;}
.state-name{font-family:'Share Tech Mono',monospace;font-size:1.1rem;letter-spacing:.1em;}
.state-sub{font-size:.7rem;color:var(--dim);font-family:'Share Tech Mono',monospace;margin-left:auto;}
/* mode buttons */
.mode-btns{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;}
.btn{border:none;cursor:pointer;border-radius:4px;font-family:'Exo 2',sans-serif;
  font-weight:600;font-size:.82rem;padding:13px 6px;letter-spacing:.04em;
  transition:all .15s;position:relative;overflow:hidden;}
.btn::after{content:'';position:absolute;inset:0;
  background:linear-gradient(180deg,rgba(255,255,255,.07),transparent);pointer-events:none;}
.btn:active{transform:scale(.96);}
.btn-manual{background:#0d3328;color:var(--accent);border:1px solid var(--accent);}
.btn-manual:hover{background:#134030;box-shadow:0 0 16px rgba(0,255,157,.25);}
.btn-auto{background:#2a2000;color:var(--auto);border:1px solid var(--auto);}
.btn-auto:hover{background:#3a2c00;box-shadow:0 0 16px rgba(247,201,72,.25);}
.btn-stop{background:#2a0000;color:var(--danger);border:1px solid var(--danger);}
.btn-stop:hover{background:#3a0000;box-shadow:0 0 16px rgba(255,43,43,.3);}
.btn-active{filter:brightness(1.35);box-shadow:0 0 20px currentColor;}
/* progress */
.prog-wrap{margin-top:14px;display:none;}
.prog-wrap.on{display:block;}
.prog-hd{display:flex;justify-content:space-between;font-family:'Share Tech Mono',monospace;
  font-size:.68rem;color:var(--dim);margin-bottom:6px;}
.prog-track{height:5px;background:#081510;border:1px solid var(--border);border-radius:3px;overflow:hidden;}
.prog-bar{height:100%;background:linear-gradient(90deg,var(--auto),#ffb700);
  border-radius:3px;transition:width .7s ease;width:0%;}
.phase{font-family:'Share Tech Mono',monospace;font-size:.7rem;color:var(--auto);
  text-align:center;margin-top:7px;letter-spacing:.1em;}
/* dpad */
.dpad-wrap{display:flex;flex-direction:column;align-items:center;gap:6px;}
.dpad-row{display:flex;gap:6px;}
.db{width:58px;height:58px;background:#0d2820;border:1px solid var(--border);
  border-radius:4px;color:var(--accent);font-size:1.3rem;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  transition:background .1s;user-select:none;-webkit-user-select:none;}
.db:active,.db.on{background:#134030;box-shadow:0 0 12px rgba(0,255,157,.3);}
.db-blank{width:58px;height:58px;visibility:hidden;}
.db-ctr{background:#081510;border-color:#081510;color:var(--dim);cursor:default;font-size:.9rem;}
.vert-row{display:flex;gap:8px;justify-content:center;margin-top:8px;}
.bv{flex:1;max-width:110px;padding:10px;background:#0d2820;
  border:1px solid var(--border);border-radius:4px;color:var(--accent2);
  font-size:1.1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;
  transition:background .1s;user-select:none;-webkit-user-select:none;}
.bv:active{background:#1a3840;}
/* telemetry */
.tgrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;}
.ti{text-align:center;}
.tv{font-family:'Share Tech Mono',monospace;font-size:1rem;color:var(--accent);font-weight:700;}
.tl{font-family:'Share Tech Mono',monospace;font-size:.6rem;color:var(--dim);
  letter-spacing:.15em;margin-top:2px;}
.pwm-row{display:flex;gap:7px;margin-top:12px;}
.pc{flex:1;text-align:center;background:#081510;border:1px solid var(--border);
  border-radius:3px;padding:6px 4px;}
.pv{font-family:'Share Tech Mono',monospace;font-size:.82rem;color:var(--accent2);}
.pl{font-family:'Share Tech Mono',monospace;font-size:.58rem;color:var(--dim);}
.samples-row{display:flex;align-items:center;gap:10px;margin-top:12px;
  padding:10px;background:#081510;border:1px solid var(--border);border-radius:4px;}
.si{font-size:1.2rem;}
.st{font-family:'Share Tech Mono',monospace;font-size:.72rem;color:var(--text);}
.sc{font-size:1.05rem;font-weight:800;color:var(--accent);margin-left:auto;
  font-family:'Share Tech Mono',monospace;}
.imu-offline{font-family:'Share Tech Mono',monospace;font-size:.68rem;
  color:var(--warn);text-align:center;margin-top:8px;display:none;}
footer{text-align:center;font-family:'Share Tech Mono',monospace;
  font-size:.62rem;color:var(--dim);padding-bottom:16px;}
#toast{position:fixed;bottom:22px;left:50%;
  transform:translateX(-50%) translateY(70px);
  background:#0d3328;border:1px solid var(--accent);color:var(--accent);
  font-family:'Share Tech Mono',monospace;font-size:.76rem;padding:9px 20px;
  border-radius:4px;transition:transform .3s;pointer-events:none;z-index:1000;white-space:nowrap;}
#toast.show{transform:translateX(-50%) translateY(0);}
</style>
</head>
<body>
<header>
  <div class="logo">M.A.N.G.O<span>CONTROL HUB v3.0</span></div>
  <div class="net-badge">192.168.4.1</div>
</header>
<main>

<!-- MODO -->
<div class="card">
  <div class="lbl">&#9632; Estado del sistema</div>
  <div class="state-row">
    <div class="dot manual" id="modeDot"></div>
    <div class="state-name" id="modeName">MANUAL</div>
    <div class="state-sub" id="autoStateLbl"></div>
  </div>
  <div class="mode-btns">
    <button class="btn btn-manual" id="btnManual" onclick="setMode('manual')">&#9737; MANUAL</button>
    <button class="btn btn-auto"   id="btnAuto"   onclick="setMode('auto')">&#9654; AUTO</button>
    <button class="btn btn-stop"   id="btnStop"   onclick="setMode('stop')">&#9632; PARAR</button>
  </div>
  <div class="prog-wrap" id="progWrap">
    <div class="prog-hd"><span>MISION AUTO</span><span id="progPct">0%</span></div>
    <div class="prog-track"><div class="prog-bar" id="progBar"></div></div>
    <div class="phase" id="phaseName">-</div>
  </div>
</div>

<!-- JOYSTICK -->
<div class="card" id="joyCard">
  <div class="lbl">&#9632; Control de direccion</div>
  <div class="dpad-wrap">
    <div class="dpad-row">
      <div class="db-blank"></div>
      <div class="db" id="dFwd"
           ontouchstart="startMove('fwd')" ontouchend="stopMove()"
           onmousedown="startMove('fwd')"  onmouseup="stopMove()" onmouseleave="stopMove()">&#9650;</div>
      <div class="db-blank"></div>
    </div>
    <div class="dpad-row">
      <div class="db" id="dLeft"
           ontouchstart="startMove('left')" ontouchend="stopMove()"
           onmousedown="startMove('left')"  onmouseup="stopMove()" onmouseleave="stopMove()">&#9664;</div>
      <div class="db db-ctr">&#9675;</div>
      <div class="db" id="dRight"
           ontouchstart="startMove('right')" ontouchend="stopMove()"
           onmousedown="startMove('right')"  onmouseup="stopMove()" onmouseleave="stopMove()">&#9654;</div>
    </div>
    <div class="dpad-row">
      <div class="db-blank"></div>
      <div class="db" id="dBwd"
           ontouchstart="startMove('bwd')" ontouchend="stopMove()"
           onmousedown="startMove('bwd')"  onmouseup="stopMove()" onmouseleave="stopMove()">&#9660;</div>
      <div class="db-blank"></div>
    </div>
  </div>
  <div class="vert-row">
    <div class="bv" ontouchstart="startMove('up')"   ontouchend="stopMove()"
         onmousedown="startMove('up')"   onmouseup="stopMove()" onmouseleave="stopMove()">&#9650;&#9650; SUBIR</div>
    <div class="bv" ontouchstart="startMove('down')" ontouchend="stopMove()"
         onmousedown="startMove('down')" onmouseup="stopMove()" onmouseleave="stopMove()">&#9660;&#9660; BAJAR</div>
  </div>
</div>

<!-- TELEMETRIA -->
<div class="card">
  <div class="lbl">&#9632; Telemetria IMU</div>
  <div class="tgrid">
    <div class="ti"><div class="tv" id="tYaw">-</div><div class="tl">YAW deg</div></div>
    <div class="ti"><div class="tv" id="tPitch">-</div><div class="tl">PITCH deg</div></div>
    <div class="ti"><div class="tv" id="tRoll">-</div><div class="tl">ROLL deg</div></div>
  </div>
  <div class="pwm-row">
    <div class="pc"><div class="pv" id="pwmL">1500</div><div class="pl">LEFT us</div></div>
    <div class="pc"><div class="pv" id="pwmR">1500</div><div class="pl">RIGHT us</div></div>
    <div class="pc"><div class="pv" id="pwmV">1500</div><div class="pl">VERT us</div></div>
  </div>
  <div class="samples-row">
    <div class="si">&#128167;</div>
    <div class="st">Paradas de muestreo completadas</div>
    <div class="sc" id="samplesCount">0 / 2</div>
  </div>
  <div class="imu-offline" id="imuOff">IMU OFFLINE</div>
</div>

</main>
<footer>MANGO-HUB &bull; 192.168.4.1 &bull; WiFi AP</footer>
<div id="toast"></div>

<script>
var curMode='MANUAL', moveTimer=null;

function showToast(m){
  var t=document.getElementById('toast');
  t.textContent=m; t.classList.add('show');
  setTimeout(function(){t.classList.remove('show');},2200);
}

function fetchStatus(){
  fetch('/api/status',{cache:'no-store'})
    .then(function(r){return r.json();})
    .then(updateUI)
    .catch(function(){});
}

function updateUI(d){
  curMode=d.mode;
  document.getElementById('modeName').textContent=d.mode;
  document.getElementById('autoStateLbl').textContent=(d.mode==='AUTO')?d.autoState:'';

  var dot=document.getElementById('modeDot');
  dot.className='dot';
  if(d.mode==='MANUAL') dot.classList.add('manual');
  else if(d.mode==='AUTO') dot.classList.add('auto');
  else dot.classList.add('rf');

  ['Manual','Auto','Stop'].forEach(function(m){
    document.getElementById('btn'+m).classList.remove('btn-active');
  });
  if(d.mode==='MANUAL') document.getElementById('btnManual').classList.add('btn-active');
  if(d.mode==='AUTO')   document.getElementById('btnAuto').classList.add('btn-active');

  var joy=document.getElementById('joyCard');
  joy.style.opacity=(d.mode==='MANUAL')?'1':'0.4';
  joy.style.pointerEvents=(d.mode==='MANUAL')?'':'none';

  var pw=document.getElementById('progWrap');
  if(d.mode==='AUTO'){
    pw.classList.add('on');
    document.getElementById('progBar').style.width=d.progress+'%';
    document.getElementById('progPct').textContent=d.progress+'%';
    document.getElementById('phaseName').textContent=d.autoState;
  } else {
    pw.classList.remove('on');
  }

  if(d.imu){
    document.getElementById('tYaw').textContent=d.yaw.toFixed(1);
    document.getElementById('tPitch').textContent=d.pitch.toFixed(1);
    document.getElementById('tRoll').textContent=d.roll.toFixed(1);
    document.getElementById('imuOff').style.display='none';
  } else {
    ['tYaw','tPitch','tRoll'].forEach(function(id){document.getElementById(id).textContent='-';});
    document.getElementById('imuOff').style.display='block';
  }
  document.getElementById('pwmL').textContent=d.pwmL;
  document.getElementById('pwmR').textContent=d.pwmR;
  document.getElementById('pwmV').textContent=d.pwmV;
  document.getElementById('samplesCount').textContent=d.samples+' / 2';
}

function setMode(m){
  var ep='', lb='';
  if(m==='manual'){ep='/cmd/manual';lb='MODO MANUAL';}
  if(m==='auto')  {ep='/cmd/auto';  lb='MODO AUTO - 30s warmup';}
  if(m==='stop')  {ep='/cmd/stop';  lb='SISTEMA PARADO';}
  fetch(ep,{method:'POST'}).then(function(){showToast(lb);fetchStatus();}).catch(function(){showToast('Error conexion');});
}

var MOVES={
  fwd:{f:60,t:0,v:0},bwd:{f:-60,t:0,v:0},
  left:{f:0,t:-60,v:0},right:{f:0,t:60,v:0},
  up:{f:0,t:0,v:60},down:{f:0,t:0,v:-60}
};
function sendMove(dir){
  if(curMode!=='MANUAL') return;
  var m=MOVES[dir]; if(!m) return;
  fetch('/cmd/move?f='+m.f+'&t='+m.t+'&v='+m.v,{method:'POST'}).catch(function(){});
}
function startMove(dir){
  if(curMode!=='MANUAL') return;
  var ids={fwd:'dFwd',bwd:'dBwd',left:'dLeft',right:'dRight'};
  if(ids[dir]) document.getElementById(ids[dir]).classList.add('on');
  sendMove(dir);
  moveTimer=setInterval(function(){sendMove(dir);},160);
}
function stopMove(){
  clearInterval(moveTimer); moveTimer=null;
  ['dFwd','dBwd','dLeft','dRight'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.classList.remove('on');
  });
  if(curMode==='MANUAL') fetch('/cmd/stop',{method:'POST'}).catch(function(){});
}

// Prevenir scroll al tocar botones
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.db,.bv').forEach(function(el){
    el.addEventListener('touchstart',function(e){e.preventDefault();},{passive:false});
    el.addEventListener('touchend',  function(e){e.preventDefault();},{passive:false});
  });
});

fetchStatus();
setInterval(fetchStatus,800);
</script>
</body>
</html>
)HTMLEOF";

// =====================================================
// API ROUTES
// =====================================================
static void handleStatus(){
  char buf[300];
  snprintf(buf,sizeof(buf),
    "{\"mode\":\"%s\",\"autoState\":\"%s\",\"progress\":%u,"
    "\"imu\":%s,\"yaw\":%.2f,\"pitch\":%.2f,\"roll\":%.2f,"
    "\"pwmL\":%d,\"pwmR\":%d,\"pwmV\":%d,\"samples\":%u}",
    modeName(),autoStateName(),missionProgress(),
    imuOnline?"true":"false",
    yawDeg,pitchDeg,rollDeg,
    lastLeftUs,lastRightUs,lastVertUs,
    samplesDone);
  server.sendHeader("Access-Control-Allow-Origin","*");
  server.send(200,"application/json",buf);
}
static void handleCmdManual(){ switchToESP(); server.send(200,"text/plain","OK"); }
static void handleCmdAuto()  { switchToAuto(); server.send(200,"text/plain","OK"); }
static void handleCmdStop()  {
  if(currentMode==MODE_AUTO) cancelAuto("WEB_STOP");
  stopAll("WEB_STOP");
  server.send(200,"text/plain","OK");
}
static void handleCmdMove(){
  if(currentMode!=MODE_ESP){ server.send(409,"text/plain","NOT_MANUAL"); return; }
  float f=server.hasArg("f")?server.arg("f").toFloat():0;
  float t=server.hasArg("t")?server.arg("t").toFloat():0;
  float v=server.hasArg("v")?server.arg("v").toFloat():0;
  applyMoveVector(f,t,v);
  server.send(200,"text/plain","OK");
}
static void handleRoot(){
  server.sendHeader("Cache-Control","no-cache");
  server.send_P(200,"text/html",HTML_PAGE);
}
static void setupWebServer(){
  server.on("/",            HTTP_GET,  handleRoot);
  server.on("/api/status",  HTTP_GET,  handleStatus);
  server.on("/cmd/manual",  HTTP_POST, handleCmdManual);
  server.on("/cmd/auto",    HTTP_POST, handleCmdAuto);
  server.on("/cmd/stop",    HTTP_POST, handleCmdStop);
  server.on("/cmd/move",    HTTP_POST, handleCmdMove);
  server.onNotFound([](){server.send(404,"text/plain","Not found");});
  server.begin();
  Serial.println("BOOT,WEBSERVER_STARTED");
}

// =====================================================
// COMANDOS SERIAL (respaldo Jetson)
// =====================================================
static void handleSingleChar(char c){
  switch(c){
    case 'a': switchToESP();  break;
    case 'm': switchToRF();   break;
    case 'o': switchToAuto(); break;
    case 's': cancelAuto("SERIAL"); stopAll("STOP"); break;
    case 'f': applyPWM(PWM_FWD_SLOW,PWM_FWD_SLOW,PWM_NEUTRAL); break;
    case 'g': applyPWM(PWM_FWD_MED, PWM_FWD_MED, PWM_NEUTRAL); break;
    case 'b': applyPWM(PWM_REV_SLOW,PWM_REV_SLOW,PWM_NEUTRAL); break;
    case 'l': applyPWM(PWM_REV_SLOW,PWM_FWD_SLOW,PWM_NEUTRAL); break;
    case 'r': applyPWM(PWM_FWD_SLOW,PWM_REV_SLOW,PWM_NEUTRAL); break;
    case 'u': applyPWM(PWM_NEUTRAL, PWM_NEUTRAL,  PWM_UP_SLOW);   break;
    case 'd': applyPWM(PWM_NEUTRAL, PWM_NEUTRAL,  PWM_DOWN_SLOW); break;
    case 'n': stopAll("NEUTRAL"); break;
    case 't': readIMU(); sendTelemetry(true); break;
    default: Serial.println("ERR,UNKNOWN_CMD"); break;
  }
}
static void handleCommand(const char* raw){
  String cmd(raw); cmd.trim();
  if(!cmd.length()) return;
  if(cmd.length()==1){handleSingleChar((char)tolower((unsigned char)cmd[0]));return;}
  cmd.toUpperCase();
  if(cmd=="STOP"||cmd=="NEUTRAL"){cancelAuto("SERIAL");stopAll(cmd.c_str());return;}
  if(cmd=="MODE,ESP"||cmd=="MODE,ESP32"){switchToESP();return;}
  if(cmd=="MODE,RF"||cmd=="MODE,MANUAL"){switchToRF();return;}
  if(cmd=="MODE,AUTO"||cmd=="AUTO")     {switchToAuto();return;}
  float fwd=0,turn=0,vert=0;
  if(sscanf(cmd.c_str(),"MOVE,%f,%f,%f",&fwd,&turn,&vert)==3){applyMoveVector(fwd,turn,vert);return;}
  int L=PWM_NEUTRAL,R=PWM_NEUTRAL,V=PWM_NEUTRAL;
  if(sscanf(cmd.c_str(),"PWM,%d,%d,%d",&L,&R,&V)==3){applyPWM(L,R,V);return;}
  Serial.println("ERR,UNKNOWN_CMD");
}
static void readSerialCommands(){
  static char rx[96]; static uint8_t len=0;
  while(Serial.available()){
    const char c=(char)Serial.read();
    if(c=='\n'||c=='\r'){if(len>0){rx[len]='\0';handleCommand(rx);len=0;}}
    else if(len<sizeof(rx)-1) rx[len++]=c;
    else{len=0;Serial.println("ERR,RX_OVERFLOW");}
  }
}

// =====================================================
// SETUP / LOOP
// =====================================================
void setup(){
  Serial.begin(SERIAL_BAUD);
  delay(800);
  Serial.println();
  Serial.println("BOOT,MANGO_ESP32_MOTION_v3.0");

  pinMode(Pins::RELAY_LEFT, OUTPUT);
  pinMode(Pins::RELAY_RIGHT,OUTPUT);
  if(USE_VERTICAL_RELAY) pinMode(Pins::RELAY_VERT,OUTPUT);
  setModeHardware(MODE_ESP);
  currentMode=MODE_ESP;

  escLeft.setPeriodHertz(50); escRight.setPeriodHertz(50); escVert.setPeriodHertz(50);
  escLeft.attach(Pins::ESC_LEFT,  PWM_MIN,PWM_MAX);
  escRight.attach(Pins::ESC_RIGHT,PWM_MIN,PWM_MAX);
  escVert.attach(Pins::ESC_VERT,  PWM_MIN,PWM_MAX);
  reinforceNeutral(5,200);
  Serial.println("BOOT,ESC_ARMING_5s");
  delay(5000);
  reinforceNeutral(5,150);

  imuOnline=startIMU();
  Serial.printf(imuOnline?"BOOT,BNO080_OK,0x%02X\n":"WARN,BNO080_NOT_FOUND\n",activeBnoAddress);

  WiFi.mode(WIFI_AP);
  WiFi.softAP(AP_SSID,AP_PASS);
  IPAddress ip=WiFi.softAPIP();
  Serial.printf("BOOT,WIFI_AP_SSID=%s,IP=%s\n",AP_SSID,ip.toString().c_str());

  setupWebServer();
  touchCommandTime();
  Serial.printf("INFO,HUB_READY -> http://%s\n",ip.toString().c_str());
}

void loop(){
  server.handleClient();
  readSerialCommands();
  readIMU();
  runAutoMission();
  sendTelemetry(false);
  runFailsafe();
}
