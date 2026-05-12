# M.A.N.G.O. — Paquete completo Fase A (Protocolo serial Jetson ↔ ESP32)

**TL;DR**
- Este paquete entrega TODO lo necesario para la Fase A: protocolo NDJSON sobre UART/USB, firmware ESP32 (PlatformIO + Arduino + ArduinoJson **7.4.x**), cliente Python (pyserial **3.5**), tests, ADR y plan de migración del repo. Es copy-paste y compila tal cual contra `board = esp32dev`.
- Decisiones clave fijadas y justificadas: **ArduinoJson 7.4.x** (`bblanchon/ArduinoJson @ ^7.4.0`, JsonDocument elástico, compatible NDJSON oficialmente), **pyserial 3.5** (último estable, requiere Python ≥ 3.4 — compatible con el 3.4.3 de Ubuntu 14.04 del Jetson TK1 y con upgrades a 3.6+), **115200 8N1**, terminador `\n`, UTF-8, línea ≤ 256 bytes, timeout failsafe 1000 ms, máquina de estados con `enum class`.
- La Fase A NO toca PWM real, BNO080, relé ni Kinect — solo deja "ganchos" comentados para Fase B+. El Kinect v1 (modelo 1414) sobre Jetson TK1 funciona con libfreenect siempre que se desactive `usbcore.autosuspend` y se use el puerto USB 2.0; eso queda anotado para Fase H.

---

## Key Findings (resumen ejecutivo de decisiones técnicas)

| Decisión | Valor | Fuente |
|---|---|---|
| Framework firmware | PlatformIO + `framework = arduino`, `board = esp32dev` | docs.platformio.org/en/latest/boards/espressif32/esp32dev.html |
| Librería JSON | ArduinoJson **7.4.3** (último estable, abr/jun 2025) — `JsonDocument` elástico, compatible NDJSON | arduinojson.org / GitHub releases bblanchon/ArduinoJson v7.4.3 |
| Cliente Python | pyserial **3.5** (release 2020-11-23) — requiere Python 2.7 o 3.4+ | pyserial.readthedocs.io / pypi.org |
| Encoding línea | UTF-8, una línea por mensaje, terminador `\n` (LF), CRLF tolerado | RFC 8259 + ndjson-spec (github.com/ndjson/ndjson-spec) |
| Lectura serial ESP32 | No bloqueante: `Serial.available()` + buffer hasta `\n`, NUNCA `readBytesUntil` (bloquea hasta timeout) | Espressif Arduino HardwareSerial docs + martyncurrey.com/arduino-serial |
| Baud rate | 115200, 8N1 | Convención Espressif Arduino + estabilidad probada en USB-CDC |
| Timeout failsafe | 1000 ms con `millis()` (no WDT hardware en Fase A — se reserva para Fase B con motores) | espressif.com/projects/esp-idf wdts |
| Detección puerto | `serial.tools.list_ports.comports()` filtrando por VID/PID Silicon Labs CP210x (0x10C4) y CH340 (0x1A86) | pyserial.readthedocs.io/en/stable/tools.html |
| Permisos en Linux | Usuario en grupo `dialout` para `/dev/ttyUSB0`/`/dev/ttyACM0` | thmosqueiro.vandroiy.com Jetson note + pyserial.com docs |
| Kinect TK1 (Fase H) | libfreenect funciona en TK1 (kernel 3.10.40 / L4T R21.x) tras `echo -1 > /sys/module/usbcore/parameters/autosuspend`; modelo 1414 plenamente soportado, modelo 1473 pierde motor/audio | jetsonhacks.com 2014/07/14 + OpenKinect issue #451 |

---

## Details — Paquete completo, listo para pegar en el repo

A continuación está el paquete íntegro. La estructura final del repo queda así:

```
M_A_N_G_O/
├── firmware/
│   └── motion_esp32/
│       ├── platformio.ini
│       └── src/
│           └── main.cpp
├── bridge/
│   └── jetson_serial/
│       ├── requirements.txt
│       ├── mango_serial.py
│       └── cli.py
├── tests/
│   ├── README.md
│   └── serial_ping_stop_test.py
├── docs/
│   ├── PHASE_A.md
│   ├── protocols/
│   │   └── MOTION_SERIAL_PROTOCOL.md
│   └── adr/
│       └── 0001-phase-a-serial-protocol.md
└── README.md  (existente, conservar)
```

---

### 1. `docs/protocols/MOTION_SERIAL_PROTOCOL.md` — Especificación del protocolo

```markdown
# MOTION_SERIAL_PROTOCOL.md — Protocolo serial Jetson ↔ ESP32 de movimiento

**Versión:** 1.0 (Fase A)
**Última actualización:** 2026-05-08
**Estado:** Estable para Fase A. Las extensiones (PWM real, IMU, modos AUTO con setpoints) se añadirán
en Fase B sin romper compatibilidad: solo se agregan comandos y campos opcionales.

## 1. Capa física

| Parámetro       | Valor                                |
|-----------------|--------------------------------------|
| Transporte      | UART sobre USB (USB-CDC del ESP32)   |
| Baud rate       | **115200**                           |
| Formato         | 8N1 (8 data bits, no parity, 1 stop) |
| Control de flujo| Ninguno (XON/XOFF y RTS/CTS off)     |
| Encoding        | **UTF-8** (sin BOM)                  |
| Terminador      | `\n` (LF, 0x0A). El parser tolera `\r\n`. |
| Línea máxima    | **256 bytes** incluyendo `\n`. Líneas mayores se descartan con `BAD_JSON`. |

> **Razones**: la spec oficial NDJSON (https://github.com/ndjson/ndjson-spec) exige UTF-8 y `\n` como
> separador, con `\r\n` aceptado. ArduinoJson v7 documenta compatibilidad explícita con NDJSON
> (https://arduinojson.org/). 256 B alcanza con holgura para los mensajes de Fase A (el más grande,
> `motion_status`, mide ~140 B serializado).

## 2. Capa de mensaje — newline-delimited JSON

Cada mensaje es **un** documento JSON de tipo `object` que termina en `\n`. No se permiten
saltos de línea internos: ArduinoJson y `json.loads` los rechazarán. Los strings con caracteres
de control deben escapar `\n` como `\\n` (el RFC 8259 ya lo exige).

Ejemplo de tráfico (`>` = Jetson → ESP32, `<` = ESP32 → Jetson):

```
> {"cmd":"PING","seq":1}\n
< {"type":"motion_status","seq_ack":1,"state":"SAFE","mode":"SAFE","uptime_ms":1234,"err":"NONE"}\n
> {"cmd":"SET_MANUAL","seq":2}\n
< {"type":"motion_status","seq_ack":2,"state":"MANUAL_READY","mode":"MANUAL","uptime_ms":1290,"err":"NONE"}\n
```

## 3. Comandos de la Jetson hacia el ESP32 (Fase A)

Todos los comandos llevan `cmd` (string) y `seq` (uint32, monotónico, empieza en 1).

| `cmd`         | Significado                                                      | Parámetros extra |
|---------------|------------------------------------------------------------------|------------------|
| `PING`        | Heartbeat. Espera `motion_status`. Resetea el watchdog.          | —                |
| `STOP`        | Fuerza modo `SAFE`, todos los PWM lógicos a 1500 µs (neutro).    | —                |
| `STATUS`      | Solicita un `motion_status` sin cambiar de estado.               | —                |
| `SET_SAFE`    | Transiciona a `SAFE`.                                            | —                |
| `SET_MANUAL`  | Transiciona a `MANUAL_READY` (relé hacia control RF en Fase B).  | —                |
| `SET_AUTO`    | Transiciona a `AUTO_ARMED` (autopiloto, relé hacia ESP32).       | —                |

> Reglas obligatorias de transición:
> 1. Cualquier cambio de modo se precede internamente por `set_pwm_neutral()`.
> 2. Tras `set_pwm_neutral()` se aplica un retardo de seguridad de **20 ms** antes de
>    conmutar el relé y antes de aceptar setpoints (Fase B).
> 3. Si llega un comando desconocido se responde con `err = UNKNOWN_CMD` sin cambiar de estado.
> 4. Si el JSON es inválido (no parsea, falta `cmd`, `cmd` no es string, línea > 256 B) se
>    responde con `err = BAD_JSON` y `seq_ack = 0`.

## 4. Mensajes del ESP32 hacia la Jetson

Todos los mensajes ESP32 → Jetson son de tipo `motion_status` (un solo tipo en Fase A).

### 4.1 `motion_status`

| Campo       | Tipo     | Descripción                                                    |
|-------------|----------|----------------------------------------------------------------|
| `type`      | string   | Siempre `"motion_status"`.                                     |
| `seq_ack`   | uint32   | `seq` del último comando válido procesado. `0` si fue espontáneo (timeout o boot). |
| `state`     | string   | Estado de la FSM: `BOOT`, `SAFE`, `MANUAL_READY`, `AUTO_ARMED`, `AUTO_RUNNING`, `FAILSAFE`. |
| `mode`      | string   | Modo de control aplicado al relé/PWM: `SAFE`, `MANUAL`, `AUTO`. |
| `uptime_ms` | uint32   | `millis()` del ESP32 al construir el mensaje.                  |
| `err`       | string   | Último error detectado (ver tabla §5). `NONE` si todo OK.      |
| `last_cmd`  | string   | Eco del último `cmd` recibido. Vacío si nunca se recibió.       |
| `fw`        | string   | Versión del firmware. Ejemplo `"mango-motion-0.1.0"`.          |

Ejemplo:
```json
{"type":"motion_status","seq_ack":42,"state":"AUTO_ARMED","mode":"AUTO","uptime_ms":98765,"err":"NONE","last_cmd":"SET_AUTO","fw":"mango-motion-0.1.0"}
```

### 4.2 Cuándo se emite

- Después de **cada** comando recibido (válido o inválido).
- Cuando el ESP32 entra en `FAILSAFE` por timeout (espontáneo, `seq_ack = 0`).
- Una vez al boot tras `Serial.begin` (espontáneo).
- A petición vía `STATUS`.

## 5. Códigos de error (`err`)

| Código          | Origen                                                                |
|-----------------|-----------------------------------------------------------------------|
| `NONE`          | Operación normal.                                                     |
| `TIMEOUT`       | No llegó ningún comando válido en 1000 ms ⇒ entró en `FAILSAFE`.      |
| `BAD_JSON`      | Línea no parseable, sobrepasó 256 B, o faltó el campo `cmd`.          |
| `UNKNOWN_CMD`   | `cmd` no reconocido en este firmware.                                 |
| `INVALID_MODE`  | Transición de modo no permitida (p.ej. `SET_AUTO` desde `FAILSAFE` antes de `SET_SAFE`). |

## 6. Máquina de estados

```
                +--------+
   power on --> |  BOOT  |  -- después de print(motion_status) -->
                +--------+
                     |
                     v
                +--------+      SET_MANUAL       +---------------+
                |  SAFE  | --------------------> | MANUAL_READY  |
                |        | <-- SET_SAFE -------- |               |
                |        |                       +-------+-------+
                |        |                               |
                |        |   SET_AUTO                    | (Fase B: setpoint)
                |        | --------------------> +---------------+
                |        | <-- SET_SAFE -------- |  AUTO_ARMED   |
                |        |                       |               |
                |        |                       +-------+-------+
                |        |                               | (Fase B)
                |        |                               v
                |        |                       +---------------+
                |        | <-- STOP / SET_SAFE - | AUTO_RUNNING  |
                +--------+                       +---------------+
                     ^                                   |
                     |  STOP / SET_SAFE                  |
                     |                                   |
                     |       1000 ms sin cmd válido      |
                     +---------- FAILSAFE <--------------+
                                    |
                                    | (cualquier cmd válido tras
                                    |  emitir motion_status err=TIMEOUT)
                                    v
                                  SAFE
