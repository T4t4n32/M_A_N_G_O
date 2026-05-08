# PHASE_A_HARDWARE_CHECKLIST

Checklist de conexión física para correr Fase A en modo hardware.

## Conexión mínima requerida

1. PC/Jetson encendida.
2. ESP32 Movimiento con firmware serial cargado.
3. Cable **USB de datos** (no solo carga) entre PC/Jetson y ESP32.
4. Puerto serial visible en sistema (`/dev/ttyUSB0` o `/dev/ttyACM0`).

## Verificación rápida de puerto

```bash
ls /dev/ttyUSB* /dev/ttyACM* 2>/dev/null
```

Si no aparece nada:

- prueba otro cable USB (muchos son solo carga)
- cambia de puerto USB
- confirma que el ESP32 está energizado
- revisa si aparece en `dmesg | tail -n 30`

## Ejecución recomendada

```bash
./scripts/run-motion-phase-a.sh hardware /dev/ttyUSB0
```

El script crea un venv local `.venv_phase_a` e instala `pyserial` ahí, para evitar errores de entorno gestionado (PEP 668).

## Criterio de éxito

- tests unitarios en `OK`
- respuestas `PING/STOP/STATUS`
- mensaje final `✅ Fase A verificada`
