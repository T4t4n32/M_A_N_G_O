// ===============================
// M.A.N.G.O. — Turbidez AZDM01 MEJORADO
// Integración Dual: Analógico + Digital
// ===============================

const int TURBIDITY_ANALOG_PIN = A1;    // Puerto analógico
const int TURBIDITY_DIGITAL_PIN = 6;    // Puerto digital
const int SAMPLES = 50;                 // Más muestras para mejor filtrado

// Parámetros de calibración mejorados
const float ANALOG_THRESHOLD_LOW = 1.5;    // Umbral bajo en voltios
const float ANALOG_THRESHOLD_HIGH = 3.5;   // Umbral alto en voltios
const float DIGITAL_THRESHOLD_NTU = 200.0; // Umbral del puerto digital

// Factores de compensación (ajustables según diagnóstico)
float compensationFactorHigh = 1.2;  // Factor cuando digital indica alta turbidez
float compensationFactorLow = 0.8;   // Factor cuando digital indica baja turbidez

float readAnalogVoltage() {
  long sum = 0;
  for (int i = 0; i < SAMPLES; i++) {
    sum += analogRead(TURBIDITY_ANALOG_PIN);
    delay(2); // Delay más corto para mayor frecuencia de muestreo
  }
  float avg = sum / (float)SAMPLES;
  return avg * (5.0 / 1023.0);
}

int readDigitalState() {
  return digitalRead(TURBIDITY_DIGITAL_PIN);
}

// === ALGORITMO DE INTEGRACIÓN AVANZADA ===
float calculateIntegratedTurbidity() {
  float analogVoltage = readAnalogVoltage();
  int digitalState = readDigitalState();
  
  // 1. Calcular turbidez base desde analógico
  float baseNTU = -1120.4 * analogVoltage * analogVoltage 
                 + 5742.3 * analogVoltage 
                 - 4352.9;
  
  if (baseNTU < 0) baseNTU = 0;
  
  // 2. Determinar rango esperado desde digital
  bool expectedHighTurbidity = (digitalState == HIGH);
  
  // 3. Estrategia de integración inteligente
  float finalNTU;
  
  // CASO 1: VALORES CONGRUENTES (confianza alta)
  if ((expectedHighTurbidity && baseNTU >= DIGITAL_THRESHOLD_NTU) || 
      (!expectedHighTurbidity && baseNTU < DIGITAL_THRESHOLD_NTU)) {
    
    // Promedio simple con ponderación
    float analogWeight = 0.7;  // 70% analógico, 30% digital
    float digitalEstimate = expectedHighTurbidity ? 300.0 : 50.0; // Estimación digital
    
    finalNTU = (analogWeight * baseNTU) + ((1 - analogWeight) * digitalEstimate);
    
    Serial.print("[CONFIANZA ALTA] ");
  
  // CASO 2: DISCREPANCIA - DIGITAL INDICA ALTO, ANALÓGICO BAJO
  } else if (expectedHighTurbidity && baseNTU < DIGITAL_THRESHOLD_NTU) {
    
    // Aplicar factor de compensación para lecturas bajas
    finalNTU = baseNTU * compensationFactorHigh;
    
    // Si después de compensación sigue siendo bajo, usar estimación digital
    if (finalNTU < DIGITAL_THRESHOLD_NTU) {
      finalNTU = (DIGITAL_THRESHOLD_NTU + 400.0) / 2; // Valor promedio del rango alto
    }
    
    Serial.print("[DISCREPANCIA: DIGITAL ALTO] ");
  
  // CASO 3: DISCREPANCIA - DIGITAL INDICA BAJO, ANALÓGICO ALTO
  } else if (!expectedHighTurbidity && baseNTU >= DIGITAL_THRESHOLD_NTU) {
    
    // Aplicar factor de compensación para lecturas altas
    finalNTU = baseNTU * compensationFactorLow;
    
    // Si después de compensación sigue siendo alto, usar estimación digital
    if (finalNTU >= DIGITAL_THRESHOLD_NTU) {
      finalNTU = (0.0 + DIGITAL_THRESHOLD_NTU) / 2; // Valor promedio del rango bajo
    }
    
    Serial.print("[DISCREPANCIA: DIGITAL BAJO] ");
  }
  
  // 4. Filtro de rango realista
  if (finalNTU < 0) finalNTU = 0;
  if (finalNTU > 1000) finalNTU = 1000; // Límite máximo realista
  
  // 5. Diagnóstico en tiempo real
  Serial.print("Analog: ");
  Serial.print(analogVoltage, 2);
  Serial.print("V (");
  Serial.print(baseNTU, 1);
  Serial.print(" NTU) | Digital: ");
  Serial.print(digitalState ? "ALTO" : "BAJO");
  Serial.print(" | Final: ");
  Serial.print(finalNTU, 1);
  Serial.println(" NTU");
  
  return finalNTU;
}

