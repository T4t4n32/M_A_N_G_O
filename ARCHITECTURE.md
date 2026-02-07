# ARCHITECTURE — M.A.N.G.O.

## 1. Purpose

M.A.N.G.O. is an environmental water-monitoring system designed to collect sensor data in the field, validate sensor reliability, and deliver real measurements to a dashboard and storage layer.

This document defines the current architecture for the prototype/testing phase, focusing on a robust end-to-end data path.

## 2. High-level architecture

M.A.N.G.O. operates with two main blocks:

1) **M.A.N.G.O. Node (TX)** — the field device  
- Contains: sensors, ESP32, LoRa (RA-02 at 433 MHz), and a Jetson inside the enclosure  
- Produces measurements and sends them:
  - via LoRa to a base/gateway (RX)
  - via USB serial to the on-board Jetson for local ingestion, logging, and API

2) **M.A.N.G.O. Base (RX/Gateway)** — connectivity edge  
- Receives LoRa packets and forwards them to a server (VPS) or network endpoint
- This base is placed where connectivity exists (school/house/edge site)

## 3. System diagram (clean)

### 3.1 Node (TX) — Field device with Jetson inside

Sensors -> ESP32 (reads, builds payload, LoRa TX) -> Jetson (USB Serial ingest + local API/storage)

- Sensors:
  - PT100 + MAX31865 (SPI)
  - pH module (analog Po)
  - turbidity module (analog AO)
- ESP32:
  - reads sensors
  - constructs a compact payload
  - transmits via LoRa 433 MHz
  - mirrors measurements via USB serial to Jetson
- Jetson:
  - consumes serial frames from ESP32
  - validates and stores data locally (prototype DB or file log)
  - exposes a local API for debugging/testing
  - can later add buffering/retry policies for uplink

### 3.2 Base (RX/Gateway)

LoRa RX -> forward to VPS / dashboard infrastructure

- ESP32 + RA-02 receives packets
- Forwarding can be:
  - serial to a PC/RPi
  - Wi-Fi/Ethernet to a server endpoint
  - (later) MQTT/HTTP depending on deployment constraints

## 4. Data flow

### 4.1 In-device (TX) flow

1) Sensor sampling (ESP32)
2) Payload construction (ESP32)
3) Dual output:
   - LoRa packet TX (433 MHz)
   - Serial frame to Jetson over USB

### 4.2 Remote (RX/Gateway) flow

1) LoRa packet RX
2) Decode/validate payload
3) Forward to server layer (VPS) or local store

## 5. Payload format (prototype)

Current goal: reliable transport, not final calibration.

Recommended compact payload (text):
TEMP=24.36;PH=7.12;TURB=183.4;TS=170000

Or JSON (bigger, slower over LoRa):
{"temp":24.36,"ph":7.12,"turb":183.4,"ts":170000}

For LoRa at 433 MHz, compact text is preferred during testing.

## 6. Hardware notes (prototype constraints)

- LoRa frequency: **433 MHz** (Colombia compliance requirement for this project scope)
- LoRa module: **RA-02**
- SPI is shared:
  - RA-02 uses SPI (MOSI/MISO/SCK) + NSS/RESET/DIO0
  - MAX31865 uses SPI (SDI/SDO/CLK) + CS
  - Both can share MOSI/MISO/SCK with separate CS lines
- Jetson does not interact with sensors electrically; it receives data from ESP32 via USB serial.

## 7. Responsibilities by component

### ESP32 (TX)
- Initialize sensors
- Read raw values
- Build payload (simple, stable)
- Send LoRa
- Mirror data via Serial to Jetson
- Provide clear status prints for debugging

### Jetson (TX)
- Read serial frames from ESP32
- Validate and store locally
- Expose local API endpoints for latest readings and health
- Provide logs and observability for integration testing

### ESP32 (RX/Gateway)
- Receive LoRa
- Decode payload
- Forward upstream (implementation depends on available connectivity)

## 8. Testing strategy (current phase)

Primary objective: confirm that data can travel reliably:

1) ESP32 TX generates readings (real or placeholder)
2) ESP32 TX sends packets over LoRa every N seconds (e.g., 5–10 s)
3) ESP32 RX prints received payload to serial monitor
4) ESP32 TX mirrors the same payload to Jetson via USB serial
5) Jetson backend confirms ingestion and exposes latest values via local API

Calibration and final sensor accuracy is explicitly out-of-scope for this phase.

## 9. Next steps

- Stabilize payload schema (fields, separators, timestamp)
- Add packet sequence number and basic integrity check
- Add Jetson buffering strategy for intermittent connectivity (if needed)
- Unify RX/Gateway forwarding implementation (HTTP/MQTT to VPS)
- Document wiring maps and board pin assignments for reproducibility


---
# 👤 **Maintainer**

**Sebastián Sánchez**  
GitHub: [https://github.com/T4t4n32](https://github.com/T4t4n32)