// Bibliotecas necesarias 
#include <OneWire.h>
#include <DallasTemperature.h>

// Declaración de pines 
#define PIN_SENSOR 7
#define SensorPin A1
#define Turbidy_sensor A0

OneWire oneWire(PIN_SENSOR);
DallasTemperature sensors(&oneWire);

// Pines del controlador XW 30A
const int PWM = 9;   // Control de velocidad
const int PWM2 = 10; // Control de velocidad

// Variables para el control del motor
int velocidadMotor = 0;
int velocidadMinima = 0;
const int velocidadMaxima = 200;
const int incremento = 5;

int velocidadMotor2 = 0;
int velocidadMinima2 = 0;
const int velocidadMaxima2 = 200;
const int incremento2 = 5;

// Declaración de variables 
unsigned long int avgValue;
float b;
int buf[10], temp;
float Tension = 0.0;
float NTU = 0.0;

void setup() {
  pinMode(PWM, OUTPUT);
  pinMode(PWM2, OUTPUT);

  Serial.begin(9600);
  sensors.begin();
}

void loop() {
  while (velocidadMotor < velocidadMaxima && velocidadMotor2 < velocidadMaxima2) {
    if (velocidadMotor < velocidadMaxima) {
      velocidadMotor += incremento;
      if (velocidadMotor > velocidadMaxima) velocidadMotor = velocidadMaxima;
    }

    if (velocidadMotor2 < velocidadMaxima2) {
      velocidadMotor2 += incremento2;
      if (velocidadMotor2 > velocidadMaxima2) velocidadMotor2 = velocidadMaxima2;
    }

    analogWrite(PWM, velocidadMotor);
    analogWrite(PWM2, velocidadMotor2);
    delay(50);
  }

  delay(3000);

  while (velocidadMotor > velocidadMinima && velocidadMotor2 > velocidadMinima2) {
    if (velocidadMotor > velocidadMinima) {
      velocidadMotor -= incremento;
      if (velocidadMotor < velocidadMinima) velocidadMotor = velocidadMinima;
    }

    if (velocidadMotor2 > velocidadMinima2) {
      velocidadMotor2 -= incremento2;
      if (velocidadMotor2 < velocidadMinima2) velocidadMotor2 = velocidadMinima2;
    }

    analogWrite(PWM, velocidadMotor);
    analogWrite(PWM2, velocidadMotor2);
    delay(50);
  }
  
  delay(1000);
  
  while (velocidadMotor < velocidadMaxima) {
    if (velocidadMotor < velocidadMaxima) {
      velocidadMotor += incremento;
      if (velocidadMotor > velocidadMaxima) velocidadMotor = velocidadMaxima;
    }

     if (velocidadMotor2 > velocidadMinima2) {
      velocidadMotor2 -= incremento2;
      if (velocidadMotor2 < velocidadMinima2) velocidadMotor2 = velocidadMinima2;
    }

    analogWrite(PWM, velocidadMotor);
    analogWrite(PWM2, velocidadMotor2);
    delay(50);
  }

  delay(3000);

  while (velocidadMotor > velocidadMinima ) {
    if (velocidadMotor > velocidadMinima) {
      velocidadMotor -= incremento;
      if (velocidadMotor < velocidadMinima) velocidadMotor = velocidadMinima;
    }

    if (velocidadMotor2 > velocidadMinima2) {
      velocidadMotor2 -= incremento2;
      if (velocidadMotor2 < velocidadMinima2) velocidadMotor2 = velocidadMinima2;
    }

    analogWrite(PWM, velocidadMotor);
    analogWrite(PWM2, velocidadMotor2);
    delay(50);
  }

  delay(1000);

while (velocidadMotor2 < velocidadMaxima2) {
    if (velocidadMotor2 < velocidadMaxima2) {
      velocidadMotor2 += incremento2;
      if (velocidadMotor2 > velocidadMaxima2) velocidadMotor2 = velocidadMaxima2;
    }

     if (velocidadMotor > velocidadMinima) {
      velocidadMotor -= incremento;
      if (velocidadMotor < velocidadMinima) velocidadMotor = velocidadMinima;
    }
    analogWrite(PWM, velocidadMotor);
    analogWrite(PWM2, velocidadMotor2);
    delay(50);
  }
  delay(3000);


 while (velocidadMotor2 > velocidadMinima2 ) {
    if (velocidadMotor2 > velocidadMinima2) {
      velocidadMotor2 -= incremento2;
      if (velocidadMotor2 < velocidadMinima2) velocidadMotor2 = velocidadMinima2;
    }

    if (velocidadMotor2 > velocidadMinima2) {
      velocidadMotor2 -= incremento2;
      if (velocidadMotor2 < velocidadMinima2) velocidadMotor2 = velocidadMinima2;
    }
    analogWrite(PWM, velocidadMotor);
    analogWrite(PWM2, velocidadMotor2);
    delay(50);
  }

  PH();
  Serial.print(",");
  delay(500);
  Turbidez();
  Serial.print(",");
  delay(500);
  Temperatura();
  Serial.print(",");
}

void Turbidez() {
  Tension = 0;
  for (int i = 0; i < 500; i++) {
    Tension += ((float)analogRead(Turbidy_sensor) / 1024) * 5;
  }
  Tension = Tension / 500;
  Tension = redondeo(Tension, 1);

  if (Tension < 2.5) {
    NTU = 3000;
  } else {
    NTU = -1120.4 * square(Tension) + 5742.3 * Tension - 4352.9;
  }

  Serial.print(NTU);
}

float redondeo(float p_entera, int p_decimal) {
  float multiplicador = powf(10.0f, p_decimal);
  p_entera = roundf(p_entera * multiplicador) / multiplicador;
  return p_entera;
}

void PH() {
  for (int i = 0; i < 10; i++) {
    buf[i] = analogRead(SensorPin);
    delay(8);
  }

  for (int i = 0; i < 9; i++) {
    for (int j = i + 1; j < 10; j++) {
      if (buf[i] > buf[j]) {
        temp = buf[i];
        buf[i] = buf[j];
        buf[j] = temp;
      }
    }
  }

  avgValue = 0;
  for (int i = 2; i < 8; i++) avgValue += buf[i];
  float phValue = (float)avgValue * 5.0 / 1024 / 6;
  phValue = 3.5 * phValue;

  Serial.print(phValue, 2);
  delay(200);
}

void Temperatura() {
  sensors.requestTemperatures();
  float temperaturaC = sensors.getTempCByIndex(0);
  Serial.println(temperaturaC);
}