```

**Reglas formales:**
- Origen de toda transición a `SAFE`: comando `STOP` o `SET_SAFE`. Estas siempre son aceptadas.
- Toda transición a `AUTO_*` o `MANUAL_*` invoca `set_pwm_neutral()` ANTES de actualizar el modo
  y espera 20 ms antes de cualquier acción posterior.
- En `FAILSAFE` solo se aceptan `STOP`, `SET_SAFE`, `PING`, `STATUS`. Cualquier `SET_MANUAL`/`SET_AUTO`
  responde `err = INVALID_MODE` hasta que el operador haya pasado por `SAFE` explícitamente.
- En `BOOT`, el primer mensaje emitido es un `motion_status` con `state = "SAFE"` (auto-transición).

## 7. Numeración `seq` / `seq_ack` y paquetes perdidos

- La Jetson incrementa `seq` en cada comando que envía (`uint32`, wrap a 1 después de 2^32 - 1).
- El ESP32 copia el `seq` del último comando válido en `seq_ack`.
- En `motion_status` espontáneos (timeout, boot), `seq_ack = 0`.
- La Jetson detecta paquetes perdidos así: si tras 200 ms de mandar `cmd` con `seq = N` no recibió
  un `motion_status` con `seq_ack = N`, reintenta una vez. Si tras dos reintentos (≈ 600 ms total)
  no hay respuesta, el cliente Python marca el enlace como degradado y el ESP32 entrará en
  `FAILSAFE` por su cuenta a los 1000 ms.
- El ESP32 NO mantiene buffer de comandos: si recibe dos comandos antes de procesar, ambos se
  procesan en orden de llegada y se emiten dos `motion_status`.

## 8. Reglas de seguridad de Fase A

1. **Watchdog de aplicación**: si `millis() - last_valid_cmd_ms >= 1000`, transición forzada a
   `FAILSAFE`, `set_pwm_neutral()`, emitir `motion_status` con `err = TIMEOUT`.
2. **Secuencia de cambio de modo** (regla "neutro → delay → cambio"):
   ```
   set_pwm_neutral();   // todos los canales lógicos a 1500 µs
   delay_ms(20);        // ventana segura para que el relé y los ESC reconozcan neutro
   apply_new_mode();    // recién aquí cambia el modo / relé
   ```
3. **STOP es prioritario**: aceptado en cualquier estado y nunca devuelve `INVALID_MODE`.
4. **Comandos espontáneos del ESP32 al boot**: el primer `motion_status` se emite con
   `state = SAFE` y `seq_ack = 0` para que la Jetson pueda detectar reinicios involuntarios.

## 9. Compatibilidad hacia adelante (no implementar en Fase A, solo reservar)

- Se reservan los campos `imu` (objeto) y `setpoint` (objeto) en `motion_status` y en comandos
  futuros. Los implementadores Fase A deben **ignorar** silenciosamente cualquier campo
  desconocido (ArduinoJson v7 lo hace por defecto).
- Versión del protocolo: si en el futuro hay un cambio incompatible se añadirá `proto: 2` al
  `motion_status`. La ausencia equivale a `proto: 1`.

---

### 2. `firmware/motion_esp32/platformio.ini`

```ini
; ============================================================================
; M.A.N.G.O. — Firmware del subcerebro de movimiento (ESP32)
; Fase A: solo protocolo serial. Sin PWM real, sin BNO080, sin relé.
; Plataforma: Espressif ESP32 DevKit V1 (board = esp32dev)
; Framework: Arduino sobre PlatformIO
; Doc oficial: https://docs.platformio.org/en/latest/boards/espressif32/esp32dev.html
; ============================================================================

