# M.A.N.G.O. ESP32 Motion Sub-Brain

Proyecto PlatformIO para integrar:

- ESP32 como subcerebro de movilidad.
- BNO080/BNO085 por I2C.
- 3 ESC/propulsores: izquierdo, derecho y vertical.
- Modulo RF manual con modulo de reles.
- Comandos seriales desde Jetson.

## Subir

```bash
pio run -t upload
pio device monitor -b 115200
```

## Comandos de prueba

Enviar con Enter:

```text
a  -> modo ESP32
m  -> modo RF/manual
s  -> stop/neutro
f  -> avanzar suave
g  -> avanzar medio
b  -> reversa suave
l  -> giro izquierda
r  -> giro derecha
u  -> subir
d  -> bajar
n  -> neutro
t  -> telemetria una vez
p  -> menu
```

## Comandos Jetson

```text
MODE,ESP
MODE,RF
MOVE,forward,turn,vertical
PWM,left,right,vertical
STOP
STATUS
```

`MOVE` usa valores de -100 a 100:

```text
MOVE,60,0,0      avanzar
MOVE,0,-60,0     girar izquierda
MOVE,0,60,0      girar derecha
MOVE,0,0,60      subir
MOVE,0,0,-60     bajar
```

`PWM` usa microsegundos, pero el firmware limita inicialmente a 1400-1600 us por seguridad:

```text
PWM,1560,1560,1500
PWM,1500,1500,1560
```

## Pines actuales

| Funcion | GPIO |
|---|---:|
| ESC left | 25 |
| ESC right | 26 |
| ESC vertical | 27 |
| Relay left | 18 |
| Relay right | 19 |
| Relay vertical | 23 |
| BNO080 SDA | 21 |
| BNO080 SCL | 22 |
| BNO080 INT | 4 |

## Cableado de reles recomendado

Para cada ESC:

- COM del rele -> señal del ESC.
- NC del rele -> señal PWM del ESP32.
- NO del rele -> señal del receptor RF.

Con la configuracion actual: ESP32 = rele OFF, RF = rele ON.

Mantener GND comun entre ESP32, receptor RF y referencia de senal de los ESC. No alimentar los propulsores desde el ESP32.

## Nota de prueba

Primero validar sin propulsores instalados o con el sistema completamente asegurado. Revisar que los ESC entren en neutro antes de cambiar entre ESP32 y RF.
