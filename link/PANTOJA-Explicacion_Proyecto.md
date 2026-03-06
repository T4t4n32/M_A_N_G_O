# Sistema de Monitoreo de Ruido en el Aula

---
## Introducción al Proyecto

Este proyecto crea un **sistema visual y sonoro de control de ruido** para aulas escolares. Su objetivo es:

- ✅ **Visualizar** el nivel de ruido mediante LEDs de colores (verde = tranquilo, amarillo = moderado, rojo = excesivo)  
- 🔊 **Alertar** con sonidos cuando el ruido supera límites aceptables  
- 📺 **Mostrar mensajes claros** en una pantalla OLED para concienciar a los estudiantes  
- 💡 **Educar** sobre la importancia de mantener un ambiente acústico adecuado para el aprendizaje  

---

## Materiales Necesarios

| Componente | Cantidad | Observaciones |
|------------|----------|---------------|
| Arduino UNO | 1 | Placa de desarrollo principal |
| LED verde | 1 | Indica nivel de ruido aceptable |
| LED amarillo | 1 | Indica nivel de ruido elevado |
| LED rojo | 1 | Indica nivel de ruido peligroso |
| **Resistencias 220Ω** | **3** | ⚠️ **Obligatorias** para proteger los LEDs |
| Buzzer activo | 1 | Emite sonido de alarma (debe tener + y - marcados) |
| Pantalla OLED 0.96" I2C | 1 | Muestra mensajes de estado (128x64 píxeles) |
| Protoboard | 1 | Para conexiones temporales sin soldar |
| Cables jumper | Varios | Macho-macho para protoboard |

> 💡 **Advertencia crítica**: Nunca conectes un LED directamente a un pin de Arduino sin resistencia. ¡Se quemará en segundos y puede dañar el pin!

---

## Conceptos Clave para Principiantes

### ¿Qué es Arduino UNO?
Es una **placa de desarrollo de código abierto** basada en un microcontrolador. Permite:
- Leer sensores (como micrófonos, botones, temperatura)
- Controlar actuadores (como LEDs, motores, pantallas)
- Ejecutar programas llamados *sketches* escritos en un lenguaje similar a C++

### LEDs y Resistencias
- **LED (Diodo Emisor de Luz)**: Componente que emite luz al pasar corriente. Tiene polaridad:
  - **Ánodo (+)** → Pierna más larga
  - **Cátodo (-)** → Pierna más corta + parte plana en el encapsulado
- **Resistencia 220Ω**: Limita la corriente para evitar que el LED se queme. Siempre se conecta en **serie** entre el pin y el ánodo del LED.

### Buzzer Activo vs Pasivo
| Tipo | Característica | Uso en este proyecto |
|------|----------------|----------------------|
| **Activo** | Suena al aplicarle voltaje (tiene circuito interno) | ✅ **Recomendado** - funciona con `digitalWrite()` |
| **Pasivo** | Requiere señal PWM para generar tono | ❌ No recomendado para alarmas simples |

> ✅ Verifica que tu buzzer tenga marcados **+** y **-** → es activo y funcionará correctamente.

### Comunicación Serial
Es la forma en que Arduino se comunica con la computadora:
- **Serial Monitor**: Ventana del IDE de Arduino donde envías/recibes texto
- **Baudios**: Velocidad de comunicación (usamos 9600)
- **Final de línea**: Debe configurarse como **"Ambos NL & CR"** para que Arduino reconozca correctamente los comandos

### Pantalla OLED e I2C
- **OLED**: Pantalla de bajo consumo que muestra texto/gráficos en blanco o azul
- **I2C (Inter-Integrated Circuit)**: Protocolo de comunicación que usa solo 2 cables de datos:
  - **SDA** → Datos (conectado a A4 en Arduino UNO)
  - **SCL** → Reloj (conectado a A5 en Arduino UNO)
- **Dirección I2C**: Cada dispositivo tiene una dirección única. Las OLED suelen usar `0x3C` o `0x3D` (detectamos `0x3C` en tu caso)

---

## 🔌 Diagrama de Conexiones