[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino

; Monitor serial: 115200 8N1, terminador LF (newline-delimited JSON)
monitor_speed = 115200
monitor_filters = direct
upload_speed = 921600

; Dependencias.
; - bblanchon/ArduinoJson 7.4.x: última estable (7.4.3, jun 2025).
;   Soporte oficial NDJSON, JsonDocument elástico (heap-resident).
;   Doc: https://arduinojson.org/v7/
lib_deps =
    bblanchon/ArduinoJson @ ^7.4.0

; Flags de compilación: warnings como errores para no dejarlos pasar.
build_flags =
    -DCORE_DEBUG_LEVEL=0
    -DMANGO_FW_VERSION=\"mango-motion-0.1.0\"
    -Wall
    -Wextra
    -Wno-unused-parameter
```

> **Notas**: el board `esp32dev` está documentado como ID oficial para “Espressif ESP32 Dev Module”. Si tu placa concreta es la “DOIT ESP32 DEVKIT V1” puedes cambiar a `board = esp32doit-devkit-v1`; el código compila igual.

---

### 3. `firmware/motion_esp32/src/main.cpp`

```cpp
// ============================================================================
//  M.A.N.G.O. — Subcerebro de movimiento (ESP32) — Fase A
//  --------------------------------------------------------------------------
//  Implementa el protocolo serial Jetson <-> ESP32 descrito en:
//    docs/protocols/MOTION_SERIAL_PROTOCOL.md
//
//  Esta build NO mueve motores reales, NO conmuta el relé y NO lee la IMU.
//  Sólo:
//    - parsea NDJSON línea por línea sobre Serial (115200 8N1, USB-CDC)
//    - mantiene una FSM (BOOT -> SAFE <-> MANUAL_READY <-> AUTO_ARMED ...
//                       ... <-> AUTO_RUNNING -> FAILSAFE -> SAFE)
//    - imprime motion_status tras cada comando y al expirar el watchdog
//    - llama a set_pwm_neutral() como STUB (sólo log) en cada cambio de modo
//
//  Fuentes oficiales consultadas:
//    - ArduinoJson v7: https://arduinojson.org/v7/api/json/deserializejson/
//    - ESP32 Arduino HardwareSerial:
//        https://docs.espressif.com/projects/arduino-esp32/en/latest/api/serial.html
//    - NDJSON spec: https://github.com/ndjson/ndjson-spec
// ============================================================================

#include <Arduino.h>
#include <ArduinoJson.h>   // 7.4.x — JsonDocument elástico, NDJSON-friendly

// --------------------------------------------------------------------------
// Constantes globales
// --------------------------------------------------------------------------
static constexpr uint32_t SERIAL_BAUD          = 115200;
static constexpr size_t   LINE_BUF_MAX         = 256;     // ver §1 del protocolo
static constexpr uint32_t HEARTBEAT_TIMEOUT_MS = 1000;    // ver §8 del protocolo
static constexpr uint32_t MODE_CHANGE_DELAY_MS = 20;      // ver §8.2 del protocolo

#ifndef MANGO_FW_VERSION
#define MANGO_FW_VERSION "mango-motion-0.1.0"
#endif

// --------------------------------------------------------------------------
// Tipos: estados, modos, errores
// --------------------------------------------------------------------------
enum class State : uint8_t {
    BOOT,
    SAFE,
    MANUAL_READY,
    AUTO_ARMED,
    AUTO_RUNNING,
    FAILSAFE
};

enum class Mode : uint8_t {
    SAFE,
    MANUAL,
    AUTO
};

enum class ErrCode : uint8_t {
    NONE,
    TIMEOUT,
    BAD_JSON,
    UNKNOWN_CMD,
    INVALID_MODE
};

// --------------------------------------------------------------------------
// Estado global del firmware (Fase A: variables planas; Fase B podrían vivir
// en un objeto MotionController).
// --------------------------------------------------------------------------
static State    g_state          = State::BOOT;
static Mode     g_mode           = Mode::SAFE;
static ErrCode  g_last_err       = ErrCode::NONE;
static uint32_t g_last_seq_ack   = 0;
static uint32_t g_last_valid_cmd_ms = 0;
static char     g_last_cmd[24]   = {0};

// Buffer de línea no bloqueante
static char   g_line_buf[LINE_BUF_MAX];
static size_t g_line_len = 0;
static bool   g_line_overflow = false;

// --------------------------------------------------------------------------
// Helpers de stringificación (alineados con el protocolo)
// --------------------------------------------------------------------------
static const char* state_to_str(State s) {
    switch (s) {
        case State::BOOT:         return "BOOT";
        case State::SAFE:         return "SAFE";
        case State::MANUAL_READY: return "MANUAL_READY";
        case State::AUTO_ARMED:   return "AUTO_ARMED";
        case State::AUTO_RUNNING: return "AUTO_RUNNING";
        case State::FAILSAFE:     return "FAILSAFE";
    }
    return "?";
}

static const char* mode_to_str(Mode m) {
    switch (m) {
        case Mode::SAFE:   return "SAFE";
        case Mode::MANUAL: return "MANUAL";
        case Mode::AUTO:   return "AUTO";
    }
    return "?";
}

static const char* err_to_str(ErrCode e) {
    switch (e) {
        case ErrCode::NONE:         return "NONE";
        case ErrCode::TIMEOUT:      return "TIMEOUT";
        case ErrCode::BAD_JSON:     return "BAD_JSON";
        case ErrCode::UNKNOWN_CMD:  return "UNKNOWN_CMD";
        case ErrCode::INVALID_MODE: return "INVALID_MODE";
    }
    return "?";
}

// --------------------------------------------------------------------------
// HARDWARE STUBS — aquí se conectarán las salidas reales en Fase B.
// --------------------------------------------------------------------------

// TODO(Fase B): conectar ledcWrite() o ESP32Servo a 3 canales PWM (2 horiz + 1 vert).
//               Pulso neutro = 1500 µs @ 50 Hz para ESC marinos APISQUEEN.
//               Documentación de referencia: jkb-git/ESP32Servo (default neutro 1500 µs).
static void set_pwm_neutral() {
    // En Fase A solo loggeamos por consola interna (no por Serial principal,
    // para no contaminar el stream NDJSON de la Jetson).
    // Cuando se conecten los ESC reales, AQUÍ se llama writeMicroseconds(1500)
    // para los 3 canales antes de cualquier conmutación de relé.
}

// TODO(Fase B): conectar el GPIO del relé que selecciona RF (manual) vs ESP32 (auto).
static void set_relay_for_mode(Mode /*new_mode*/) {
    // Stub. En Fase A no se toca hardware.
}

// TODO(Fase F+): integrar BNO080 vía SPI/I2C y publicar yaw/pitch/roll en motion_status.imu.
// (Fase A no la inicializa).

// --------------------------------------------------------------------------
// Emisión de motion_status
// --------------------------------------------------------------------------
static void emit_motion_status(uint32_t seq_ack, ErrCode err) {
    JsonDocument doc;
    doc["type"]      = "motion_status";
    doc["seq_ack"]   = seq_ack;
    doc["state"]     = state_to_str(g_state);
    doc["mode"]      = mode_to_str(g_mode);
    doc["uptime_ms"] = (uint32_t) millis();
    doc["err"]       = err_to_str(err);
    doc["last_cmd"]  = g_last_cmd;
    doc["fw"]        = MANGO_FW_VERSION;

    serializeJson(doc, Serial);
    Serial.print('\n');   // terminador NDJSON obligatorio (LF, 0x0A)
}

// --------------------------------------------------------------------------
// Lógica de transiciones — cumple §8 del protocolo (neutro -> delay -> mode)
// --------------------------------------------------------------------------
static bool try_set_mode(Mode new_mode, State new_state, ErrCode& out_err) {
    // Regla: STOP/SET_SAFE siempre aceptadas. Salir de FAILSAFE solo permitido
    // hacia SAFE (§8 y §6 del protocolo).
    if (g_state == State::FAILSAFE && new_state != State::SAFE) {
        out_err = ErrCode::INVALID_MODE;
        return false;
    }

    set_pwm_neutral();
    delay(MODE_CHANGE_DELAY_MS);     // ventana segura
    set_relay_for_mode(new_mode);    // stub en Fase A

    g_mode  = new_mode;
    g_state = new_state;
    out_err = ErrCode::NONE;
    return true;
}

// --------------------------------------------------------------------------
// Procesamiento de un comando ya parseado
// --------------------------------------------------------------------------
static void handle_command(const char* cmd, uint32_t seq) {
    // Guardamos eco del cmd
    strncpy(g_last_cmd, cmd, sizeof(g_last_cmd) - 1);
    g_last_cmd[sizeof(g_last_cmd) - 1] = '\0';

    ErrCode err = ErrCode::NONE;

    if (strcmp(cmd, "PING") == 0) {
        // No cambia el estado, solo refresca el watchdog (lo hace el caller).
    }
    else if (strcmp(cmd, "STATUS") == 0) {
        // Igual que PING: no cambia estado.
    }
    else if (strcmp(cmd, "STOP") == 0 || strcmp(cmd, "SET_SAFE") == 0) {
        try_set_mode(Mode::SAFE, State::SAFE, err);
    }
    else if (strcmp(cmd, "SET_MANUAL") == 0) {
        try_set_mode(Mode::MANUAL, State::MANUAL_READY, err);
    }
    else if (strcmp(cmd, "SET_AUTO") == 0) {
        try_set_mode(Mode::AUTO, State::AUTO_ARMED, err);
    }
    else {
        err = ErrCode::UNKNOWN_CMD;
    }

    // Comandos válidos resetean el watchdog (también UNKNOWN_CMD: la línea era JSON
    // bien formado, así que el enlace está vivo).
    g_last_valid_cmd_ms = millis();
    g_last_seq_ack      = seq;
    g_last_err          = err;

    emit_motion_status(seq, err);
}

// --------------------------------------------------------------------------
// Procesamiento de una línea recibida (puede ser JSON válido o basura)
// --------------------------------------------------------------------------
static void process_line(char* line, size_t len) {
    // Strip de \r al final (CRLF tolerado por la spec NDJSON).
    if (len > 0 && line[len - 1] == '\r') {
        line[len - 1] = '\0';
        len--;
    }
    if (len == 0) return;   // línea vacía: silencio

    // ArduinoJson v7: deserializeJson sobre buffer mutable -> zero-copy.
    JsonDocument doc;
    DeserializationError perr = deserializeJson(doc, line, len);
    if (perr) {
        g_last_err = ErrCode::BAD_JSON;
        emit_motion_status(0, ErrCode::BAD_JSON);
        return;
    }

    const char* cmd = doc["cmd"] | (const char*)nullptr;
    if (cmd == nullptr) {
        g_last_err = ErrCode::BAD_JSON;
        emit_motion_status(0, ErrCode::BAD_JSON);
        return;
    }

    // seq es opcional pero recomendado; si no viene asumimos 0.
    uint32_t seq = doc["seq"] | 0u;

    handle_command(cmd, seq);
}

// --------------------------------------------------------------------------
// Lectura no bloqueante de Serial (Serial.available + buffer hasta '\n')
// Implementación recomendada por la documentación ESP32 Arduino y por la
// guía martyncurrey.com (readBytesUntil bloquea hasta su timeout, lo cual
// rompe la latencia de la FSM; por eso lo evitamos).
// --------------------------------------------------------------------------
static void poll_serial() {
    while (Serial.available() > 0) {
        int ci = Serial.read();
        if (ci < 0) break;
        char c = (char) ci;

        if (c == '\n') {
            if (g_line_overflow) {
                // Línea más larga que LINE_BUF_MAX: la descartamos como BAD_JSON.
                emit_motion_status(0, ErrCode::BAD_JSON);
                g_line_len = 0;
                g_line_overflow = false;
                return;
            }
            g_line_buf[g_line_len] = '\0';
            process_line(g_line_buf, g_line_len);
            g_line_len = 0;
            g_line_overflow = false;
            return;   // procesamos UNA línea por iteración para dejar respirar al loop
        }

        if (g_line_len < LINE_BUF_MAX - 1) {
            g_line_buf[g_line_len++] = c;
        } else {
            g_line_overflow = true;
            // seguimos consumiendo hasta el próximo '\n' para resincronizar
        }
    }
}

// --------------------------------------------------------------------------
// Watchdog de aplicación (timeout 1000 ms, §8.1 del protocolo)
// --------------------------------------------------------------------------
static void check_heartbeat_timeout() {
    if (g_state == State::FAILSAFE) return;   // ya estamos en FAILSAFE
    if (millis() - g_last_valid_cmd_ms < HEARTBEAT_TIMEOUT_MS) return;

    // Forzamos neutro y entramos en FAILSAFE.
    set_pwm_neutral();
    delay(MODE_CHANGE_DELAY_MS);
    g_mode  = Mode::SAFE;
    g_state = State::FAILSAFE;
    g_last_err = ErrCode::TIMEOUT;
    emit_motion_status(0, ErrCode::TIMEOUT);
    g_last_valid_cmd_ms = millis();   // evita spam: re-emite cada 1000 ms
}

// --------------------------------------------------------------------------
// setup() / loop()
// --------------------------------------------------------------------------
void setup() {
    Serial.begin(SERIAL_BAUD);
    // Sin while(!Serial): en USB-CDC podría bloquear si la Jetson tarda en abrir.

    // Inicialización segura: PWM en neutro antes que nada.
    set_pwm_neutral();
    g_state = State::SAFE;
    g_mode  = Mode::SAFE;
    g_last_valid_cmd_ms = millis();

    // Mensaje de boot (espontáneo, seq_ack = 0). Esto le dice a la Jetson
    // "te reinicié, vuelve a sincronizar".
    emit_motion_status(0, ErrCode::NONE);
}

void loop() {
    poll_serial();
    check_heartbeat_timeout();
    // Dejamos al scheduler de FreeRTOS oxígeno (ESP32 Arduino corre loop() en una
    // tarea propia; sin yield explícito el WDT del IDLE task podría dispararse).
    delay(1);
}
```

---

### 4. `bridge/jetson_serial/requirements.txt`

```text
# pyserial 3.5 — release oficial (2020-11-23). Compatible con Python 2.7 y 3.4+.
# Esto es importante: la Jetson TK1 trae Ubuntu 14.04 con Python 3.4.3 por defecto;
# 3.5 es la última versión que sigue siendo instalable allí, y también funciona
# perfectamente en Python 3.6+ si se hace upgrade.
# Doc oficial: https://pyserial.readthedocs.io/en/latest/
pyserial==3.5
```

---

### 5. `bridge/jetson_serial/mango_serial.py`

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
mango_serial.py — Cliente Python para el subcerebro de movimiento ESP32.

Implementa:
- Detección automática de puerto (CP210x VID 0x10C4, CH340 VID 0x1A86, FT232 VID 0x0403,
  USB-CDC nativo del ESP32-S3 0x303A).
- Lectura asíncrona en thread de fondo.
- API pública: ping(), stop(), status(), set_mode(mode).
- Reconexión automática ante SerialException.

Compatible con Python >= 3.4 (Jetson TK1 / Ubuntu 14.04) y con Python 3.6+.
Requiere pyserial == 3.5.

Documentación de referencia:
- pyserial Short intro: https://pyserial.readthedocs.io/en/latest/shortintro.html
- list_ports: https://pyserial.readthedocs.io/en/stable/tools.html
- NDJSON spec: https://github.com/ndjson/ndjson-spec
"""

import json
import logging
import threading
import time
from queue import Queue, Empty

import serial
import serial.tools.list_ports

# ---------------------------------------------------------------------------
# Constantes
# ---------------------------------------------------------------------------
DEFAULT_BAUD = 115200
DEFAULT_TIMEOUT_S = 0.2     # readline timeout para no bloquear el thread reader
RESPONSE_TIMEOUT_S = 1.0    # cuánto esperar un motion_status tras enviar un cmd
RECONNECT_DELAY_S = 1.0
MAX_LINE_BYTES = 512        # margen sobre los 256 B del protocolo

# VID conocidos de chips USB-serial usados en placas ESP32.
# (Espressif ESP32-S3 nativo: 0x303A.)
KNOWN_USB_VIDS = {
    0x10C4,   # Silicon Labs CP210x
    0x1A86,   # WCH CH340 / CH341
    0x0403,   # FTDI FT232
    0x303A,   # Espressif (ESP32-S3 USB-JTAG nativo)
    0x067B,   # Prolific (PL2303)
}

# ---------------------------------------------------------------------------
# Logger
# ---------------------------------------------------------------------------
logger = logging.getLogger("mango.serial")
if not logger.handlers:
    _h = logging.StreamHandler()
    _h.setFormatter(logging.Formatter(
        "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    ))
    logger.addHandler(_h)
    logger.setLevel(logging.INFO)


# ---------------------------------------------------------------------------
# Detección de puerto
# ---------------------------------------------------------------------------
def autodetect_port():
    """Devuelve la ruta del primer puerto que parezca un ESP32, o None."""
    candidates = list(serial.tools.list_ports.comports())
    # 1) Por VID conocido
    for p in candidates:
        if p.vid is not None and p.vid in KNOWN_USB_VIDS:
            logger.info("Auto-detect: ESP32 detectado en %s (vid=0x%04X pid=0x%04X desc=%r)",
                        p.device, p.vid, p.pid or 0, p.description)
            return p.device
    # 2) Fallback heurístico por nombre de dispositivo
    for p in candidates:
        if any(p.device.startswith(prefix) for prefix in
               ("/dev/ttyUSB", "/dev/ttyACM")):
            logger.info("Auto-detect (fallback): %s (desc=%r)", p.device, p.description)
            return p.device
    return None


# ---------------------------------------------------------------------------
# Cliente
# ---------------------------------------------------------------------------
class MangoSerialClient:
    """Cliente de alto nivel para hablar con el ESP32 de movimiento."""

    def __init__(self, port=None, baud=DEFAULT_BAUD, auto_reconnect=True):
        self._port_arg = port
        self._baud = baud
        self._auto_reconnect = auto_reconnect

        self._ser = None
        self._reader_thread = None
        self._stop_event = threading.Event()
        self._rx_queue = Queue()           # cola de motion_status recibidos
        self._seq = 0
        self._seq_lock = threading.Lock()

    # -------------------------------------------------------------- lifecycle
    def connect(self):
        port = self._port_arg or autodetect_port()
        if port is None:
            raise RuntimeError(
                "No se encontró ningún puerto ESP32. Conéctalo o pasa port=... explícito."
            )
        logger.info("Abriendo %s @ %d baud", port, self._baud)
        self._ser = serial.Serial(
            port=port,
            baudrate=self._baud,
            bytesize=serial.EIGHTBITS,
            parity=serial.PARITY_NONE,
            stopbits=serial.STOPBITS_ONE,
            timeout=DEFAULT_TIMEOUT_S,
            xonxoff=False,
            rtscts=False,
            dsrdtr=False,
        )
        # Algunas placas se resetean al abrir el puerto (DTR toggling).
        time.sleep(2.0)
        try:
            self._ser.reset_input_buffer()
        except Exception:
            pass

        self._stop_event.clear()
        self._reader_thread = threading.Thread(
            target=self._reader_loop, name="mango-serial-reader", daemon=True
        )
        self._reader_thread.start()
        logger.info("Conectado y reader thread iniciado")

    def close(self):
        self._stop_event.set()
        if self._reader_thread is not None:
            self._reader_thread.join(timeout=2.0)
        if self._ser is not None:
            try:
                self._ser.close()
            except Exception:
                pass
        self._ser = None
        logger.info("Conexión cerrada")

    def __enter__(self):
        self.connect()
        return self

    def __exit__(self, exc_type, exc, tb):
        self.close()

    # -------------------------------------------------------------- reader
    def _reader_loop(self):
        buf = bytearray()
        while not self._stop_event.is_set():
            if self._ser is None:
                time.sleep(RECONNECT_DELAY_S)
                continue
            try:
                chunk = self._ser.read(128)   # respeta timeout=0.2 s
            except serial.SerialException as e:
                logger.warning("SerialException en read(): %s", e)
                self._handle_disconnect()
                continue
            except Exception as e:
                logger.error("Error inesperado en read(): %s", e)
                time.sleep(0.1)
                continue

            if not chunk:
                continue

            buf.extend(chunk)
            while b"\n" in buf:
                line, _, rest = buf.partition(b"\n")
                buf = bytearray(rest)
                if len(line) > MAX_LINE_BYTES:
                    logger.warning("Línea descartada (>%d bytes)", MAX_LINE_BYTES)
                    continue
                line_str = line.decode("utf-8", errors="replace").strip()
                if not line_str:
                    continue
                try:
                    msg = json.loads(line_str)
                except json.JSONDecodeError as e:
                    logger.warning("JSON inválido del ESP32: %r (%s)", line_str, e)
                    continue
                logger.debug("RX %s", msg)
                self._rx_queue.put(msg)

    def _handle_disconnect(self):
        logger.warning("Enlace serial perdido")
        try:
            if self._ser is not None:
                self._ser.close()
        except Exception:
            pass
        self._ser = None
        if not self._auto_reconnect:
            return
        # bucle de reconexión
        while not self._stop_event.is_set():
            time.sleep(RECONNECT_DELAY_S)
            try:
                port = self._port_arg or autodetect_port()
                if port is None:
                    continue
                self._ser = serial.Serial(
                    port=port, baudrate=self._baud,
                    timeout=DEFAULT_TIMEOUT_S,
                )
                logger.info("Reconectado a %s", port)
                return
            except Exception as e:
                logger.debug("Intento de reconexión falló: %s", e)

    # -------------------------------------------------------------- send/recv
    def _next_seq(self):
        with self._seq_lock:
            self._seq = (self._seq % 0xFFFFFFFF) + 1
            return self._seq

    def _send_command(self, cmd, expect_response=True, timeout_s=RESPONSE_TIMEOUT_S):
        if self._ser is None:
            raise RuntimeError("No conectado. Llama a connect() primero.")
        seq = self._next_seq()
        payload = json.dumps({"cmd": cmd, "seq": seq}, separators=(",", ":"))
        line = (payload + "\n").encode("utf-8")
        logger.debug("TX %s", payload)
        try:
            self._ser.write(line)
            self._ser.flush()
        except serial.SerialException as e:
            self._handle_disconnect()
            raise

        if not expect_response:
            return None
        # Esperamos un motion_status con seq_ack == seq
        deadline = time.monotonic() + timeout_s
        while time.monotonic() < deadline:
            remaining = max(0.01, deadline - time.monotonic())
            try:
                msg = self._rx_queue.get(timeout=remaining)
            except Empty:
                break
            if msg.get("type") == "motion_status" and msg.get("seq_ack") == seq:
                return msg
            # otros mensajes (espontáneos, motion_status de cmds previos): los ignoramos
            logger.debug("Descartado mientras esperaba seq=%d: %s", seq, msg)
        raise TimeoutError(
            "No llegó motion_status para cmd=%s seq=%d en %.1f s" % (cmd, seq, timeout_s)
        )

    # -------------------------------------------------------------- API pública
    def ping(self, timeout_s=RESPONSE_TIMEOUT_S):
        return self._send_command("PING", timeout_s=timeout_s)

    def stop(self, timeout_s=RESPONSE_TIMEOUT_S):
        return self._send_command("STOP", timeout_s=timeout_s)

    def status(self, timeout_s=RESPONSE_TIMEOUT_S):
        return self._send_command("STATUS", timeout_s=timeout_s)

    def set_mode(self, mode, timeout_s=RESPONSE_TIMEOUT_S):
        mode = mode.lower()
        cmd_map = {"safe": "SET_SAFE", "manual": "SET_MANUAL", "auto": "SET_AUTO"}
        if mode not in cmd_map:
            raise ValueError("mode debe ser uno de: safe, manual, auto")
        return self._send_command(cmd_map[mode], timeout_s=timeout_s)

    def drain_async(self):
        """Devuelve y vacía todos los mensajes asíncronos pendientes."""
        out = []
        while True:
            try:
                out.append(self._rx_queue.get_nowait())
            except Empty:
                break
        return out
```

---

### 6. `bridge/jetson_serial/cli.py`

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
cli.py — Pequeña REPL para probar el cliente MangoSerial desde terminal.

Uso:
    python3 cli.py                 # auto-detecta el puerto
    python3 cli.py /dev/ttyUSB0    # puerto explícito

Comandos soportados:
    ping
    stop
    status
    mode safe | mode manual | mode auto
    quit
"""

import sys
import logging
from mango_serial import MangoSerialClient


def main():
    port = sys.argv[1] if len(sys.argv) > 1 else None
    logging.getLogger("mango.serial").setLevel(logging.INFO)

    with MangoSerialClient(port=port) as client:
        print("M.A.N.G.O. CLI — escribe 'quit' para salir.")
        while True:
            try:
                line = input("> ").strip().lower()
            except (EOFError, KeyboardInterrupt):
                print()
                break
            if not line:
                continue
            if line in ("quit", "exit", "q"):
                break
            try:
                if line == "ping":
                    print(client.ping())
                elif line == "stop":
                    print(client.stop())
                elif line == "status":
                    print(client.status())
                elif line.startswith("mode "):
                    print(client.set_mode(line.split(None, 1)[1]))
                else:
                    print("comandos: ping | stop | status | mode {safe|manual|auto} | quit")
            except TimeoutError as e:
                print("TIMEOUT:", e)
            except Exception as e:
                print("ERROR:", e)


if __name__ == "__main__":
    main()
```

---

### 7. `tests/serial_ping_stop_test.py`

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test de humo end-to-end de la Fase A.

Requiere:
- ESP32 flasheado con firmware/motion_esp32 y conectado por USB.
- pyserial == 3.5

Ejecución:
    pytest -v tests/serial_ping_stop_test.py
o bien
    python3 tests/serial_ping_stop_test.py
"""

import os
import sys
import time
import json

# Permite ejecutar tanto con pytest como con python directo
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "bridge", "jetson_serial"))

