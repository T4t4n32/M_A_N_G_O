#include <SPI.h>

// Pines para Arduino Uno:
// SCK  => Pin 13
// MISO => Pin 12 (SDO)
// MOSI => Pin 11 (SDI)
// CS   => Pin 10 (chipSelectPin)

// Variables para el MAX31865
double resistance;
uint8_t reg1, reg2; 
uint16_t fullreg; 
double temperature;

// Variables para la conversión R - T (Callendar-Van Dusen)
double Z1, Z2, Z3, Z4, Rt;
double RTDa = 3.9083e-3;
double RTDb = -5.775e-7;
double rpoly = 0;

const int chipSelectPin = 10;

void setup() {
  Serial.begin(115200); 
  SPI.begin();
  
  pinMode(chipSelectPin, OUTPUT);
  digitalWrite(chipSelectPin, HIGH); // Asegurar que CS inicie en alto

  Serial.println("--- M.A.N.G.O. Monitor de Temperatura PT100 ---");
}

void loop() {
  readRegister();
  convertToTemperature();
  
  // Imprimir resumen en una sola línea para facilitar lectura
  Serial.print(" | Final Temp: ");
  Serial.print(temperature);
  Serial.println(" C");
  
  delay(1000); // Pausa de 1 segundo entre lecturas
}

void convertToTemperature() {
  // Rt es el valor del registro, ahora calculamos la resistencia real
  Rt = resistance;
  Rt /= 32768;
  Rt *= 430; // 430 es la resistencia de referencia (Rref) en el módulo

  // Fórmula para temperaturas >= 0°C
  Z1 = -RTDa;
  Z2 = RTDa * RTDa - (4 * RTDb);
  Z3 = (4 * RTDb) / 100;
  Z4 = 2 * RTDb;

  temperature = Z2 + (Z3 * Rt);
  temperature = (sqrt(temperature) + Z1) / Z4;

  // Si la temperatura es menor a 0, usamos el polinomio de corrección
  if (temperature < 0) {
    Rt /= 100;
    rpoly = Rt;

    temperature = -242.02;
    temperature += 2.2228 * rpoly;
    rpoly *= Rt; 
    temperature += 2.5859e-3 * rpoly;
    rpoly *= Rt; 
    temperature -= 4.8260e-6 * rpoly;
    rpoly *= Rt; 
    temperature -= 2.8183e-8 * rpoly;
    rpoly *= Rt; 
    temperature += 1.5243e-10 * rpoly;
  }
}

void readRegister() {
  // Configuración de SPI para MAX31865 (Mode 1 o 3 suelen funcionar)
  SPI.beginTransaction(SPISettings(500000, MSBFIRST, SPI_MODE1));
  
  // 1. Escribir en el registro de configuración
  digitalWrite(chipSelectPin, LOW);
  SPI.transfer(0x80); // Dirección de escritura del registro 0
  SPI.transfer(0xB0); // 10110000: Bias ON, Modo 3 hilos
  digitalWrite(chipSelectPin, HIGH);

  delay(10); // Tiempo para que el bias se estabilice

  // 2. Leer los registros de RTD (MSB y LSB)
  digitalWrite(chipSelectPin, LOW);
  SPI.transfer(0x01); // Dirección de lectura del registro 1 (MSB RTD)
  reg1 = SPI.transfer(0xFF);
  reg2 = SPI.transfer(0xFF);
  digitalWrite(chipSelectPin, HIGH);
  SPI.endTransaction();

  // Combinar bytes
  fullreg = reg1;
  fullreg <<= 8;
  fullreg |= reg2;
  
  // El bit 0 es un bit de falla, lo eliminamos con un desplazamiento
  fullreg >>= 1; 
  resistance = (double)fullreg;

  Serial.print("Registro Raw: ");
  Serial.print(fullreg);
}