```
ARDUINO UNO          COMPONENTE          NOTAS
─────────────────────────────────────────────────────────────
5V                  OLED VCC            Alimentación pantalla
GND                 OLED GND            Tierra común
A4 (SDA)            OLED SDA            Comunicación I2C datos
A5 (SCL)            OLED SCL            Comunicación I2C reloj
─────────────────────────────────────────────────────────────
Pin 10              Ánodo LED verde     → con resistencia 220Ω
GND                 Cátodo LED verde    Conexión directa a tierra
─────────────────────────────────────────────────────────────
Pin 9               Ánodo LED amarillo  → con resistencia 220Ω
GND                 Cátodo LED amarillo Conexión directa a tierra
─────────────────────────────────────────────────────────────
Pin 8               Ánodo LED rojo      → con resistencia 220Ω
Pin 8               Buzzer (+)          Comparte pin con LED rojo
GND                 Cátodo LED rojo     Conexión directa a tierra
GND                 Buzzer (-)          Conexión directa a tierra
```

> 📌 **Importante**: El buzzer y el LED rojo comparten el mismo pin (8) porque ambos deben activarse simultáneamente en estados de alarma.

---

## Código Completo Comentado

```cpp
/*
  SISTEMA DE MONITOREO DE RUIDO EN EL AULA
  ========================================
  Control manual mediante comandos Serial:
    - BAJO    → Nivel normal (LED verde)
    - MEDIO   → Nivel controlado (LED amarillo)
    - ALTO    → Riesgo auditivo (LED rojo + 3 pitidos)
    - PELIGRO → Alerta máxima (LED rojo + 2s de alarma continua)
  
  Autor: [Tu nombre]
  Fecha: 2026
*/

// ===== 1. LIBRERÍAS =====
#include <Wire.h>                  // Comunicación I2C para la OLED
#include <Adafruit_GFX.h>          // Librería gráfica base (letras, formas)
#include <Adafruit_SSD1306.h>      // Controlador específico para pantallas SSD1306

// ===== 2. CONFIGURACIÓN OLED =====
#define SCREEN_WIDTH 128           // Ancho de la pantalla en píxeles
#define SCREEN_HEIGHT 64           // Alto de la pantalla en píxeles
#define OLED_RESET -1              // Sin pin de reset físico
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// ===== 3. DEFINICIÓN DE PINES =====
#define LED_VERDE    10            // Pin para LED verde
#define LED_AMARILLO 9             // Pin para LED amarillo
#define LED_ROJO     8             // Pin para LED rojo Y buzzer
#define BUZZER       8             // Mismo pin que LED rojo (activación simultánea)

// ===== 4. FUNCIÓN DE INICIALIZACIÓN =====
void setup() {
  // Configurar pines como SALIDAS (envían señal)
  pinMode(LED_VERDE, OUTPUT);
  pinMode(LED_AMARILLO, OUTPUT);
  pinMode(LED_ROJO, OUTPUT);
  pinMode(BUZZER, OUTPUT);
  
  // Apagar todos los componentes al inicio
  digitalWrite(LED_VERDE, LOW);
  digitalWrite(LED_AMARILLO, LOW);
  digitalWrite(LED_ROJO, LOW);
  digitalWrite(BUZZER, LOW);
  
  // Iniciar comunicación Serial con la computadora
  Serial.begin(9600);
  
  // Iniciar pantalla OLED en dirección 0x3C (detectada previamente)
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  
  // Mostrar pantalla de bienvenida
  display.clearDisplay();          // Limpiar buffer de pantalla
  display.setTextSize(2);          // Tamaño de texto grande
  display.setTextColor(WHITE);     // Color blanco (OLED monocromo)
  display.setCursor(30, 25);       // Posición X=30, Y=25 píxeles
  display.println("LISTO");        // Texto a mostrar
  display.display();               // ¡Importante! Refrescar pantalla física
  
  // Mensaje de confirmación en Serial Monitor
  Serial.println("✅ Sistema listo. Usa: BAJO, MEDIO, ALTO, PELIGRO");
}

// ===== 5. BUCLE PRINCIPAL (se ejecuta repetidamente) =====
void loop() {
  // Verificar si hay datos disponibles en Serial
  if (Serial.available() > 0) {
    // Leer comando hasta encontrar salto de línea (\n)
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();        // Eliminar espacios al inicio/final
    cmd.toUpperCase(); // Convertir a mayúsculas (BAJO = bajo = BaJo)
    
    // Mostrar comando recibido en Serial para depuración
    Serial.print("→ Comando: ");
    Serial.println(cmd);
    
    // === APAGAR TODOS LOS COMPONENTES ANTES DE ACTIVAR NUEVO ESTADO ===
    digitalWrite(LED_VERDE, LOW);
    digitalWrite(LED_AMARILLO, LOW);
    digitalWrite(LED_ROJO, LOW);
    digitalWrite(BUZZER, LOW);
    
    // === EVALUAR COMANDO Y ACTIVAR COMPONENTES CORRESPONDIENTES ===
    if (cmd == "BAJO") {
      digitalWrite(LED_VERDE, HIGH);          // Encender LED verde
      mostrar("NIVEL", "NORMAL");             // Mostrar en OLED
    } 
    else if (cmd == "MEDIO") {
      digitalWrite(LED_AMARILLO, HIGH);       // Encender LED amarillo
      mostrar("NIVEL", "CONTROLADO");         // Mostrar en OLED
    } 
    else if (cmd == "ALTO") {
      digitalWrite(LED_ROJO, HIGH);           // Encender LED rojo
      
      // Generar 3 pitidos cortos (alarma intermitente)
      for (int i = 0; i < 3; i++) {
        digitalWrite(BUZZER, HIGH);  // Activar buzzer
        delay(100);                  // Mantener 100ms
        digitalWrite(BUZZER, LOW);   // Desactivar buzzer
        delay(100);                  // Pausa 100ms
      }
      
      mostrar("RIESGO", "AUDITIVO");          // Mostrar en OLED
    } 
    else if (cmd == "PELIGRO") {
      digitalWrite(LED_ROJO, HIGH);           // Encender LED rojo
      digitalWrite(BUZZER, HIGH);             // Activar buzzer continuo
      delay(2000);                            // Mantener 2 segundos
      digitalWrite(BUZZER, LOW);              // Apagar buzzer
      
      mostrar("BAJAR NIVEL", "DE RUIDO !!!"); // Mostrar mensaje crítico
    }
    else {
      // Comando no reconocido → mostrar error temporal
      mostrar("ERROR", "COMANDO");
      delay(1000);                            // Esperar 1 segundo
      // Volver a pantalla de inicio
      display.clearDisplay();
      display.setTextSize(2);
      display.setTextColor(WHITE);
      display.setCursor(30, 25);
      display.println("LISTO");
      display.display();
    }
  }
}

// ===== 6. FUNCIÓN PARA MOSTRAR MENSAJES EN OLED =====
void mostrar(String linea1, String linea2) {
  display.clearDisplay();           // Limpiar pantalla
  display.setTextSize(2);           // Tamaño grande
  display.setTextColor(WHITE);      // Color blanco
  
  display.setCursor(5, 10);         // Primera línea (Y=10)
  display.println(linea1);          // Mostrar primer texto
  
  display.setCursor(5, 35);         // Segunda línea (Y=35)
  display.println(linea2);          // Mostrar segundo texto
  
  display.display();                // ¡Refrescar pantalla física!
}
```

