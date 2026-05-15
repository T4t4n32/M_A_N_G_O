# M.A.N.G.O. – Sistema PlatformIO v2.0
**Autonomous Water-Quality Mapping Drone**

---

## Estructura de proyectos

```
MANGO_Motion/          ← ESP32: motores, IMU, modo AUTO
  platformio.ini
  include/
    auto_config.h      ← Parámetros de misión (tiempos, PWM)
  src/
    main.cpp

MANGO_TX/              ← Arduino sensor (PT100, pH, turbidez) + TX LoRa
  platformio.ini
  include/
    tx_config.h        ← Pines, calibración, parámetros LoRa
  src/
    main.cpp

MANGO_RX/              ← Arduino gateway LoRa → Jetson/PC
  platformio.ini
  src/
    main.cpp
```

---

## Migración desde Arduino IDE

| Antes (.ino) | Ahora (PlatformIO) | Notas |
|---|---|---|
| `TX_ALL_V1_5_0.ino` | `MANGO_TX/src/main.cpp` | + configuración en `tx_config.h` |
| `RX_ALL_V1_5_0.ino` | `MANGO_RX/src/main.cpp` | + detección de paquetes perdidos |
| `main.cpp` (v1) | `MANGO_Motion/src/main.cpp` | + modo AUTO completo |

**Para abrir en VS Code + PlatformIO:** `File → Open Folder` sobre cada carpeta de proyecto.

---

## Modo Automático – Secuencia de misión piscina

```
[Usuario activa AUTO]
        │
   WARMUP (30 s)  ← El dispositivo espera quieto, motores en neutro
        │
   FWD_LEG1 (~4 s) ──────────────────────────────── avanza lado 1
        │
   TURN1 (~2.2 s) ──────────────────────────────── giro 90° derecha
        │
   SAMPLE_STOP1 (60 s) ──────────────────────── 🛑 parada muestreo 1
        │                                         motores neutro
   FWD_LEG2 (~4 s) ──────────────────────────────── avanza lado 2
        │
   TURN2 (~2.2 s) ──────────────────────────────── giro 90° derecha
        │
   SPIN (~1.8 s)  ──────────────────────────────── rotación ~180° eje
        │
   SAMPLE_STOP2 (60 s) ──────────────────────── 🛑 parada muestreo 2
        │
   RETURN_LEG (~4 s) ─────────────────────────── reversa al inicio
        │
   RETURN_TURN (~2.2 s) ──────────────────────── giro para encarar origen
        │
   DONE → vuelve a MODE_ESP (manual)
```

**Todos los tiempos** se ajustan en `MANGO_Motion/include/auto_config.h`.

### Comandos para activar

| Comando Serial | Efecto |
|---|---|
| `o` (una letra) | Activa modo AUTO |
| `MODE,AUTO` | Activa modo AUTO (formato Jetson) |
| `AUTO` | Alias |
| `s` o `STOP` | Cancela AUTO inmediatamente |

---

## Optimizaciones LoRa v2.0

### Protocolo binario (TX ↔ RX)

| Aspecto | v1 (JSON texto) | v2 (binario) |
|---|---|---|
| Tamaño payload | ~220 bytes | **32 bytes** |
| Tiempo en aire (SF7/125kHz) | ~180 ms | **~26 ms** |
| Reducción colisiones | — | **7× menos** |
| Detección pérdidas | No | **Sí (número de secuencia)** |
| Timestamp | No | **Sí (millis en paquete)** |
| Reintentos TX | No | **Sí (3 intentos, back-off)** |
| CRC LoRa | Activo | **Activo + validación magic** |
| Sync word privado | 0x34 (público) | **0x12 (privado)** |

El RX reconstruye el JSON completo para Jetson — el contrato de datos hacia arriba **no cambia**.

### Parámetros LoRa (idénticos en TX y RX)

```
Frecuencia : 433.0 MHz
Bandwidth  : 125 kHz
SF         : 7  (rango/velocidad: SF7=rápido, SF12=largo alcance)
Coding Rate: 4/5
Sync Word  : 0x12 (privado, evita interferencias con otros módulos)
Potencia TX: 14 dBm
```

Para cambiar el alcance vs. velocidad, modifica `LORA_SF` en `tx_config.h`
(y el valor hardcoded en `MANGO_RX/src/main.cpp` — mismo valor).

### Estadísticas que emite el RX por Serial

```
JSON:{...}               ← datos de sensores para Jetson
LINK:rssi=-72.4 snr=9.2 freq_err=234    ← calidad del enlace
STATS:total=45 lost=2 loss_pct=4.3      ← tasa de pérdida acumulada
```

---

## Calibración de sensores (TX)

Edita `MANGO_TX/include/tx_config.h`:

```cpp
// pH: medir con buffers pH 4 y pH 7 y anotar el voltaje
static constexpr float PH_V_AT7 = 2.50f;  // voltaje en pH 7
static constexpr float PH_V_AT4 = 3.00f;  // voltaje en pH 4

// Referencia del MAX31865
static constexpr float MAX_RREF = 430.0f;  // medir con multímetro
```

---

## Librerías PlatformIO requeridas

| Proyecto | Librería |
|---|---|
| MANGO_Motion | `ESP32Servo`, `sparkfun/SparkFun BNO080 Cortex Based IMU` |
| MANGO_TX | `jgromes/RadioLib @ ^7.1.2` |
| MANGO_RX | `jgromes/RadioLib @ ^7.1.2` |

PlatformIO las descarga automáticamente al hacer Build (`✓`).

---

## Notas de seguridad

- El modo AUTO usa los mismos límites `PWM_SAFE_MIN=1400 / PWM_SAFE_MAX=1600`.
- `STOP` desde serial cancela AUTO **inmediatamente** en cualquier estado.
- El failsafe de 2 s solo aplica en modo ESP manual, **no** interrumpe AUTO.
- Cambiar a `MODE,RF` desde AUTO cancela la misión y pone relés en RF.
