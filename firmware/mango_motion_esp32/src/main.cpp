/*
  M.A.N.G.O. - ESP32 Motion Sub-Brain
  PlatformIO + Arduino framework

  Integra:
  - BNO080/BNO085 por I2C con interrupcion INT.
  - 3 ESC/propellers: left, right, vertical.
  - Modulo RF manual mediante 2 reles para izquierda/derecha.
  - Propulsor vertical directo al ESP32, sin rele ni RF.
  - Comandos seriales desde Jetson o monitor serial.

  Filosofia:
  - Jetson decide ruta/mapeo.
  - ESP32 traduce ordenes simples a PWM seguro para ESC.
  - RF queda como modo manual de respaldo.
*/

#include <Arduino.h>
#include <Wire.h>
#include <ESP32Servo.h>
#include "SparkFun_BNO080_Arduino_Library.h"
#include <ctype.h>
#include <math.h>

// =====================================================
// CONFIGURACION GENERAL
// =====================================================
static constexpr uint32_t SERIAL_BAUD = 115200;
static constexpr uint32_t I2C_SPEED_HZ = 400000;

// BNO080/BNO085: 10 ms = 100 Hz internos. Puedes bajar a 5 ms si el bus va estable.
static constexpr uint16_t IMU_REPORT_INTERVAL_MS = 10;

// Telemetria hacia Jetson/PC. 100 ms = 10 Hz para no saturar el serial.
static constexpr uint16_t TELEMETRY_INTERVAL_MS = 100;

// Si no llegan ordenes en modo ESP32, vuelve a neutro.
static constexpr uint32_t FAILSAFE_MS = 2000;

// 1 = quaternion + gyro rapido. 0 = rotation vector normal con accuracy.
#define USE_GYRO_INTEGRATED_VECTOR 1

// =====================================================
// PINES
// =====================================================
namespace Pins {
  // ESC signal pins
  static constexpr int ESC_LEFT  = 25;
  static constexpr int ESC_RIGHT = 26;
  static constexpr int ESC_VERT  = 27;

  // Relay pins: solo izquierda/derecha cambian entre ESP32 y RF.
  static constexpr int RELAY_LEFT  = 18;
  static constexpr int RELAY_RIGHT = 19;

  // El propulsor vertical NO usa rele. Su señal va directa al ESP32 por GPIO27.
  // GPIO23 queda libre/reservado para futuro.
  static constexpr int RELAY_VERT  = 23;

  // I2C + IMU INT
  static constexpr int I2C_SDA = 21;
  static constexpr int I2C_SCL = 22;
  static constexpr int BNO_INT = 4;
}

// true si tu modulo de reles se activa con LOW.
static constexpr bool RELAY_ACTIVE_LOW = true;

// true si el rele ACTIVADO conecta ESC -> receptor RF.
// Este valor mantiene la logica actual: RF = rele ON, ESP32 = rele OFF.
static constexpr bool RELAY_ON_SELECTS_RF = true;

// El vertical va directo al ESP32. Dejar false para NO usar GPIO23/RELAY_VERT.
static constexpr bool USE_VERTICAL_RELAY = false;

// =====================================================
// PWM ESC
// =====================================================
static constexpr int PWM_MIN     = 1000;
static constexpr int PWM_NEUTRAL = 1500;
static constexpr int PWM_MAX     = 2000;

// Limite seguro inicial. En prototipo evita ir directo a 1000/2000.
static constexpr int PWM_SAFE_MIN = 1400;
static constexpr int PWM_SAFE_MAX = 1600;

// MOVE usa valores -100..100. Con 1 us/%: -100 => 1400, +100 => 1600.
static constexpr float US_PER_PERCENT = 1.0f;

// Movimientos rapidos de prueba por comandos de una letra.
static constexpr int PWM_FWD_SLOW  = 1560;
static constexpr int PWM_FWD_MED   = 1600;
static constexpr int PWM_REV_SLOW  = 1440;
static constexpr int PWM_UP_SLOW   = 1560;
static constexpr int PWM_DOWN_SLOW = 1440;

// =====================================================
// OBJETOS Y ESTADO
// =====================================================
Servo escLeft;
Servo escRight;
Servo escVert;
BNO080 imu;

volatile bool imuInterruptFlag = false;
bool imuOnline = false;
uint8_t activeBnoAddress = 0x00;