---

## Explicación Paso a Paso del Código

### 6.1. Librerías y Configuración
```cpp
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
```
- **`Wire.h`**: Habilita comunicación I2C (protocolo de 2 hilos para OLED)
- **`Adafruit_GFX.h`**: Proporciona funciones gráficas básicas (`drawLine`, `drawRect`)
- **`Adafruit_SSD1306.h`**: Controlador específico para pantallas OLED SSD1306

> 💡 **¿Por qué Adafruit?** Es una empresa líder en hardware educativo. Sus librerías son estables, bien documentadas y compatibles con la mayoría de componentes económicos del mercado.

### 6.2. Declaración de Pines
```cpp
#define LED_VERDE    10
#define LED_AMARILLO 9
#define LED_ROJO     8
#define BUZZER       8
```
- **`#define`**: Crea un alias (nombre legible) para un número. Mejora la legibilidad:
  - En lugar de `digitalWrite(10, HIGH)` → `digitalWrite(LED_VERDE, HIGH)`
- **Pin compartido (8)**: LED rojo y buzzer se activan juntos en estados críticos (diseño intencional para simplicidad)

### 6.3. Función `setup()`
```cpp
void setup() {
  // ... configuración inicial ...
}
```
- Se ejecuta **una sola vez** al encender o reiniciar Arduino
- **Pasos críticos**:
  1. `pinMode(pin, OUTPUT)` → Define pines como salidas (envían señal)
  2. `digitalWrite(pin, LOW)` → Apaga todo al inicio (evita estados indeseados)
  3. `Serial.begin(9600)` → Inicia comunicación con computadora a 9600 baudios
  4. `display.begin(...)` → Inicializa la pantalla OLED
  5. `display.display()` → **¡Obligatorio!** Sin esto, los cambios no aparecen en pantalla