import serial  # noqa: E402
from mango_serial import MangoSerialClient, autodetect_port  # noqa: E402

PORT = os.environ.get("MANGO_PORT") or autodetect_port()
assert PORT, "No se detectó ningún ESP32; exporta MANGO_PORT=/dev/ttyUSB0"


# ---------------------------------------------------------------------------
# Helpers para asserts simples (también funcionan sin pytest)
# ---------------------------------------------------------------------------
def _assert(cond, msg):
    if not cond:
        raise AssertionError(msg)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------
def test_ping_responds():
    with MangoSerialClient(port=PORT) as c:
        msg = c.ping()
        _assert(msg["type"] == "motion_status", "type incorrecto: %r" % msg)
        _assert(msg["err"] == "NONE", "err esperado NONE: %r" % msg)
        _assert(msg["state"] in ("SAFE", "MANUAL_READY", "AUTO_ARMED"),
                "state inesperado: %r" % msg)


def test_stop_forces_safe():
    with MangoSerialClient(port=PORT) as c:
        c.set_mode("manual")
        msg = c.stop()
        _assert(msg["state"] == "SAFE", "Tras STOP el state debe ser SAFE: %r" % msg)
        _assert(msg["mode"] == "SAFE",  "Tras STOP el mode debe ser SAFE: %r" % msg)