float qx = 0.0f, qy = 0.0f, qz = 0.0f, qw = 1.0f;
float gyroX = 0.0f, gyroY = 0.0f, gyroZ = 0.0f;
float yawDeg = 0.0f, pitchDeg = 0.0f, rollDeg = 0.0f;
uint8_t quatAccuracy = 0;
float quatRadAccuracy = 0.0f;
uint32_t sampleCounter = 0;
uint32_t lastTelemetryMs = 0;

int lastLeftUs  = PWM_NEUTRAL;
int lastRightUs = PWM_NEUTRAL;
int lastVertUs  = PWM_NEUTRAL;

unsigned long lastCommandTime = 0;
bool failsafeActive = false;

enum ControlMode : uint8_t {
  MODE_ESP = 0,
  MODE_RF  = 1
};

ControlMode currentMode = MODE_ESP;

// =====================================================
// UTILIDADES
// =====================================================
int clampInt(int value, int low, int high) {
  if (value < low) return low;
  if (value > high) return high;
  return value;
}

float clampFloat(float value, float low, float high) {
  if (value < low) return low;
  if (value > high) return high;
  return value;
}

const char* modeName() {
  return currentMode == MODE_ESP ? "ESP32" : "RF";
}

void touchCommandTime() {
  lastCommandTime = millis();
  failsafeActive = false;
}

// =====================================================
// BNO080/BNO085
// =====================================================
void IRAM_ATTR imuISR() {
  imuInterruptFlag = true;
}

void quaternionToEuler(float x, float y, float z, float w,
                       float &yaw, float &pitch, float &roll) {
  const float sinr_cosp = 2.0f * (w * x + y * z);
  const float cosr_cosp = 1.0f - 2.0f * (x * x + y * y);
  roll = atan2f(sinr_cosp, cosr_cosp);

  const float sinp = 2.0f * (w * y - z * x);
  if (fabsf(sinp) >= 1.0f) {
    pitch = copysignf(PI / 2.0f, sinp);
  } else {
    pitch = asinf(sinp);
  }

  const float siny_cosp = 2.0f * (w * z + x * y);
  const float cosy_cosp = 1.0f - 2.0f * (y * y + z * z);
  yaw = atan2f(siny_cosp, cosy_cosp);

  roll  *= 180.0f / PI;
  pitch *= 180.0f / PI;
  yaw   *= 180.0f / PI;
}

void configureIMUReports() {
#if USE_GYRO_INTEGRATED_VECTOR
  imu.enableGyroIntegratedRotationVector(IMU_REPORT_INTERVAL_MS);
#else
  imu.enableRotationVector(IMU_REPORT_INTERVAL_MS);
#endif
}

bool startIMU() {
  Wire.begin(Pins::I2C_SDA, Pins::I2C_SCL);
  Wire.setClock(I2C_SPEED_HZ);
  pinMode(Pins::BNO_INT, INPUT_PULLUP);
  delay(100);

  // Direcciones comunes: 0x4B y 0x4A.
  if (imu.begin(0x4B, Wire, Pins::BNO_INT)) {
    activeBnoAddress = 0x4B;
  } else if (imu.begin(0x4A, Wire, Pins::BNO_INT)) {
    activeBnoAddress = 0x4A;
  } else {
    return false;
  }

  Wire.setClock(I2C_SPEED_HZ);
  attachInterrupt(digitalPinToInterrupt(Pins::BNO_INT), imuISR, FALLING);
  configureIMUReports();
  imuInterruptFlag = true;
  return true;
}

void readIMU() {
  if (!imuOnline) return;

  bool shouldCheck = imuInterruptFlag;
  if (shouldCheck) imuInterruptFlag = false;

  // Fallback suave: si se pierde una interrupcion, dataAvailable() aun puede recuperar datos.
  if (!shouldCheck && !imu.dataAvailable()) return;

  uint8_t reads = 0;
  do {
#if USE_GYRO_INTEGRATED_VECTOR
    qx = imu.getQuatI();
    qy = imu.getQuatJ();
    qz = imu.getQuatK();
    qw = imu.getQuatReal();
    gyroX = imu.getFastGyroX();
    gyroY = imu.getFastGyroY();
    gyroZ = imu.getFastGyroZ();
#else
    imu.getQuat(qx, qy, qz, qw, quatRadAccuracy, quatAccuracy);
#endif
    quaternionToEuler(qx, qy, qz, qw, yawDeg, pitchDeg, rollDeg);
    sampleCounter++;
    reads++;
  } while (reads < 8 && imu.dataAvailable());
}