> ⚠️ **Error común**: Olvidar `display.display()` → la pantalla permanece en blanco aunque el código "parezca" correcto.

### 6.4. Función `loop()`
```cpp
void loop() {
  if (Serial.available() > 0) {
    // ... procesar comando ...
  }
}
```
- Se ejecuta **repetidamente** en bucle infinito (miles de veces por segundo)
- **Lógica de flujo**:
  1. `Serial.available() > 0` → ¿Hay datos esperando en Serial?
  2. `readStringUntil('\n')` → Leer hasta salto de línea (Enter)
  3. `trim()` + `toUpperCase()` → Normalizar comando (evita errores por espacios/mayúsculas)
  4. **Apagar todo primero** → Evita que múltiples LEDs queden encendidos
  5. Evaluar comando con `if/else if` → Activar componentes correspondientes

> 💡 **Patrón de diseño**: "Apagar todo → Encender lo necesario" es una práctica robusta que evita estados inconsistentes.

### 6.5. Función `mostrar()`
```cpp
void mostrar(String linea1, String linea2) {
  // ... código para actualizar OLED ...
}
```
- **Función personalizada**: Agrupa lógica repetitiva (limpiar + escribir + refrescar)
- **Ventajas**:
  - Reduce código duplicado
  - Facilita mantenimiento (cambios en un solo lugar)
  - Mejora legibilidad del `loop()`
- **Parámetros**:
  - `String linea1` → Primer texto (ej: "NIVEL")
  - `String linea2` → Segundo texto (ej: "NORMAL")

> 📌 **Nota técnica**: Las coordenadas en OLED usan sistema cartesiano con origen (0,0) en **esquina superior izquierda**.

---

## Guía de Uso Paso a Paso

### Paso 1: Conexiones físicas
1. Conecta los 3 LEDs con sus **resistencias de 220Ω** a los pines 10, 9 y 8
2. Conecta el buzzer (+) al pin 8 y (-) a GND
3. Conecta la OLED: VCC→5V, GND→GND, SDA→A4, SCL→A5

### Paso 2: Cargar el código
1. Abre el IDE de Arduino
2. Ve a *Herramientas → Placa → Arduino UNO*
3. Ve a *Herramientas → Puerto* y selecciona el puerto correcto
4. Copia y pega el código completo
5. Haz clic en ✔️ **Verificar** y luego en ➡️ **Subir**

### Paso 3: Configurar Monitor Serial
1. Abre *Herramientas → Monitor Serial* (`Ctrl+Shift+M`)
2. Configura:
   - **Velocidad**: `9600 baudios`
   - **Final de línea**: `Ambos NL & CR` ⚠️ *(¡ES CLAVE!)*

### Paso 4: Enviar comandos
Escribe **exactamente** estos comandos (en mayúsculas) y presiona **ENTER**:

| Comando | Resultado esperado |
|---------|-------------------|
| `BAJO` | LED verde encendido + Pantalla: "NIVEL / NORMAL" |
| `MEDIO` | LED amarillo encendido + Pantalla: "NIVEL / CONTROLADO" |
| `ALTO` | LED rojo + 3 pitidos + Pantalla: "RIESGO / AUDITIVO" |
| `PELIGRO` | LED rojo + 2s de sonido continuo + Pantalla: "BAJAR NIVEL / DE RUIDO !!!" |