def test_timeout_triggers_failsafe():
    """Abrimos el puerto, mandamos un STOP para sincronizar, y luego no enviamos
    nada por 1500 ms. Debe llegar un motion_status espontáneo con err=TIMEOUT."""
    with MangoSerialClient(port=PORT) as c:
        c.stop()                       # sincroniza watchdog
        c.drain_async()                # limpia cola
        time.sleep(1.5)                # > HEARTBEAT_TIMEOUT_MS
        events = c.drain_async()
        timeouts = [e for e in events
                    if e.get("type") == "motion_status" and e.get("err") == "TIMEOUT"]
        _assert(len(timeouts) >= 1,
                "Esperaba al menos un motion_status con err=TIMEOUT, recibí: %r" % events)
        _assert(timeouts[-1]["state"] == "FAILSAFE",
                "Tras TIMEOUT el state debe ser FAILSAFE: %r" % timeouts[-1])


def test_bad_json_returns_bad_json_error():
    """Bypaseamos el cliente para mandar basura cruda."""
    s = serial.Serial(PORT, 115200, timeout=1.0)
    time.sleep(2.0)
    try:
        s.reset_input_buffer()
        s.write(b"this is not json\n")
        s.flush()
        deadline = time.monotonic() + 2.0
        got_bad = False
        while time.monotonic() < deadline:
            line = s.readline()
            if not line:
                continue
            try:
                msg = json.loads(line.decode("utf-8", errors="replace").strip())
            except Exception:
                continue
            if msg.get("err") == "BAD_JSON":
                got_bad = True
                break
        _assert(got_bad, "No llegó err=BAD_JSON ante línea no parseable")
    finally:
        s.close()


