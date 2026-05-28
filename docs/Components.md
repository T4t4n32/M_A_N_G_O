# M.A.N.G.O. – Hardware Components Reference

Autonomous water-quality mapping drone. Dual-node architecture: sensor/TX node on the vessel, RX gateway node tethered to the Jetson edge computer.

---

## System Overview

```
[Vessel]                         [Shore/Dock]
  MANGO_TX  ─── LoRa 433 MHz ──→  MANGO_RX  ──→  Jetson  ──→  VPS Backend
  MANGO_Motion                     (serial)        (Python)     integramosoe.com
```

---

## Nodes

### MANGO_TX — Sensor Node

| Field | Value |
|---|---|
| Board | ESP32 Dev Board (`esp32dev`) |
| Framework | Arduino via PlatformIO |
| Firmware | `firmware/MANGO_sensores_ESP32/MANGO_TX/` |
| Baud rate | 115200 |
| Send interval | 10 s |

Carries three core sensors and one LoRa radio. Transmits binary packets over LoRa every 10 seconds. Also hosts a hidden WiFi AP for on-vessel diagnostics.

---

### MANGO_Motion — Drive Node

| Field | Value |
|---|---|
| Board | ESP32 Dev Board (`esp32dev`) |
| Framework | Arduino via PlatformIO |
| Firmware | `firmware/MANGO_sensores_ESP32/MANGO_Motion/` |
| Baud rate | 115200 |

Controls two ESCs for propulsion and reads the BNO080 IMU for orientation. Operates in three modes: RF (RC passthrough), ESP (serial commands), and AUTO (autonomous mission sequence).

---

### MANGO_RX — Gateway Node

| Field | Value |
|---|---|
| Board | ESP32 Dev Board (`esp32dev`) |
| Framework | Arduino via PlatformIO |
| Firmware | `firmware/MANGO_sensores_ESP32/MANGO_RX/` |
| Baud rate | 115200 |
| Output | Serial JSON to Jetson |

Receives LoRa packets, validates sequence numbers and CRC, reconstructs JSON, and forwards to Jetson via USB serial. Reports link quality (`LINK:`) and packet loss (`STATS:`) on each received packet.

---

### Edge Processing Node — NVIDIA Jetson

Receives serial JSON from MANGO_RX. Runs the Python backend (`rx_gateway.py`) and exposes a local API on port 9100. Bridges sensor data to the VPS via HTTP. Connected to MANGO_RX over USB serial.

---

## Sensors

### pH

| Field | Value |
|---|---|
| Interface | Analog ADC |
| Pin | GPIO 32 |
| Reference | 3.3 V |
| Calibration | V@pH4 = 3.00 V, V@pH7 = 2.50 V |
| Averaging | 20 samples |
| API endpoint | `GET /api/ph/latest` |

Linear voltage-to-pH conversion using two-point calibration. Calibration constants defined in `MANGO_TX/include/tx_config.h`.

---

### Temperature — PT100 via MAX31865

| Field | Value |
|---|---|
| Sensor | PT100 RTD probe |
| Amplifier | Maxim MAX31865 |
| Interface | SPI |
| CS Pin | GPIO 17 |
| SCK / MISO / MOSI | GPIO 18 / 19 / 23 |
| Wiring | 3-wire |
| RREF | 430 Ohm |
| RNOMINAL | 100 Ohm |
| API endpoint | `GET /api/temperature/latest` |

MAX31865 handles linearization and converts RTD resistance to temperature. RREF should be measured with a multimeter and updated in `tx_config.h` for accurate readings.

---

### Turbidity — AZDM01

| Field | Value |
|---|---|
| Model | AZDM01 |
| Analog pin | GPIO 33 |
| Digital pin | GPIO 27 |
| Reference | 3.3 V |
| Averaging | 30 samples |
| API endpoint | `GET /api/turbidity/latest` |

Infrared-based optical turbidity sensor. Analog output averaged over 30 samples. Digital output used for threshold detection.

---

## LoRa Radio Link

Both MANGO_TX and MANGO_RX use an SX1278-based module with identical parameters.

| Parameter | Value |
|---|---|
| Module | SX1278 |
| Library | RadioLib v7.x |
| Frequency | 433.0 MHz |
| Bandwidth | 125 kHz |
| Spreading Factor | 7 |
| Coding Rate | 4/5 |
| Sync Word | 0x12 (private) |
| TX Power | 14 dBm |
| Payload format | Binary, 32 bytes |
| Air time (SF7/125kHz) | ~26 ms |

**TX pin mapping (SX1278):**

| Signal | GPIO |
|---|---|
| SCK | 18 |
| MISO | 19 |
| MOSI | 23 |
| NSS | 21 |
| DIO0 | 26 |
| RST | 14 |

Private sync word `0x12` prevents cross-talk with other LoRa devices on the same band.

### Protocol v2.0

Binary packet with sequence number, magic byte validation, and millis timestamp. RX applies 3-attempt retry with back-off on TX side. RX reconstructs full JSON for Jetson — upstream data contract unchanged from v1.

---

## IMU — SparkFun BNO080

| Field | Value |
|---|---|
| Module | SparkFun BNO080 Cortex Based IMU |
| Interface | I2C |
| Library | `sparkfun/SparkFun BNO080 Cortex Based IMU @ ^1.1.9` |
| Node | MANGO_Motion |

Provides orientation data for the motion controller. Used in AUTO mode to confirm turn angles.

---

## Propulsion

Two brushless motors driven by ESCs. PWM signal range is restricted to the safe band to prevent runaway.

| Parameter | Value |
|---|---|
| Protocol | PWM (servo-style) |
| Library | ESP32Servo |
| Safe min | 1400 us |
| Safe max | 1600 us |
| Forward | 1555 us |
| Reverse | 1445 us |

PWM limits enforced in `auto_config.h`. `STOP` command via serial halts all motors immediately regardless of current mission state.

---

## On-Vessel Diagnostics (WiFi AP)

MANGO_TX runs a hidden WiFi access point for field diagnostics. The SSID is not broadcast.

| Field | Value |
|---|---|
| SSID | MANGO-SEN (hidden) |
| Diagnostic path | `/diag/<TOKEN>` |
| Session timeout | 60 min |
| Lockout | 3 failed attempts → 5 min block |

Credentials and token are defined in `tx_config.h`. Do not commit updated credentials to version control.

---

## Calibration Reference

All calibration constants are in `firmware/MANGO_sensores_ESP32/MANGO_TX/include/tx_config.h`.

| Constant | Default | Notes |
|---|---|---|
| `PH_V_AT7` | 2.50 V | Measure with pH 7 buffer |
| `PH_V_AT4` | 3.00 V | Measure with pH 4 buffer |
| `MAX_RREF` | 430.0 Ohm | Measure with multimeter at RREF resistor |

After updating calibration constants, rebuild and reflash MANGO_TX.
