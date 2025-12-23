// Definición del pin analógico al que está conectado el sensor de turbidez
const int sensorPin = A0; 

void setup() {
  // Inicializa la comunicación serial a 9600 baudios para ver los resultados
  Serial.begin(9600); 
  Serial.println("Iniciando lectura del sensor de turbidez...");
}

void loop() {
  // 1. Lee el valor del pin analógico (valor entre 0 y 1023)
  int sensorValue = analogRead(sensorPin);

  // 2. Convierte la lectura analógica a voltaje (0 - 5V)
  // La fórmula es: (valor leído * Voltaje de Referencia) / Rango de Conversión
  // (sensorValue * 5.0) / 1024.0
  float voltage = sensorValue * (5.0 / 1024.0);

  // 3. Imprime el valor de lectura crudo y el voltaje
  Serial.print("Lectura cruda (0-1023): ");
  Serial.print(sensorValue);

  Serial.print(" | Voltaje (V): ");
  Serial.println(voltage, 2); // '2' es para mostrar 2 decimales

  // 4. Agrega una pequeña pausa antes de la siguiente lectura
  delay(500); // Lee cada medio segundo
}