# ---------------------------------------------------------------------------
# Runner sin pytest
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    for fn in (test_ping_responds, test_stop_forces_safe,
               test_timeout_triggers_failsafe, test_bad_json_returns_bad_json_error):
        print("==", fn.__name__)
        fn()
        print("   OK")
    print("Todos los tests pasaron ✅")
```

---

### 8. `tests/README.md`

```markdown
# Tests de humo Fase A

## Requisitos
- ESP32 flasheado con `firmware/motion_esp32` (Fase A).
- ESP32 conectado por USB a la PC o Jetson.
- Python 3.4+ con `pyserial == 3.5` (`pip install -r bridge/jetson_serial/requirements.txt`).
- Usuario en grupo `dialout` (Linux): `sudo usermod -a -G dialout $USER && newgrp dialout`.

## Cómo correr

Con pytest (recomendado):

    pytest -v tests/serial_ping_stop_test.py

Sin pytest (asserts planos):

    python3 tests/serial_ping_stop_test.py

Si el autodetect no encuentra el puerto:

    MANGO_PORT=/dev/ttyUSB0 pytest -v tests/serial_ping_stop_test.py

## Qué cubre

1. `test_ping_responds`: PING → llega motion_status válido.
2. `test_stop_forces_safe`: STOP fuerza state=SAFE/mode=SAFE.
3. `test_timeout_triggers_failsafe`: 1.5 s sin tráfico → motion_status espontáneo con err=TIMEOUT.
4. `test_bad_json_returns_bad_json_error`: JSON inválido → err=BAD_JSON.
```

---

### 9. `docs/PHASE_A.md`

```markdown
# Fase A — Cimiento del enlace serial Jetson ↔ ESP32

## 0. Objetivo
Tener un enlace fiable, monitoreable y testeable entre Jetson y ESP32 antes de tocar
PWM real, relé, IMU o trayectorias. Si esto no es sólido, las fases siguientes serán imposibles
de depurar.

## 1. Flashear el ESP32 desde PlatformIO

1. Instala VSCode + extensión PlatformIO IDE.
2. Abre la carpeta `firmware/motion_esp32/`.
3. Conecta el ESP32 por USB. (Driver: CP210x si es el WROOM original, CH340 si es el clon).
4. Pulsa **Build** (✓), después **Upload** (→). PlatformIO descarga ArduinoJson 7.4.x
   automáticamente la primera vez (definido en `lib_deps`).
5. Abre **Serial Monitor** (icono de enchufe). Deberías ver una línea como:

       {"type":"motion_status","seq_ack":0,"state":"SAFE","mode":"SAFE","uptime_ms":12,"err":"NONE","last_cmd":"","fw":"mango-motion-0.1.0"}

   y luego, cada 1 s, otra con `err":"TIMEOUT"` (porque nadie le manda PING todavía).
   Esto es **lo correcto**: confirma que el watchdog funciona.

Por CLI, el equivalente es:

    cd firmware/motion_esp32
    pio run -t upload
    pio device monitor -b 115200

## 2. Correr el cliente Python en la Jetson

1. Conecta el ESP32 a un puerto USB-A de la Jetson TK1.
2. Asegúrate de estar en el grupo `dialout`:

       sudo usermod -a -G dialout $USER
       newgrp dialout

3. Crea un venv (opcional pero recomendado) e instala dependencias:

       cd bridge/jetson_serial
       python3 -m venv venv
       source venv/bin/activate
       pip install -r requirements.txt

4. Lanza la CLI:

       python3 cli.py

5. Prueba:

       > ping
       {'type':'motion_status', 'state':'SAFE', ...}
       > mode auto
       {'type':'motion_status', 'state':'AUTO_ARMED', ...}
       > stop
       {'type':'motion_status', 'state':'SAFE', ...}
       > quit

## 3. Checklist de validación de Fase A

Antes de pasar a Fase B (motores reales), asegúrate de marcar TODO esto:

- [ ] El firmware compila sin warnings nuevos.
- [ ] El monitor serial muestra el motion_status de boot al energizar el ESP32.
- [ ] `ping` responde con `err=NONE` y `seq_ack` igual al `seq` enviado.
- [ ] `stop` deja `state=SAFE`, `mode=SAFE`.
- [ ] Tras 1 s sin enviar nada, llega un motion_status espontáneo con `err=TIMEOUT` y `state=FAILSAFE`.
- [ ] Mandar `XYZ` (basura) por terminal devuelve `err=BAD_JSON`.
- [ ] `mode auto` desde `FAILSAFE` devuelve `err=INVALID_MODE` hasta haber pasado por `mode safe`.
- [ ] Los 4 tests de `tests/serial_ping_stop_test.py` pasan en verde.
- [ ] La Jetson tolera desconectar y reconectar el cable USB sin matar el proceso (auto-reconnect).

Si todo eso está OK, **la Fase A está cerrada**. Recién entonces se conecta el primer ESC al
GPIO de PWM y se reactiva `set_pwm_neutral()` con código real.

## 4. Troubleshooting

### `Could not open port /dev/ttyUSB0: Permission denied`
Tu usuario no está en `dialout`. Ejecuta `sudo usermod -a -G dialout $USER && newgrp dialout`.
Documentado en pyserial.com/docs/installation y reportado específicamente en Jetson en
thmosqueiro.vandroiy.com (a veces hay que tener el dispositivo conectado al boot para que el
udev rule aplique).

### `No se detectó ningún ESP32`
- `lsusb` debe mostrar el chip USB-serial (Silicon Labs CP210x o WCH CH340).
- `ls /dev/ttyUSB* /dev/ttyACM*` debe listar al menos un dispositivo.
- Pasa el puerto explícito: `python3 cli.py /dev/ttyUSB0`.

### El ESP32 reinicia al abrir el puerto
Es normal en placas que conectan DTR al pin EN. El cliente espera 2 s tras `Serial()` para
absorber ese reset. Si el reset es errático, mira si tu cable es solo de carga; cámbialo
por uno de datos.

### `JSON inválido del ESP32: ...`
Suele significar que algo está imprimiendo por el `Serial` principal sin terminar en `\n` o
con caracteres binarios. Revisa que NINGÚN log de debug en el firmware use `Serial.print*`
sin terminador (en Fase A no lo hacemos, pero si añades código nuevo, ojo).

