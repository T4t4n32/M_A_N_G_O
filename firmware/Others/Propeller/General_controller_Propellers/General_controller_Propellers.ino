#include <Servo.h>

Servo esc1;
Servo esc2;
Servo esc3;

// Pines de señal
const int ESC1_PIN = 10;
const int ESC2_PIN = 9;
const int ESC3_PIN = 11;

// Valores típicos para ESC bidireccional
const int PWM_NEUTRAL = 1500;
const int PWM_FORWARD = 2200;
const int PWM_REVERSE = 1000;

// Duración del pulso de prueba
const int TEST_TIME = 1500;

void setAllNeutral() {
  esc1.writeMicroseconds(PWM_NEUTRAL);
  esc2.writeMicroseconds(PWM_NEUTRAL);
  esc3.writeMicroseconds(PWM_NEUTRAL);
}

void runThrusterPulse(int thruster, int pwmValue, int durationMs) {
  setAllNeutral();

  if (thruster == 1) {
    esc1.writeMicroseconds(pwmValue);
  } else if (thruster == 2) {
    esc2.writeMicroseconds(pwmValue);
  } else if (thruster == 3) {
    esc3.writeMicroseconds(pwmValue);
  } else {
    Serial.println("Propulsor invalido");
    return;
  }

  delay(durationMs);
  setAllNeutral();
}

void printMenu() {
  Serial.println();
  Serial.println("=== MENU DE PRUEBA ===");
  Serial.println("1 -> Propulsor 1 adelante");
  Serial.println("2 -> Propulsor 2 adelante");
  Serial.println("3 -> Propulsor 3 adelante");
  Serial.println("q -> Propulsor 1 reversa");
  Serial.println("w -> Propulsor 2 reversa");
  Serial.println("e -> Propulsor 3 reversa");
  Serial.println("s -> STOP / neutro");
  Serial.println("m -> Mostrar menu");
  Serial.println("======================");
}

void setup() {
  Serial.begin(115200);

  esc1.attach(ESC1_PIN);
  esc2.attach(ESC2_PIN);
  esc3.attach(ESC3_PIN);

  Serial.println("Inicializando ESCs en neutro...");
  setAllNeutral();

  Serial.println("Esperando armado del ESC...");
  delay(5000);

  Serial.println("Sistema listo.");
  printMenu();
}

void loop() {
  if (Serial.available()) {
    char cmd = Serial.read();

    switch (cmd) {
      case '1':
        Serial.println("Propulsor 1 adelante");
        runThrusterPulse(1, PWM_FORWARD, TEST_TIME);
        break;

      case '2':
        Serial.println("Propulsor 2 adelante");
        runThrusterPulse(2, PWM_FORWARD, TEST_TIME);
        break;

      case '3':
        Serial.println("Propulsor 3 adelante");
        runThrusterPulse(3, PWM_FORWARD, TEST_TIME);
        break;

      case 'q':
        Serial.println("Propulsor 1 reversa");
        runThrusterPulse(1, PWM_REVERSE, TEST_TIME);
        break;

      case 'w':
        Serial.println("Propulsor 2 reversa");
        runThrusterPulse(2, PWM_REVERSE, TEST_TIME);
        break;

      case 'e':
        Serial.println("Propulsor 3 reversa");
        runThrusterPulse(3, PWM_REVERSE, TEST_TIME);
        break;

      case 's':
        Serial.println("STOP / neutro");
        setAllNeutral();
        break;

      case 'm':
        printMenu();
        break;

      default:
        break;
    }
  }
}