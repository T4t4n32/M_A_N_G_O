#include <ESP32Servo.h>

// =========================
// PINES ESC
// =========================
const int ESC_LEFT_PIN  = 25;
const int ESC_RIGHT_PIN = 26;
const int ESC_VERT_PIN  = 27;

// =========================
// PINES RELE
// =========================
const int RELAY_LEFT_PIN  = 18;
const int RELAY_RIGHT_PIN = 19;

// true si el rele se activa en LOW
const bool RELAY_ACTIVE_LOW = true;

// =========================
// AJUSTES PWM
// =========================
const int PWM_MIN     = 1000;
const int PWM_NEUTRAL = 1500;
const int PWM_MAX     = 2000;

const int PWM_FWD_SLOW = 1560;
const int PWM_FWD_MED  = 1600;
const int PWM_REV_SLOW = 1440;
const int PWM_REV_MED  = 1400;

const int PWM_UP_SLOW   = 1560;
const int PWM_DOWN_SLOW = 1440;

const unsigned long FAILSAFE_MS = 4000;
unsigned long lastCommandTime = 0;

Servo escLeft;
Servo escRight;
Servo escVert;

enum ControlMode {
  MODE_ESP = 0,
  MODE_RF  = 1
};

ControlMode currentMode = MODE_ESP;

// =========================
// RELE
// =========================
void relayWrite(int pin, bool on) {
  digitalWrite(pin, RELAY_ACTIVE_LOW ? !on : on);
}

void setModeHardware(ControlMode mode) {
  if (mode == MODE_ESP) {
    relayWrite(RELAY_LEFT_PIN, false);
    relayWrite(RELAY_RIGHT_PIN, false);
  } else {
    relayWrite(RELAY_LEFT_PIN, true);
    relayWrite(RELAY_RIGHT_PIN, true);
  }
}

// =========================
// ESC
// =========================
void setLeft(int us)  { escLeft.writeMicroseconds(us); }
void setRight(int us) { escRight.writeMicroseconds(us); }
void setVert(int us)  { escVert.writeMicroseconds(us); }

void allNeutral() {
  setLeft(PWM_NEUTRAL);
  setRight(PWM_NEUTRAL);
  setVert(PWM_NEUTRAL);
}

void stopAll() {
  allNeutral();
  Serial.println("STOP");
}

void reinforceNeutral(int times, int waitMs) {
  for (int i = 0; i < times; i++) {
    allNeutral();
    delay(waitMs);
  }
}

bool ensureESPMode() {
  if (currentMode != MODE_ESP) {
    Serial.println("Estas en modo RF. Cambia a modo ESP32 con 'a'.");
    return false;
  }
  return true;
}

// =========================
// CAMBIO ROBUSTO DE MODOS
// =========================
void switchToESP() {
  Serial.println("\n[CAMBIO] Preparando cambio a modo ESP32...");

  // Paso 1: neutro fuerte
  reinforceNeutral(4, 200);

  // Paso 2: cambiar rele
  Serial.println("[CAMBIO] Conmutando rele a ESP32...");
  setModeHardware(MODE_ESP);

  // Paso 3: esperar estabilizacion
  delay(1200);

  // Paso 4: volver a reforzar neutro ya en el nuevo modo
  reinforceNeutral(4, 200);

  currentMode = MODE_ESP;
  lastCommandTime = millis();

  Serial.println("[OK] Modo ESP32 activado.");
}

void switchToRF() {
  Serial.println("\n[CAMBIO] Preparando cambio a modo RF...");

  // Paso 1: neutro fuerte desde ESP32 antes de soltar control
  reinforceNeutral(4, 200);

  // Paso 2: cambiar rele
  Serial.println("[CAMBIO] Conmutando rele a RF...");
  setModeHardware(MODE_RF);

  // Paso 3: esperar a que la señal RF quede estable
  delay(1500);

  // Paso 4: dar tiempo extra por si el receptor tarda
  delay(1000);

  currentMode = MODE_RF;
  lastCommandTime = millis();

  Serial.println("[OK] Modo RF activado.");
  Serial.println("[INFO] Mueve ligeramente el joystick del control si no responde de inmediato.");
}

