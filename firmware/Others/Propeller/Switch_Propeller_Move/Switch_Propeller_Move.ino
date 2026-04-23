#include <Servo.h>

Servo esc1;
Servo esc2;
Servo esc3;

const int ESC1_PIN = 10;
const int ESC2_PIN = 9;
const int ESC3_PIN = 11;

const int RELAY1_PIN = 4;
const int RELAY2_PIN = 5;
const int RELAY3_PIN = 6;

const int PWM_NEUTRAL = 1500;
const int PWM_FORWARD = 2060;
const int PWM_REVERSE = 940;

String controlMode = "RF"; // RF por defecto

void setAllNeutral() {
  esc1.writeMicroseconds(PWM_NEUTRAL);
  esc2.writeMicroseconds(PWM_NEUTRAL);
  esc3.writeMicroseconds(PWM_NEUTRAL);
}

void setModeRF() {
  setAllNeutral();
  delay(500);

  digitalWrite(RELAY1_PIN, LOW);
  digitalWrite(RELAY2_PIN, LOW);
  digitalWrite(RELAY3_PIN, LOW);

  controlMode = "RF";
  Serial.println("Modo RF activado");
}

void setModeArduino() {
  setAllNeutral();
  delay(500);

  digitalWrite(RELAY1_PIN, HIGH);
  digitalWrite(RELAY2_PIN, HIGH);
  digitalWrite(RELAY3_PIN, HIGH);

  delay(500);
  setAllNeutral();

  controlMode = "ARD";
  Serial.println("Modo Arduino activado");
}

void printMenu() {
  Serial.println("\n=== MENU ===");
  Serial.println("rf  -> pasar control a RF");
  Serial.println("ard -> pasar control a Arduino");
  Serial.println("1f  -> propulsor 1 adelante");
  Serial.println("1r  -> propulsor 1 reversa");
  Serial.println("2f  -> propulsor 2 adelante");
  Serial.println("2r  -> propulsor 2 reversa");
  Serial.println("3f  -> propulsor 3 adelante");
  Serial.println("3r  -> propulsor 3 reversa");
  Serial.println("s   -> stop total");
  Serial.print("Modo actual: ");
  Serial.println(controlMode);
}

void setup() {
  Serial.begin(115200);

  esc1.attach(ESC1_PIN);
  esc2.attach(ESC2_PIN);
  esc3.attach(ESC3_PIN);

  pinMode(RELAY1_PIN, OUTPUT);
  pinMode(RELAY2_PIN, OUTPUT);
  pinMode(RELAY3_PIN, OUTPUT);

  setAllNeutral();
  delay(5000);

  setModeRF(); // por defecto RF
  printMenu();
}

void loop() {
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    cmd.toLowerCase();

    if (cmd == "rf") {
      setModeRF();
    }
    else if (cmd == "ard") {
      setModeArduino();
    }
    else if (cmd == "s") {
      setAllNeutral();
      Serial.println("STOP total");
    }
    else if (controlMode == "ARD") {
      if (cmd == "1f") esc1.writeMicroseconds(PWM_FORWARD);
      else if (cmd == "1r") esc1.writeMicroseconds(PWM_REVERSE);
      else if (cmd == "2f") esc2.writeMicroseconds(PWM_FORWARD);
      else if (cmd == "2r") esc2.writeMicroseconds(PWM_REVERSE);
      else if (cmd == "3f") esc3.writeMicroseconds(PWM_FORWARD);
      else if (cmd == "3r") esc3.writeMicroseconds(PWM_REVERSE);
    }
    else {
      Serial.println("Estas en modo RF. Cambia a 'ard' para controlar desde Arduino.");
    }
  }
}