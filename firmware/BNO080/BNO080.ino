/*
  ESP32 + BNO080 / BNO085 - Lectura optimizada
  Autor: Sebastián / M.A.N.G.O.

  Librería:
  - SparkFun BNO080 Arduino Library

  Objetivo:
  - Leer orientación rápida usando quaternion.
  - Evitar cálculos pesados innecesarios.
  - Usar interrupción INT para reducir polling.
  - Preparado para visualización 3D, telemetría o fusión futura.
*/

#include <Wire.h>
#include "SparkFun_BNO080_Arduino_Library.h"

// ==========================
// CONFIGURACIÓN DE PINES
// ==========================
#define I2C_SDA_PIN 21
#define I2C_SCL_PIN 22
#define BNO080_INT_PIN 4

// Dirección común en SparkFun/Qwiic: 0x4B
// Algunos módulos usan 0x4A.
#define BNO080_ADDR 0x4B

// ==========================
// CONFIGURACIÓN DE RENDIMIENTO
// ==========================
#define SERIAL_BAUD 921600
#define I2C_SPEED_HZ 400000

// 5 ms = 200 Hz teóricos.
// Si ves datos inestables, sube a 10 ms o 20 ms.
#define IMU_REPORT_INTERVAL_MS 5

// Controla cada cuánto imprimir por Serial.
// 10 ms = 100 Hz de salida serial.
#define SERIAL_OUTPUT_INTERVAL_MS 10

// Si quieres orientación absoluta con magnetómetro, cambia esto a 0
// y usa enableRotationVector(). Para máxima velocidad y suavidad,
// el gyro integrated vector es mejor.
#define USE_GYRO_INTEGRATED_VECTOR 1

// Si quieres mandar yaw/pitch/roll además de quaternion.
#define SEND_EULER 1

// ==========================
// OBJETOS Y VARIABLES
// ==========================
BNO080 imu;

volatile bool imuInterruptFlag = false;

float qx = 0.0f;
float qy = 0.0f;
float qz = 0.0f;
float qw = 1.0f;

float gyroX = 0.0f;
float gyroY = 0.0f;
float gyroZ = 0.0f;

float yawDeg = 0.0f;
float pitchDeg = 0.0f;
float rollDeg = 0.0f;

uint8_t quatAccuracy = 0;
float quatRadAccuracy = 0.0f;

uint32_t lastSerialOutput = 0;
uint32_t sampleCounter = 0;

// ==========================
// INTERRUPCIÓN
// ==========================
void IRAM_ATTR imuISR() {
  imuInterruptFlag = true;
}

// ==========================
// UTILIDAD: QUATERNION A EULER
// ==========================
// Entrada: qx, qy, qz, qw
// Salida: yaw, pitch, roll en grados
void quaternionToEuler(
  float x, float y, float z, float w,
  float &yaw, float &pitch, float &roll
) {
  // Roll X
  float sinr_cosp = 2.0f * (w * x + y * z);
  float cosr_cosp = 1.0f - 2.0f * (x * x + y * y);
  roll = atan2f(sinr_cosp, cosr_cosp);

  // Pitch Y
  float sinp = 2.0f * (w * y - z * x);
  if (fabsf(sinp) >= 1.0f) {
    pitch = copysignf(PI / 2.0f, sinp);
  } else {
    pitch = asinf(sinp);
  }

  // Yaw Z
  float siny_cosp = 2.0f * (w * z + x * y);
  float cosy_cosp = 1.0f - 2.0f * (y * y + z * z);
  yaw = atan2f(siny_cosp, cosy_cosp);

  // Radianes a grados
  roll  *= 180.0f / PI;
  pitch *= 180.0f / PI;
  yaw   *= 180.0f / PI;
}

// ==========================
// CONFIGURAR REPORTES DEL BNO080
// ==========================
void configureReports() {
#if USE_GYRO_INTEGRATED_VECTOR
  imu.enableGyroIntegratedRotationVector(IMU_REPORT_INTERVAL_MS);
#else
  imu.enableRotationVector(IMU_REPORT_INTERVAL_MS);
#endif

  // No actives todo al mismo tiempo si quieres máxima velocidad.
  // Activa solo lo que necesites.
  //
  // imu.enableLinearAccelerometer(10); // Aceleración sin gravedad
  // imu.enableGyro(10);                // Giroscopio calibrado
  // imu.enableGravity(20);             // Vector gravedad
  // imu.enableAccelerometer(20);       // Acelerómetro con gravedad
}