// =========================
// MOVIMIENTOS
// =========================
void moveForwardSlow() {
  if (!ensureESPMode()) return;
  setLeft(PWM_FWD_SLOW);
  setRight(PWM_FWD_SLOW);
  setVert(PWM_NEUTRAL);
  Serial.println("FORWARD SLOW");
}

void moveForwardMed() {
  if (!ensureESPMode()) return;
  setLeft(PWM_FWD_MED);
  setRight(PWM_FWD_MED);
  setVert(PWM_NEUTRAL);
  Serial.println("FORWARD MED");
}

void moveReverseSlow() {
  if (!ensureESPMode()) return;
  setLeft(PWM_REV_SLOW);
  setRight(PWM_REV_SLOW);
  setVert(PWM_NEUTRAL);
  Serial.println("REVERSE SLOW");
}

void turnLeft() {
  if (!ensureESPMode()) return;
  setLeft(PWM_REV_SLOW);
  setRight(PWM_FWD_SLOW);
  setVert(PWM_NEUTRAL);
  Serial.println("LEFT");
}

void turnRight() {
  if (!ensureESPMode()) return;
  setLeft(PWM_FWD_SLOW);
  setRight(PWM_REV_SLOW);
  setVert(PWM_NEUTRAL);
  Serial.println("RIGHT");
}

void riseUp() {
  if (!ensureESPMode()) return;
  setLeft(PWM_NEUTRAL);
  setRight(PWM_NEUTRAL);
  setVert(PWM_UP_SLOW);
  Serial.println("UP");
}

void goDown() {
  if (!ensureESPMode()) return;
  setLeft(PWM_NEUTRAL);
  setRight(PWM_NEUTRAL);
  setVert(PWM_DOWN_SLOW);
  Serial.println("DOWN");
}

// =========================
// MENU
// =========================
void printMenu() {
  Serial.println("\n===== MENU M.A.N.G.O =====");
  Serial.println("a -> modo ESP32");
  Serial.println("m -> modo RF");
  Serial.println("s -> stop");
  Serial.println("f -> avanzar suave");
  Serial.println("g -> avanzar medio");
  Serial.println("b -> reversa suave");
  Serial.println("l -> giro izquierda");
  Serial.println("r -> giro derecha");
  Serial.println("u -> subir");
  Serial.println("d -> bajar");
  Serial.println("n -> neutro");
  Serial.println("p -> mostrar menu");
  Serial.println("==========================");
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(RELAY_LEFT_PIN, OUTPUT);
  pinMode(RELAY_RIGHT_PIN, OUTPUT);

  escLeft.setPeriodHertz(50);
  escRight.setPeriodHertz(50);
  escVert.setPeriodHertz(50);

  escLeft.attach(ESC_LEFT_PIN, PWM_MIN, PWM_MAX);
  escRight.attach(ESC_RIGHT_PIN, PWM_MIN, PWM_MAX);
  escVert.attach(ESC_VERT_PIN, PWM_MIN, PWM_MAX);

  // Neutro inicial
  reinforceNeutral(5, 200);

  // Arranque por defecto en ESP
  setModeHardware(MODE_ESP);
  currentMode = MODE_ESP;

  Serial.println("Armando ESC...");
  delay(5000);

  reinforceNeutral(5, 200);
  lastCommandTime = millis();

  Serial.println("Sistema listo.");
  Serial.println("Inicio por defecto: modo ESP32");
  printMenu();
}

void loop() {
  if (Serial.available()) {
    char cmd = Serial.read();
    lastCommandTime = millis();

    switch (cmd) {
      case 'a':
        switchToESP();
        break;

      case 'm':
        switchToRF();
        break;

      case 's':
        stopAll();
        break;

      case 'f':
        moveForwardSlow();
        break;

      case 'g':
        moveForwardMed();
        break;

      case 'b':
        moveReverseSlow();
        break;

      case 'l':
        turnLeft();
        break;

      case 'r':
        turnRight();
        break;

      case 'u':
        riseUp();
        break;

      case 'd':
        goDown();
        break;

      case 'n':
        allNeutral();
        Serial.println("NEUTRO");
        break;

      case 'p':
        printMenu();
        break;

      default:
        break;
    }
  }

  if (currentMode == MODE_ESP) {
    if (millis() - lastCommandTime > FAILSAFE_MS) {
      allNeutral();
    }
  }
}