// =====================================================
// RELES Y ESC
// =====================================================
void relayWrite(int pin, bool on) {
  digitalWrite(pin, RELAY_ACTIVE_LOW ? (on ? LOW : HIGH) : (on ? HIGH : LOW));
}

void setModeHardware(ControlMode mode) {
  const bool relayOn = (mode == MODE_RF) ? RELAY_ON_SELECTS_RF : !RELAY_ON_SELECTS_RF;

  // Solo los dos propulsores horizontales conmutan ESP32/RF.
  relayWrite(Pins::RELAY_LEFT, relayOn);
  relayWrite(Pins::RELAY_RIGHT, relayOn);

  // El vertical queda directo al ESP32. No conmuta con RF.
  if (USE_VERTICAL_RELAY) {
    relayWrite(Pins::RELAY_VERT, relayOn);
  }
}

void setLeft(int us) {
  lastLeftUs = clampInt(us, PWM_MIN, PWM_MAX);
  escLeft.writeMicroseconds(lastLeftUs);
}

void setRight(int us) {
  lastRightUs = clampInt(us, PWM_MIN, PWM_MAX);
  escRight.writeMicroseconds(lastRightUs);
}

void setVert(int us) {
  lastVertUs = clampInt(us, PWM_MIN, PWM_MAX);
  escVert.writeMicroseconds(lastVertUs);
}

void allNeutral() {
  setLeft(PWM_NEUTRAL);
  setRight(PWM_NEUTRAL);
  setVert(PWM_NEUTRAL);
}

void reinforceNeutral(uint8_t times, uint16_t waitMs) {
  for (uint8_t i = 0; i < times; i++) {
    allNeutral();
    delay(waitMs);
  }
}

bool ensureESPMode() {
  if (currentMode != MODE_ESP) {
    Serial.println("ERR,MODE_RF_ACTIVE");
    return false;
  }
  return true;
}

void applyPWM(int leftUs, int rightUs, int vertUs) {
  if (!ensureESPMode()) return;

  // Clamp seguro para prototipo.
  leftUs  = clampInt(leftUs,  PWM_SAFE_MIN, PWM_SAFE_MAX);
  rightUs = clampInt(rightUs, PWM_SAFE_MIN, PWM_SAFE_MAX);
  vertUs  = clampInt(vertUs,  PWM_SAFE_MIN, PWM_SAFE_MAX);

  setLeft(leftUs);
  setRight(rightUs);
  setVert(vertUs);
  touchCommandTime();

  Serial.printf("ACK,PWM,%d,%d,%d\n", lastLeftUs, lastRightUs, lastVertUs);
}

void applyMoveVector(float forwardPct, float turnPct, float verticalPct) {
  if (!ensureESPMode()) return;

  forwardPct  = clampFloat(forwardPct,  -100.0f, 100.0f);
  turnPct     = clampFloat(turnPct,     -100.0f, 100.0f);
  verticalPct = clampFloat(verticalPct, -100.0f, 100.0f);

  // forward + : ambos propulsores horizontales adelante.
  // turn +    : giro derecha, left adelante y right reversa.
  // vertical +: subir.
  const int leftUs  = PWM_NEUTRAL + (int)((forwardPct + turnPct) * US_PER_PERCENT);
  const int rightUs = PWM_NEUTRAL + (int)((forwardPct - turnPct) * US_PER_PERCENT);
  const int vertUs  = PWM_NEUTRAL + (int)(verticalPct * US_PER_PERCENT);

  applyPWM(leftUs, rightUs, vertUs);
}

void stopAll(const char* reason = "STOP") {
  allNeutral();
  touchCommandTime();
  Serial.printf("ACK,%s\n", reason);
}

void switchToESP() {
  Serial.println("ACK,SWITCHING_TO_ESP32");
  reinforceNeutral(4, 150);
  setModeHardware(MODE_ESP);
  delay(900);
  reinforceNeutral(4, 150);
  currentMode = MODE_ESP;
  touchCommandTime();
  Serial.println("ACK,MODE,ESP32");
}

void switchToRF() {
  Serial.println("ACK,SWITCHING_TO_RF");
  reinforceNeutral(4, 150);
  setModeHardware(MODE_RF);
  delay(1500);
  currentMode = MODE_RF;
  touchCommandTime();
  Serial.println("ACK,MODE,RF");
  Serial.println("WARN,RF_READY_MOVE_JOYSTICK_IF_NEEDED");
  Serial.println("INFO,VERTICAL_REMAINS_ESP32_DIRECT_NEUTRAL_IN_RF_MODE");
}

