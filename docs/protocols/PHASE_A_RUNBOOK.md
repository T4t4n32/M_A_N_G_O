# PHASE_A_RUNBOOK

Guía de arranque desde un solo punto para Fase A (movimiento seguro).

## 1) Un solo comando para correr todo

Modo simulación (sin hardware):

```bash
./scripts/run-motion-phase-a.sh
```

Modo hardware (ESP32 conectado por USB):

```bash
./scripts/run-motion-phase-a.sh hardware /dev/ttyUSB0
```

## 2) Qué valida automáticamente

1. Tests unitarios del bridge (`PING/STOP` y parseo de `motion_status`).
2. Chequeo serial de Fase A:
   - `PING`
   - `STOP` en ciclos
   - `STATUS`

## 3) Criterio para decir “funciona”

Debes ver:

- salida `OK` de `unittest`
- líneas `PING seq=... -> ...`
- líneas `STOP seq=... -> ...`
- línea `STATUS seq=... -> ...`
- mensaje final `✅ Fase A verificada`

## 4) Si falla en hardware

- Verifica puerto correcto (`/dev/ttyUSB0`, `/dev/ttyACM0`, etc.).
- Verifica baudrate del firmware en `115200`.
- Verifica que el firmware envíe JSON por línea (`\n`).
- Verifica que el firmware implemente failsafe (timeout 1000 ms).
