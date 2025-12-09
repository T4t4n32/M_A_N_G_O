// Pines del controlador XW 30A
const int PWM = 9;   // Control de velocidad

// Variables para el control del motor
int velocidadMotor = 0;
int velocidadMinima = 0;
const int velocidadMaxima = 200;  // Ajusta según la potencia de tu motor
const int incremento = 1;         // Velocidad de aceleración y desaceleración

void setup() {
  Serial.begin(9600);

  // Configuración del controlador XW 30A
  pinMode(PWM, OUTPUT);
}

void loop() {
  // Aumenta la velocidad hasta velocidadMaxima
  while (velocidadMotor < velocidadMaxima) {
    velocidadMotor += incremento;
    if (velocidadMotor > velocidadMaxima) velocidadMotor = velocidadMaxima;
    analogWrite(PWM, velocidadMotor);
    Serial.print(velocidadMotor);
    Serial.print(",");
    delay(15);
  }

  delay(3000);

  // Disminuye la velocidad hasta velocidadMinima
  while (velocidadMotor > velocidadMinima) {
    velocidadMotor -= incremento;
    if (velocidadMotor < velocidadMinima) velocidadMotor = velocidadMinima;
    analogWrite(PWM, velocidadMotor);
    Serial.print(velocidadMotor);
    Serial.print(",");
    delay(15);
  }

  delay(3000);

  // Reinicia el ciclo
  velocidadMotor = 0; // <- Ajuste necesario para que vuelva a acelerar
}
