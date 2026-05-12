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