// ==========================
// INICIAR SENSOR
// ==========================
bool startBNO080() {
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  Wire.setClock(I2C_SPEED_HZ);

  delay(100);

  // Con pin INT para mejor rendimiento.
  if (!imu.begin(BNO080_ADDR, Wire, BNO080_INT_PIN)) {
    return false;
  }

  Wire.setClock(I2C_SPEED_HZ);

  pinMode(BNO080_INT_PIN, INPUT_PULLUP);
  attachInterrupt(
    digitalPinToInterrupt(BNO080_INT_PIN),
    imuISR,
    FALLING
  );

  configureReports();
  return true;
}

// ==========================
// LEER DATOS DEL SENSOR
// ==========================
void readIMU() {
  bool gotData = false;

  // Si hubo interrupción, intentamos vaciar los datos disponibles.
  if (imuInterruptFlag) {
    imuInterruptFlag = false;

    while (imu.dataAvailable()) {
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

#if SEND_EULER
      quaternionToEuler(qx, qy, qz, qw, yawDeg, pitchDeg, rollDeg);
#endif

      sampleCounter++;
      gotData = true;
    }
  }

  // Fallback: por si se pierde una interrupción.
  // No se ejecuta pesado todo el tiempo.
  if (!gotData && imu.dataAvailable()) {
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

#if SEND_EULER
    quaternionToEuler(qx, qy, qz, qw, yawDeg, pitchDeg, rollDeg);
#endif

    sampleCounter++;
  }
}

// ==========================
// ENVIAR DATOS POR SERIAL
// ==========================
void sendSerialData() {
  uint32_t now = millis();

  if (now - lastSerialOutput < SERIAL_OUTPUT_INTERVAL_MS) {
    return;
  }

  lastSerialOutput = now;

  // Formato CSV compacto:
  // millis,samples,qx,qy,qz,qw,gx,gy,gz,yaw,pitch,roll

  Serial.print(now);
  Serial.print(',');

  Serial.print(sampleCounter);
  Serial.print(',');

  Serial.print(qx, 6);
  Serial.print(',');

  Serial.print(qy, 6);
  Serial.print(',');

  Serial.print(qz, 6);
  Serial.print(',');

  Serial.print(qw, 6);

#if USE_GYRO_INTEGRATED_VECTOR
  Serial.print(',');
  Serial.print(gyroX, 6);
  Serial.print(',');

  Serial.print(gyroY, 6);
  Serial.print(',');

  Serial.print(gyroZ, 6);
#endif

#if SEND_EULER
  Serial.print(',');
  Serial.print(yawDeg, 2);
  Serial.print(',');

  Serial.print(pitchDeg, 2);
  Serial.print(',');

  Serial.print(rollDeg, 2);
#endif

  Serial.println();
}

// ==========================
// SETUP
// ==========================
void setup() {
  Serial.begin(SERIAL_BAUD);
  delay(500);

  Serial.println();
  Serial.println("ESP32 + BNO080/BNO085 - Modo optimizado");

  if (!startBNO080()) {
    Serial.println("ERROR: No se detecto el BNO080.");
    Serial.println("Revisa:");
    Serial.println("- SDA GPIO 21");
    Serial.println("- SCL GPIO 22");
    Serial.println("- GND comun");
    Serial.println("- Alimentacion 3.3V");
    Serial.println("- Direccion I2C 0x4B o prueba 0x4A");

    while (true) {
      delay(1000);
    }
  }

  Serial.println("BNO080 detectado correctamente.");
  Serial.println("Formato:");
  Serial.println("ms,samples,qx,qy,qz,qw,gx,gy,gz,yaw,pitch,roll");
}

// ==========================
// LOOP
// ==========================
void loop() {
  readIMU();
  sendSerialData();

  // No uses delay() aquí.
  // Dejar el loop libre mejora la respuesta del sistema.
}