### El timeout NO se dispara
- Verifica que tu monitor serie no esté reenviando nada (a veces el monitor reenvía LF al abrir).
- Confirma con un osciloscopio o `od -c < /dev/ttyUSB0` que el ESP32 no recibe ruido.
```

---

### 10. `docs/adr/0001-phase-a-serial-protocol.md`

```markdown
# ADR 0001 — Protocolo serial Fase A: NDJSON sobre UART/USB, sin ROS

- **Fecha:** 2026-05-08
- **Estado:** Accepted
- **Decisores:** equipo M.A.N.G.O.

## Contexto

El proyecto M.A.N.G.O. necesita comunicar la Jetson TK1 con dos ESP32 (movimiento + sensores).
La Fase A se limita al ESP32 de movimiento. Restricciones reales:

- El TK1 corre L4T R21.7 sobre Ubuntu 14.04 (kernel 3.10.40, CUDA 6.5). No vamos a actualizarlo.
- El equipo trabaja con C++ Arduino + PlatformIO en el ESP32 y Python plano en la Jetson.
- El proyecto tiene horizonte de varias fases (B-H) y no queremos que la Fase A nos amarre.
- La depuración tiene que ser posible sin herramientas más allá de un monitor serie y `cat`.

## Decisión

1. **Capa física**: UART nativo del ESP32 expuesto como USB-CDC, 115200 8N1, sin control de flujo.
2. **Capa de mensaje**: newline-delimited JSON (NDJSON), un objeto JSON por línea, terminador `\n`,
   UTF-8, longitud máxima 256 B (ver `docs/protocols/MOTION_SERIAL_PROTOCOL.md`).
3. **Lib JSON en ESP32**: ArduinoJson 7.4.x, `JsonDocument` elástico (heap).
4. **Cliente Jetson**: Python 3 + pyserial 3.5 + `json` de la stdlib + un thread de lectura.
5. **Sin ROS, sin RTOS task tuning, sin protobuf, sin MQTT.**

## Alternativas descartadas

- **ROS 1/2 sobre Jetson TK1**: ROS 2 no soporta Ubuntu 14.04; ROS 1 Indigo está EOL desde 2019.
  Aún si compiláramos algo, agregaría una dependencia masiva para una Fase A que solo manda PING.
  Se pospone a Fase F o G.
- **MQTT (sobre TCP/Wi-Fi)**: añadiría broker, configuración de red, latencia y dependencia eléctrica
  innecesaria para un enlace cableado de 30 cm.
- **Protocol Buffers / nanopb**: más eficiente en bytes y CPU, pero no se puede inspeccionar con
  `cat` ni con un terminal serie. La pérdida de “debugabilidad humana” no compensa en esta fase.
- **ESP-IDF puro (en lugar de Arduino)**: el equipo ya conoce Arduino y la latencia de un USB-CDC a
  115200 no exige las APIs de bajo nivel de IDF. Si en Fase D necesitamos timing duro, se evaluará.
- **Binario empaquetado custom (cabecera + payload + CRC)**: implementación más larga y más
  propensa a errores que NDJSON, sin beneficios mensurables a 115200 con mensajes < 200 B.
- **Múltiples mensajes por línea (concatenated JSON)**: rechazado porque ArduinoJson recomienda
  oficialmente NDJSON para streaming, y `cat` no podría separarlos legiblemente.

## Consecuencias

**Positivas**
- Se puede depurar con `cat /dev/ttyUSB0`, `screen`, PlatformIO Serial Monitor, o cualquier consola.
- Un mensaje malformado no rompe el siguiente: el parser se resincroniza al próximo `\n`.
- Extensible: añadir un campo nuevo a `motion_status` no rompe clientes viejos (ArduinoJson y
  `json.loads` ignoran campos desconocidos).
- Cero dependencias en Jetson más allá de pyserial 3.5, que está empaquetado para Ubuntu 14.04
  (`apt install python3-serial`) y también disponible vía pip para Python 3.6+.

**Negativas / trade-offs**
- ~3-4× overhead en bytes vs binario crudo. A 115200 y mensajes < 200 B es despreciable
  (>500 mensajes/s teóricos).
- JSON parsing en el ESP32 cuesta unos cientos de microsegundos por mensaje. Aceptable: el
  watchdog corre a 1 Hz, no a 1 kHz.
- El timeout de 1000 ms se hace por software (millis), no por watchdog hardware. En Fase B con
  motores reales se reforzará con `esp_task_wdt_*` además del watchdog de aplicación.

## Compromisos para Fase B+

- La capa física y el formato NDJSON quedan congelados. Sólo se añadirán comandos y campos
  opcionales nuevos.
- Si se necesita más ancho de banda (telemetría IMU a 100 Hz en Fase F), se valorará abrir un
  segundo `Serial` (UART2 del ESP32) para telemetría, manteniendo USB-CDC para comandos.
```

---

### 11. Estrategia de migración del repo `T4t4n32/M_A_N_G_O`

**Branch sugerido:** `feature/phase-a-serial-protocol`

**Pasos exactos:**

```bash
# 1. Clonar y actualizar
git clone https://github.com/T4t4n32/M_A_N_G_O.git
cd M_A_N_G_O
git checkout main
git pull --ff-only

# 2. Crear el branch de Fase A
git checkout -b feature/phase-a-serial-protocol

# 3. Archivar lo viejo (sin borrarlo) en una carpeta histórica
mkdir -p legacy/pre-phase-a
git mv $(git ls-files | grep -v -E '^(\.git|\.gitignore|README|LICENSE)') legacy/pre-phase-a/ 2>/dev/null || true
# Revisa manualmente que NO se haya movido la carpeta firmware/, bridge/, docs/, tests/
# si ya existen con nombres compatibles. Si existen, decide caso por caso.

# 4. Pegar el paquete nuevo en la raíz, con la estructura indicada arriba
#    (firmware/motion_esp32/, bridge/jetson_serial/, docs/, tests/).

# 5. Añadir/actualizar .gitignore
cat >> .gitignore <<'EOF'
# PlatformIO
.pio/
.pioenvs/
.piolibdeps/
.vscode/
# Python
__pycache__/
*.pyc
.venv/
venv/
EOF

# 6. Commit inicial
git add .
git commit -m "feat(phase-a): protocolo serial NDJSON Jetson<->ESP32, FSM y failsafe

- Añade firmware/motion_esp32 (PlatformIO + Arduino + ArduinoJson 7.4.x)
- Añade bridge/jetson_serial (cliente Python con pyserial 3.5, threading, autodetect)
- Añade docs/protocols/MOTION_SERIAL_PROTOCOL.md (spec completa)
- Añade docs/PHASE_A.md y docs/adr/0001-phase-a-serial-protocol.md
- Añade tests/serial_ping_stop_test.py (4 tests de humo end-to-end)
- Mueve archivos previos a legacy/pre-phase-a/ para preservar historia

Cierre de Fase A: solo protocolo + FSM + failsafe (1000 ms). Sin PWM real,
sin relé, sin BNO080. Hooks set_pwm_neutral() y set_relay_for_mode() listos
para Fase B."