// === MODO DE DIAGNÓSTICO INTELIGENTE ===
void runDiagnostics() {
  Serial.println("\n=== DIAGNÓSTICO SENSOR TURBIDEZ ===");
  
  // Prueba 1: Agua limpia (0 NTU)
  Serial.println("PASO 1: Coloca sensor en agua DESTILADA");
  Serial.println("Presiona cualquier tecla cuando esté listo...");
  while (!Serial.available());
  Serial.read();
  
  float cleanVoltage = readAnalogVoltage();
  int cleanDigital = readDigitalState();
  
  // Prueba 2: Agua turbia (>200 NTU)
  Serial.println("\nPASO 2: Coloca sensor en agua TURBIA");
  Serial.println("Presiona cualquier tecla cuando esté listo...");
  while (!Serial.available());
  Serial.read();
  
  float dirtyVoltage = readAnalogVoltage();
  int dirtyDigital = readDigitalState();
  
  // Análisis de resultados
  Serial.println("\n=== RESULTADOS DIAGNÓSTICO ===");
  Serial.print("Agua Limpia  - Voltaje: "); Serial.print(cleanVoltage, 3); 
  Serial.print("V | Digital: "); Serial.println(cleanDigital ? "ALTO" : "BAJO");
  
  Serial.print("Agua Turbia  - Voltaje: "); Serial.print(dirtyVoltage, 3); 
  Serial.print("V | Digital: "); Serial.println(dirtyDigital ? "ALTO" : "BAJO");
  
  // Calcular sensibilidad
  float voltageRange = abs(dirtyVoltage - cleanVoltage);
  bool digitalWorking = (cleanDigital != dirtyDigital);
  
  Serial.println("\n=== ANÁLISIS ===");
  Serial.print("Rango de voltaje detectado: "); Serial.print(voltageRange, 3); Serial.println("V");
  
  if (voltageRange < 0.5) {
    Serial.println("⚠️  ALERTA: Rango de voltaje muy pequeño (<0.5V)");
    Serial.println("   Posible problema con el sensor o conexiones");
  } else if (voltageRange < 1.0) {
    Serial.println("⚠️  ADVERTENCIA: Rango de voltaje limitado (0.5-1.0V)");
    Serial.println("   Calibración necesaria");
  } else {
    Serial.println("✅ Rango de voltaje adecuado (>1.0V)");
  }
  
  if (digitalWorking) {
    Serial.println("✅ Puerto digital respondiendo correctamente");
    
    // Calcular y sugerir factores de compensación
    float avgClean = cleanVoltage;
    float avgDirty = dirtyVoltage;
    
    if (cleanDigital == LOW && dirtyDigital == HIGH) {
      compensationFactorHigh = 1.0 + (2.0 * (1.0 - (avgClean / 2.5)));
      compensationFactorLow = 0.9 - (0.2 * (avgDirty / 4.0));
      
      Serial.println("\n=== FACTORES DE COMPENSACIÓN CALCULADOS ===");
      Serial.print("Factor para alta turbidez: "); Serial.println(compensationFactorHigh, 2);
      Serial.print("Factor para baja turbidez: "); Serial.println(compensationFactorLow, 2);
      Serial.println("Estos valores se aplicarán automáticamente");
    }
  } else {
    Serial.println("❌ Puerto digital NO respondiendo");
    Serial.println("   Revisar conexiones o sensor digital");
  }
  
  Serial.println("\n=== DIAGNÓSTICO COMPLETADO ===");
  delay(3000);
}

void setup() {
  Serial.begin(9600);
  pinMode(TURBIDITY_ANALOG_PIN, INPUT);
  pinMode(TURBIDITY_DIGITAL_PIN, INPUT);
  
  Serial.println("M.A.N.G.O. | Turbidez - Modo Integración Dual");
  Serial.println("Iniciando diagnóstico...");
  runDiagnostics();
}

void loop() {
  float integratedTurbidity = calculateIntegratedTurbidity();
  
  // Mostrar resultado final optimizado
  Serial.print("TURBIDEZ FINAL: ");
  Serial.print(integratedTurbidity, 1);
  Serial.println(" NTU");
  
  delay(1000);
}
