/*
 * Medidor de pH corregido para Proyecto M.A.N.G.O.
 * Salida exclusiva por Monitor Serial (Sin LCD)
 */

#include <Wire.h>

// Valor de calibración: ajusta este número según tus soluciones buffer
// (Si tu lectura es muy alta o baja, cambia este valor)
float calibration_value = 21.34; 

int phval = 0;
unsigned long int avgval;
int buffer_arr[10], temp;

void setup() {
  // Velocidad del monitor serial
  Serial.begin(9600); 
  
  Serial.println("========================================");
  Serial.println("   M.A.N.G.O. - Sistema de Monitoreo   ");
  Serial.println("          Modulo de pH Activo           ");
  Serial.println("========================================");
  delay(1000);
}

void loop() {
  // Toma 10 muestras para estabilidad
  for (int i = 0; i < 10; i++) {
    buffer_arr[i] = analogRead(A0);
    delay(30);
  }

  // Ordenamiento de burbuja para filtrar ruido (elimina picos)
  for (int i = 0; i < 9; i++) {
    for (int j = i + 1; j < 10; j++) {
      if (buffer_arr[i] > buffer_arr[j]) {
        temp = buffer_arr[i];
        buffer_arr[i] = buffer_arr[j];
        buffer_arr[j] = temp;
      }
    }
  }

  // Promedio de las muestras centrales (filtro de media móvil)
  avgval = 0;
  for (int i = 2; i < 8; i++) {
    avgval += buffer_arr[i];
  }

  // Cálculo de voltaje y conversión a pH
  float volt = (float)avgval * 5.0 / 1024 / 6;
  float ph_act = -5.70 * volt + calibration_value;

  // Salida al Monitor Serial
  Serial.print("Voltaje: ");
  Serial.print(volt, 2);
  Serial.print("V | ");
  Serial.print("Valor pH: ");
  Serial.println(ph_act, 2);

  delay(1000); // Pausa de 1 segundo entre lecturas
}