#include <Servo.h>

Servo esc1;
Servo esc2;
Servo esc3;

const int ESC1_PIN = 10;
const int ESC2_PIN = 9;
const int ESC3_PIN = 11;

// Ajustables
int PWM_NEUTRAL = 1500;

// OJO: estos dos pueden estar invertidos en tu caso real
int PWM_FORWARD = 2060;
int PWM_REVERSE = 940;

// tiempos
const int ARM_TIME = 5000;
const int NEUTRAL_PAUSE = 800;
const int STEP_DELAY = 40;
const int STEP_SIZE = 10;

// guarda último valor enviado a cada ESC
int last1 = 1500;
int last2 = 1500;
int last3 = 1500;

void writeESC(Servo &esc, int &lastValue, int target) {
  if (target > lastValue) {
    for (int v = lastValue; v <= target; v += STEP_SIZE) {
      esc.writeMicroseconds(v);
      delay(STEP_DELAY);
    }
  } else {
    for (int v = lastValue; v >= target; v -= STEP_SIZE) {
      esc.writeMicroseconds(v);
      delay(STEP_DELAY);
    }
  }
  lastValue = target;
}

void allNeutral() {
  writeESC(esc1, last1, PWM_NEUTRAL);
  writeESC(esc2, last2, PWM_NEUTRAL);
  writeESC(esc3, last3, PWM_NEUTRAL);
}

void stopThruster(int n) {
  if (n == 1) writeESC(esc1, last1, PWM_NEUTRAL);
  if (n == 2) writeESC(esc2, last2, PWM_NEUTRAL);
  if (n == 3) writeESC(esc3, last3, PWM_NEUTRAL);
}

void moveThruster(int n, int target) {
  // Siempre pasar por neutro antes de cambiar de sentido
  stopThruster(n);
  delay(NEUTRAL_PAUSE);

  if (n == 1) writeESC(esc1, last1, target);
  if (n == 2) writeESC(esc2, last2, target);
  if (n == 3) writeESC(esc3, last3, target);
}

void testForward(int n) {
  Serial.print("Propulsor ");
  Serial.print(n);
  Serial.println(" -> ADELANTE");
  moveThruster(n, PWM_FORWARD);
}

void testReverse(int n) {
  Serial.print("Propulsor ");
  Serial.print(n);
  Serial.println(" -> REVERSA");
  moveThruster(n, PWM_REVERSE);
}

void printMenu() {
  Serial.println("\n=== MENU ===");
  Serial.println("1 -> propulsor 1 adelante");
  Serial.println("2 -> propulsor 2 adelante");
  Serial.println("3 -> propulsor 3 adelante");
  Serial.println("q -> propulsor 1 reversa");
  Serial.println("w -> propulsor 2 reversa");
  Serial.println("e -> propulsor 3 reversa");
  Serial.println("s -> stop total");
  Serial.println("+ -> subir PWM_FORWARD y bajar PWM_REVERSE");
  Serial.println("- -> bajar PWM_FORWARD y subir PWM_REVERSE");
  Serial.println("m -> mostrar menu");
  Serial.println("----------------------------");
  Serial.print("NEUTRAL: "); Serial.println(PWM_NEUTRAL);
  Serial.print("FORWARD: "); Serial.println(PWM_FORWARD);
  Serial.print("REVERSE: "); Serial.println(PWM_REVERSE);
  Serial.println("============================");
}

void setup() {
  Serial.begin(115200);

  esc1.attach(ESC1_PIN);
  esc2.attach(ESC2_PIN);
  esc3.attach(ESC3_PIN);

  esc1.writeMicroseconds(PWM_NEUTRAL);
  esc2.writeMicroseconds(PWM_NEUTRAL);
  esc3.writeMicroseconds(PWM_NEUTRAL);

  Serial.println("Armando ESCs en neutro...");
  delay(ARM_TIME);

  last1 = PWM_NEUTRAL;
  last2 = PWM_NEUTRAL;
  last3 = PWM_NEUTRAL;

  Serial.println("Listo.");
  printMenu();
}

void loop() {
  if (Serial.available()) {
    char cmd = Serial.read();

    switch (cmd) {
      case '1': testForward(1); break;
      case '2': testForward(2); break;
      case '3': testForward(3); break;

      case 'q': testReverse(1); break;
      case 'w': testReverse(2); break;
      case 'e': testReverse(3); break;

      case 's':
        Serial.println("STOP TOTAL");
        allNeutral();
        break;

      case '+':
        PWM_FORWARD += 10;
        PWM_REVERSE -= 10;
        Serial.println("Ajuste de potencia aumentado");
        printMenu();
        break;

      case '-':
        PWM_FORWARD -= 10;
        PWM_REVERSE += 10;
        Serial.println("Ajuste de potencia disminuido");
        printMenu();
        break;

      case 'm':
        printMenu();
        break;
    }
  }
}