void runFailsafe() {
  if (currentMode != MODE_ESP) return;

  if (millis() - lastCommandTime > FAILSAFE_MS) {
    allNeutral();
    if (!failsafeActive) {
      failsafeActive = true;
      Serial.println("WARN,FAILSAFE_NEUTRAL");
    }
  }
}

// =====================================================
// COMANDOS SERIAL / JETSON
// =====================================================
void printMenu() {
  Serial.println();
  Serial.println("===== M.A.N.G.O ESP32 MOTION =====");
  Serial.println("Comandos de prueba, enviar con Enter:");
  Serial.println("a  -> modo ESP32");
  Serial.println("m  -> modo RF/manual");
  Serial.println("s  -> stop/neutro");
  Serial.println("f  -> avanzar suave");
  Serial.println("g  -> avanzar medio");
  Serial.println("b  -> reversa suave");
  Serial.println("l  -> giro izquierda");
  Serial.println("r  -> giro derecha");
  Serial.println("u  -> subir solo en modo ESP32");
  Serial.println("d  -> bajar solo en modo ESP32");
  Serial.println("n  -> neutro");
  Serial.println("t  -> telemetria una vez");
  Serial.println("p  -> menu");
  Serial.println();
  Serial.println("Comandos Jetson:");
  Serial.println("MODE,ESP");
  Serial.println("MODE,RF");
  Serial.println("MOVE,forward,turn,vertical   valores -100..100");
  Serial.println("PWM,left,right,vertical       microsegundos, limitado a zona segura");
  Serial.println("Nota: vertical va directo al ESP32; RF solo conmuta izquierda/derecha");
  Serial.println("STOP");
  Serial.println("STATUS");
  Serial.println("==================================");
}

void printStatus() {
  Serial.printf("STATUS,mode=%s,imu=%s,bno=0x%02X,pwm=%d/%d/%d,vertical=ESP32_DIRECT,samples=%lu\n",
                modeName(),
                imuOnline ? "OK" : "OFFLINE",
                activeBnoAddress,
                lastLeftUs,
                lastRightUs,
                lastVertUs,
                (unsigned long)sampleCounter);
}

void sendTelemetry(bool force = false) {
  if (!imuOnline) return;

  const uint32_t now = millis();
  if (!force && (now - lastTelemetryMs < TELEMETRY_INTERVAL_MS)) return;
  lastTelemetryMs = now;

#if USE_GYRO_INTEGRATED_VECTOR
  Serial.printf("TEL,%lu,%s,%lu,%.6f,%.6f,%.6f,%.6f,%.6f,%.6f,%.6f,%.2f,%.2f,%.2f,%d,%d,%d\n",
                (unsigned long)now,
                modeName(),
                (unsigned long)sampleCounter,
                qx, qy, qz, qw,
                gyroX, gyroY, gyroZ,
                yawDeg, pitchDeg, rollDeg,
                lastLeftUs, lastRightUs, lastVertUs);
#else
  Serial.printf("TEL,%lu,%s,%lu,%.6f,%.6f,%.6f,%.6f,%u,%.6f,%.2f,%.2f,%.2f,%d,%d,%d\n",
                (unsigned long)now,
                modeName(),
                (unsigned long)sampleCounter,
                qx, qy, qz, qw,
                quatAccuracy,
                quatRadAccuracy,
                yawDeg, pitchDeg, rollDeg,
                lastLeftUs, lastRightUs, lastVertUs);
#endif
}

void handleSingleCharCommand(char cmd) {
  switch (cmd) {
    case 'a': switchToESP(); break;
    case 'm': switchToRF(); break;
    case 's': stopAll("STOP"); break;
    case 'f': applyPWM(PWM_FWD_SLOW, PWM_FWD_SLOW, PWM_NEUTRAL); break;
    case 'g': applyPWM(PWM_FWD_MED, PWM_FWD_MED, PWM_NEUTRAL); break;
    case 'b': applyPWM(PWM_REV_SLOW, PWM_REV_SLOW, PWM_NEUTRAL); break;
    case 'l': applyPWM(PWM_REV_SLOW, PWM_FWD_SLOW, PWM_NEUTRAL); break;
    case 'r': applyPWM(PWM_FWD_SLOW, PWM_REV_SLOW, PWM_NEUTRAL); break;
    case 'u': applyPWM(PWM_NEUTRAL, PWM_NEUTRAL, PWM_UP_SLOW); break;
    case 'd': applyPWM(PWM_NEUTRAL, PWM_NEUTRAL, PWM_DOWN_SLOW); break;
    case 'n': stopAll("NEUTRAL"); break;
    case 't': readIMU(); sendTelemetry(true); break;
    case 'p': printMenu(); break;
    default:  Serial.println("ERR,UNKNOWN_SINGLE_CMD"); break;
  }
}

