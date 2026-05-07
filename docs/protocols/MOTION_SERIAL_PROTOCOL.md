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
