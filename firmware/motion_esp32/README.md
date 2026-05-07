# motion_esp32 (Fase A)

Este directorio define el firmware mínimo para el **ESP32 de Movimiento**.

## Objetivo

Implementar:

- parser de JSON serial (`cmd_motion`)
- comandos: `PING`, `STOP`, `SET_SAFE`, `SET_AUTO`, `SET_MANUAL`, `STATUS`
- failsafe a 1000 ms (PWM neutro + `SAFE` + `TIMEOUT`)

## Salidas esperadas

- `motion_status` con `left_pwm`, `right_pwm`, `vertical_pwm`, `mode`, `error`

## Nota

No incluir aún SLAM/Kinect/mapa en este firmware base.