# 7. Subir y abrir PR
git push -u origin feature/phase-a-serial-protocol
```

**Qué conservar / qué archivar:**
- **Conservar en raíz**: `README.md` existente (actualízalo con el link a `docs/PHASE_A.md`),
  `LICENSE` si existe, `.gitignore`.
- **Archivar en `legacy/pre-phase-a/`**: cualquier sketch `.ino` antiguo, scripts sueltos,
  exploraciones de Kinect/SLAM previas. **No borrar**, solo mover. Esto preserva trazabilidad
  histórica y permite rescatar piezas si se necesitan en Fase H.

---

## Investigación complementaria (sin desviar el foco)

### Kinect V1 (modelo 1414, original Xbox 360) sobre Jetson TK1 — para Fase H

- **Driver**: `OpenKinect/libfreenect` (no `libfreenect2`, que es solo para Kinect V2).
  Se compila desde fuente en TK1 con dependencias `cmake freeglut3-dev libxmu-dev libxi-dev libusb-1.0-0-dev`.
- **Issue principal en TK1**: el USB autosuspend del kernel L4T 21.x apaga el puerto y el Kinect
  se desconecta. Hay que añadir a `/etc/rc.local`:

      echo -1 > /sys/module/usbcore/parameters/autosuspend

  o en `/boot/extlinux/extlinux.conf` añadir `usbcore.autosuspend=-1` a APPEND. Documentado en
  jetsonhacks.com/2014/07/14/jetson-tk1-microsoft-kinect-using-openkinect.

- **Permisos**: copiar `libfreenect/platform/linux/udev/51-kinect.rules` a `/etc/udev/rules.d/`
  y añadir el usuario al grupo `video`.

- **Alimentación**: el Kinect V1 oficial trae un adaptador de 12 V. Si el suyo está roto por
  alimentación insuficiente (como reporta el equipo), conectarlo solo al USB del TK1 NO basta:
  necesita el adaptador o una fuente externa 12 V/1.5 A.

- **USB 2.0 vs 3.0**: el Kinect V1 va por USB 2.0 sin problemas, así que conviene usar el puerto
  micro-USB del TK1 (J1C2 USB2) o un hub externo USB 2.0 alimentado, evitando el puerto USB 3.0
  que en el TK1 tuvo problemas históricos con `xhci_hcd`.

- **Modelos a evitar**: el modelo 1473 (revisión posterior) tiene problemas conocidos con
  libfreenect (motor y audio dejan de funcionar; OpenKinect issue #451). Para SLAM en Fase H
  conviene confirmar que el equipo tiene un 1414 antes de invertir tiempo.

### Limitaciones conocidas de pyserial en Jetson TK1 / Ubuntu 14.04

- **Versión disponible vía apt**: `python3-serial` en Ubuntu 14.04 viene en versión vieja (3.0.x).
  Para Fase A se recomienda `pip install pyserial==3.5` en venv y dejar el paquete del sistema en paz.
- **No hay limitación funcional** específica del TK1: el puerto USB-CDC del ESP32 aparece como
  `/dev/ttyUSB0` o `/dev/ttyACM0` igual que en cualquier x86. Sí hay que añadir el usuario al
  grupo `dialout` (esto es Linux genérico, no Jetson-específico).
- **Truco operativo reportado** (thmosqueiro.vandroiy.com): a veces el dispositivo necesita
  estar conectado en el momento del boot para que las reglas udev de `dialout` se apliquen
  consistentemente. Si tras `usermod` y `newgrp` sigues viendo `Permission denied`, reinicia
  el TK1 con el ESP32 enchufado.
- **Python 3.4.3 default**: pyserial 3.5 declara compatibilidad con Python 2.7 y ≥ 3.4, así que
  funciona tal cual. Si decides hacer upgrade a Python 3.6 vía deadsnakes-equivalente para TK1,
  el código de este paquete sigue siendo idéntico (no usa f-strings ni walrus, deliberadamente,
  para mantener compat con 3.4).

### Buenas prácticas NDJSON sobre serial

Resumidas de la spec oficial (github.com/ndjson/ndjson-spec) y de jsonlines.org:

- **Terminador**: `\n` (LF, 0x0A). Acepta `\r\n` opcionalmente. **No** uses `\r` solo.
- **Encoding**: UTF-8 sin BOM. Nunca UTF-16/UTF-32.
- **Una línea = un valor JSON completo**: nada de pretty-printing, nada de saltos internos.
- **Escapar saltos de línea dentro de strings** como `\\n`. ArduinoJson y `json.dumps` lo
  hacen automáticamente.
- **Longitud máxima recomendada**: aunque la spec no impone un límite, en sistemas embebidos
  con UART es buena práctica fijar uno (en este paquete: 256 B). Razones: el buffer RX por
  defecto del ESP32 Arduino es de 256 B; el de pyserial es elástico pero al pasar por
  `readline()` con un timeout de 0.2 s, líneas demasiado largas pueden cortarse.
- **MIME type**: `application/x-ndjson` (no aplica aquí porque es UART, pero útil si en Fase G
  expones esto vía HTTP/MQTT).
- **Resincronización**: el receptor descarta cualquier byte hasta el próximo `\n` cuando
  detecta JSON inválido. Esto es exactamente lo que hace `process_line()` en `main.cpp`.

---

## Recommendations (próximos pasos accionables)

1. **HOY**: pega el paquete en el repo siguiendo §11, abre PR `feature/phase-a-serial-protocol`,
   flashea un ESP32 cualquiera (no necesita estar montado en el robot) y corre los 4 tests.
   Si pasan, mergea a `main` con squash.
2. **Antes de Fase B**: completa el checklist de §9 (`docs/PHASE_A.md`). Ese checklist es la
   puerta de salida — si algo no está marcado, no toques motores.
3. **Fase B (motores reales)**: en `set_pwm_neutral()` reemplaza el cuerpo vacío por
   `ledcWrite()` o `Servo.writeMicroseconds(1500)` para los 3 canales (2 horizontales + 1 vertical),
   añade `Servo` o `ESP32Servo` en `lib_deps`, conecta el relé en `set_relay_for_mode()`. NO
   modifiques el protocolo: solo el contenido de los stubs.
4. **Fase F+ (IMU BNO080)**: añade un campo opcional `imu: {yaw, pitch, roll}` a `motion_status`.
   Esto es backwards-compatible, los clientes Fase A simplemente lo ignoran.
5. **Fase G (segundo ESP32 + LoRa)**: aplica el mismo patrón NDJSON con un `type` distinto
   (`sensors_status`). Reusa `MangoSerialClient` con un puerto adicional.
6. **Fase H (Kinect)**: antes de invertir tiempo, **verifica el modelo del Kinect** (debe ser
   1414, no 1473) y **diagnostica la fuente de poder rota**: el cable original de 12 V/1.5 A es
   reemplazable por cualquier fuente equivalente. Sin eso, libfreenect no enumerará el dispositivo
   por más que el USB esté bien.

**Umbrales que cambiarían estas recomendaciones:**
- Si los tests fallan con timeout intermitente en Jetson TK1 pero pasan en PC, sospecha del
  USB autosuspend del TK1 (mismo síntoma que con el Kinect). Aplica `usbcore.autosuspend=-1`.
- Si en Fase B observas que los ESC se arman en el momento equivocado al cambiar de modo,
  sube `MODE_CHANGE_DELAY_MS` de 20 a 100. Es seguro hacerlo: el protocolo no impone un
  máximo.
- Si necesitas más de ~50 mensajes/s sostenidos (telemetría IMU densa), salta a 921600 baud
  o abre un segundo UART; no intentes acelerar a 1 Mbaud sobre USB-CDC del ESP32 original
  (es inestable; el ESP32-S3 con USB nativo sí lo aguanta).

---

## Caveats

- **El repo `T4t4n32/M_A_N_G_O` no fue accesible directamente** desde este entorno de
  investigación (la API de fetch lo bloqueó). El plan de migración de §11 es genérico para
  cualquier estado actual del repo: si el repo ya tiene una carpeta `firmware/` o `bridge/`,
  el `git mv` a `legacy/pre-phase-a/` debe revisarse a mano antes de ejecutar.
- **Las versiones de ArduinoJson y pyserial son las últimas estables a la fecha (mayo 2026)**:
  ArduinoJson 7.4.3 (publicada jun 2025) y pyserial 3.5 (publicada nov 2020). pyserial no ha
  tenido nuevo release estable en >5 años; si publicaran 4.0 con cambios incompatibles,
  fija `pyserial==3.5` como ya hace `requirements.txt`.
- **El timeout de 1000 ms es por software (millis())**, no por watchdog hardware. Es deliberado
  para Fase A (no hay motores reales). Cuando entres a Fase B con propulsores, añade además un
  WDT de tarea (`esp_task_wdt_init` con timeout de ~3 s) como red de seguridad de segundo nivel.
- **El delay de 20 ms en cambio de modo (`MODE_CHANGE_DELAY_MS`)** es un valor conservador,
  no derivado de un datasheet específico de los APISQUEEN del proyecto. Si su manual dice algo
  distinto, ese valor es el que manda. Mantén la constante centralizada en `main.cpp` para
  poder ajustarla en una sola línea.
- **El auto-detect de puerto** asume que solo hay un ESP32 conectado a la Jetson. Cuando entre
  el segundo ESP32 (sensores + LoRa) en Fase G, el cliente Python tendrá que filtrar también
  por número de serie USB (`p.serial_number`), no solo por VID. Reserva ese cambio para Fase G.
- **La Fase A no implementa cifrado ni autenticación** del enlace. No es un problema mientras
  ambos extremos estén físicamente cableados dentro del mismo chasis. No expongas este UART
  por radio sin añadir antes una capa de integridad.