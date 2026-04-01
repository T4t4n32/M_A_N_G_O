# SENSOR_TURBID
``` cpp
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
```

# TEMPE
``` cpp
#include <SPI.h>
#include <Adafruit_MAX31865.h>
#define CS_PIN 10
#define RNOMINAL 100.0 // PT100
#define RREF 430.0 // referencia típica PT100
Adafruit_MAX31865 thermo = Adafruit_MAX31865(CS_PIN);

void setup() {
	Serial.begin(115200);
	thermo.begin(MAX31865_3WIRE); // 👈 CLAVE
}

void loop() {
	uint16_t rtd = thermo.readRTD();
	float ratio = rtd;
	ratio /= 32768;
	float resistance = RREF * ratio;
	float temperature = thermo.temperature(RNOMINAL, RREF);
	Serial.print("RTD raw: "); Serial.print(rtd);
	Serial.print(" | Resistance: "); Serial.print(resistance, 2);
	Serial.print(" ohm | Temp: "); Serial.print(temperature, 2);
	Serial.println(" °C");
	uint8_t fault = thermo.readFault();
	if (fault) {
		Serial.print("FAULT: 0x");
		Serial.println(fault, HEX);
		 if (fault & MAX31865_FAULT_HIGHTHRESH) Serial.println("RTD High Threshold");
		if (fault & MAX31865_FAULT_LOWTHRESH) Serial.println("RTD Low Threshold");
		if (fault & MAX31865_FAULT_REFINLOW) Serial.println("REFIN- < 0.85 x Bias");
		if (fault & MAX31865_FAULT_REFINHIGH) Serial.println("REFIN- > 0.85 x Bias");
		if (fault & MAX31865_FAULT_RTDINLOW) Serial.println("RTDIN- < 0.85 x Bias");
		if (fault & MAX31865_FAULT_OVUV) Serial.println("Over/Under voltage");
		thermo.clearFault();
	}

delay(1000);
}
```

# TEMPERATURA

``` cpp
#include <SPI.h>
// CS => Arduino 10
// MISO => Arduino 12
// MOSI => Arduino 11
// SCK => Arduino 13
// Variables for the PT100
double resistance;
uint8_t reg1, reg2;
uint16_t fullreg;
double temperature;
// Variables for R-T conversion (AN-709)
double Z1, Z2, Z3, Z4, Rt;
double RTDa = 3.9083e-3;
double RTDb = -5.775e-7;
double rpoly = 0;
const int chipSelectPin = 10;

void setup() {
	Serial.begin(115200);
	SPI.begin();
	pinMode(chipSelectPin, OUTPUT);
	digitalWrite(chipSelectPin, HIGH);
	Serial.println("MAX31865 PT100 (3-wire) - Serial output only");
}

void loop() {
	readRegister();
	convertToTemperature();
	delay(1000);
}

void convertToTemperature() {
	Rt = resistance;
	Rt /= 32768;
	Rt *= 430; // RREF = 430 ohm
	Z1 = -RTDa;
	Z2 = RTDa * RTDa - (4 * RTDb);
	Z3 = (4 * RTDb) / 100;
	Z4 = 2 * RTDb;
	temperature = Z2 + (Z3 * Rt);
	temperature = (sqrt(temperature) + Z1) / Z4;
	if (temperature >= 0) {
		Serial.print("RTD Resistance: ");
		Serial.print(Rt, 2);
		Serial.print(" ohm | Temperature: ");
		Serial.print(temperature, 2);
		Serial.println(" °C");
		} else {
			Rt /= 100;
			Rt *= 100;
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
			Serial.print("RTD Resistance: ");
			Serial.print(Rt, 2);
			Serial.print(" ohm | Temperature: ");
			Serial.print(temperature, 2);
			Serial.println(" °C");
		}
	}
}	
void readRegister() {
	SPI.beginTransaction(SPISettings(500000, MSBFIRST, SPI_MODE1));
	// Configure MAX31865
	digitalWrite(chipSelectPin, LOW);
	SPI.transfer(0x80); // Config register
	SPI.transfer(0xB0); // Bias ON, 1-shot, start conversion, 3-wire
	digitalWrite(chipSelectPin, HIGH);
	delay(10);
	// Read RTD MSB/LSB
	digitalWrite(chipSelectPin, LOW);
	SPI.transfer(0x01);
	reg1 = SPI.transfer(0xFF);
	reg2 = SPI.transfer(0xFF);
	digitalWrite(chipSelectPin, HIGH);
	fullreg = reg1;
	fullreg <<= 8;
	fullreg |= reg2;
	fullreg >>= 1;
	resistance = fullreg;
	// Disable bias
	digitalWrite(chipSelectPin, LOW);
	SPI.transfer(0x80);
	SPI.transfer(0x90);
	digitalWrite(chipSelectPin, HIGH);
	SPI.endTransaction();
}
```
# TUR_SENSOR
``` cpp
#include <Adafruit_MAX31865.h>
/* =============================
PIN CONFIGURATION (TU CASO)
============================= */
#define MAX31865_CS 10
#define MAX31865_MOSI 11
#define MAX31865_MISO 12
#define MAX31865_CLK 13
/* =============================
PT1000 CONFIG
============================= */
// Para PT1000 → referencia = 4300 ohms
#define RREF 4300.0
#define RNOMINAL 1000.0
/* =============================
CALIBRATION
============================= */
// ⬇️ AQUÍ es donde TÚ ajustas luego
float TEMP_OFFSET = 0.0; // coloca aquí el valor de calibración
/* =============================
OBJECT
============================= */
Adafruit_MAX31865 max31865 = Adafruit_MAX31865(MAX31865_CS, MAX31865_MOSI, MAX31865_MISO, MAX31865_CLK);

void setup() {
	Serial.begin(115200);
	delay(1000);
	Serial.println("M.A.N.G.O. | PT1000 Temperature Sensor");
	Serial.println("------------------------------------");
// 4-WIRE CONFIGURATION (MUY IMPORTANTE)
	max31865.begin(MAX31865_4WIRE);

void loop() {
	uint16_t rtd = max31865.readRTD();
	float ratio = rtd;
	ratio /= 32768;
	float resistance = RREF * ratio;
	float temperature = max31865.temperature(RNOMINAL, RREF);
	// Aplicar calibración
	float calibratedTemp = temperature + TEMP_OFFSET;
	Serial.print("RTD raw: ");
	Serial.print(rtd);
	Serial.print(" | Resistance: ");
	Serial.print(resistance, 2);
	Serial.print(" ohm");
	Serial.print(" | Temp: ");
	Serial.print(calibratedTemp, 2);
	Serial.println(" °C");
	// Detectar errores
	uint8_t fault = max31865.readFault();
	if (fault) {
		Serial.print("FAULT: 0x");
		Serial.println(fault, HEX);
	} if (fault & MAX31865_FAULT_HIGHTHRESH){
		Serial.println("RTD High Threshold");
	} if (fault & MAX31865_FAULT_LOWTHRESH) {
		Serial.println("RTD Low Threshold");
	} if (fault & MAX31865_FAULT_REFINLOW) {
		Serial.println("REFIN Low");
	} if (fault & MAX31865_FAULT_REFINHIGH) {
		Serial.println("REFIN High");
	} if (fault & MAX31865_FAULT_RTDINLOW) {
		Serial.println("RTDIN Low");
	} if (fault & MAX31865_FAULT_OVUV) {
		Serial.println("Over/Under Voltage");
		max31865.clearFault();
	}
}
delay(1000);
}
```