void handleCommand(const char* raw) {
  String cmd(raw);
  cmd.trim();
  if (cmd.length() == 0) return;

  if (cmd.length() == 1) {
    handleSingleCharCommand((char)tolower(cmd[0]));
    return;
  }

  cmd.toUpperCase();

  if (cmd == "STOP" || cmd == "NEUTRAL") {
    stopAll(cmd.c_str());
    return;
  }

  if (cmd == "STATUS") {
    printStatus();
    return;
  }

  if (cmd == "MODE,ESP" || cmd == "MODE,ESP32") {
    switchToESP();
    return;
  }

  if (cmd == "MODE,RF" || cmd == "MODE,MANUAL") {
    switchToRF();
    return;
  }

  float forwardPct = 0.0f, turnPct = 0.0f, verticalPct = 0.0f;
  if (sscanf(cmd.c_str(), "MOVE,%f,%f,%f", &forwardPct, &turnPct, &verticalPct) == 3) {
    applyMoveVector(forwardPct, turnPct, verticalPct);
    return;
  }

  int leftUs = PWM_NEUTRAL, rightUs = PWM_NEUTRAL, vertUs = PWM_NEUTRAL;
  if (sscanf(cmd.c_str(), "PWM,%d,%d,%d", &leftUs, &rightUs, &vertUs) == 3) {
    applyPWM(leftUs, rightUs, vertUs);
    return;
  }

  Serial.println("ERR,UNKNOWN_CMD");
}

void readSerialCommands() {
  static char rx[96];
  static uint8_t len = 0;

  while (Serial.available() > 0) {
    const char c = (char)Serial.read();

    if (c == '\n' || c == '\r') {
      if (len > 0) {
        rx[len] = '\0';
        handleCommand(rx);
        len = 0;
      }
      continue;
    }

    if (len < sizeof(rx) - 1) {
      rx[len++] = c;
    } else {
      len = 0;
      Serial.println("ERR,RX_OVERFLOW");
    }
  }
}

// =====================================================
// SETUP / LOOP
// =====================================================
void setup() {
  Serial.begin(SERIAL_BAUD);
  delay(800);
  Serial.println();
  Serial.println("BOOT,MANGO_ESP32_MOTION_PLATFORMIO");
  Serial.println("INFO,VERTICAL_ESC_DIRECT_TO_ESP32_GPIO27_NO_RELAY");

  pinMode(Pins::RELAY_LEFT, OUTPUT);
  pinMode(Pins::RELAY_RIGHT, OUTPUT);
  if (USE_VERTICAL_RELAY) {
    pinMode(Pins::RELAY_VERT, OUTPUT);
  }

  // Arranque seguro: ruta ESP32 y ESC en neutro.
  setModeHardware(MODE_ESP);
  currentMode = MODE_ESP;

  escLeft.setPeriodHertz(50);
  escRight.setPeriodHertz(50);
  escVert.setPeriodHertz(50);

  escLeft.attach(Pins::ESC_LEFT, PWM_MIN, PWM_MAX);
  escRight.attach(Pins::ESC_RIGHT, PWM_MIN, PWM_MAX);
  escVert.attach(Pins::ESC_VERT, PWM_MIN, PWM_MAX);

  reinforceNeutral(5, 200);
  Serial.println("BOOT,ARMING_ESC_NEUTRAL_5S");
  delay(5000);
  reinforceNeutral(5, 150);

  imuOnline = startIMU();
  if (imuOnline) {
    Serial.printf("BOOT,BNO080_OK,0x%02X\n", activeBnoAddress);
  } else {
    Serial.println("ERR,BNO080_NOT_FOUND_CONTINUING_WITHOUT_IMU");
  }

  touchCommandTime();
  printMenu();
  printStatus();
}

void loop() {
  readSerialCommands();
  readIMU();
  sendTelemetry(false);
  runFailsafe();
}