> ✅ **Feedback visual**: El Monitor Serial mostrará `→ Comando: BAJO` para confirmar recepción.

---

## Troubleshooting (Solución de Problemas)

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| **Pantalla OLED en blanco/negra** | Falta `display.display()` | Verifica que la función `mostrar()` incluya `display.display()` |
| **LEDs no encienden** | Falta resistencia o polaridad invertida | Revisa: ánodo→resistencia→pin, cátodo→GND |
| **Buzzer no suena** | Es buzzer pasivo (no activo) | Reemplaza por buzzer activo (con + y - marcados) |
| **Comandos no reconocidos** | Configuración Serial incorrecta | **¡Configura "Ambos NL & CR"!** |
| **Pantalla muestra basura** | Dirección I2C incorrecta | Cambia `0x3C` → `0x3D` en `display.begin()` |
| **Arduino se reinicia al conectar buzzer** | Demasiada corriente | Usa transistor 2N2222 para alimentar buzzer desde 5V externo |

### Diagnóstico rápido de OLED
Si la pantalla no funciona, sube este sketch mínimo:
```cpp
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
Adafruit_SSD1306 display(128, 64, &Wire, -1);

void setup() {
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay();
  display.setTextSize(2);
  display.setTextColor(WHITE);
  display.setCursor(10, 25);
  display.println("PRUEBA OLED");
  display.display();
}
void loop() {}
```

---

## Próximos Pasos: Integración con Sensor de Sonido

Cuando recibas tu **sensor de sonido KY-038**, solo necesitarás modificar estas secciones:

### 1. Conexión física del sensor
```
KY-038 → Arduino UNO
VCC    → 5V
GND    → GND
OUT    → A0 (entrada analógica)
```

### 2. Modificación del código (reemplazar `loop()`)
```cpp
void loop() {
  int nivelSonido = analogRead(A0);  // Leer valor 0-1023
  
  // Umbrales calibrados en tu aula (ajustar según necesidad)
  if (nivelSonido < 300) {
    activarVerde();
  } 
  else if (nivelSonido < 550) {
    activarAmarillo();
  } 
  else if (nivelSonido < 750) {
    activarRojoAlarmaCorta();
  } 
  else {
    activarRojoAlarmaLarga();
  }
  
  delay(100);  // Evitar lecturas demasiado rápidas
}
```

### 3. Calibración de umbrales
1. Sube un sketch que solo imprima `analogRead(A0)` en Serial
2. Mide valores en 4 escenarios:
   - Silencio total → define umbral para `BAJO`
   - Conversación normal → define umbral para `MEDIO`
   - Alboroto moderado → define umbral para `ALTO`
   - Gritos → define umbral para `PELIGRO`
3. Reemplaza los valores en el código

> 💡 **Consejo profesional**: Usa promedio móvil para suavizar lecturas:
> ```cpp
> int promedio = (analogRead(A0) + analogRead(A0) + analogRead(A0)) / 3;
> ```

---

## Referencias y Recursos Adicionales

### Documentación oficial
- [Arduino Language Reference](https://www.arduino.cc/reference/en/)
- [Adafruit SSD1306 Library](https://github.com/adafruit/Adafruit_SSD1306)
- [KY-038 Sound Sensor Datasheet](https://www.makerguides.com/ky-038-sound-sensor-arduino-tutorial/)

### Tutoriales recomendados
- [Curso gratuito de Arduino en español (ProgramarFacil)](https://programarfacil.com/curso-arduino/)
- [Comunicación I2C explicada visualmente (YouTube)](https://youtu.be/0H1Gc6nO6C4)
- [Cómo usar resistencias con LEDs (SparkFun)](https://learn.sparkfun.com/tutorials/polarity/diode-and-led-polarity)

### Para profundizar
- **Electrónica básica**: "Make: Electronics" de Charles Platt
- **Programación Arduino**: "Arduino Cookbook" de Michael Margolis
- **Proyectos educativos**: [Arduino Education](https://www.arduino.cc/education)