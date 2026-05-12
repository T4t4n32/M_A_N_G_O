%%
# MOTION_SERIAL_PROTOCOL

Protocolo inicial (Fase A) para control seguro Jetson/PC ↔ ESP32 Movimiento.

## Objetivo

Validar comunicación serial y seguridad antes de integrar SLAM/Kinect/sensores pesados.

## Transporte

- Medio: UART sobre USB (CDC)
- Formato: JSON por línea (`\n`)
- Baudrate inicial recomendado: `115200`
- Timeout de enlace: `1000 ms`

## Comandos permitidos en Fase A

- `PING`
- `STOP`
- `SET_SAFE`
- `SET_AUTO`
- `SET_MANUAL`
- `STATUS`

## Mensaje de comando

```json
{"type":"cmd_motion","seq":1,"cmd":"STOP","duration_ms":500}
```

Campos mínimos:

- `type`: siempre `cmd_motion`
- `seq`: entero incremental
- `cmd`: comando del set permitido
- `duration_ms`: obligatorio para comandos de movimiento (en Fase A solo se usa con STOP)

## Mensaje de estado

```json
{"type":"motion_status","seq_ack":1,"mode":"SAFE","left_pwm":1500,"right_pwm":1500,"vertical_pwm":1500,"error":"NONE"}
```

## Failsafe obligatorio

Si no llega ningún comando válido durante `1000 ms`:

1. Poner todos los PWM a neutro (1500 µs)
2. Cambiar a `SAFE`
3. Reportar `error: "TIMEOUT"`

## Criterio de aceptación Fase A

- Jetson/PC envía `PING` y recibe confirmación.
- Jetson/PC envía `STOP` periódicamente (cada 500 ms).
- ESP32 mantiene neutro y responde `motion_status`.
- Al cortar comandos por >1000 ms, entra en failsafe.
%%

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

{"cmd":"PING","seq":1}\n  
< {"type":"motion_status","seq_ack":1,"state":"SAFE","mode":"SAFE","uptime_ms":1234,"err":"NONE"}\n  
{"cmd":"SET_MANUAL","seq":2}\n  
< {"type":"motion_status","seq_ack":2,"state":"MANUAL_READY","mode":"MANUAL","uptime_ms":1290,"err":"NONE"}\n


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